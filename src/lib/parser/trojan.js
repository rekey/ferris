const url = require('url');

const utils = require('../util');
const rateParse = require('./rate');

const outbound = {
    "protocol": "trojan",
    "streamSettings": {
        "network": "tcp",
        "tcpSettings": {
            "header": {
                "type": "none"
            }
        },
        "security": "none"
    },
    "tag": "proxy",
    "settings": {
        "servers": [
            {
                "address": "",
                "port": 443,
                "password": "",
                "email": "",
                "level": 0
            }
        ]
    },
    "mux": {
        enabled: false,
    },
};

function parse(line) {
    const data = url.parse(line);
    const ps = decodeURIComponent(data.hash)?.slice(1);
    const query = new url.URLSearchParams(data.query);
    const config = utils.copy(outbound);
    config.streamSettings.security = 'tls';
    config.streamSettings.tlsSettings = {
        serverName: query.get('sni') || query.get('peer') || data.hostname,
        allowInsecure: true,
    };
    const server = config.settings.servers[0];
    server.password = data.auth;
    server.address = data.hostname;
    server.port = data.port * 1;
    config.tag = utils.md5(line);
    config.extend = {
        ps: ps,
        rate: rateParse(ps),
        type: 'trojan',
    };
    return config;
}

module.exports = {
    parse
};
