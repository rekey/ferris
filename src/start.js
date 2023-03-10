const appSvc = require('./service/app');
const app = require('./app');
const { wait } = require('./lib/util');

process.nextTick(() => {
    (async () => {
        let canRun = true;
        while (canRun) {
            await appSvc.trigger();
            await wait(1000 * 60 * 15);
        }
    })();
});

app.listen(60001);

function handle(signal) {
    console.log('signal', signal);
    process.exit(0);
}

process.on('SIGINT', handle);
process.on('SIGTERM', handle);
