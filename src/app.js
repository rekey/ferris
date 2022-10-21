const Koa = require('koa');
const Router = require('koa-router');

const subSvc = require('./service/sub');
const xraySvc = require('./service/xray');
const appSvc = require('./service/app');

const app = new Koa();
const router = new Router();

router.get('/api/sub/list', async (ctx) => {
    ctx.body = subSvc.getAllUrls();
});

router.get('/api/sub/add', async (ctx) => {
    ctx.body = subSvc.addUrl(ctx.query.sub);
});

router.get('/api/sub/remove', async (ctx) => {
    ctx.body = subSvc.delUrl(ctx.query.sub);
});

router.get('/api/outbound/list', async (ctx) => {
    ctx.body = await xraySvc.getOutbounds();
});

router.get('/api/outbound/test', async (ctx) => {
    appSvc.trigger();
    ctx.body = await xraySvc.getOutbounds();
});

app.use(router.routes());

module.exports = app;
