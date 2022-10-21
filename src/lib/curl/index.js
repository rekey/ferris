const {spawn} = require('child_process');

function curl(url, proxy) {
    return new Promise((resolve, reject) => {
        let args = [url];
        if (proxy) {
            args = ['-x', proxy].concat(args);
        }
        let child = spawn('curl', args);
        let data = Buffer.from('');
        child.stdout.on('data', (chunk) => {
            data = Buffer.concat([data, chunk]);
        });
        child.once('exit', (code) => {
            process.nextTick(() => {
                child.stdout.removeAllListeners();
                child.kill(9);
            });
            if (code === 0) {
                resolve(data);
                return;
            }
            reject(code);
        });
    });
}

module.exports = curl;
