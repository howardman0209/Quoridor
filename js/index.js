import { GameHelper } from './globalObject/GameHelper.js';
import { Turn } from './enum/Turn.js';
import { AI } from './ai/AI.js';
import { Log } from '../js/util/Log.js';
import { Direction } from './enum/Direction.js';

// variable 
const gameSize = 9;
let selectedMove = [];
let selectedBlock = [];

// Functions
function render(game) {
    const board = document.getElementById("board");
    const arena = game.arena;

    // render arena
    let tableContent = "";
    for (let row = 0; row < arena.length; row++) {
        tableContent += "<tr>";
        for (let column = 0; column < arena[row].length; column++) {
            const colorRGB = arena[row][column] % 2 != 0 ? rgb(90, 90, 200) : rgb(168, 138, 41)
            const placedBlockStyle = arena[row][column] < 0 ? `style="background-color:${colorRGB};"` : ""
            tableContent +=
                `<td 
                    id="c${column}r${row}"
                    class=${arena[row][column] < 0 ? "occupied" : ""} ${row % 2 != 0 || column % 2 != 0 ? "borderBlock" : "platformBlock"}
                    ${placedBlockStyle}
                    onclick=null
                >
                </td>`;
        }
        tableContent += "</tr>";
    }
    board.innerHTML = `<table>${tableContent}</table>`;

    // render p1, p2
    const p1Slot = document.getElementById(`c${game.p1.x}r${game.p1.y}`);
    const p2Slot = document.getElementById(`c${game.p2.x}r${game.p2.y}`);

    p1Slot.innerHTML += getPawn(Turn.P1);
    p2Slot.innerHTML += getPawn(Turn.P2);
}

function nextTurn() {
    clearSelection();
    render(game);
    let winner = game.checkWinner();
    // console.log(`winner: ${winner}`);
    if (winner != null) { // check game is end
        endGame();
        setWinnerLabel();
    } else {
        updateBlocksRemain();
        updateTurnLabel();
    }
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

function showBlockOptions(validBlocks) {
    validBlocks.forEach(block => {
        const firstPart = block[0]
        const blkSlot = document.getElementById(`c${firstPart[0]}r${firstPart[1]}`);
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
                resetBlockOptions();
            });
        }
    });
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

function resetBlockOptions() {
    const arena = game.arena;
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
    // console.log(selected);
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

function updateTurnLabel() {
    const turnLabel = document.getElementById("turnLabel");
    turnLabel.innerHTML = `<div class="flex"><p class="with-pawn">Turn: ${game.currentTurn}</p>${getPawn(game.currentTurn)}`;
}

function setWinnerLabel() {
    const winnerLabel = document.getElementById("winnerLabel");
    winnerLabel.innerText = `WIN`;
}

function updateBlocksRemain() {
    const blocksRemain = document.getElementById("blockLabel");
    blocksRemain.innerHTML = `${getBlock(Turn.P1)}<p class="blockStorage with-pawn">${Turn.P1}: block x${game.p1.remainingBlocks}</p>${getBlock(Turn.P2)}<p class="blockStorage with-pawn">${Turn.P2}: block x${game.p2.remainingBlocks}</p>`;
    if (game.getPlayer().remainingBlocks > 0) {
        const blockBtn = document.getElementById("blockBtn");
        blockBtn.disabled = false;
    } else {
        const blockBtn = document.getElementById("blockBtn");
        blockBtn.disabled = true;
    }
}

function getPawn(turn) {
    const colorRGB = turn == Turn.P1 ? rgb(90, 90, 200) : rgb(168, 138, 41)
    return `<span class="pawn" style="background-color:${colorRGB};"></span>`
}

function getBlock(turn) {
    const colorRGB = turn == Turn.P1 ? rgb(90, 90, 200) : rgb(168, 138, 41)
    return `<span class="block" style="background-color:${colorRGB};"></span>`
}


// OnCreate
const game = GameHelper.initGame(gameSize);
// const clone = game.deepCopy()
// console.log(game);
render(game);
updateTurnLabel();
updateBlocksRemain();
//[[2, 1], [3, 1], [4, 1]]
//[[1, 0], [1, 1], [1, 2]]
// let block = [[1, 0], [1, 1], [1, 2]]
// console.log(game);

const blockBtn = document.getElementById("blockBtn");
blockBtn.onclick = () => {
    // console.log(`blockBtn clicked`);
    clearSelection();
    clearAllOption(game.arena);
    let validBlocks = game.getValidBlocks();
    // Log.d(`validBlocks`, validBlocks);
    showBlockOptions(validBlocks);
}

const moveBtn = document.getElementById("moveBtn");
moveBtn.onclick = () => {
    // console.log(`moveBtn clicked`);
    clearSelection();
    clearAllOption(game.arena);
    let validMoves = game.getValidMoves(true);
    // console.log(validMoves);
    showMoveOptions(validMoves);
}

const confirmBtn = document.getElementById("confirmBtn");
confirmBtn.onclick = () => {
    // console.log(`confirmBtn clicked`);
    clearAllOption(game.arena);

    let isMove = selectedMove.length > 0;
    let isBlock = selectedBlock.length > 0;

    if (!isMove && !isBlock) {
        console.log(`No action selected`);
        alert("Please select block or move.");
        return
    }

    if (isMove) {
        console.log(`${game.currentTurn} Move`);
        Log.d(`MOVE`, selectedMove);
        game.applyMove(selectedMove);
    }

    if (isBlock) {
        console.log(`${game.currentTurn} Block`);
        Log.d(`BLOCK`, selectedBlock);

        let isPlayerRemainsBlock = game.getPlayer().remainingBlocks > 0;
        if (!isPlayerRemainsBlock) {
            console.log(`No block remains`);
            clearSelectedBlock();
            alert("No block remains.");
            return
        }

        game.placeBlock(selectedBlock);
    }

    nextTurn();
}

const saveLoadBtn = document.getElementById("saveLoadBtn");
saveLoadBtn.onclick = () => {
    const gameStateIO = document.getElementById("gameStateIO");
    if (gameStateIO.value == "") {
        // console.log(`save Btn clicked`);
        gameStateIO.value = JSON.stringify(game);
    } else {
        // console.log(`Load Btn clicked`);
        let data = null;
        try {
            data = JSON.parse(gameStateIO.value)
            game.loadData(data);
            nextTurn();
        } catch (error) {
            alert(error);
        }
        gameStateIO.value = "";
    }
}

const suggestBtn = document.getElementById("suggestBtn");
suggestBtn.onclick = () => {
    console.log(`suggestBtn clicked`);
    // let bestAction = GameHelper.findBestAction(game, 1, currentTurn);
    // console.log(Direction.getByDelta([0, 2]));
    let moveOrBlock = AI.moveOrBlock(game);
    Log.d("moveOrBlock", moveOrBlock);

    // let check = AI.lookUpRoutesBetween(game.arena, [game.p1.x, game.p1.y], [0, 0], [game.p2.x, game.p2.y]);
    // Log.d("check", check);
    // console.log(JSON.stringify(check));
}