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
    let port = xray.startPort;
    function getPort() {
        if (port === xray.endPort) {
            return 0;
        }
        const p = port * 1;
        port += 1;
        return p;
    }
    cache.test.promise = new Promise((resolve) => {
        const results = [];
        const task = new Task(15);
        const o = {};
        task.getTask = () => {
            const runPort = getPort();
            console.log('runPort', runPort);
            if (runPort === 0) {
                return false;
            }
            return async (index) => {
                try {
                    const outbound = xray.outbounds[runPort];
                    console.log(index, outbound.protocol, outbound.tag, "start");
                    const test = await testSocks(runPort);
                    if (o[test.ip]) {
                        return;
                    }
                    o[test.ip] = true;
                    if (test.success) {
                        Object.assign(outbound.extend, test);
                        results.push(outbound);
                    }
                    console.log(index, outbound.protocol, outbound.tag, test.ip, test.success, "done");
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
