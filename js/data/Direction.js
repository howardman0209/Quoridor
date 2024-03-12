export const Direction = (() => {
    const directions = {
        UP: { label: 'UP', delta: [0, -2] },
        DOWN: { label: 'DOWN', delta: [0, 2] },
        LEFT: { label: 'LEFT', delta: [-2, 0] },
        RIGHT: { label: 'RIGHT', delta: [2, 0] },
    };
    return {
        getByDelta: function (delta) {
            // console.log(`input: ${delta}`)
            for (const [key, value] of Object.entries(directions)) {
                // console.log(`key: ${key}, value: ${value.delta}`);
                // console.log(`check boolean: ${value.delta[0] == delta[0] && value.delta[1] == delta[1]}`);
                if (value.delta[0] == delta[0] && value.delta[1] == delta[1]) {
                    // console.log(`found: ${value.delta}`);
                    return key;
                }
            }
        }
    };
})(); 