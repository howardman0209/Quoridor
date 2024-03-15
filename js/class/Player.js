import { Turn } from '../enum/Turn.js';

export class Player {
    constructor(turn, arenaSize, blockLimit) {
        [this.x, this.y] = this.#getInitialPosition(turn, arenaSize);
        this.goals = this.#getGoals(turn, arenaSize);
        this.remainingBlocks = blockLimit;
    }

    #getInitialPosition(turn, arenaSize) {
        return turn == Turn.P1 ? [arenaSize - 1, arenaSize * 2 - 2] : [arenaSize - 1, 0];
    }

    #getGoals(turn, arenaSize) {
        const ends = turn == Turn.P1 ? Array.from({ length: arenaSize }, (_, index) => [index * 2, 0]) :
            Array.from({ length: arenaSize }, (_, index) => [index * 2, arenaSize * 2 - 2]);
        // console.log(ends);
        return ends;
    }
}