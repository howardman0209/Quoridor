// Data Class
export class Action {
    constructor(move, block) {
        this.move = move;
        this.block = block;
        this.type = move != undefined ? ActionType.MOVE : ActionType.BLOCK;
    }
}

export const ActionType = Object.freeze({
    MOVE: 'MOVE',
    BLOCK: 'BLOCK'
});