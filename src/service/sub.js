const {got} = require('got-cjs');

const {store} = require('../lib/store');
const parser = require('../lib/parser');
const {base64, md5} = require('../lib/util');

const subKey = 'sub';
const subDataKey = `${subKey}-data`;
const subUrlKey = `${subKey}-url`;

function save(url, data) {
    const storeData = store.get(subDataKey) || {};
    storeData[url] = {
        data,
        now: Date.now(),
    };
    store.set(subDataKey, storeData);
}

async function request(url) {
    const resp = await got(url);
    const content = base64.decode(resp.body);
    const md5str = md5(url).slice(0, 8);
    const data = content
        .split('\n')
        .filter((line) => {
            return line
                && line.trim()
                && (line.indexOf('vmess://') === 0 || line.indexOf('trojan://') === 0);
        })
        .map((line) => {
            if (line.indexOf('vmess://') === 0) {
                return parser.vmess.parse(line, md5str);
            }
            if (line.indexOf('trojan://') === 0) {
                return parser.trojan.parse(line, md5str);
            }
            return {};
        });
    save(url, data);
    return data;
}

function addUrl(url) {
    const urls = store.get(subUrlKey) || [];
    if (!urls.includes(url)) {
        urls.push(url);
        store.set(subUrlKey, urls);
    }
    return urls;
}

function delUrl(url = '') {
    url = url.trim();
    let urls = store.get(subUrlKey) || [];
    urls = urls.filter((item) => {
        return item !== url;
    });
    store.set(subUrlKey, urls);
    return urls;
}

async function subAll() {
    let urls = store.get(subUrlKey) || [];
    await Promise.all(urls.map(async (url) => {
        console.log('start', 'sub', url);
        try {
            await request(url);
        } catch (e) {
            console.log(e.message);
        }
        console.log('done', 'sub', url);
    }));
}

function getAllOutbounds() {
    let outbounds = [];
    const storeData = store.get(subDataKey) || {};
    Object.keys(storeData).forEach((url) => {
        const item = storeData[url];
        outbounds = outbounds.concat(item.data);
    });
    return outbounds;
}

function getAllUrls() {
    return store.get(subUrlKey) || [];
}

module.exports = {
    addUrl,
    delUrl,
    subAll,
    getAllUrls,
    getAllOutbounds,
};
