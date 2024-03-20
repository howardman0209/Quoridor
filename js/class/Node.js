export class Node {
    constructor(state, takenAction) {
        this.state = state; // Game state associated with the node
        this.takenAction = takenAction;
        this.parent = null; // Parent node
        this.children = []; // Child nodes
        this.visits = 0; // Number of times the node has been visited
        this.score = 0; // Accumulated score for the node
    }

    // Add a child node to the current node
    addChild(child) {
        child.parent = this;
        this.children.push(child);
    }
}