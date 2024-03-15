export const Log = (() => {
    return {
        d: function (tag, message) {
            console.log(`<${tag}> - ${JSON.stringify(message)}`);
        }
    }
})();