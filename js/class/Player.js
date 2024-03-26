"use strict";
import { Turn } from '../enum/Turn.js';

export class Player {
    constructor(turn, arenaSize, blockLimit, forClone) {
        this.x = null;
        this.y = null;
        this.goalLine = null;
        this.remainingBlocks = null;
        this.shortestRoute = null;

        if (!forClone) {
            [this.x, this.y] = this.#getInitialPosition(turn, arenaSize);
            this.goalLine = this.#getGoalLine(turn, arenaSize);
            this.remainingBlocks = blockLimit;
            this.shortestRoute = [];
        }
    }

    loadData(playerMeta){
        const assertDataList = Object.keys(this);
        assertDataList.forEach(key => {
            if (!Object.keys(playerMeta).includes(key)) { // Assertion fail
                // console.log(`missing data`);
                throw new Error(`Missing required player data`);
            }
        });
        this.x = playerMeta.x;
        this.y = playerMeta.y;
        this.goalLine = playerMeta.goalLine;
        this.remainingBlocks = playerMeta.remainingBlocks;
        this.shortestRoute = playerMeta.shortestRoute;
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

Player.clone = function (playerMeta) {
    const clonePlayer = new Player(null, null, null, true);
    clonePlayer.loadData(playerMeta);
    return clonePlayer;
}