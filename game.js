const COLS = 10;
const ROWS = 22;
const VISIBLE_ROWS = 20;
const CELL_SIZE = 30;
const DROP_INTERVAL = 800;

const COLORS = [
  null,
  '#00f0f0', // I
  '#f0f000', // O
  '#a000f0', // T
  '#00f000', // S
  '#f00000', // Z
  '#0000f0', // J
  '#f0a000', // L
];

const SHAPES = {
  I: [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
    [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
  ],
  O: [
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
  ],
  T: [
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
  ],
  S: [
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
    [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
    [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
    [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
  ],
  J: [
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
    [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
  ],
  L: [
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
    [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
    [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
  ],
};

const TYPE_INDEX = { I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7 };
const PIECE_TYPES = Object.keys(SHAPES);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');

let board;
let piece;
let score;
let totalLines;
let gameOver;
let dropAccumulator;
let lastTime;

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function randomType() {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
}

function getMatrix() {
  return SHAPES[piece.type][piece.rotation];
}

function forEachCell(matrix, x, y, callback) {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        callback(x + c, y + r);
      }
    }
  }
}

function isValidPosition(matrix, x, y) {
  let valid = true;
  forEachCell(matrix, x, y, (col, row) => {
    if (col < 0 || col >= COLS || row >= ROWS) {
      valid = false;
      return;
    }
    if (row >= 0 && board[row][col]) {
      valid = false;
    }
  });
  return valid;
}

function spawnPiece() {
  const type = randomType();
  piece = {
    type,
    rotation: 0,
    x: Math.floor(COLS / 2) - 1,
    y: 0,
    colorIndex: TYPE_INDEX[type],
  };
  if (!isValidPosition(getMatrix(), piece.x, piece.y)) {
    gameOver = true;
  }
}

function move(dx, dy) {
  if (gameOver) return false;
  const matrix = getMatrix();
  const newX = piece.x + dx;
  const newY = piece.y + dy;
  if (isValidPosition(matrix, newX, newY)) {
    piece.x = newX;
    piece.y = newY;
    return true;
  }
  return false;
}

function rotate() {
  if (gameOver) return;
  const nextRotation = (piece.rotation + 1) % 4;
  const matrix = SHAPES[piece.type][nextRotation];

  if (isValidPosition(matrix, piece.x, piece.y)) {
    piece.rotation = nextRotation;
    return;
  }

  for (const kick of [-1, 1, -2, 2]) {
    if (isValidPosition(matrix, piece.x + kick, piece.y)) {
      piece.rotation = nextRotation;
      piece.x += kick;
      return;
    }
  }
}

function mergePiece() {
  const matrix = getMatrix();
  forEachCell(matrix, piece.x, piece.y, (col, row) => {
    if (row >= 0) {
      board[row][col] = piece.colorIndex;
    }
  });
  clearLines();
  spawnPiece();
}

function clearLines() {
  let linesCleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every((cell) => cell !== 0)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(0));
      linesCleared++;
      r++;
    }
  }
  if (linesCleared > 0) {
    score += 100 * linesCleared;
    scoreEl.textContent = score;
  }
}

function lockOrFall() {
  if (!move(0, 1)) {
    mergePiece();
  }
}

function drawCell(col, row, colorIndex) {
  const x = col * CELL_SIZE;
  const y = (row - (ROWS - VISIBLE_ROWS)) * CELL_SIZE;
  if (y < 0) return;

  ctx.fillStyle = COLORS[colorIndex];
  ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
}

function draw() {
  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = ROWS - VISIBLE_ROWS; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) {
        drawCell(c, r, board[r][c]);
      } else {
        const x = c * CELL_SIZE;
        const y = (r - (ROWS - VISIBLE_ROWS)) * CELL_SIZE;
        ctx.strokeStyle = '#222';
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  if (piece && !gameOver) {
    const matrix = getMatrix();
    forEachCell(matrix, piece.x, piece.y, (col, row) => {
      drawCell(col, row, piece.colorIndex);
    });
  }

  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Press R or Enter', canvas.width / 2, canvas.height / 2 + 20);
  }
}

function update(time) {
  if (!lastTime) lastTime = time;
  const delta = time - lastTime;
  lastTime = time;

  if (!gameOver) {
    dropAccumulator += delta;
    if (dropAccumulator >= DROP_INTERVAL) {
      dropAccumulator = 0;
      lockOrFall();
    }
  }

  draw();
  requestAnimationFrame(update);
}

function init() {
  board = createBoard();
  score = 0;
  totalLines = 0;
  gameOver = false;
  dropAccumulator = 0;
  lastTime = 0;
  scoreEl.textContent = '0';
  linesEl.textContent = '0';
  spawnPiece();
}

function restart() {
  init();
}

document.addEventListener('keydown', (e) => {
  if (gameOver) {
    if (e.key === 'r' || e.key === 'R' || e.key === 'Enter') {
      restart();
    }
    return;
  }

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      move(-1, 0);
      break;
    case 'ArrowRight':
      e.preventDefault();
      move(1, 0);
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (move(0, 1)) {
        dropAccumulator = 0;
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (!e.repeat) rotate();
      break;
    case 'r': // restart
    case 'R':
      restart();
      break;
  }
});

init();
requestAnimationFrame(update);
