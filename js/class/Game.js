"use strict";
import { Log } from '../util/Log.js';
import { Turn } from '../enum/Turn.js';
import { Player } from './Player.js';
import { GameHelper } from '../globalObject/GameHelper.js';
import { Action } from '../dataClass/Action.js';
import { ActionType } from '../enum/ActionType.js';

export class Game {
    constructor(arenaSize, playerOrder, forClone) {
        this.arena = null;
        this.p1 = null;
        this.p2 = null;
        this.playerOrder = null;
        this.numOfTurn = null;

        if (!forClone) {
            this.arena = this.#initArena(arenaSize);
            this.p1 = this.#initPlayer(arenaSize, Turn.P1);
            this.p2 = this.#initPlayer(arenaSize, Turn.P2);
            this.playerOrder = playerOrder;
            this.numOfTurn = 1;
            this.#updatePlayersShortestRoute();
        }
    }

    restart() {
        const arenaSize = (this.arena.length + 1) / 2;
        this.arena = this.#initArena(arenaSize);
        this.p1 = this.#initPlayer(arenaSize, Turn.P1);
        this.p2 = this.#initPlayer(arenaSize, Turn.P2);
        this.numOfTurn = 1;
    }

    #initArena(size) {
        // Log.d(`Game`, `initArena`);
        const arena = Array.from({ length: size * 2 - 1 }, (_, rowIndex) =>
            Array.from({ length: size * 2 - 1 }, (_, columnIndex) =>
                rowIndex % 2 != 0 || columnIndex % 2 != 0 ? 1 : 0
            )
        )
        // Log.d(`Arena`, arena)
        return arena
    }

    #initPlayer(arenaSize, turn) {
        // Log.d(`Game`, `initPlayer, ${turn}`);
        return new Player(turn, arenaSize, arenaSize + 1)
    }


    get cloneData() {
        return JSON.parse(JSON.stringify(this));
    }

    loadData(gameMeta) {
        const assertDataList = Object.keys(this);
        assertDataList.forEach(key => {
            if (!Object.keys(gameMeta).includes(key)) { // Assertion fail
                // console.log(`missing data`);
                throw new Error(`Missing required game data`);
            }
        });

        const p1 = Object.assign(new Player, gameMeta.p1);
        const p2 = Object.assign(new Player, gameMeta.p2);
        this.arena = gameMeta.arena;
        this.numOfTurn = gameMeta.numOfTurn;
        this.playerOrder = gameMeta.playerOrder;
        this.p1 = p1;
        this.p2 = p2;
    }

    get player() {
        return this.currentTurn == Turn.P1 ? this.p1 : this.p2;
    }

    get opponent() {
        return this.currentTurn == Turn.P1 ? this.p2 : this.p1;
    }

    get currentTurn() {
        return this.playerOrder[this.numOfTurn % 2];
    }

    get nextTurn() {
        return this.playerOrder[(this.numOfTurn + 1) % 2];
    }

    #goToNextTurn() {
        this.numOfTurn++;
        this.#updatePlayersShortestRoute();
    }

    #backToPreviousTurn() {
        this.numOfTurn--;
    }

    #updatePlayersShortestRoute() {
        const p1ShortestRoute = GameHelper.lookUpShortestRoute(this.arena, [this.p1.x, this.p1.y], this.p1.goalLine, [this.p2.x, this.p2.y]);
        const p2ShortestRoute = GameHelper.lookUpShortestRoute(this.arena, [this.p2.x, this.p2.y], this.p2.goalLine, [this.p1.x, this.p1.y]);

        this.p1.shortestRoute = p1ShortestRoute;
        this.p2.shortestRoute = p2ShortestRoute;
    }

    getValidMoves(considerOpponent) {
        const player = [this.player.x, this.player.y];
        const opponent = considerOpponent ? [this.opponent.x, this.opponent.y] : undefined;
        return GameHelper.findValidMoves(this.arena, player, opponent);
    }

    getValidBlocks() {
        const arena = this.arena;
        const size = (this.arena.length + 1) / 2;

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

        return verticalBlocks.concat(horizontalBlocks).filter(block => this.isValidBlock(block));
        //.filter(block => this.isAvailableToPlaceBlock(block) && !this.isDeadBlock(block));
    }

    getValidActions() {
        const moveActions = this.getValidMoves(true).map(move => new Action([[this.player.x, this.player.y], move], ActionType.MOVE));
        // Log.d(`moveActions`, moveActions);

        const blockActions = this.getValidBlocks().map(block => new Action(block, ActionType.BLOCK));
        // Log.d(`blockActions`, blockActions);
        if (this.player.remainingBlocks > 0) {
            return moveActions.concat(blockActions);
        } else {
            return moveActions;
        }
    }

    #isAvailableToPlaceBlock(block) {
        return block.every(part => this.arena[part[1]][part[0]] > 0);
    }

    #isDeadBlock(block) {
        // temporaryPlaceBlock(block)
        const tmpGame = Game.newInstance(this.cloneData);
        const arena = tmpGame.arena;

        // place block
        tmpGame.#placeBlock(block);

        // console.log(arena);
        // check player
        const player = this.player;
        let playerShortestRoute = GameHelper.lookUpShortestRoute(arena, [player.x, player.y], player.goalLine);

        // check opponent
        const opponent = this.opponent;
        let opponentShortestRoute = GameHelper.lookUpShortestRoute(arena, [opponent.x, opponent.y], opponent.goalLine);

        // check player & opponent whether has no valid route
        let isDeadBlock = playerShortestRoute == null || opponentShortestRoute == null;
        // console.log(`isDeadBlock: ${isDeadBlock}`);

        return isDeadBlock;
    }

    isValidBlock(block) {
        return this.#isAvailableToPlaceBlock(block) && !this.#isDeadBlock(block)
    }

    #placeBlock(block) {
        block.forEach(element => {
            this.arena[element[1]][element[0]] = this.currentTurn == Turn.P1 ? -1 : -2;
        });
    }

    #removeBlock(block) {
        block.forEach(element => {
            this.arena[element[1]][element[0]] = 1;
        });
    }

    doAction(action) {
        if (action.type == ActionType.MOVE) {
            const [original, move] = action.data;
            this.player.moveTo(...move);
        } else if (action.type == ActionType.BLOCK) {
            const block = action.data;
            this.#placeBlock(block);
            this.player.remainingBlocks--;
        }
        this.#goToNextTurn();
    }

    undoAction(action) {
        if (action.type == ActionType.MOVE) {
            const [original, move] = action.data;
            this.opponent.moveTo(...original);
        } else if (action.type == ActionType.BLOCK) {
            const block = action.data;
            this.#removeBlock(block);
            this.opponent.remainingBlocks++;
        }
        this.#backToPreviousTurn()
    }

    getShortestRoute(considerOpponent) {
        const player = this.player;
        const start = [player.x, player.y];
        const opponent = considerOpponent ? [this.opponent.x, this.opponent.y] : undefined;
        return GameHelper.lookUpShortestRoute(this.arena, start, player.goalLine, opponent)
    }

    checkWinner(checkFuture) {
        // check current terminated state
        if (this.player.y == this.player.goalLine) {
            return this.currentTurn;
        }

        if (this.opponent.y == this.opponent.goalLine) {
            return this.nextTurn;
        }

        if (checkFuture) {
            // check predictable terminated state
            if (this.opponent.remainingBlocks <= 0) {
                const playerShortestRoute = GameHelper.lookUpShortestRoute(this.arena, [this.player.x, this.player.y], this.player.goalLine, [this.opponent.x, this.opponent.y]);
                const opponentShortestRoute = GameHelper.lookUpShortestRoute(this.arena, [this.opponent.x, this.opponent.y], this.opponent.goalLine, [this.player.x, this.player.y]);
                if (playerShortestRoute != null && opponentShortestRoute != null && playerShortestRoute.length < opponentShortestRoute.length) {
                    return this.currentTurn;
                }
            }

            if (this.player.remainingBlocks <= 0) {
                const playerShortestRoute = GameHelper.lookUpShortestRoute(this.arena, [this.player.x, this.player.y], this.player.goalLine, [this.opponent.x, this.opponent.y]);
                const opponentShortestRoute = GameHelper.lookUpShortestRoute(this.arena, [this.opponent.x, this.opponent.y], this.opponent.goalLine, [this.player.x, this.player.y]);
                if (playerShortestRoute != null && opponentShortestRoute != null && opponentShortestRoute.length < playerShortestRoute.length) {
                    return this.nextTurn;
                }
            }
        } else {
            return null;
        }


        return null;
    }

    getReachableGoals(turn) {
        let arena = this.arena;
        const [player, opponent] = turn == this.currentTurn ? [this.player, this.opponent] : [this.opponent, this.player];
        const [px, py] = [player.x, player.y];
        const [ox, oy] = [opponent.x, opponent.y];
        const reachableGoals = [];
        const queue = [];
        const visited = [];

        queue.push([[px, py], []]);
        visited.push([px, py]);

        while (queue.length > 0) {
            const [current, path] = queue.shift();
            // console.log(current);
            // console.log(path);

            if (current[1] == player.goalLine) { // check reach ends
                reachableGoals.push(current);
                visited.push(current); // mark end is visited
                continue;
            }

            const validMoves = GameHelper.findValidMoves(arena, current, [ox, oy]);

            validMoves.forEach(move => {
                let isVisited = visited.some(item => item[0] == move[0] && item[1] == move[1]); // check next move is visited
                if (!isVisited) {
                    // console.log([current]);
                    const newPath = path.concat([current]);
                    // console.log(newPath);
                    queue.push([move, newPath]);
                    visited.push(move);
                }
            });
        }

        return reachableGoals.sort((a, b) => a[0] - b[0]);
    }

}

Game.newInstance = function (gameMeta) {
    const size = (gameMeta.arena.length + 1) / 2;
    const game = new Game(size, [], true);
    game.loadData(gameMeta);
    return game;
}