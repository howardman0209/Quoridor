import { VM } from './viewModel/GameVM.js';
import { Turn } from './data/Turn.js';
import { AI } from './ai/AI.js';
import { Direction } from './data/Direction.js';
// variable 
const gameSize = 5;
let selectedMove = [];
let selectedBlock = [];
let currentTurn = Turn.P1;

// Functions
function render(game) {
    const board = document.getElementById("board");
    const arena = game.arena;

    // render arena
    let tableContent = "";
    for (let row = 0; row < arena.length; row++) {
        tableContent += "<tr>";
        for (let column = 0; column < arena[row].length; column++) {
            tableContent +=
                `<td 
                    id="c${column}r${row}"
                    class=${arena[row][column] < 0 ? "occupied" : ""} ${row % 2 != 0 || column % 2 != 0 ? "borderBlock" : "platformBlock"}
                    onclick=null
                >
                </td>`;
        }
        tableContent += "</tr>";
    }
    board.innerHTML = `<table>${tableContent}</table>`;

    // render p1, p2
    const p1Slot = document.getElementById(`c${game.p1[0]}r${game.p1[1]}`);
    const p2Slot = document.getElementById(`c${game.p2[0]}r${game.p2[1]}`);

    p1Slot.innerHTML += `<em id="pawn">P1</em>`;
    p2Slot.innerHTML += `<em id="pawn">P2</em>`;
}

function nextTurn(game) {
    clearSelection();
    render(game);
    let winner = VM.checkWinner(game);
    console.log(`winner: ${winner}`);
    if (winner == null) { // check game is end
        currentTurn = currentTurn == Turn.P1 ? Turn.P2 : Turn.P1; // switch turn
    } else {
        endGame();
        return;
    }
    updateBlocksRemain();
    updateTurnLabel(winner != null);
}

function endGame() {
    const blockBtn = document.getElementById("blockBtn");
    const moveBtn = document.getElementById("moveBtn");
    const confirmBtn = document.getElementById("confirmBtn");

    blockBtn.disabled = true;
    moveBtn.disabled = true;
    confirmBtn.disabled = true;
}

function showMoveOptions(validMoves) {
    validMoves.forEach(move => {
        const moveSlot = document.getElementById(`c${move[0]}r${move[1]}`);
        moveSlot.classList.add("option");
        moveSlot.onclick = () => {
            selectMove(move);
            resetMoveOptions(validMoves);
        }
    });
}

function resetMoveOptions(validMoves) {
    validMoves.forEach(move => {
        const moveSlot = document.getElementById(`c${move[0]}r${move[1]}`);
        moveSlot.classList.remove("option");
        moveSlot.onclick = null;
    });
}

function showBlockOptions(arena) {
    for (let row = 0; row < arena.length - 1; row++) {
        for (let column = 0; column < arena[row].length - 1; column++) {
            // find vertical & horizontal options
            let isVerticalBlockOptions = row % 2 == 0 && column % 2 != 0;
            let isHorizontalBlockOptions = row % 2 != 0 && column % 2 == 0;

            // init varible block and isAvailable
            let block = [];
            let isAvailable = false;

            // set varible block and isAvailable by case
            if (isVerticalBlockOptions) {
                block = [[column, row], [column, row + 1], [column, row + 2]];
                isAvailable = arena[row][column] > 0 && arena[row + 1][column] > 0 && arena[row + 2][column] > 0;
            } else if (isHorizontalBlockOptions) {
                block = [[column, row], [column + 1, row], [column + 2, row]];
                isAvailable = arena[row][column] > 0 && arena[row][column + 1] > 0 && arena[row][column + 2] > 0;
            }

            // check block option is valid
            if (block.length > 0 && isAvailable) {
                const blkSlot = document.getElementById(`c${column}r${row}`);
                blkSlot.classList.add("option");
                blkSlot.onmouseover = () => {
                    blockOptionsMouseEffect(block, true);
                }
                blkSlot.onmouseleave = () => {
                    blockOptionsMouseEffect(block, false);
                }
                blkSlot.onclick = () => {
                    block.forEach(part => {
                        selectBlock([part[0], part[1]]);
                        resetBlockOptions(arena);
                    });
                }
            }
        }
    }
}

function rgb(r, g, b) {
    return 'rgb(' + [(r || 0), (g || 0), (b || 0)].join(',') + ')';
}

function blockOptionsMouseEffect(block, isHover) {
    if (isHover) {
        block.forEach(part => {
            const blkSlot = document.getElementById(`c${part[0]}r${part[1]}`);
            blkSlot.style.backgroundColor = rgb(212, 136, 136);
        });
    } else {
        block.forEach(part => {
            const blkSlot = document.getElementById(`c${part[0]}r${part[1]}`);
            blkSlot.style.backgroundColor = "";
        });
    }
}

function resetBlockOptions(arena) {
    for (let row = 0; row < arena.length; row++) {
        for (let column = 0; column < arena[row].length; column++) {
            if (arena[row][column] > 0) {
                const blkSlot = document.getElementById(`c${column}r${row}`);
                blkSlot.classList.remove("option");
                blkSlot.onclick = null;
                blkSlot.onmouseover = null;
                blkSlot.onmouseleave = null;
            }
        }
    }
}

function clearAllOption(arena) {
    for (let row = 0; row < arena.length; row++) {
        for (let column = 0; column < arena[row].length; column++) {
            const blkSlot = document.getElementById(`c${column}r${row}`);
            blkSlot.classList.remove("option");
            blkSlot.onclick = null;
            blkSlot.onmouseover = null;
            blkSlot.onmouseleave = null;
        }
    }
}

function selectMove(selected) {
    console.log(selected);
    selectedMove = selected;
    const selectedSlot = document.getElementById(`c${selected[0]}r${selected[1]}`);
    selectedSlot.classList.add("selected");
}

function clearSelectedMove() {
    if (selectedMove.length > 0) {
        const selectedSlot = document.getElementById(`c${selectedMove[0]}r${selectedMove[1]}`);
        selectedSlot.classList.remove("selected");
        selectedMove = [];
    }
}

function selectBlock(selected) {
    selectedBlock.push(selected);
    const selectedSlot = document.getElementById(`c${selected[0]}r${selected[1]}`);
    selectedSlot.style.backgroundColor = "";
    selectedSlot.classList.add("selected");
}

function deselectBlock(selected) {
    selectedBlock = selectedBlock.filter(arr => !(arr[0] === selected[0] && arr[1] === selected[1]));
    const selectedSlot = document.getElementById(`c${selected[0]}r${selected[1]}`);
    selectedSlot.classList.remove("selected");
}

function clearSelectedBlock() {
    if (selectedBlock.length > 0) {
        selectedBlock.forEach(block => {
            const selectedSlot = document.getElementById(`c${block[0]}r${block[1]}`);
            selectedSlot.classList.remove("selected");
        });
        selectedBlock = [];
    }
}

function clearSelection() {
    clearSelectedMove();
    clearSelectedBlock();
}

function updateTurnLabel(gameEnd) {
    const turnLabel = document.getElementById("turnLabel");
    turnLabel.innerText = `Turn: ${currentTurn} ${gameEnd ? "win" : ""}`;
}

function updateBlocksRemain() {
    const blocksRemain = document.getElementById("blocksRemain");
    blocksRemain.innerHTML = `<em class="blockStorage">${Turn.P1}: block x${game.p1Blocks}</em>\n <em class="blockStorage">${Turn.P2}: block x${game.p2Blocks}</em>`;
    if ((currentTurn == Turn.P1 && game.p1Blocks == 0) || (currentTurn == Turn.P2 && game.p2Blocks == 0)) {
        const blockBtn = document.getElementById("blockBtn");
        blockBtn.disabled = true;
    } else {
        const blockBtn = document.getElementById("blockBtn");
        blockBtn.disabled = false;
    }
}


// OnCreate
const game = VM.initGame(gameSize);
// const clone = game.deepCopy()
// console.log(game);
render(game);
updateTurnLabel();
updateBlocksRemain();
//[[2, 1], [3, 1], [4, 1]]
//[[1, 0], [1, 1], [1, 2]]
// let block = [[1, 0], [1, 1], [1, 2]]
// console.log("isValidBlockPattern: " + VM.isValidBlockPattern(block))
// console.log("isAvailableToPlaceBlock: " + VM.isAvailableToPlaceBlock(game.arena, block))
// console.log("isDeadBlock: " + VM.isDeadBlock(game, [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1]]))
// console.log(game);

const blockBtn = document.getElementById("blockBtn");
blockBtn.onclick = () => {
    console.log(`blockBtn clicked`);
    clearSelection();
    clearAllOption(game.arena);
    showBlockOptions(game.arena);
}

const moveBtn = document.getElementById("moveBtn");
moveBtn.onclick = () => {
    console.log(`moveBtn clicked`);
    clearSelection();
    clearAllOption(game.arena);
    let player = currentTurn == Turn.P1 ? game.p1 : game.p2;
    let opponent = currentTurn != Turn.P1 ? game.p1 : game.p2;
    let validMoves = VM.findValidMoves(game.arena, player, opponent);
    // console.log(validMoves);
    showMoveOptions(validMoves);
}

const confirmBtn = document.getElementById("confirmBtn");
confirmBtn.onclick = () => {
    console.log(`confirmBtn clicked`);
    clearAllOption(game.arena);

    let isMove = selectedMove.length > 0;
    let isBlock = selectedBlock.length > 0;

    if (!isMove && !isBlock) {
        console.log(`No action selected`);
        alert("Please select block or move.");
        return
    }

    if (isMove) {
        console.log(`${currentTurn} Move`);
        console.log(selectedMove);
        VM.applyMove(game, selectedMove, currentTurn);
    }

    if (isBlock) {
        console.log(`${currentTurn} Block`);
        console.log(selectedBlock);

        let isPlayerRemainsBlock = VM.isPlayerRemainsBlock(game, currentTurn);
        if (!isPlayerRemainsBlock) {
            console.log(`No block remains`);
            clearSelectedBlock();
            alert("No block remains.");
            return
        }

        let isValidBlockPattern = VM.isValidBlockPattern(selectedBlock);
        if (!isValidBlockPattern) {
            console.log(`invalid block pattern --- - ---`);
            clearSelectedBlock();
            alert("Please select correct block pattern.");
            return
        }

        let isAvailableToPlaceBlock = VM.isAvailableToPlaceBlock(game.arena, selectedBlock);
        if (!isAvailableToPlaceBlock) {
            console.log(`place is occupied`);
            clearSelectedBlock();
            alert("The place is occupied.");
            return
        }

        let isDeadBlock = VM.isDeadBlock(game, selectedBlock);
        if (isDeadBlock) {
            console.log(`cannot place a dead block`);
            clearSelectedBlock();
            alert("You cannot place a dead block. Please reselect.");
            return
        }

        VM.placeBlock(game, selectedBlock, currentTurn);
    }

    // Count possible blks
    // let possibleBlks = VM.findValidBlocks(game);
    // console.log(possibleBlks);
    // let ii = 0
    // setInterval(() => {
    //     let blkSlots = possibleBlks[ii];
    //     if (ii < possibleBlks.length) {
    //         console.log(`place blk: ${ii}`);
    //         blkSlots.forEach(block => {
    //             const selectedSlot = document.getElementById(`c${block[0]}r${block[1]}`);
    //             selectedSlot.classList.add("selected");
    //         });
    //     }

    //     ii++;
    // }, 500)
    nextTurn(game);
}

const suggestBtn = document.getElementById("suggestBtn");
suggestBtn.onclick = () => {
    console.log(`suggestBtn clicked`);
    // let bestAction = VM.findBestAction(game, 1, currentTurn);
    // console.log(Direction.getByDelta([0, 2]));
    let moveOrBlock = AI.moveOrBlock(game, currentTurn);
    console.log(moveOrBlock);

    // let check = AI.lookUpRoutesBetween(game.arena, game.p1, [0, 0], game.p2);
    // let check = AI.lookUpRoutes(game, currentTurn);
    // console.log(`result:`);
    // console.log(JSON.stringify(check));
}