const vmess = require('./vmess.js');
const trojan = require('./trojan');

module.exports = {
    vmess,
    trojan,
    outbound(line) {
        if (line.indexOf('vmess://') === 0) {
            return vmess.parse(line);
        }
        if (line.indexOf('trojan://') === 0) {
            return trojan.parse(line);
        }
        return false;
    },
    inbound(outbound, port) {
        return {
            tag: 'in-' + outbound.tag,
            protocol: 'socks',
            listen: "0.0.0.0",
            port,
            settings: {
                "udp": true,
                "auth": "noauth"
            },
        };
    }
};
