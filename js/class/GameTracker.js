import { Action } from "../dataClass/Action.js";

export class GameTracker {
    #actions = [];
    #cursor = -1;
    constructor() {

    }

    hasPrevious() {
        return this.#cursor != -1;
    }

    hasNext() {
        return this.#cursor < this.#actions.length - 1;
    }

    exportRecord() {
        return this.#actions.slice(); // return value instead of reference
    }

    importRecord(record) {
        const assertDataList = Object.keys(new Action());
        record.forEach(action => {
            assertDataList.forEach(key => {
                if (!Object.keys(action).includes(key)) { // Assertion fail
                    // console.log(`missing data`);
                    throw new Error(`Missing required record data`);
                }
            });
        });
        this.clear();
        this.#actions = record;
        this.#cursor = -1;
    }

    clear() {
        this.#actions = [];
        this.#cursor = -1;
    }

    record(action) {
        console.log(action);
        this.#cursor++;
        this.#actions.splice(this.#cursor, this.#actions.length - this.#cursor, action);
    }

    previous() {
        // console.log(this.#cursor, this.#actions);
        if (this.#cursor >= 0) {
            const action = this.#actions[this.#cursor];
            // console.log(action);
            this.#cursor--;
            return action;
        }
    }

    next() {
        // console.log(this.#cursor, this.#actions);
        if (this.#cursor < this.#actions.length - 1) {
            this.#cursor++;
            const action = this.#actions[this.#cursor];
            // console.log(action);
            return action;
        }
    }

}