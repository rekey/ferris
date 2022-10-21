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
                "address": "kr.oracle02.5288825.xyz",
                "port": 443,
                "password": "74e58866-ce29-4ccd-8fe7-dd29d17952e6",
                "email": "admin@apple.com",
                "level": 0
            }
        ]
    },
    "mux": {
        enabled: false,
    },
};

function parse(line, src = "") {
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
    config.tag = `${src}-trojan-${ps}-${data.hostname}-${data.port}`;
    // console.log(JSON.stringify(config));

    config.extend = {
        ps: ps,
        rate: rateParse(ps),
    };
    return config;
}

module.exports = {
    parse
};
