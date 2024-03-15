// Data Class
import { ActionType } from '../enum/ActionType.js';

export class Action {
    constructor(move, block) {
        this.move = move;
        this.block = block;
        this.type = move != undefined ? ActionType.MOVE : ActionType.BLOCK;
    }
}