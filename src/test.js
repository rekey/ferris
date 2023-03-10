const subSvc = require('./service/sub');
const xraySvc = require('./service/xray');

subSvc.addUrl('https://sub.cutecloud.link/link/Pn3uVBxGgWk9dgxR?sub=3');

//(async () => {
//    await subSvc.subAll();
//})();

(async () => {
    console.log(subSvc.getAllUrls());
    await subSvc.subAll();
    // const outbounds = subSvc.getAllOutbounds();
    // console.log(outbounds);
    console.log(subSvc.getAllUrls());
})();