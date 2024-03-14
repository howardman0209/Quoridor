// Data Class
export class Game {
    constructor(arena, p1, p2, p1Blocks, p2Blocks, turn) {
        this.arena = arena;
        this.p1 = p1;
        this.p2 = p2;
        this.p1Blocks = p1Blocks;
        this.p2Blocks = p2Blocks;
        this.turn = turn
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
        this.turn = game.turn;
    }
}