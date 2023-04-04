const utils = require('../util');
const rateParse = require('./rate');

const outbound = {
    "streamSettings": {
        "network": "tcp",
        "security": null,
        "tlsSettings": {
            "allowInsecure": true
        },
        "kcpSettings": {
            "mtu": 1350,
            "tti": 50,
            "uplinkCapacity": 12,
            "downlinkCapacity": 100,
            "congestion": false,
            "readBufferSize": 2,
            "writeBufferSize": 2,
            "header": {
                "type": "wechat-video"
            }
        },
        "wsSettings": {
            "connectionReuse": true,
            "path": "/path",
            "headers": {
                "Host": "host.host.host"
            }
        },
        "httpSettings": {
            "host": [
                "host.com"
            ],
            "path": "/host"
        },
        "quicSettings": {
            "security": "none",
            "key": "",
            "header": {
                "type": "none"
            }
        },
        "tcpSettings": {
            "connectionReuse": true,
            "header": {
                "type": "http",
                "request": {
                    "version": "1.1",
                    "method": "GET",
                    "path": [
                        "/"
                    ],
                    "headers": {
                        "Host": [
                            ""
                        ],
                        "User-Agent": [
                            "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.75 Safari/537.36",
                            "Mozilla/5.0 (iPhone; CPU iPhone OS 10_0_2 like Mac OS X) AppleWebKit/601.1 (KHTML, like Gecko) CriOS/53.0.2785.109 Mobile/14A456 Safari/601.1.46"
                        ],
                        "Accept-Encoding": [
                            "gzip, deflate"
                        ],
                        "Connection": [
                            "keep-alive"
                        ],
                        "Pragma": "no-cache"
                    }
                }
            }
        }
    },
};

function streamSettings(data) {
    const config = {};
    const base = utils.copy(outbound.streamSettings);
    config.network = data.net;
    if (data.tls === 'tls') {
        config.security = 'tls';
        if (data.host) {
            const { tlsSettings } = base;
            tlsSettings.serverName = data.host;
            config.tlsSettings = tlsSettings;
        }
    }
    if (data.net === 'kcp') {
        const { kcpSettings } = base;
        kcpSettings.header.type = data.type;
        config.kcpSettings = kcpSettings;
        return config;
    }
    if (data.net === 'ws') {
        const { wsSettings } = base;
        if (data.host) {
            wsSettings.headers.Host = data.host;
        }
        if (data.path) {
            wsSettings.path = data.path;
        }
        config.wsSettings = wsSettings;
        return config;
    }
    if (data.net === 'h2') {
        const { httpSettings } = base;
        if (data.host) {
            httpSettings.host = data.host.split(',');
        }
        httpSettings.path = data.path;
        config.wsSettings = httpSettings;
        return config;
    }
    if (data.net === 'quic') {
        const { quicSettings } = base;
        quicSettings.security = data.host;
        quicSettings.key = data.path;
        quicSettings.header.type = data.type;
        config.quicSettings = quicSettings;
        return config;
    }
    if (data.net === 'tcp') {
        const { tcpSettings } = base;
        if (data.type === 'http') {
            tcpSettings.header.request.headers.Host = data.host;
            tcpSettings.header.request.path = [data.path];
        }
        config.tcpSettings = tcpSettings;
        return config;
    }
}

function vnext(data) {
    return {
        "address": data.add,
        "users": [
            {
                "id": data.id,
                "alterId": data.aid * 1,
                "level": 0,
                "security": "aes-128-gcm"
            },
        ],
        "port": data.port * 1,
    }
}

function parse(line) {
    line = line.replace('vmess://', '');
    const data = JSON.parse(utils.base64.decode(line));
    const ps = decodeURIComponent(data.ps);
    return {
        "mux": {
            enabled: true,
            concurrency: 4,
            // enabled: false,
        },
        "protocol": "vmess",
        "streamSettings": streamSettings(data),
        "extend": {
            ps: ps,
            rate: rateParse(ps),
            type: 'vmess',
        },
        "settings": {
            "vnext": [
                vnext(data),
            ]
        }
    };
}

module.exports = {
    streamSettings,
    vnext,
    parse,
};
