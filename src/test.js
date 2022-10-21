const subSvc = require('./service/sub');
const xraySvc = require('./service/xray');

subSvc.addUrl('https://api-goodtek.loliloli.live/link/mh0jSAIrxEQrzfOm?list=kitsunebi');
subSvc.addUrl("https://giegie.cloud/api/v1/client/subscribe?token=bf341f5a585666355721df8d3ac4d1c1");
subSvc.addUrl("https://s.juzicloud.vip/link/yLV9AczVC0QHuvDU?sub=3");
subSvc.addUrl("https://sub.suo.tw/link/Pvdgxhrfl0wgFqCE?list=shadowrocket");

//(async () => {
//    await subSvc.subAll();
//})();

(async () => {
    const outbounds = subSvc.getAllOutbounds();
    const data = await xraySvc.test(outbounds);
    console.log(data);
})();