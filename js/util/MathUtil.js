export const MathUtil = (() => {
    return {
        getRandomInt: function (max) {
            return Math.floor(Math.random() * max);
        }
    }
})();