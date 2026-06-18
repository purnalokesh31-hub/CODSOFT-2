const boardElement = document.getElementById('board');
const messageElement = document.getElementById('message');
const restartBtn = document.getElementById('restartBtn');
const themeToggle = document.getElementById('themeToggle');

const humanNameElement = document.getElementById('humanName');
const humanSymbolLabel = document.getElementById('humanSymbolLabel');
const aiSymbolLabel = document.getElementById('aiSymbolLabel');
const firstTurnLabel = document.getElementById('firstTurnLabel');
const statusText = document.getElementById('statusText');
const roundText = document.getElementById('roundText');

const params = new URLSearchParams(window.location.search);
const humanPlayer = params.get('symbol') === 'O' ? 'O' : 'X';
const aiPlayer = humanPlayer === 'X' ? 'O' : 'X';
const firstTurn = params.get('firstTurn') === 'ai' ? 'ai' : 'human';
const humanName = (params.get('playerName') || 'Player').trim();

let board = Array(9).fill('');
let currentPlayer = firstTurn === 'human' ? humanPlayer : aiPlayer;
let gameActive = true;
let round = 1;

const winningCombos = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

function updateThemeIcon(theme) {
  themeToggle.textContent = theme === 'dark' ? '☾' : '☀';
}

function initTheme() {
  const saved = sessionStorage.getItem('ttt-theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (systemDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  sessionStorage.setItem('ttt-theme', next);
  updateThemeIcon(next);
});

function initializeSummary() {
  humanNameElement.textContent = humanName || 'Player';
  humanSymbolLabel.textContent = humanPlayer;
  aiSymbolLabel.textContent = aiPlayer;
  firstTurnLabel.textContent = firstTurn === 'human' ? 'Human' : 'AI';
  roundText.textContent = round;
}

function renderBoard() {
  boardElement.innerHTML = '';

  board.forEach((cell, index) => {
    const button = document.createElement('button');
    button.className = 'cell';
    button.type = 'button';
    button.setAttribute('role', 'gridcell');
    button.setAttribute('aria-label', cell ? `Cell ${index + 1} ${cell}` : `Cell ${index + 1} empty`);
    button.textContent = cell;

    if (cell === 'X') button.classList.add('x');
    if (cell === 'O') button.classList.add('o');

    if (!gameActive || cell || currentPlayer !== humanPlayer) {
      button.disabled = true;
    }

    button.addEventListener('click', () => handleHumanMove(index));
    boardElement.appendChild(button);
  });
}

function checkWinner(currentBoard) {
  for (const [a, b, c] of winningCombos) {
    if (
      currentBoard[a] &&
      currentBoard[a] === currentBoard[b] &&
      currentBoard[a] === currentBoard[c]
    ) {
      return currentBoard[a];
    }
  }

  if (currentBoard.every(cell => cell !== '')) {
    return 'draw';
  }

  return null;
}

function evaluateState(currentBoard, depth) {
  const winner = checkWinner(currentBoard);

  if (winner === aiPlayer) return 10 - depth;
  if (winner === humanPlayer) return depth - 10;
  if (winner === 'draw') return 0;

  return null;
}

function minimax(state, depth, isMaximizing, alpha, beta) {
  const score = evaluateState(state, depth);
  if (score !== null) return score;

  if (isMaximizing) {
    let bestScore = -Infinity;

    for (let i = 0; i < state.length; i++) {
      if (state[i] === '') {
        state[i] = aiPlayer;
        const result = minimax(state, depth + 1, false, alpha, beta);
        state[i] = '';
        bestScore = Math.max(bestScore, result);
        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) break;
      }
    }

    return bestScore;
  } else {
    let bestScore = Infinity;

    for (let i = 0; i < state.length; i++) {
      if (state[i] === '') {
        state[i] = humanPlayer;
        const result = minimax(state, depth + 1, true, alpha, beta);
        state[i] = '';
        bestScore = Math.min(bestScore, result);
        beta = Math.min(beta, bestScore);
        if (beta <= alpha) break;
      }
    }

    return bestScore;
  }
}

function findBestMove(state) {
  let bestScore = -Infinity;
  let move = -1;

  for (let i = 0; i < state.length; i++) {
    if (state[i] === '') {
      state[i] = aiPlayer;
      const score = minimax(state, 0, false, -Infinity, Infinity);
      state[i] = '';
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }

  return move;
}

function updateGameState() {
  const winner = checkWinner(board);

  if (winner === humanPlayer) {
    gameActive = false;
    messageElement.textContent = `Excellent play, ${humanName}! You won this round.`;
    statusText.textContent = 'Great job — human victory';
    renderBoard();
    return true;
  }

  if (winner === aiPlayer) {
    gameActive = false;
    messageElement.textContent = `Well tried, ${humanName}. The AI wins this round.`;
    statusText.textContent = 'AI victory — strong effort';
    renderBoard();
    return true;
  }

  if (winner === 'draw') {
    gameActive = false;
    messageElement.textContent = `Nice thinking, ${humanName}. This round ends in a draw.`;
    statusText.textContent = 'Draw — balanced play';
    renderBoard();
    return true;
  }

  return false;
}

function handleHumanMove(index) {
  if (!gameActive || board[index] !== '' || currentPlayer !== humanPlayer) return;

  board[index] = humanPlayer;
  currentPlayer = aiPlayer;
  statusText.textContent = 'AI is thinking...';
  messageElement.textContent = 'AI is choosing the best move...';
  renderBoard();

  if (!updateGameState()) {
    window.setTimeout(makeAiMove, 350);
  }
}

function makeAiMove() {
  if (!gameActive || currentPlayer !== aiPlayer) return;

  const bestMove = findBestMove([...board]);
  if (bestMove !== -1) {
    board[bestMove] = aiPlayer;
  }

  currentPlayer = humanPlayer;
  renderBoard();

  if (!updateGameState()) {
    messageElement.textContent = `${humanName}, your turn.`;
    statusText.textContent = 'Waiting for human move';
  }
}

function resetGame(incrementRound = false) {
  board = Array(9).fill('');
  gameActive = true;

  if (incrementRound) {
    round += 1;
    roundText.textContent = round;
  }

  currentPlayer = firstTurn === 'human' ? humanPlayer : aiPlayer;
  messageElement.textContent = currentPlayer === humanPlayer ? `${humanName}, your turn.` : 'AI starts the round.';
  statusText.textContent = currentPlayer === humanPlayer ? 'Waiting for human move' : 'AI opening move';
  renderBoard();

  if (currentPlayer === aiPlayer) {
    window.setTimeout(makeAiMove, 450);
  }
}

restartBtn.addEventListener('click', () => {
  resetGame(true);
});

initTheme();
initializeSummary();
resetGame(false);