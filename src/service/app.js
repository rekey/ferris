const subSvc = require('./sub');
const xraySvc = require('./xray');

module.exports = {
    async trigger() {
        try {
            console.log('sub', 'start');
            const urls = await subSvc.subAll();
            if (!Array.isArray(urls) || urls.length === 0) {
                console.log('sub', 'empty', urls);
                return;
            }
            console.log('sub', 'done', urls);
            const outbounds = subSvc.getAllOutbounds();
            console.log('sub', 'getOutbounds', 'done');
            await xraySvc.test(outbounds);
            console.log('sub', 'test', 'done');
        } catch (e) {
            console.error(e);
        }
    },
};
