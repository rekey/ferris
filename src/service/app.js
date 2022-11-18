const subSvc = require('./sub');
const xraySvc = require('./xray');

module.exports = {
    async trigger() {
        try {
            const urls = await subSvc.subAll();
            console.log(urls);
            if (!Array.isArray(urls) && urls.length === 0) {
                return;
            }
            const outbounds = subSvc.getAllOutbounds();
            await xraySvc.test(outbounds);
        } catch (e) {
            console.error(e);
        }
    },
};
