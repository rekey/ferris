const subSvc = require('./sub');
const xraySvc = require('./xray');

module.exports = {
    trigger() {
        (async () => {
            try {
                const outbounds = subSvc.getAllOutbounds();
                await xraySvc.test(outbounds);
            } catch (e) {

            }
        })().then(() => {

        });
    },
};
