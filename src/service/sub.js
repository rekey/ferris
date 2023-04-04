const { got } = require('got-cjs');

const store = require('./store');
const { base64, md5 } = require('../lib/util');

const subKey = 'sub';
const subDataKey = `${subKey}-data`;
const subUrlKey = `${subKey}-url`;


async function requestSub(url) {
    const storeData = store.get(subDataKey, {});
    const resp = await got(url, {
        followRedirect: true,
    });
    const content = base64.decode(resp.body);
    const data = {};
    for (let line of content.split('\n')) {
        line = line.trim();
        if (line !== "") {
            const tag = md5(line);
            data[md5(line)] = {
                tag,
                value: line,
            };
        }
    }
    storeData[url] = data;
    store.set(subDataKey, storeData);
}

function addUrl(url) {
    const urls = store.get(store.subUrlKey, []);
    console.log(urls);
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
            await requestSub(url);
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
    for (const k of Object.keys(storeData)) {
        const data = storeData[k];
        for (const key of Object.keys(data)) {
            outbounds.push(data[key]);
        }
    }
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
