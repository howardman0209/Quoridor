import { VM } from '../viewModel/GameVM.js';
import { ActionType } from '../data/Action.js';
import { Turn } from '../data/Turn.js';
import { Direction } from '../data/Direction.js';

export const AI = (() => {
    return {
        // return all routes to every end
        // once reach any end will stop and try other path to remaining end(s)
        lookUpRoutes: function (game, turn) {
            let arena = game.arena;
            const [player, opponent, playerEnds] = turn == Turn.P1 ?
                [game.p1, game.p2, VM.getEnds(arena, Turn.P1)] : [game.p2, game.p1, VM.getEnds(arena, Turn.P2)];
            const possiblePaths = [];
            const queue = [];
            const visited = [];

            queue.push([player, []]);
            visited.push(player);

            while (queue.length > 0) {
                const [current, path] = queue.shift();
                // console.log(current);
                // console.log(path);

                if (playerEnds.some(item => item[0] == current[0] && item[1] == current[1])) { // check reach ends
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
        },

        lookUpRoutesBetween: function (arena, start, end, opponent) {
            console.log(`start: [${start}], end: [${end}], opponent: [${opponent}]`);
            const possiblePaths = [];
            const queue = [];
            const visited = [];
            queue.push([start, []]);
            visited.push(start);

            while (queue.length > 0) {
                const [current, path] = queue.shift();
                console.log(`current: [${current}]`);
                console.log(`path`);
                console.log(path);

                if (end[0] == current[0] && end[1] == current[1]) { // check reach ends
                    possiblePaths.push(path.concat([current]));
                } else if (end[1] == current[1]) {
                    continue;
                }

                const validMoves = VM.findValidMoves(arena, current, opponent);

                validMoves.forEach(move => {
                    // console.log(`move: ${move}`);
                    let isVisited = visited.some(item => item[0] == move[0] && item[1] == move[1]); // check next move is visited
                    // console.log(`isVisited: ${isVisited}`);
                    if (!isVisited) {
                        const newPath = path.concat([current]);
                        queue.push([move, newPath]);
                        if (!(end[0] == move[0] && end[1] == move[1])) {
                            visited.push(move);
                        }
                    }
                });
            }

            return possiblePaths;
        },

        lookUpShortestRoute: function (game, turn) {
            const arena = game.arena;
            const [player, opponent, playerEnds] = turn == Turn.P1 ?
                [game.p1, game.p2, VM.getEnds(arena, Turn.P1)] : [game.p2, game.p1, VM.getEnds(arena, Turn.P2)];

            const queue = [];
            const visited = [];

            queue.push([player, []]);
            visited.push(player);

            while (queue.length > 0) {
                const [current, path] = queue.shift();
                // console.log(current);
                // console.log(path);

                if (playerEnds.some(item => item[0] == current[0] && item[1] == current[1])) { // check reach ends
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
        },

        moveOrBlock: function (game, turn) {
            let arena = game.arena;
            let [player, opponent, playerEnds, opponentEnds] = turn == Turn.P1 ?
                [game.p1, game.p2, VM.getEnds(arena, Turn.P1), VM.getEnds(arena, Turn.P2)]
                : [game.p2, game.p1, VM.getEnds(arena, Turn.P2), VM.getEnds(arena, Turn.P1)];

            if (!VM.isPlayerRemainsBlock(game, turn)) {
                return ActionType.MOVE; // Theorem 1
            }

            let winInNextMove = this.winInNextMove(game, turn);
            // console.log(`winInNextMove: ${winInNextMove}`)
            if (winInNextMove) {
                return ActionType.MOVE;  // Theorem 2
            }


            let criticalSlots = this.findCriticalSlots(game, turn);
            console.log(`criticalSlots`);
            console.log(criticalSlots);

            return ActionType.MOVE;
        },

        winInNextMove: function (game, turn) {
            let player = turn == Turn.P1 ? game.p1 : game.p2;
            let playerShortest = this.lookUpShortestRoute(game, turn);
            let winInNextMove = playerShortest[playerShortest.length - 2] == player; // win in next move
            return winInNextMove;
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

        getReachableEnds: function (game, turn) {
            let routes = this.lookUpRoutes(game, turn);
            return routes.map(route => { return route[route.length - 1] });
        },

        findCriticalSlots: function (game, turn) {
            const [player, opponent] = turn == Turn.P1 ? [game.p1, game.p2] : [game.p2, game.p1];
            const criticalSlots = [];
            const reachableEnds = this.getReachableEnds(game, turn);
            reachableEnds.forEach(end => {
                const routes = this.lookUpRoutesBetween(game.arena, player, end, opponent);
                console.log(`from: [${player}] to [${end}], opponent at [${opponent}]`);
                console.log(routes);
                routes.forEach(route => {
                    for (let i = route.length - 1; i > 0; i--) {
                        let [current, next] = [route[i - 1], route[i]]
                        if (criticalSlots.some(slot => slot[0] == current[0] && slot[1] == current[1])) {
                            break; // skip check if current is already be regarded as critical slot
                        }

                        let blocks = this.getBlocksInBetween(current, next, game.arena.length);
                        // console.log(blocks);
                        let validBlocks = blocks.filter(block => VM.isAvailableToPlaceBlock(game.arena, block) && !VM.isDeadBlock(game, block));
                        // console.log(validBlocks);
                        let canBlock = validBlocks.length != 0;
                        if (canBlock) {
                            criticalSlots.push(current);
                            break;
                        }
                    }
                });
            });

            return criticalSlots;
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

        }
    };
})();