import { Node } from '../class/Node.js';
import { MathUtil } from '../util/MathUtil.js';
import { Action } from '../dataClass/Action.js';
import { ActionType } from '../enum/ActionType.js';
import { Game } from '../class/Game.js';
import { Log } from '../util/Log.js';
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
                    const distanceHeuristicScore = AI.getDistanceHeuristicScore(child.state);
                    return exploitation + exploration + distanceHeuristicScore;
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
            const randomChoice = MathUtil.getRandomInt(maxUCB1Indices.length);
            const randomChildIndex = maxUCB1Indices[randomChoice];
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
            const newState = Game.newInstance(node.state.cloneData);
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
        const winInNextMove = (game) => {
            const player = game.player;
            let playerShortest = game.player.shortestRoute;
            if (playerShortest == null) {
                return false;
            }
            let lastSlot = playerShortest[playerShortest.length - 2];
            // Log.d(`lastSlot`, lastSlot);
            return lastSlot[0] == player.x && lastSlot[1] == player.y;
        }

        const decideMoveOrBlock = (game) => {
            const [player, opponent] = [game.player, game.opponent]

            if (player.remainingBlocks <= 0) {
                return ActionType.MOVE; // Theorem 1
            }

            if (winInNextMove(game)) {
                return ActionType.MOVE;  // Theorem 2
            }

            return Math.random() < 0.7 ? ActionType.MOVE : ActionType.BLOCK;
        }

        const actionList = [];// tmp add to check
        const simulationGame = Game.newInstance(nodeState.cloneData);
        // Log.d(`simulation init state`, simulationGame);

        while (simulationGame.checkWinner(true) == null) {
            // state 1: choose move or block
            const moveOrBlock = decideMoveOrBlock(simulationGame);
            // Log.d(`AI, moveOrBlock`, moveOrBlock);

            // state 2: select move / block options
            let action = undefined
            if (moveOrBlock == ActionType.MOVE) {
                const validMoves = simulationGame.getValidMoves(true);
                const shortestRoute = simulationGame.player.shortestRoute;
                const randomChance = Math.random() < 0.75
                // ensure game reach terminate status & accelerate simulation
                if (shortestRoute != null && (simulationGame.opponent.remainingBlocks == 0 || winInNextMove(nodeState) || randomChance)) {
                    const effectiveMove = validMoves.find((move) => shortestRoute.some(step => step[0] == move[0] && step[1] == move[1]));
                    action = new Action([[simulationGame.player.x, simulationGame.player.y], effectiveMove], ActionType.MOVE);
                } else {
                    const selectedIdx = MathUtil.getRandomInt(validMoves.length - 1);
                    action = new Action([[simulationGame.player.x, simulationGame.player.y], validMoves[selectedIdx]], ActionType.MOVE);
                }
            } else if (moveOrBlock == ActionType.BLOCK) {
                const validBlocks = simulationGame.getValidBlocks();
                const selectedIdx = MathUtil.getRandomInt(validBlocks.length - 1);
                action = new Action(validBlocks[selectedIdx], ActionType.BLOCK);
            }
            // Log.d(`AI, ${simulationGame.currentTurn} Action`, action);

            // state 3: update game status
            if (action != undefined) {
                actionList.push(action);
                simulationGame.doAction(action);
                // Log.d(`AI, turn: ${simulationGame.numOfTurn} status`, simulationGame);
            }
        }
        // Log.d(`actionList (${actionList.length})`, actionList);

        return simulationGame.checkWinner(true);
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
        const ucb1Values = node.children.map(child => {
            if (child.visits !== 0) {
                const exploitation = child.score / child.visits;
                const exploration = Math.sqrt((2 * Math.log(node.visits)) / child.visits);
                // console.log(`@DEBUG`, child);
                const distanceHeuristicScore = AI.getDistanceHeuristicScore(child.state);
                // const remainingBlocksHeuristicScore = AI.getRemainingBlocksHeuristicScore(child.state) / child.visits;
                return exploitation + exploration + distanceHeuristicScore// + remainingBlocksHeuristicScore;
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
        const randomChoice = MathUtil.getRandomInt(maxUCB1Indices.length);
        const randomChildIndex = maxUCB1Indices[randomChoice];
        // console.log(`@DEBUG`, node.children);
        // console.log(`@DEBUG`, ucb1Values);
        // console.log(`@DEBUG`, maxUCB1Value);
        // console.log(`@DEBUG`, maxUCB1Indices);
        // console.log(`@DEBUG`, randomChoice);
        // console.log(`@DEBUG`, randomChildIndex);
        return node.children[randomChildIndex];
    }

    return {

        search: function (rootNode, numberOfIterations, callback) {
            const targetWinner = rootNode.state.currentTurn;
            // console.log(`targetWinner`, targetWinner);
            let targetNode = rootNode;
            for (let i = 0; i < numberOfIterations; i++) {
                // console.log(`MCTS - iteration: ${i}`);
                callback(i / numberOfIterations * 100);
                if (i == 0) {
                    expansion(targetNode);
                } else {
                    targetNode = selection(rootNode);
                    // console.log(`targetNode`, targetNode);
                    const isNewNode = targetNode.visits == 0;
                    const currentNodeWinner = targetNode.state.checkWinner(true);
                    if (currentNodeWinner != null) {
                        if (currentNodeWinner == targetWinner) { // winning node
                            backpropagation(targetNode.parent, -1000);
                            backpropagation(targetNode, 1000);
                        } else { // losing node
                            backpropagation(targetNode, -1000);
                        }
                    } else {
                        if (isNewNode) {
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
            }
            // console.log(`targetNode`, targetNode);
            const bestChild = getBestChild(rootNode);
            // console.log(`bestChild`, bestChild);

            return bestChild;
        }
    }
})();