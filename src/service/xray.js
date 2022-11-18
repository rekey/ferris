const path = require('path');
const { spawnSync } = require('child_process');

const XRay = require('../lib/xray');
const curl = require('../lib/curl');
const Task = require('../lib/task');
const { wait } = require('../lib/util');
const { store } = require('../lib/store');

const xrayKey = 'xray';
const xrayDataKey = `${xrayKey}-data`;

function findXrayExec() {
    const spawn = spawnSync('which', ['xray'], {
        encoding: 'utf8'
    });
    return spawn.stdout?.trim();
}

const configDir = path.resolve(__dirname, '../config');
const logDir = path.resolve(__dirname, '../log');

const xray = new XRay({
    exec: findXrayExec(),
    logDir,
    configDir,
    name: 'test',
});

async function testSocks(port) {
    const now = Date.now();
    let fail = {
        success: false,
        ip: '',
        time: 0,
    };
    return Promise.race([
        curl(
            'https://api.ipify.org?format=json',
            `socks5://127.0.0.1:${port}`
        )
            .then((buf) => {
                const data = JSON.parse(buf.toString('utf8'));
                return {
                    success: true,
                    ip: data.ip,
                    time: Date.now() - now,
                };
            })
            .catch((e) => {
                return fail;
            }),
        wait(5000, fail),
    ]);
}

function setOutbounds(outbounds) {
    store.set(xrayDataKey, outbounds);
}

function getOutbounds() {
    return store.get(xrayDataKey);
}

const cache = {
    test: {
        running: false,
        now: 0,
        expire: 1000 * 60 * 10,
    },
};

async function test(originOutbounds) {
    if (cache.test.running) {
        return cache.test.promise;
    }
    const now = Date.now();
    if ((now - cache.test.now) < cache.test.expire) {
        return cache.test.promise;
    }
    cache.test.running = true;
    await xray.start(originOutbounds);
    cache.test.promise = new Promise((resolve) => {
        const results = [];
        let port = xray.startPort;
        const end = xray.endPort;
        const length = end - port;
        let done = 0;
        const task = new Task(() => {
            if (port >= end) {
                return;
            }
            return async (i) => {
                const data = {
                    port,
                    time: 0,
                    success: false,
                    ip: '',
                };
                port += 1;
                const index = data.port - xray.startPort;
                const outbound = originOutbounds[index];
                if (!outbound) {
                    return;
                }
                try {
                    const test = await testSocks(port);
                    Object.assign(data, test);
                    Object.assign(outbound.extend, data);
                } catch (e) {
                    console.log(index, outbound);
                    console.error(e);
                }
                done += 1;
                console.log(i, done, length, outbound.extend.ps, port, 'done', outbound.extend.success, outbound.extend.time, outbound.extend.ip);
                if (data.success) {
                    results.push(outbound);
                }
            };
        }, 15);
        task.once('done', () => {
            cache.test.running = false;
            cache.test.now = Date.now();
            process.nextTick(() => {
                xray.stop();
            });
            setOutbounds(results);
            resolve(results);
            console.log('test', 'done');
        });
        task.start();
    });
    return cache.test.promise;
}

module.exports = {
    getOutbounds,
    test,
};
