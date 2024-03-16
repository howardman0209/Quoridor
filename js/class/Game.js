// Data Class
import { Log } from '../util/Log.js';
import { Turn } from '../enum/Turn.js';
import { Player } from './Player.js';
import { GameHelper } from '../globalObject/GameHelper.js';

export class Game {
    constructor(arenaSize, playerOrder) {
        this.arena = this.#initArena(arenaSize);
        this.p1 = this.#initPlayer(arenaSize, Turn.P1);
        this.p2 = this.#initPlayer(arenaSize, Turn.P2);
        this.playerOrder = playerOrder;
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


    deepCopy() {
        const cloneData = JSON.parse(JSON.stringify(this));
        const newGame = new Game(0, 0, 0, Turn.P1);
        newGame.loadData(cloneData);
        return newGame;
    }

    loadData(game) {
        this.arena = game.arena;
        this.p1 = game.p1;
        this.p2 = game.p2;
        this.playerOrder = game.playerOrder;
        this.numOfTurn = game.numOfTurn;
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

    #isAvailableToPlaceBlock(block) {
        return block.every(part => this.arena[part[1]][part[0]] > 0);
    }

    #isDeadBlock(block) {
        // temporaryPlaceBlock(block)
        const tmpGame = this.deepCopy();
        const arena = tmpGame.arena;

        // place block
        tmpGame.placeBlock(block);

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

    placeBlock(block) {
        block.forEach(element => {
            this.arena[element[1]][element[0]] = this.currentTurn == Turn.P1 ? -1 : -2;
        });

        const player = this.player;
        player.remainingBlocks--;
        this.#goToNextTurn();
    }

    applyMove(move) {
        this.player.moveTo(...move);
        this.#goToNextTurn();
    }

    getShortestRoute(considerOpponent) {
        const player = this.player;
        const start = [player.x, player.y];
        const opponent = considerOpponent ? [this.opponent.x, this.opponent.y] : undefined;
        return GameHelper.lookUpShortestRoute(this.arena, start, player.goalLine, opponent)
    }

    checkWinner() {
        // check player
        const player = this.player;
        let playerShortestRoute = GameHelper.lookUpShortestRoute(this.arena, [player.x, player.y], player.goalLine);
        // Log.d(`checkWinner, player`, player.goalLine);

        // check opponent
        const opponent = this.opponent;
        let opponentShortestRoute = GameHelper.lookUpShortestRoute(this.arena, [opponent.x, opponent.y], opponent.goalLine);
        // Log.d(`checkWinner, opponent`, opponent.goalLine);

        if (playerShortestRoute.length - 1 == 0) {
            return this.currentTurn;
        }

        if (opponentShortestRoute.length - 1 == 0) {
            return this.nextTurn;
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