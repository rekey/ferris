const { got } = require('got-cjs');

const store = require('./store');
const { base64, md5 } = require('../lib/util');

const subKey = 'sub';
const subDataKey = `${subKey}-data`;
const subUrlKey = `${subKey}-url`;

function save(url, data) {
    const storeData = store.get(store.subDataKey, {});
    storeData[url] = data;
    store.set(subDataKey, storeData);
}

async function request(url) {
    const resp = await got(url);
    const content = base64.decode(resp.body);
    save(url, content.split('\n').map((line) => {
        return {
            key: md5(line),
            value: line,
        };
    }));
    return content.split('\n');
}

function addUrl(url) {
    const urls = store.get(store.subUrlKey, []);
    if (!urls.includes(url)) {
        urls.push(url);
        store.set(subUrlKey, urls);
    }
    return urls;
}

function delUrl(url = '') {
    url = url.trim();
    let urls = store.get(store.subUrlKey, []);
    urls = urls.filter((item) => {
        return item !== url;
    });
    store.set(subUrlKey, urls);
    return urls;
}

async function subAll() {
    let urls = getAllUrls();
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        if (!url) {
            break;
        }
        console.log('start', 'sub', url);
        try {
            await request(url);
        } catch (e) {
            console.log(e.message);
        }
        console.log('done', 'sub', url);
    }
    return urls;
}

function getAllOutbounds() {
    let outbounds = [];
    const storeData = store.get(store.subDataKey, {});
    Object.keys(storeData)
        .forEach((url) => {
            const data = storeData[url];
            outbounds = outbounds.concat(data);
        });
    return outbounds;
}

function getAllUrls() {
    return store.get(store.subUrlKey, []);
}

module.exports = {
    addUrl,
    delUrl,
    subAll,
    getAllUrls,
    getAllOutbounds,
};
