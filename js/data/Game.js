// Data Class
export class Game {
    constructor(arena, p1, p2) {
        this.arena = arena;
        this.p1 = p1;
        this.p2 = p2;
    }

    deepCopy() {
        const newGameCopy = JSON.parse(JSON.stringify(this));
        return newGameCopy;
    }
}