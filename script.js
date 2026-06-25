const solvedTiles = [1, 2, 3, 4, 5, 6, 7, 8, null];

let tiles = [...solvedTiles];
let moves = 0;

const board = document.getElementById("board");
const moveCount = document.getElementById("move-count");
const message = document.getElementById("message");
const shuffleButton = document.getElementById("shuffle-button");
const resetButton = document.getElementById("reset-button");

function renderBoard() {
  board.innerHTML = "";

  tiles.forEach((value, index) => {
    if (value === null) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.setAttribute("aria-label", "Empty space");
      board.appendChild(empty);
      return;
    }

    const tile = document.createElement("button");
    tile.className = "tile";
    tile.type = "button";
    tile.textContent = value;
    tile.setAttribute("aria-label", `Move tile ${value}`);
    tile.addEventListener("click", () => moveTile(index));
    board.appendChild(tile);
  });

  moveCount.textContent = moves;
}

function getRow(index) {
  return Math.floor(index / 3);
}

function getCol(index) {
  return index % 3;
}

function isNextToEmpty(tileIndex) {
  const emptyIndex = tiles.indexOf(null);
  const rowDiff = Math.abs(getRow(tileIndex) - getRow(emptyIndex));
  const colDiff = Math.abs(getCol(tileIndex) - getCol(emptyIndex));
  return rowDiff + colDiff === 1;
}

function moveTile(tileIndex) {
  if (!isNextToEmpty(tileIndex)) {
    return;
  }

  const emptyIndex = tiles.indexOf(null);
  [tiles[tileIndex], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[tileIndex]];
  moves += 1;
  renderBoard();
  updateMessage();
}

function isSolved() {
  return tiles.every((value, index) => value === solvedTiles[index]);
}

function updateMessage() {
  if (isSolved()) {
    message.textContent = "Clear!";
    message.classList.add("solved");
  } else {
    message.textContent = "Keep going";
    message.classList.remove("solved");
  }
}

function resetPuzzle() {
  tiles = [...solvedTiles];
  moves = 0;
  message.textContent = "Ready";
  message.classList.remove("solved");
  renderBoard();
}

function shufflePuzzle() {
  resetPuzzle();

  let previousEmptyIndex = -1;
  for (let step = 0; step < 80; step += 1) {
    const emptyIndex = tiles.indexOf(null);
    const movableIndexes = tiles
      .map((value, index) => ({ value, index }))
      .filter(({ value, index }) => value !== null && isNextToEmpty(index))
      .map(({ index }) => index)
      .filter((index) => index !== previousEmptyIndex);

    const nextIndex = movableIndexes[Math.floor(Math.random() * movableIndexes.length)];
    previousEmptyIndex = emptyIndex;
    [tiles[nextIndex], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[nextIndex]];
  }

  moves = 0;

  if (isSolved()) {
    shufflePuzzle();
    return;
  }

  message.textContent = "Shuffled";
  message.classList.remove("solved");
  renderBoard();
}

shuffleButton.addEventListener("click", shufflePuzzle);
resetButton.addEventListener("click", resetPuzzle);

renderBoard();
