import { Game } from "../class/Game.js";
import { Turn } from '../enum/Turn.js';
import { Action } from '../dataClass/Action.js';
import { ActionType } from '../enum/ActionType.js';

export const GameHelper = (() => {
    return {
        initGame: function (size) {
            // inital numOfTurn = 1, playerOrder[numOfTurn%2]
            // if order = [Turn.P2, Turn.P1] => P1 will be the first player
            let game = new Game(size, [Turn.P2, Turn.P1]);
            return game;
        },

        lookUpShortestRoute: function (arena, start, goalLine, opponent) {
            const queue = [];
            const visited = [];

            queue.push([start, []]);
            visited.push(start);

            while (queue.length > 0) {
                const [current, path] = queue.shift();
                // console.log(current);
                // console.log(path);

                if (current[1] == goalLine) { // check reach ends
                    return path.concat([current]); // return path
                }

                const validMoves = GameHelper.findValidMoves(arena, current, opponent);

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
        },

        shuffle(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const x = arr[i];
                arr[i] = arr[j];
                arr[j] = x;
            }
            return arr;
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
                // console.log(`${directionLabels[i]} - dy: ${dy}, dx: ${dx}`);

                if (0 <= dy && dy < arena.length && 0 <= dx && dx < arena.length) {
                    let noBlock = arena[dy][dx] > 0;
                    // console.log(`noBlock: ${noBlock}`);
                    if (noBlock) {
                        let meetOpponent = opponent != undefined && (py + 2 * it[0] == oy && px + 2 * it[1] == ox);
                        // console.log(`meetOpponent: ${meetOpponent}`);
                        if (!meetOpponent) {
                            let move = [px + (2 * it[1]), py + (2 * it[0])];
                            if (isMoveValid(...move)) {
                                validMove.push(move);
                            }
                        } else {
                            let canJump = isMoveValid(px + 3 * it[1], py + 3 * it[0]) && arena[py + 3 * it[0]][px + 3 * it[1]] > 0;
                            // console.log(`canJump: ${canJump}`);
                            if (canJump) {
                                let move = [px + (4 * it[1]), py + (4 * it[0])];
                                validMove.push(move);
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
                }
                i++;
            });

            return validMove;
        },
    }
})();