module.exports = function (str) {
    if (!str) {
        return 100;
    }
    const tag = str.toLocaleLowerCase();
    let arr = tag.match(/(\d\.\d+)x/)
        || tag.match(/(\d)x/)
        || tag.match(/x(\d\.\d+)/)
        || tag.match(/x(\d+)/);
    if (Array.isArray(arr)) {
        const ratio = arr[1] * 1;
        return isNaN(ratio) ? 1 : ratio;
    }
    arr = tag.match(/\[(\d.\d+)]/)
        || tag.match(/\[(\d)]/);
    if (Array.isArray(arr)) {
        const ratio = arr[1] * 1;
        return isNaN(ratio) ? 1 : ratio;
    }
    return 1;
};
