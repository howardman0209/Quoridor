import { Game } from "../data/Game.js";
import { Turn } from '../data/Turn.js';
import { Action } from '../data/Action.js';
import { ActionType } from '../data/Action.js';

export const VM = (() => {

    function bfsSearchShortestRoute(arena, start, ends, opponent) {
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

        findValidBlocks: function (game) {
            const arena = game.arena;
            const size = (game.arena.length + 1) / 2;
            const p1 = game.p1;
            const p2 = game.p2;

            let verticalBlocks = [];
            let horizontalBlocks = [];
            for (let row = 0; row < size - 1; row++) {
                for (let column = 0; column < size - 1; column++) {
                    let [x, y] = [1 + column * 2, 1 + row * 2]
                    let isMiddleSlotOccupied = arena[y][x] < 0
                    // console.log(`(x, y): (${x}, ${y}) occupied: ${occupied}`);
                    if (!isMiddleSlotOccupied) {
                        let verticallyOccupied = arena[y - 1][x] < 0 || arena[y + 1][x] < 0
                        let horizontallyOccupied = arena[y][x - 1] < 0 || arena[y][x + 1] < 0
                        if (!verticallyOccupied) {
                            let vtlBlk = [[x, y - 1], [x, y], [x, y + 1]];
                            verticalBlocks.push(vtlBlk);
                        }

                        if (!horizontallyOccupied) {
                            let hzlBlk = [[x - 1, y], [x, y], [x + 1, y]];
                            horizontalBlocks.push(hzlBlk);
                        }
                    }
                }
            }

            return verticalBlocks.concat(horizontalBlocks);
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
            const tmpGame = game.deepCopy();
            const arena = tmpGame.arena;

            // place block
            this.placeBlock(tmpGame, block);

            // console.log(arena);

            let p1 = tmpGame.p1;
            let p2 = tmpGame.p2;

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
            // this.removeBlock(tmpGame, block);
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

        checkWinner: function (game) {
            // check p1 
            const p1Ends = Array.from({ length: game.arena.length }, (_, index) => [index, 0]);
            let p1ShortestRoute = bfsSearchShortestRoute(game.arena, game.p1, p1Ends);
            // console.log(`p1 remains steps: ${p1ShortestRoute.length - 1}`);

            // check p2
            const p2Ends = Array.from({ length: game.arena.length }, (_, index) => [index, game.arena.length - 1]);
            let p2ShortestRoute = bfsSearchShortestRoute(game.arena, game.p2, p2Ends);
            // console.log(`p2 remains steps: ${p2ShortestRoute.length - 1}`);

            if (p1ShortestRoute.length - 1 == 0) {
                return Turn.P1;
            }

            if (p2ShortestRoute.length - 1 == 0) {
                return Turn.P2;
            }

            return null;
        },

        getScore: function (game, turn) {
            // check p1 
            const p1Ends = Array.from({ length: game.arena.length }, (_, index) => [index, 0]);
            let p1ShortestRoute = bfsSearchShortestRoute(game.arena, game.p1, p1Ends, game.p2);
            let p1Remains = p1ShortestRoute.length - 1
            // console.log(`p1 remains steps: ${p1Remains}`);

            // check p2
            const p2Ends = Array.from({ length: game.arena.length }, (_, index) => [index, game.arena.length - 1]);
            let p2ShortestRoute = bfsSearchShortestRoute(game.arena, game.p2, p2Ends, game.p1);
            let p2Remains = p2ShortestRoute.length - 1
            // console.log(`p2 remains steps: ${p2Remains}`);
            if (turn == Turn.P1) {
                return p2Remains - p1Remains
            } else {
                return p1Remains - p2Remains
            }
        },

        getSimulateResult: function (game, turn, action) {
            // clone game current status
            const tmpGame = game.deepCopy();

            if (action.type == ActionType.MOVE) {
                this.applyMove(tmpGame, action.move, turn);
            } else {
                this.placeBlock(tmpGame, action.block);
            }

            return tmpGame;
        },

        minimax: function (game, turn, action, depth, maximizingPlayer, alpha, beta) {
            let simulation = this.getSimulateResult(game, turn, action);
            let score = this.getScore(simulation, turn);
            // console.log(`score: ${score}`);
            //define player & opponent
            let [player, opponent] = turn == Turn.P1 ? [game.p1, game.p2] : [game.p2, game.p1];

            // Check if the maximum depth or a terminal game state has been reached
            if (depth === 0 || this.checkWinner(simulation)) {
                // console.log(depth === 0 ? `depth reach the end` : `someone win`);
                return score;
            }

            if (maximizingPlayer) {
                let maxScore = -Infinity;

                //evaluate blocks
                const possibleBlocks = this.findValidBlocks(game);
                for (const nextBlock of possibleBlocks) {
                    const blockScore = this.minimax(game, turn, new Action(undefined, nextBlock), depth - 1, false, alpha, beta);
                    maxScore = Math.max(maxScore, blockScore);
                    alpha = Math.max(alpha, blockScore);
                    if (beta <= alpha) {
                        break; // Beta cutoff
                    }
                }

                //evaluate moves
                const possibleMoves = this.findValidMoves(game.arena, player, opponent);
                for (const nextMove of possibleMoves) {
                    const moveScore = this.minimax(game, turn, new Action(nextMove, undefined), depth - 1, false, alpha, beta);
                    maxScore = Math.max(maxScore, moveScore);
                    alpha = Math.max(alpha, moveScore);
                    if (beta <= alpha) {
                        break; // Beta cutoff
                    }
                }

                return maxScore;
            } else {
                let minScore = Infinity;

                //evaluate blocks
                const possibleBlocks = this.findValidBlocks(game);
                for (const nextBlock of possibleBlocks) {
                    const blockScore = this.minimax(game, turn, new Action(undefined, nextBlock), depth - 1, true, alpha, beta);
                    minScore = Math.min(minScore, blockScore);
                    beta = Math.min(beta, blockScore);
                    if (beta <= alpha) {
                        break; // Alpha cutoff
                    }
                }

                //evaluate moves
                const possibleMoves = this.findValidMoves(game.arena, player, opponent);
                for (const nextMove of possibleMoves) {
                    const moveScore = this.minimax(game, turn, new Action(nextMove, undefined), depth - 1, true, alpha, beta);
                    minScore = Math.min(minScore, moveScore);
                    beta = Math.min(beta, moveScore);
                    if (beta <= alpha) {
                        break; // Alpha cutoff
                    }
                }

                return minScore;
            }
        },

        findBestAction: function (game, depth, turn) {
            let bestScore = -Infinity;
            let bestAction = null;

            //define player & opponent
            let [player, opponent] = turn == Turn.P1 ? [game.p1, game.p2] : [game.p2, game.p1];

            //evaluate moves
            const possibleMoves = this.findValidMoves(game.arena, player, opponent);
            for (const nextMove of possibleMoves) {
                const moveScore = this.minimax(game, turn, new Action(nextMove, undefined), depth, true, -Infinity, Infinity);
                if (moveScore > bestScore) {
                    bestScore = moveScore;
                    bestAction = new Action(nextMove, undefined);
                }
            }

            //evaluate blocks
            const possibleBlocks = this.findValidBlocks(game);
            for (const nextBlock of possibleBlocks) {
                const blockScore = this.minimax(game, turn, new Action(undefined, nextBlock), depth, true, -Infinity, Infinity);
                if (blockScore > bestScore) {
                    bestScore = blockScore;
                    bestAction = new Action(undefined, nextBlock);
                }
            }

            return bestAction;
        }
    }
})();