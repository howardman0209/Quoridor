// Data Class
import { Log } from '../util/Log.js';
import { Turn } from '../enum/Turn.js';
import { Player } from './Player.js';
import { GameCO } from '../companionObj/GameCO.js';

export class Game {
    constructor(arenaSize, initialTurn) {
        this.arena = this.#initArena(arenaSize);
        this.p1 = this.#initPlayer(arenaSize, Turn.P1);
        this.p2 = this.#initPlayer(arenaSize, Turn.P2);
        this.currentTurn = initialTurn;
        // Log.d(`P1`, this.#initPlayer(arenaSize, Turn.P1));
        // Log.d(`P2`, this.#initPlayer(arenaSize, Turn.P2));
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
        this.p1Blocks = game.p1Blocks;
        this.p2Blocks = game.p2Blocks;
        this.currentTurn = game.currentTurn;
    }

    getPlayer() {
        return this.currentTurn == Turn.P1 ? this.p1 : this.p2;
    }

    getOpponent() {
        return this.currentTurn == Turn.P1 ? this.p2 : this.p1;
    }

    getNextTurn() {
        return this.currentTurn == Turn.P1 ? Turn.P2 : Turn.P1;
    }

    #goToNextTurn() {
        this.currentTurn = this.getNextTurn();
    }

    getValidMoves(considerOpponent) {
        const player = [this.getPlayer().x, this.getPlayer().y];
        const opponent = considerOpponent ? [this.getOpponent().x, this.getOpponent().y] : undefined;
        return GameCO.findValidMoves(this.arena, player, opponent);
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

        return verticalBlocks.concat(horizontalBlocks).filter(block => this.isAvailableToPlaceBlock(block) && !this.isDeadBlock(block));
        //.filter(block => this.isAvailableToPlaceBlock(block) && !this.isDeadBlock(block));
    }

    isAvailableToPlaceBlock(block) {
        return block.every(part => this.arena[part[1]][part[0]] > 0);
    }

    isDeadBlock(block) {
        // temporaryPlaceBlock(block)
        const tmpGame = this.deepCopy();
        const arena = tmpGame.arena;

        // place block
        tmpGame.placeBlock(block);

        // console.log(arena);
        // check player
        const player = this.getPlayer();
        let playerShortestRoute = GameCO.lookUpShortestRoute(arena, [player.x, player.y], player.goals);

        // check opponent
        const opponent = this.getOpponent();
        let opponentShortestRoute = GameCO.lookUpShortestRoute(arena, [opponent.x, opponent.y], opponent.goals);

        // check player & opponent whether has no valid route
        let isDeadBlock = playerShortestRoute == null || opponentShortestRoute == null;
        // console.log(`isDeadBlock: ${isDeadBlock}`);

        return isDeadBlock;
    }

    placeBlock(block) {
        block.forEach(element => {
            this.arena[element[1]][element[0]] = -1;
        });

        const player = this.getPlayer();
        player.remainingBlocks--;
        this.#goToNextTurn();
    }

    applyMove(move) {
        this.getPlayer().x = move[0];
        this.getPlayer().y = move[1];
        this.#goToNextTurn();
    }

    getShortestRoute(considerOpponent) {
        const player = this.getPlayer();
        const [start, ends] = [[player.x, player.y], player.goals];
        const opponent = considerOpponent ? [this.getOpponent().x, this.getOpponent().y] : undefined;
        return GameCO.lookUpShortestRoute(this.arena, start, ends, opponent)
    }

    checkWinner() {
        // check player
        const player = this.getPlayer();
        let playerShortestRoute = GameCO.lookUpShortestRoute(this.arena, [player.x, player.y], player.goals);

        // check opponent
        const opponent = this.getOpponent();
        let opponentShortestRoute = GameCO.lookUpShortestRoute(this.arena, [opponent.x, opponent.y], opponent.goals);

        if (playerShortestRoute.length - 1 == 0) {
            return this.currentTurn;
        }

        if (opponentShortestRoute.length - 1 == 0) {
            return this.getNextTurn();
        }

        return null;
    }
}