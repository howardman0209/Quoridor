import { Log } from '../util/Log.js';
import { Node } from '../class/Node.js';
import { AI } from '../ai/AI.js';

export const MCTS = (() => {
    function selection(node) {
        // Implement the selection strategy to choose a node to expand
        // You can use any strategy like UCB1, Upper Confidence Bound, etc.
        // Traverse the tree based on a selection policy until a leaf node is reached
        // Return the selected node

        while (node.children.length !== 0) {
            // UCB1 calculation for each child node
            const ucb1Values = node.children.map(child => {
                if (child.visits !== 0) {
                    const exploitation = child.score / child.visits;
                    const exploration = Math.sqrt((2 * Math.log(node.visits)) / child.visits);
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
            node = node.children[randomChildIndex];
        }

        return node;
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

    function rollout(nodeState) {
        // start with the argument's game state 
        // to simulate the remaining game process random until reach terminate state (EndGame)
        // console.log(`rollout`, nodeState.currentTurn);
        return AI.simulation(nodeState);
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

        search: function (rootNode, numberOfIterations, callback) {
            const targetWinner = rootNode.state.currentTurn;
            // console.log(`targetWinner`, targetWinner);
            let targetNode = rootNode;
            for (let i = 0; i < numberOfIterations; i++) {
                console.log(`MCTS - iteration: ${i}`);
                callback(i / numberOfIterations * 100);
                if (i == 0) {
                    expansion(targetNode);
                } else {
                    targetNode = selection(rootNode);
                    // console.log(`targetNode`, targetNode);
                    const isNewNode = targetNode.visits == 0;
                    if (isNewNode || targetNode.state.checkWinner() != null) {
                        // define score, (win or lose): [ win:1 | lose:0 ]
                        const simulationWinner = rollout(targetNode.state);
                        // console.log(`targetWinner`, targetWinner);
                        // console.log(`simulationWinner`, simulationWinner);
                        const score = simulationWinner == targetWinner ? 1 : 0;
                        // console.log(`score`, score);
                        backpropagation(targetNode, score);
                    } else {
                        expansion(targetNode);
                    }
                }
            }
            // console.log(`targetNode`, targetNode);
            const bestChild = getBestChild(rootNode);
            // console.log(`bestChild`, bestChild);

            return bestChild;
        }
    }
})();