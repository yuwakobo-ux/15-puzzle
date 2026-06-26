const solvedTiles = [1, 2, 3, 4, 5, 6, 7, 8, null];

let tiles = [...solvedTiles];
let moves = 0;
let dragState = null;
let suppressNextClick = false;
const dragCommitRatio = 0.42;

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
    tile.addEventListener("pointerdown", (event) => startPointerDrag(event, index, tile));
    tile.addEventListener("pointermove", (event) => movePointerDrag(event, index));
    tile.addEventListener("pointerup", (event) => finishPointerDrag(event, index));
    tile.addEventListener("pointercancel", cancelDrag);
    tile.addEventListener("touchstart", (event) => startTouchDrag(event, index, tile), { passive: false });
    tile.addEventListener("touchmove", moveTouchDrag, { passive: false });
    tile.addEventListener("touchend", (event) => finishTouchDrag(event, index), { passive: false });
    tile.addEventListener("touchcancel", cancelDrag);
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

function getDragPlan(tileIndex, tileElement) {
  if (!isNextToEmpty(tileIndex)) {
    return null;
  }

  const emptyIndex = tiles.indexOf(null);
  const rowDelta = getRow(emptyIndex) - getRow(tileIndex);
  const colDelta = getCol(emptyIndex) - getCol(tileIndex);
  const rect = tileElement.getBoundingClientRect?.() || { width: 96, height: 96 };

  if (colDelta !== 0) {
    return {
      axis: "x",
      direction: Math.sign(colDelta),
      distance: rect.width
    };
  }

  return {
    axis: "y",
    direction: Math.sign(rowDelta),
    distance: rect.height
  };
}

function startDrag(pointerType, id, tileIndex, tileElement, startX, startY) {
  const plan = getDragPlan(tileIndex, tileElement);

  if (!plan) {
    dragState = null;
    return false;
  }

  dragState = {
    pointerType,
    id,
    tileIndex,
    tileElement,
    startX,
    startY,
    plan,
    offset: 0,
    moved: false
  };

  tileElement.classList.add("dragging");
  return true;
}

function updateDrag(clientX, clientY) {
  if (!dragState) {
    return;
  }

  const rawOffset = dragState.plan.axis === "x"
    ? clientX - dragState.startX
    : clientY - dragState.startY;
  const towardEmptyOffset = Math.max(0, rawOffset * dragState.plan.direction);
  const maxOffset = dragState.plan.distance;
  const clampedOffset = Math.min(towardEmptyOffset, maxOffset);
  const signedOffset = clampedOffset * dragState.plan.direction;

  dragState.offset = clampedOffset;
  dragState.moved = dragState.moved || clampedOffset > 4;

  if (dragState.plan.axis === "x") {
    dragState.tileElement.style.transform = `translateX(${signedOffset}px)`;
  } else {
    dragState.tileElement.style.transform = `translateY(${signedOffset}px)`;
  }
}

function finishDrag(tileIndex, endX, endY) {
  if (!dragState || dragState.tileIndex !== tileIndex) {
    return false;
  }

  updateDrag(endX, endY);

  const { tileElement, offset, plan, moved } = dragState;
  const shouldMove = offset >= plan.distance * dragCommitRatio;
  dragState = null;

  tileElement.classList.remove("dragging");
  tileElement.classList.add("settling");

  if (shouldMove) {
    const finalOffset = plan.distance * plan.direction;
    tileElement.style.transform = plan.axis === "x"
      ? `translateX(${finalOffset}px)`
      : `translateY(${finalOffset}px)`;
    window.setTimeout(() => moveTile(tileIndex), 120);
    suppressNextClick = true;
    return true;
  }

  tileElement.style.transform = "";
  window.setTimeout(() => tileElement.classList.remove("settling"), 160);
  if (moved) {
    suppressNextClick = true;
  }
  return moved;
}

function cancelDrag() {
  if (!dragState) {
    return;
  }

  const { tileElement } = dragState;
  dragState = null;
  tileElement.classList.remove("dragging");
  tileElement.classList.add("settling");
  tileElement.style.transform = "";
  window.setTimeout(() => tileElement.classList.remove("settling"), 160);
}

function startPointerDrag(event, tileIndex, tileElement) {
  if (!startDrag("pointer", event.pointerId, tileIndex, tileElement, event.clientX, event.clientY)) {
    return;
  }

  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function movePointerDrag(event, tileIndex) {
  if (!dragState || dragState.pointerType !== "pointer" || dragState.id !== event.pointerId || dragState.tileIndex !== tileIndex) {
    return;
  }

  updateDrag(event.clientX, event.clientY);
}

function finishPointerDrag(event, tileIndex) {
  if (!dragState || dragState.pointerType !== "pointer" || dragState.id !== event.pointerId) {
    return;
  }

  finishDrag(tileIndex, event.clientX, event.clientY);
}

function startTouchDrag(event, tileIndex, tileElement) {
  const touch = event.changedTouches[0];
  if (!touch || !startDrag("touch", touch.identifier, tileIndex, tileElement, touch.clientX, touch.clientY)) {
    return;
  }

  event.preventDefault();
}

function findActiveTouch(touches) {
  return Array.from(touches).find((touch) => dragState && touch.identifier === dragState.id);
}

function moveTouchDrag(event) {
  if (!dragState || dragState.pointerType !== "touch") {
    return;
  }

  const touch = findActiveTouch(event.changedTouches);
  if (!touch) {
    return;
  }

  updateDrag(touch.clientX, touch.clientY);
  event.preventDefault();
}

function finishTouchDrag(event, tileIndex) {
  if (!dragState || dragState.pointerType !== "touch" || dragState.tileIndex !== tileIndex) {
    return;
  }

  const touch = findActiveTouch(event.changedTouches);
  if (!touch) {
    return;
  }

  const handledDrag = finishDrag(tileIndex, touch.clientX, touch.clientY);
  if (!handledDrag) {
    moveTile(tileIndex);
  }

  suppressNextClick = true;
  event.preventDefault();
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
