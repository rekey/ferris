const path = require('path');
const fs = require('fs');

class Store {
    data = {};

    constructor(dataFile) {
        if (!dataFile) {
            throw new Error("dataFile!!!");
        }
        this.dataFile = dataFile;
        const dataDir = path.dirname(dataFile);
        try {
            fs.mkdirSync(dataDir, {
                recursive: true,
            });
            const content = fs.readFileSync(this.dataFile, 'utf8');
            this.data = JSON.parse(content);
        } catch (e) {
            // console.error(e);
        }
    }

    set(key, value, expire = 0) {
        this.data[key] = {
            now: Date.now(),
            expire,
            value: value,
        };
        fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 4), 'utf8');
    }

    get(key) {
        const data = this.data[key];
        if (!data) {
            return null;
        }
        if (data.expire !== 0 && (Date.now() - data.now) > data.expire) {
            return null;
        }
        return data.value;
    }

    clear() {
        this.data = {};
        fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 4), 'utf8');
    }
}

const dataFile = path.resolve(process.cwd(), './store/data.json');
const store = new Store(dataFile);
Store.store = store;

module.exports = Store;
