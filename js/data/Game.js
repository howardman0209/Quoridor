// Data Class
export class Game {
    constructor(arena, p1, p2, p1Blocks, p2Blocks) {
        this.arena = arena;
        this.p1 = p1;
        this.p2 = p2;
        this.p1Blocks = p1Blocks;
        this.p2Blocks = p2Blocks;
    }

    deepCopy() {
        const newGameCopy = JSON.parse(JSON.stringify(this));
        return newGameCopy;
    }
}