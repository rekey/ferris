const Event = require('events');

class Task extends Event {
    max = 1

    constructor(getTask, max = 1) {
        super();
        this.current = 0;
        this.max = max;
        this.done = 0;
        this.getTask = getTask;
    }

    async run(i) {
        let canRun = true;
        while (canRun) {
            const task = await this.getTask();
            if (!task) {
                canRun = false;
                break;
            }
            await task(i);
        }
    }

    start() {
        for (; this.current < this.max; this.current++) {
            const i = this.current;
            (async (that, i) => {
                await that.run(i);
                that.done += 1;
                if (that.done === (that.max - 1)) {
                    that.emit('done');
                }
            })(this, i);
        }
    }
}

module.exports = Task;
