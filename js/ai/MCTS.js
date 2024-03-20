import { Log } from '../util/Log.js';
import { Node } from '../class/Node.js';

export const MCTS = (() => {
    function selection(node) {
        // Implement the selection strategy to choose a node to expand
        // You can use any strategy like UCB1, Upper Confidence Bound, etc.
        // Traverse the tree based on a selection policy until a leaf node is reached
        // Return the selected node

        let currentNode = Object.assign({}, node); // Create a copy of the node object

        while (currentNode.children.length !== 0) {
            // UCB1 calculation for each child node
            const ucb1Values = currentNode.children.map(child => {
                if (child.visits !== 0) {
                    const exploitation = child.score / child.visits;
                    const exploration = Math.sqrt((2 * Math.log(currentNode.visits)) / child.visits);
                    return exploitation + exploration;
                } else {
                    return Infinity;
                }
            });

            // Find the maximum UCB1 value
            const maxUCB1Value = Math.max(...ucb1Values);

            // Find all child nodes with the maximum UCB1 value
            const maxUCB1Indices = ucb1Values.reduce((indices, value, index) => {
                if (value === maxUCB1Value) {
                    indices.push(index);
                }
                return indices;
            }, []);

            // Randomly select one child node from the ones with the maximum UCB1 value
            const randomChildIndex = maxUCB1Indices[Math.floor(Math.random() * maxUCB1Indices.length)];
            currentNode = currentNode.children[randomChildIndex];
        }

        return currentNode;
    }

    function expansion(node) {
        // Implement the expansion strategy to create a new child node
        // Expand the given node by generating a new state and creating a child node
        // Return the newly created child node

        // Generate all possible child states from the current node's game state
        const validActions = node.state.getValidActions();
        // Log.d(`validActions`, validActions);
        validActions.forEach(action => {
            // Create a new child node with the updated game state
            const newState = node.state.deepCopy();
            newState.doAction(action);
            const childNode = new Node(newState, action);
            // Log.d(`childNode`, childNode);

            // Connect the child node to the current node
            node.addChild(childNode);
        });

        return node;
    }

    function simulation(nodeState) {
        // start with the argument's game state 
        // to simulate the remaining game process random until reach terminate state (EndGame)
        // define score, (win or lose): [ win:1 | lose:0 ]
        console.log(`simulation`);
    }

    function backpropagation(node, score) {
        // Update the scores of the visited nodes along the path from the given node to the root
        // Increment the visit count and add the score to the accumulated score of each node
        while (node !== null) {
            node.visits++;
            node.score += score;
            node = node.parent;
        }
    }

    function getBestChild(node) {
        // Choose the child node with the highest average score
        // Calculate the average score of each child node
        // Return the child node with the highest average score
        let bestChild = node;
        let bestScore = -Infinity;

        for (const child of node.children) {
            const averageScore = child.score / child.visits;

            if (averageScore > bestScore) {
                bestScore = averageScore;
                bestChild = child;
            }
        }

        return bestChild;
    }

    return {

        monteCarloTreeSearch: function (rootNode, iterations) {
            for (let i = 0; i < iterations; i++) {
                // Selection phase: Choose a node to expand
                let node = selection(rootNode);
                Log.d(`selection`, node);

                // Expansion phase: Create a new child node
                let newNode = expansion(node);
                console.log(`expansion`, newNode);

                // Simulation phase: Simulate a random game play
                let score = simulation(newNode.state);
                Log.d(`simulation`, score);

                // Backpropagation phase: Update scores of the visited nodes
                backpropagation(newNode, score);
                Log.d(`backpropagation`, null);
            }

            // Get the best move by choosing the child with the highest average score
            let bestChild = getBestChild(rootNode);
            return bestChild.state; // Return the state associated with the best move
        }

    }
})();