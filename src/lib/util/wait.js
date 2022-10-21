module.exports = (ms, resp = '') => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(resp);
        }, ms);
    });
};

