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

/*
        getScore: function (game, turn) {
            // check p1 
            const p1Ends = Array.from({ length: game.arena.length }, (_, index) => [index, 0]);
            let p1ShortestRoute = this.lookUpShortestRoute(game.arena, game.p1, p1Ends, game.p2);
            let p1Remains = p1ShortestRoute.length - 1
            // console.log(`p1 remains steps: ${p1Remains}`);

            // check p2
            const p2Ends = Array.from({ length: game.arena.length }, (_, index) => [index, game.arena.length - 1]);
            let p2ShortestRoute = this.lookUpShortestRoute(game.arena, game.p2, p2Ends, game.p1);
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
                this.placeBlock(tmpGame, action.block, turn);
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
*/