const crypto = require('crypto');

module.exports = (str) => {
    const md5 = crypto.createHash('md5');
    return md5.update(Buffer.from(str, 'utf8')).digest('hex');
};
