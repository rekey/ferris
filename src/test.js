const subSvc = require('./service/sub');
const xraySvc = require('./service/xray');

subSvc.addUrl('https://xxx.com');

//(async () => {
//    await subSvc.subAll();
//})();

(async () => {
    const outbounds = subSvc.getAllOutbounds();
    const data = await xraySvc.test(outbounds);
    console.log(data);
})();