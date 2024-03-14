// Data Class
import { Log } from '../util/Log.js';
import { Turn } from '../data/Turn.js';
import { Player } from '../data/Player.js';

export class Game {
    constructor(arenaSize, p1Blocks, p2Blocks, initialTurn) {
        this.arena = this.#initArena(arenaSize);
        this.p1 = this.#initPlayer(arenaSize, Turn.P1);
        this.p2 = this.#initPlayer(arenaSize, Turn.P2);
        this.p1Blocks = p1Blocks;
        this.p2Blocks = p2Blocks;
        this.currentTurn = initialTurn;
        // Log.d(`P1`, this.#initPlayer(arenaSize, Turn.P1));
        // Log.d(`P2`, this.#initPlayer(arenaSize, Turn.P2));
    }

    #initArena(size) {
        Log.d(`Game`, `initArena`);
        const arena = Array.from({ length: size * 2 - 1 }, (_, rowIndex) =>
            Array.from({ length: size * 2 - 1 }, (_, columnIndex) =>
                rowIndex % 2 != 0 || columnIndex % 2 != 0 ? 1 : 0
            )
        )
        Log.d(`Arena`, arena)
        return arena
    }

    #initPlayer(arenaSize, turn) {
        Log.d(`Game`, `initPlayer, ${turn}`);
        return new Player(turn, arenaSize, arenaSize + 1)
    }


    deepCopy() {
        const newGameCopy = JSON.parse(JSON.stringify(this));
        return newGameCopy;
    }

    loadData(game) {
        this.arena = game.arena;
        this.p1 = game.p1;
        this.p2 = game.p2;
        this.p1Blocks = game.p1Blocks;
        this.p2Blocks = game.p2Blocks;
        this.currentTurn = game.currentTurn;
    }

    getPlayer(turn) {
        return turn == Turn.P1 ? this.p1 : this.p2;
    }

    getOpponent(turn) {
        return turn == Turn.P1 ? this.p2 : this.p1;
    }

    getNextTurn(turn) {
        return turn == Turn.P1 ? Turn.P2 : Turn.P1;
    }

    findValidMoves(turn, considerOpponent) {
        const player = this.getPlayer(turn);
        const opponent = considerOpponent ? this.getOpponent(turn) : null;
        // Log.d(`player ${turn}`, player);
        const [px, py] = [player.x, player.y];
        const [ox, oy] = opponent != null ? [opponent.x, opponent.y] : [0, 0];
        if (px % 2 != 0 || py % 2 != 0) {
            return; // invalid location
        }

        const isMoveValid = (x, y) => 0 <= x && x < this.arena.length && 0 <= y && y < this.arena.length && !(x == px && y == py);
        const validMove = [];
        let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Up, Down, Left, Right
        let directionLabels = ["Up", "Down", "Left", "Right"];
        let i = 0;
        directions.forEach(it => {
            const dy = py + it[0];
            const dx = px + it[1];
            // console.log(`${directionLabels[i]} - dy: ${dy}, dx: ${dx}`);

            if (0 <= dy && dy < this.arena.length && 0 <= dx && dx < this.arena.length) {
                let noBlock = this.arena[dy][dx] > 0;
                // console.log(`noBlock: ${noBlock}`);
                if (noBlock) {
                    let meetOpponent = opponent != null && (py + 2 * it[0] == oy && px + 2 * it[1] == ox);
                    // console.log(`meetOpponent: ${meetOpponent}`);
                    if (!meetOpponent) {
                        let move = [px + (2 * it[1]), py + (2 * it[0])];
                        if (isMoveValid(...move)) {
                            validMove.push(move);
                        }
                    } else {
                        let canJump = isMoveValid(px + 3 * it[1], py + 3 * it[0]) && this.arena[py + 3 * it[0]][px + 3 * it[1]] > 0;
                        // console.log(`canJump: ${canJump}`);
                        if (canJump) {
                            let move = [px + (4 * it[1]), py + (4 * it[0])];
                            validMove.push(move);
                        } else {
                            let opponentMoves = this.findValidMoves(this.getNextTurn(turn));
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
    }

    checkValidMoves(player, opponent) {
        const [px, py] = player;
        const [ox, oy] = opponent != undefined ? [opponent.x, opponent.y] : [];
        if (px % 2 != 0 || py % 2 != 0) {
            return; // invalid location
        }

        const isMoveValid = (x, y) => 0 <= x && x < this.arena.length && 0 <= y && y < this.arena.length && !(x == px && y == py);
        const validMove = [];
        let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Up, Down, Left, Right
        let directionLabels = ["Up", "Down", "Left", "Right"];
        let i = 0;
        directions.forEach(it => {
            const dy = py + it[0];
            const dx = px + it[1];
            // console.log(`${directionLabels[i]} - dy: ${dy}, dx: ${dx}`);

            if (0 <= dy && dy < this.arena.length && 0 <= dx && dx < this.arena.length) {
                let noBlock = this.arena[dy][dx] > 0;
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
                        let canJump = isMoveValid(px + 3 * it[1], py + 3 * it[0]) && this.arena[py + 3 * it[0]][px + 3 * it[1]] > 0;
                        // console.log(`canJump: ${canJump}`);
                        if (canJump) {
                            let move = [px + (4 * it[1]), py + (4 * it[0])];
                            validMove.push(move);
                        } else {
                            let opponentMoves = this.checkValidMoves([ox, oy]);
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
    }

    findValidBlocks() {
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

        return verticalBlocks.concat(horizontalBlocks);
    }

    isAvailableToPlaceBlock(block) {
        return block.every(part => this.arena[part[1]][part[0]] > 0);
    }


    lookUpShortestRoute(turn, considerOpponent) {
        const queue = [];
        const visited = [];
        const player = this.getPlayer(turn);
        const opponent = considerOpponent ? this.getOpponent(turn) : undefined;

        const start = [player.x, player.y]

        queue.push([start, []]);
        visited.push(start);

        while (queue.length > 0) {
            const [current, path] = queue.shift();
            // console.log(current);
            // console.log(path);

            if (player.goals.some(item => item[0] == current[0] && item[1] == current[1])) { // check reach ends
                return path.concat([current]); // return path
            }

            const validMoves = this.checkValidMoves(current, opponent);
            // console.log(validMoves);

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
}