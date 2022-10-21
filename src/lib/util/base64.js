module.exports = {
    decode: (str) => {
        const buf = Buffer.from(str, 'base64');
        return buf.toString('utf8');
    },
};
