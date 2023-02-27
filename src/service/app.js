const subSvc = require('./sub');
const xraySvc = require('./xray');

module.exports = {
    async trigger() {
        try {
            const urls = await subSvc.subAll();
            console.log('sub', 'start', urls);
            if (!Array.isArray(urls) && urls.length === 0) {
                return;
            }
            console.log('sub', 'done', urls);
            const outbounds = subSvc.getAllOutbounds();
            console.log('sub', 'getOutbounds', 'done', urls);
            await xraySvc.test(outbounds);
        } catch (e) {
            console.error(e);
        }
    },
};
