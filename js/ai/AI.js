"use strict";
import { GameHelper } from '../globalObject/GameHelper.js';
import { ActionType } from '../enum/ActionType.js';
import { Direction } from '../enum/Direction.js';
import { MathUtil } from '../util/MathUtil.js';
import { Action } from '../dataClass/Action.js';
import { Log } from '../util/Log.js';
import { Game } from '../class/Game.js';
import { Turn } from '../enum/Turn.js';

export const AI = (() => {
    return {
        // return all shortest routes from start to end
        lookUpRoutesBetween: function (arena, start, end, opponent) {
            // console.log(`start: [${start}], end: [${end}], opponent: [${opponent}]`);
            const rows = arena.length;
            const cols = arena[0].length;

            const label = Array.from({ length: (rows + 1) / 2 }, (_, rowIndex) =>
                Array.from({ length: (cols + 1) / 2 }, (_, columnIndex) =>
                    rowIndex * (cols + 1) / 2 + columnIndex + 1
                )
            );
            // console.log(label);
            const steps = Array.from({ length: (rows + 1) / 2 }, () => Array((cols + 1) / 2).fill(0));
            // console.log(steps);
            const visited = Array.from({ length: (rows + 1) / 2 }, () => Array((cols + 1) / 2).fill(0));
            const queue = [[start, []]];
            const getLabel = (x, y) => { return 0 <= y / 2 && y / 2 <= label.length && 0 <= x / 2 && x / 2 <= label.length ? label[y / 2][x / 2] : null };
            const getSteps = (x, y) => { return 0 <= y / 2 && y / 2 <= steps.length && 0 <= x / 2 && x / 2 <= steps.length ? steps[y / 2][x / 2] : null };
            const markVisited = (x, y) => { visited[y / 2][x / 2] = 1 };
            const isVisited = (x, y) => { return visited[y / 2][x / 2] == 1 };
            const reachEnd = (x, y) => { return x == end[0] && y == end[1] };

            if (opponent != undefined && reachEnd(...opponent)) {
                return [];
            }

            // Construct steps table 
            // Mark start position as visited
            markVisited(start[0], start[1])

            let counter = 0;
            while (queue.length > 0) {
                const [currentPos, path] = queue.shift();
                const [x, y] = [currentPos[0] / 2, currentPos[1] / 2];
                const parent = path[path.length - 1];
                let label = null
                if (parent != undefined) {
                    label = getLabel(...parent)
                }
                // console.log(`current: [${currentPos}] (${getLabel(...currentPos)}) counter: ${counter} parent: ${label}`);
                counter++;

                let value = 0
                if (parent != undefined) {
                    value = getSteps(...parent)
                }
                steps[y][x] = value + 1; // assign step

                // Get all possible moves from the current position
                let moves = GameHelper.findValidMoves(arena, currentPos).sort((a, b) => b[1] - a[1]);

                // Explore each possible move
                for (const move of moves) {
                    const [newX, newY] = move;
                    // Check if the position has been visited
                    if (isVisited(newX, newY) == 0) {
                        markVisited(newX, newY);
                        queue.push([move, [...path, currentPos]]);
                    }
                }
            }
            // console.log(steps);
            // console.log(visited);

            // search steps table to find all routes
            const dfsResult = []
            const dfs = (currentNode, path) => {
                let currentStep = getSteps(...currentNode);
                let possibleNodes = GameHelper.findValidMoves(arena, currentNode);
                possibleNodes = possibleNodes.filter(node => getSteps(...node) < currentStep);
                if (possibleNodes.length > 0) {
                    for (const nextNode of possibleNodes) {
                        path.concat([currentNode]).concat(dfs(nextNode, path.concat([currentNode])));
                    }
                } else {
                    // console.log(`path`);
                    // console.log(path.concat([currentNode]));
                    dfsResult.push(path.concat([currentNode]));
                }
            }

            dfs(end, [])
            // console.log(`dfsResult`);
            // console.log(dfsResult);
            const finalResult = []
            for (let route of dfsResult) {
                if (opponent != undefined) {
                    route = route.filter(slot => slot[0] != opponent[0] || slot[1] != opponent[1]);
                }
                finalResult.push(route.reverse());
            }
            // console.log(`finalResult`);
            // console.log(finalResult);

            return finalResult;
        },

        moveOrBlock: function (game) {
            const arena = game.arena;
            const [player, opponent] = [game.player, game.opponent]

            if (player.remainingBlocks <= 0) {
                return ActionType.MOVE; // Theorem 1
            }

            let winInNextMove = this.winInNextMove(game);
            // console.log(`winInNextMove: ${winInNextMove}`)
            if (winInNextMove) {
                return ActionType.MOVE;  // Theorem 2
            }


            // let criticalSlots = this.findCriticalSlots(game, game.currentTurn);
            // Log.d(`criticalSlots`, criticalSlots);
            const moveOrBlock = Math.random() < 0.7 ? ActionType.MOVE : ActionType.BLOCK;
            return moveOrBlock;
        },

        winInNextMove: function (game) {
            const player = game.player;
            let playerShortest = game.player.shortestRoute;
            if (playerShortest == null) {
                return false;
            }
            let lastSlot = playerShortest[playerShortest.length - 2];
            // Log.d(`lastSlot`, lastSlot);
            return lastSlot[0] == player.x && lastSlot[1] == player.y;
        },

        getMoveDirection: function (current, next) {
            let delta = [next[0] - current[0], next[1] - current[1]];
            return Direction.getByDelta(delta);
        },

        getBlocksInBetween: function (current, next, arenaSize) {
            // console.log(`current: [${current}] -> next: [${next}]]`);
            const isValidBlock = (block) => block.every(part => part.every(it => 0 <= it && it < arenaSize));
            let [dx, dy] = [next[0] - current[0], next[1] - current[1]];
            let [x, y] = [current[0] + dx / 2, current[1] + dy / 2]
            let verticalOnly = x % 2 != 0 && y % 2 == 0;
            let horizontalOnly = x % 2 == 0 && y % 2 != 0;
            let vtlAndHzl = x % 2 != 0 && y % 2 != 0;

            if (verticalOnly) {
                // console.log(`verticalOnly`);
                let blocks = [[[x, y], [x, y + 1], [x, y + 2]], [[x, y - 2], [x, y - 1], [x, y]]]
                    .filter(block => isValidBlock(block));
                return blocks;
            }

            if (horizontalOnly) {
                // console.log(`horizontalOnly`);
                let blocks = [[[x, y], [x + 1, y], [x + 2, y]], [[x - 2, y], [x - 1, y], [x, y]]]
                    .filter(block => isValidBlock(block));
                return blocks;
            }

            if (vtlAndHzl) {
                // console.log(`vtlAndHzl`);
                let blocks = [[[x - 1, y], [x, y], [x + 1, y]], [[x, y - 1], [x, y], [x, y + 1]]]
                    .filter(block => isValidBlock(block));
                return blocks;
            }

            let isJump = x % 2 == 0 && y % 2 == 0;
            if (isJump) {
                // console.log(`jump opponent: [${x},${y}]`);
                let opponent = [x, y];
                let blocks = this.getBlocksInBetween(current, opponent, arenaSize).concat(this.getBlocksInBetween(opponent, next, arenaSize)).filter(block => isValidBlock(block));
                return blocks;
            }

            return null;
        },

        findCriticalSlots: function (game, turn) {
            const [p, o] = [game.player, game.opponent];
            const [start, opponent] = [[p.x, p.y], [o.x, o.y]];
            const criticalSlots = [];
            const reachableGoals = game.getReachableGoals(turn);
            // Log.d(`reachableGoals`, reachableGoals);
            reachableGoals.forEach(end => {
                const routes = this.lookUpRoutesBetween(game.arena, start, end, opponent);
                // Log.d(`findCriticalSlots`, `from: [${start}] to [${end}], opponent at [${opponent}]`);
                // Log.d(`routes`, routes);
                routes.forEach(route => {
                    for (let i = route.length - 1; i > 0; i--) {
                        let [current, next] = [route[i - 1], route[i]]
                        if (criticalSlots.some(slot => slot[0] == current[0] && slot[1] == current[1])) {
                            break; // skip check if current is already be regarded as critical slot
                        }

                        let blocks = this.getBlocksInBetween(current, next, game.arena.length);
                        // Log.d(`Blocks between [${current}] and [${next}]`, blocks);
                        let validBlocks = blocks.filter(block => game.isValidBlock(block));
                        // console.log(validBlocks);
                        let canBlock = validBlocks.length != 0;
                        if (canBlock) {
                            criticalSlots.push(current);
                            break;
                        }
                    }
                });
            });

            return criticalSlots.filter(slot => slot[1] != 0);
        },

        findCriticalMoves: function () {

        },

        findMeetUpSlots: function () {

        },

        findMeetUpMoves: function () {

        },

        findCriticalBlocks: function () {

        },

        findDetermineBlocks: function () {

        },

        isInTunnel: function () {

        },

        isInTube: function () {

        },

        getDistanceHeuristicScore(afterActionState) {
            const [player, opponent] = [afterActionState.opponent, afterActionState.player];
            if (opponent.shortestRoute != null && player.shortestRoute != null) {
                return opponent.shortestRoute.length - player.shortestRoute.length;
            }

            return 0;
        },

        getRemainingBlocksHeuristicScore(afterActionState) {
            const [player, opponent] = [afterActionState.opponent, afterActionState.player];
            return player.remainingBlocks - opponent.remainingBlocks;
        },

        simulation: function (game) {
            const actionList = [];// tmp add to check
            const simulationGame = Game.newInstance(game.cloneData);
            Log.d(`simulation init state`, simulationGame);

            while (simulationGame.checkWinner(true) == null) {
                // state 1: choose move or block
                const moveOrBlock = this.moveOrBlock(simulationGame);
                // Log.d(`AI, moveOrBlock`, moveOrBlock);

                // state 2: select move / block options
                let action = undefined
                if (moveOrBlock == ActionType.MOVE) {
                    const validMoves = simulationGame.getValidMoves(true);
                    const shortestRoute = simulationGame.player.shortestRoute;
                    const randomChance = Math.random() < 0.75
                    // ensure game reach terminate status & accelerate simulation
                    if (shortestRoute != null && (simulationGame.opponent.remainingBlocks == 0 || this.winInNextMove(game) || randomChance)) {
                        const effectiveMove = validMoves.find((move) => shortestRoute.some(step => step[0] == move[0] && step[1] == move[1]));
                        action = new Action([[simulationGame.player.x, simulationGame.player.y], effectiveMove], ActionType.MOVE);
                    } else {
                        const selectedIdx = MathUtil.getRandomInt(validMoves.length - 1);
                        action = new Action([[simulationGame.player.x, simulationGame.player.y], validMoves[selectedIdx]], ActionType.MOVE);
                    }
                } else if (moveOrBlock == ActionType.BLOCK) {
                    const validBlocks = simulationGame.getValidBlocks();
                    const selectedIdx = MathUtil.getRandomInt(validBlocks.length - 1);
                    action = new Action(validBlocks[selectedIdx], ActionType.BLOCK);
                }
                // Log.d(`AI, ${simulationGame.currentTurn} Action`, action);

                // state 3: update game status
                if (action != undefined) {
                    actionList.push(action);
                    simulationGame.doAction(action);
                    // Log.d(`AI, turn: ${simulationGame.numOfTurn} status`, simulationGame);
                }
            }
            Log.d(`actionList (${actionList.length})`, actionList);

            return simulationGame.checkWinner(true);
        }
    };
})();