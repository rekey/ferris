const {spawn, spawnSync} = require('child_process');
const fs = require('fs');
const path = require('path');

function findXrayExec() {
    const spawn = spawnSync('which', ['xray'], {
        encoding: 'utf8'
    });
    return spawn.stdout?.trim();
}

class Xray {
    exec = '';
    child = null;
    startPort = 40080;
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
            startPort = 40080,
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

    buildInbound(type, port) {
        return {
            tag: `${type}-${port}`,
            listen: "0.0.0.0",
            protocol: type,
            port: port,
            settings: type === 'socks'
                ? {
                    "udp": true,
                    "auth": "noauth"
                }
                : {},
        }
    }

    buildConfig(outbounds, type) {
        this.endPort = 0;
        const config = this.config;
        config.log.error = path.resolve(this.logDir, `log-${this.name}.error.log`);
        config.log.access = path.resolve(this.logDir, `log-${this.name}.access.log`);
        config.routing.rules = [];
        config.outbounds = outbounds;
        config.inbounds = outbounds.map((item, index) => {
            const port = this.startPort + index;
            const inbound = this.buildInbound(type, port);
            config.routing.rules.push({
                type: "field",
                inboundTag: [inbound.tag],
                outboundTag: item.tag,
            });
            this.outbounds[port] = item;
            this.endPort = port;
            return inbound;
        });
        fs.writeFileSync(this.buildConfigPath(), JSON.stringify(this.config, null, 4), 'utf8');
    }

    async start(outbounds, type = 'socks') {
        this.buildConfig(outbounds, type);
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
