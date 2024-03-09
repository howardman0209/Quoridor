import { Game } from "../data/Game.js";
import { Turn } from '../data/Turn.js';

export const VM = (() => {

    function bfsSearchShortestRoute(arena, start, ends) {
        const queue = [];
        const visited = [];

        queue.push([start, []]);
        visited.push(start);

        while (queue.length > 0) {
            const [current, path] = queue.shift();
            // console.log(current);
            // console.log(path);

            if (ends.some(item => item[0] == current[0] && item[1] == current[1])) { // check reach ends
                return path.concat([current]); // return path
            }

            const validMoves = VM.findValidMoves(arena, current);

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

        return null; // If no path is found
    }

    return {
        initGame: function (size) {
            let arena = [];
            for (let row = 0; row < size * 2 - 1; row++) {
                let rows = [];
                for (let column = 0; column < size * 2 - 1; column++) {
                    if (row % 2 != 0 || column % 2 != 0) {
                        rows.push(1); // borderBlock
                    } else {
                        rows.push(0); // platformBlock
                    }
                }
                arena.push(rows);
            }
            let p1 = [size - 1, size * 2 - 2] // column
            let p2 = [size - 1, 0]

            let game = new Game(arena, p1, p2);
            return game;
        },

        findValidMoves: function (arena, player, opponent) {
            const [px, py] = player;
            const [ox, oy] = opponent != undefined ? opponent : [];
            if (px % 2 != 0 || py % 2 != 0) {
                return; // invalid location
            }

            const isMoveValid = (x, y) => 0 <= x && x < arena.length && 0 <= y && y < arena.length && !(x == px && y == py);
            const validMove = [];
            let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Up, Down, Left, Right
            let directionLabels = ["Up", "Down", "Left", "Right"];
            let i = 0;
            directions.forEach(it => {
                const dy = py + it[0];
                const dx = px + it[1];
                console.log(`${directionLabels[i]} - dy: ${dy}, dx: ${dx}`);

                if (0 <= dy && dy < arena.length && 0 <= dx && dx < arena.length) {
                    let noBlock = arena[dy][dx] > 0;
                    // console.log(`noBlock: ${noBlock}`);
                    if (noBlock) {
                        let noOpponent = opponent == undefined || !(py + 2 * it[0] == oy && px + 2 * it[1] == ox);

                        if (noOpponent) {
                            let move = [px + (2 * it[1]), py + (2 * it[0])];
                            if (isMoveValid(...move)) {
                                validMove.push(move);
                            }
                        } else {
                            let opponentMoves = this.findValidMoves(arena, [ox, oy]);
                            opponentMoves.forEach(move => {
                                if (isMoveValid(...move)) {
                                    validMove.push(move);
                                }
                            });
                        }
                    }
                }
                i++;
            });

            return validMove;
        },

        isValidBlockPattern: function (block) {
            // check pattern --- - ---
            if (block.length != 3) {
                console.log(`length != 3 -> false`);
                return false;
            }

            let isVertical = block[0][0] == block[1][0] && block[1][0] == block[2][0];
            let isHorizontal = block[0][1] == block[1][1] && block[1][1] == block[2][1];
            // console.log(`isVertical: ${isVertical}, isHorizontal: ${isHorizontal}`);

            let isStraight = isVertical || isHorizontal
            if (!isStraight) {
                console.log(`not straight -> false`);
                return false;
            }

            if (isVertical) {
                block.sort((a, b) => a[1] - b[1]);
                let isContinous = (block[1][1] - 1 == block[0][1]) && (block[1][1] + 1 == block[2][1])
                if (!isContinous) {
                    console.log(`not continous -> false`);
                    return false;
                }

                if (block[1][1] % 2 == 0) {
                    console.log(`wrong pattern -> false`);
                    return false;
                }
            }

            if (isHorizontal) {
                block.sort((a, b) => a[0] - b[0]);
                let isContinous = (block[1][0] - 1 == block[0][0]) && (block[1][0] + 1 == block[2][0])
                if (!isContinous) {
                    console.log(`not continous -> false`);
                    return false;
                }

                if (block[1][0] % 2 == 0) {
                    console.log(`wrong pattern -> false`);
                    return false;
                }
            }

            console.log(`valid block -> true`);
            return true
        },

        isAvailableToPlaceBlock: function (arena, block) {
            let row = block[1][1]
            let column = block[1][0]
            return arena[row][column] > 0;
        },

        isDeadBlock: function (game, block) {
            // temporaryPlaceBlock(block)
            const arena = game.arena;

            // place block
            this.placeBlock(game, block);

            // console.log(arena);

            let p1 = game.p1;
            let p2 = game.p2;

            // check p1 
            const p1Ends = Array.from({ length: arena.length }, (_, index) => [index, 0]);
            let p1ShortestRoute = bfsSearchShortestRoute(arena, p1, p1Ends);

            // check p2
            const p2Ends = Array.from({ length: arena.length }, (_, index) => [index, arena.length - 1]);
            let p2ShortestRoute = bfsSearchShortestRoute(arena, p2, p2Ends);

            // check p1p2 no valid route
            let isDeadBlock = p1ShortestRoute == null || p2ShortestRoute == null;
            // console.log(`isDeadBlock: ${isDeadBlock}`);

            // remove block
            this.removeBlock(game, block);
            return isDeadBlock;
        },

        placeBlock: function (game, block) {
            block.forEach(element => {
                game.arena[element[1]][element[0]] = -1;
            });
        },

        removeBlock: function (game, block) {
            block.forEach(element => {
                game.arena[element[1]][element[0]] = 1;
            });
        },

        applyMove: function (game, move, turn) {
            if (turn == Turn.P1) {
                game.p1 = move;
            } else {
                game.p2 = move;
            }
        },

        checkPlayerWin: function (game) {
            // check p1 
            const p1Ends = Array.from({ length: game.arena.length }, (_, index) => [index, 0]);
            let p1ShortestRoute = bfsSearchShortestRoute(game.arena, game.p1, p1Ends);
            console.log(`p1 remains steps: ${p1ShortestRoute.length - 1}`);

            // check p2
            const p2Ends = Array.from({ length: game.arena.length }, (_, index) => [index, game.arena.length - 1]);
            let p2ShortestRoute = bfsSearchShortestRoute(game.arena, game.p2, p2Ends);
            console.log(`p2 remains steps: ${p2ShortestRoute.length - 1}`);

            if (p1ShortestRoute.length - 1 == 0) {
                return Turn.P1;
            }

            if (p2ShortestRoute.length - 1 == 0) {
                return Turn.P2;
            }

            return null;
        }
    }
})();