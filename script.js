const solvedTiles = [1, 2, 3, 4, 5, 6, 7, 8, null];

let tiles = [...solvedTiles];
let moves = 0;
let activePointer = null;
let activeTouch = null;
let suppressNextClick = false;

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
    tile.addEventListener("click", () => {
      if (suppressNextClick) {
        suppressNextClick = false;
        return;
      }

      moveTile(index);
    });
    tile.addEventListener("pointerdown", (event) => startSwipe(event, index));
    tile.addEventListener("pointerup", (event) => finishSwipe(event, index));
    tile.addEventListener("pointercancel", cancelSwipe);
    tile.addEventListener("touchstart", (event) => startTouchSwipe(event, index), { passive: false });
    tile.addEventListener("touchend", (event) => finishTouchSwipe(event, index), { passive: false });
    tile.addEventListener("touchcancel", cancelTouchSwipe);
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

function isSwipeTowardEmpty(tileIndex, deltaX, deltaY) {
  const emptyIndex = tiles.indexOf(null);
  const horizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

  if (horizontalSwipe) {
    return getRow(tileIndex) === getRow(emptyIndex)
      && Math.sign(deltaX) === Math.sign(getCol(emptyIndex) - getCol(tileIndex));
  }

  return getCol(tileIndex) === getCol(emptyIndex)
    && Math.sign(deltaY) === Math.sign(getRow(emptyIndex) - getRow(tileIndex));
}

function trySwipeMove(tileIndex, startX, startY, endX, endY) {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance < 22 || !isNextToEmpty(tileIndex) || !isSwipeTowardEmpty(tileIndex, deltaX, deltaY)) {
    return false;
  }

  suppressNextClick = true;
  moveTile(tileIndex);
  return true;
}

function startSwipe(event, tileIndex) {
  activePointer = {
    id: event.pointerId,
    tileIndex,
    x: event.clientX,
    y: event.clientY
  };

  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function finishSwipe(event, tileIndex) {
  if (!activePointer || activePointer.id !== event.pointerId || activePointer.tileIndex !== tileIndex) {
    return;
  }

  const startX = activePointer.x;
  const startY = activePointer.y;
  activePointer = null;

  trySwipeMove(tileIndex, startX, startY, event.clientX, event.clientY);
}

function cancelSwipe() {
  activePointer = null;
}

function startTouchSwipe(event, tileIndex) {
  const touch = event.changedTouches[0];
  if (!touch) {
    return;
  }

  activeTouch = {
    id: touch.identifier,
    tileIndex,
    x: touch.clientX,
    y: touch.clientY
  };

  event.preventDefault();
}

function finishTouchSwipe(event, tileIndex) {
  if (!activeTouch || activeTouch.tileIndex !== tileIndex) {
    return;
  }

  const touch = Array.from(event.changedTouches).find((item) => item.identifier === activeTouch.id);
  if (!touch) {
    return;
  }

  const startX = activeTouch.x;
  const startY = activeTouch.y;
  const deltaX = touch.clientX - startX;
  const deltaY = touch.clientY - startY;
  const distance = Math.hypot(deltaX, deltaY);
  activeTouch = null;

  if (distance < 10) {
    suppressNextClick = true;
    moveTile(tileIndex);
    event.preventDefault();
    return;
  }

  if (trySwipeMove(tileIndex, startX, startY, touch.clientX, touch.clientY)) {
    event.preventDefault();
  }
}

function cancelTouchSwipe() {
  activeTouch = null;
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
document.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });

renderBoard();
