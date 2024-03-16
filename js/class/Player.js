import { Turn } from '../enum/Turn.js';

export class Player {
    constructor(turn, arenaSize, blockLimit) {
        [this.x, this.y] = this.#getInitialPosition(turn, arenaSize);
        this.goalLine = this.#getGoalLine(turn, arenaSize);
        this.remainingBlocks = blockLimit;
    }

    #getInitialPosition(turn, arenaSize) {
        return turn == Turn.P1 ? [arenaSize - 1, arenaSize * 2 - 2] : [arenaSize - 1, 0];
    }

    #getGoalLine(turn, arenaSize) {
        return turn == Turn.P1 ? 0 : arenaSize * 2 - 2;
    }

    moveTo(x, y) {
        [this.x, this.y] = [x, y];
    }
}