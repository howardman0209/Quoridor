import { MCTS } from './ai/MCTS.js';
import { Node } from './class/Node.js';
import { Game } from './class/Game.js';

// Define the code to be executed by the web worker
self.onmessage = function (event) {
    // Perform the computationally intensive task
    const request = event.data;
    const task = request.task;
    const data = request.data;
    switch (task) {
        case `AI`:
            aiAction(data);
            break;
        default:
            break;
    }
};

function callback(task, data) {
    // Send the result back to the main thread
    const response = {
        "task": task,
        "data": data
    }
    self.postMessage(response);
}

// Define the computationally intensive task
function aiAction(data) {
    // Process the data and perform complex calculations
    // ...
    const cloneGame = Game.newInstance(data);
    console.log(cloneGame);
    const result = MCTS.search(new Node(cloneGame), 5000);

    callback(`AI`, result);
}