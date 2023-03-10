const path = require('path');
const { spawnSync } = require('child_process');

const XRay = require('../lib/xray');
const curl = require('../lib/curl');
const Task = require('../lib/task');
const { wait } = require('../lib/util');
const store = require('./store');

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
    store.set(store.xrayDataKey, outbounds);
}

function getOutbounds() {
    return store.get(store.xrayDataKey, []);
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
    cache.test.now = now;
    cache.test.running = true;
    await xray.start(originOutbounds);
    cache.test.promise = new Promise((resolve) => {
        const results = [];
        let port = xray.startPort - 1;
        const end = xray.endPort + 1;
        const task = new Task(15);
        task.getTask = () => {
            if (port >= end) {
                return false;
            }
            port += 1;
            const runPort = port;
            return async () => {
                try {
                    const test = await testSocks(runPort);
                    if (test.success) {
                        const outbound = xray.outbounds[runPort];
                        Object.assign(outbound.extend, test);
                        results.push(outbound);
                        console.log(outbound.protocol, test.ip, test.success, test.time);
                    }
                } catch (e) {
                }
            };
        };
        task.once('done', () => {
            cache.test.running = false;
            cache.test.now = Date.now();
            process.nextTick(() => {
                xray.stop();
            });
            // console.log(results);
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
