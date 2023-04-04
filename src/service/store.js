const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');
const { Console } = require('console');

const dataDir = path.resolve(__dirname, '../store');
const dataFile = path.resolve(dataDir, './data.json');

let data = {};
const store = {
    subKey: 'sub',
    subDataKey: `sub-data`,
    subUrlKey: `sub-url`,
    xrayKey: 'xray',
    xrayDataKey: `xray-data`,
    save() {
        fs.writeFileSync(
            dataFile,
            JSON.stringify(data, null, 4),
            { mode: 0o0600 },
        );
    },
    set(key, value) {
        data[key] = value;
        this.save();
    },
    get(key, fallback) {
        return data[key] || fallback;
    }
};

(async () => {
    try {
        const d = require(dataFile);
        Object.assign(data, d);
    } catch (e) {
        console.error(e);
    }
})();

(async () => {
    await mkdirp(dataDir);
})();

module.exports = store;
