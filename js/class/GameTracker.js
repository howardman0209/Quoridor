import { Action } from "../dataClass/Action.js";

export class GameTracker {
    constructor() {
        this.actions = [];
        this.cursor = -1;
    }

    clear() {
        this.actions = [];
        this.cursor = -1;
    }

    record(action) {
        console.log(action);
        this.cursor++;
        this.actions.splice(this.cursor, this.actions.length - this.cursor, action);
    }

    previous() {
        // console.log(this.cursor, this.actions);
        if (this.cursor >= 0) {
            const action = this.actions[this.cursor];
            // console.log(action);
            this.cursor--;
            return action;
        }
    }

    next() {
        // console.log(this.cursor, this.actions);
        if (this.cursor < this.actions.length - 1) {
            this.cursor++;
            const action = this.actions[this.cursor];
            // console.log(action);
            return action;
        }
    }

}