import { VM } from '../viewModel/GameVM.js';

export const AI = (() => {
    return {
        // return all routes to every end
        // once reach any end will stop and try other path to remaining end(s)
        lookUpRoutes: function (arena, start, ends, opponent) {
            const possiblePaths = []
            const queue = [];
            const visited = [];

            queue.push([start, []]);
            visited.push(start);

            while (queue.length > 0) {
                const [current, path] = queue.shift();
                // console.log(current);
                // console.log(path);

                if (ends.some(item => item[0] == current[0] && item[1] == current[1])) { // check reach ends
                    possiblePaths.push(path.concat([current]));
                    visited.push(current); // mark end is visited
                    continue;
                }

                const validMoves = VM.findValidMoves(arena, current, opponent);

                validMoves.forEach(move => {
                    let isVisited = visited.some(item => item[0] == move[0] && item[1] == move[1]); // check next move is visited
                    if (!isVisited) {
                        const newPath = path.concat([current]);
                        // console.log(newPath);
                        queue.push([move, newPath]);
                        visited.push(move);
                    }
                });
            }

            return possiblePaths;
        }
    };
})();