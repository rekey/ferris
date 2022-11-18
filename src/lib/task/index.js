const Event = require('events');
const wait = require('../util/wait')

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
        let i = this.current;
        for (; i < this.max; i++) {
            (async (that, i) => {
                console.log('thread', i, 'start');
                await that.run(i);
                that.done += 1;
                console.log('thread', i, 'done');
                await wait(100);
                if (that.done === that.max) {
                    process.nextTick(() => {
                        that.emit('done');
                    });
                }
            })(this, i);
        }
    }
}

module.exports = Task;
