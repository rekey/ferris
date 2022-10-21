const appSvc = require('./service/app');
const app = require('./app');
const {wait} = require('./lib/util');

(async () => {
    await appSvc.trigger();
    let canRun = true;
    while (canRun) {
        await wait(1000 * 60 * 60);
        await appSvc.trigger();
    }
})();

app.listen(60001);

function handle(signal) {
    console.log('signal', signal);
    process.exit(0);
}

process.on('SIGINT', handle);
process.on('SIGTERM', handle);
