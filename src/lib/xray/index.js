const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const parser = require('../parser');

function findXrayExec() {
    const spawn = spawnSync('which', ['xray'], {
        encoding: 'utf8'
    });
    return spawn.stdout?.trim();
}

class Xray {
    exec = '';
    child = null;
    startPort = 10080;
    endPort = 0;
    name = '';
    configDir = '';
    outbounds = {};
    config = {
        log: {
            "error": "/data/xray/logs/error.log",
            "loglevel": "info",
            "access": "/data/xray/logs/access.log"
        },
        inbounds: [],
        outbounds: [],
        observatory: {},
        routing: {
            domainStrategy: 'AsIs',
            rules: [],
            balancers: [],
        },
    }

    constructor(
        {
            exec = '',
            startPort = 10080,
            configDir,
            logDir,
            name
        }
    ) {
        this.exec = exec || findXrayExec();
        this.startPort = startPort;
        this.name = name;
        this.configDir = configDir;
        this.logDir = logDir;
        fs.mkdirSync(this.logDir, {
            recursive: true
        });
        fs.mkdirSync(this.configDir, {
            recursive: true
        });
    }

    buildConfigPath() {
        return path.resolve(this.configDir, `${this.name}.json`);
    }

    buildConfig(outbounds) {
        this.endPort = 0;
        const config = this.config;
        config.log.error = path.resolve(this.logDir, `log-${this.name}.error.log`);
        config.log.access = path.resolve(this.logDir, `log-${this.name}.access.log`);
        config.routing.rules = [];
        config.outbounds = [];
        config.inbounds = [];
        outbounds.forEach((item, index) => {
            const port = this.startPort + index;
            const outbound = parser.outbound(item.value);
            if (!outbound) {
                return;
            }
            const inbound = parser.inbound(outbound, port);
            config.routing.rules.push({
                type: "field",
                inboundTag: [inbound.tag],
                outboundTag: outbound.tag,
            });
            config.inbounds.push(inbound);
            config.outbounds.push(outbound);
            this.outbounds[port] = outbound;
            this.endPort = port;
        });
        fs.writeFileSync(
            this.buildConfigPath(),
            JSON.stringify(this.config, null, 4),
        );
    }

    async start(outbounds) {
        this.buildConfig(outbounds);
        this.stop();
        const configFile = this.buildConfigPath();
        return new Promise((resolve) => {
            this.child = spawn(this.exec, ['-config', configFile], {
                encoding: 'utf8'
            });
            this.child.stdout.on('data', (chunk) => {
                const text = chunk.toString();
                console.log(text);
                if (text.includes('Xray')) {
                    resolve();
                }
            });
            this.child.stderr.on('data', (chunk) => {
                const text = chunk.toString();
                if (text.includes('Xray')) {
                    resolve();
                }
            });
        });
    }

    stop() {
        if (this.child !== null && !this.child.killed) {
            this.child.stdout.removeAllListeners();
            this.child.stderr.removeAllListeners();
            this.child.kill(9);
        }
    }
}

module.exports = Xray;
