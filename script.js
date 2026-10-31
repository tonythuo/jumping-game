// ============================================================
// JUMPING GAME — interface contract (agreed, do not rename)
// Sections below: Karim (input/orchestration), Logic (state), Tony (output)
// ============================================================

const player = {
  x: 50,
  y: 0,
  width: 40,
  height: 40,
  velocityY: 0
};

const gameState = {
  character: player,
  obstacles: [],
  score: 0,
  gameOver: false,
  gameOverAt: 0,
  running: false,
  lastSpawnTime: 0,
  lastTimestamp: 0
};

const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const OBSTACLE_SPEED = 5;
const SPAWN_INTERVAL = 1500;
const RESTART_LOCKOUT_MS = 400;
const MAX_FRAME_DT = 50;

// ============================================================
// SECTION 1 — KARIM: Structure, Input & Orchestration
// ============================================================

let frameId = 0;

function initGame(autoStart = false) {
  gameState.score = 0;
  gameState.obstacles = [];
  gameState.gameOver = false;
  gameState.gameOverAt = 0;
  gameState.running = autoStart;
  gameState.lastSpawnTime = 0;
  gameState.lastTimestamp = 0;
  Object.assign(gameState.character, { x: 50, y: 0, velocityY: 0 });
  clearContainer();
  gameOverEl.classList.add('hidden');
  renderState();
  if (autoStart) gameEl.focus();
  if (frameId) cancelAnimationFrame(frameId);
  frameId = requestAnimationFrame(gameLoop);
}

function startRun() {
  if (gameState.running || gameState.gameOver) return;
  gameState.running = true;
  renderState();
  gameEl.focus();
}

function gameLoop(timestamp) {
  if (gameState.gameOver) return;

  if (gameState.lastTimestamp === 0) {
    gameState.lastTimestamp = timestamp;
  } else if (gameState.running) {
    const deltaTime = Math.min(timestamp - gameState.lastTimestamp, MAX_FRAME_DT);
    gameState.lastTimestamp = timestamp;
    update(deltaTime, timestamp);
    render();
  } else {
    gameState.lastTimestamp = timestamp;
  }
  frameId = requestAnimationFrame(gameLoop);
}

function handleKeydown(event) {
  if (event.repeat) return;
  if (event.code === 'Space') {
    event.preventDefault();
    if (gameState.gameOver) {
      if (performance.now() - gameState.gameOverAt >= RESTART_LOCKOUT_MS) {
        initGame(true);
        jump();
      }
      return;
    }
    startRun();
    jump();
  } else if (event.code === 'Enter' || event.code === 'NumpadEnter') {
    event.preventDefault();
    if (gameState.gameOver) {
      initGame(true);
    } else if (!gameState.running) {
      startRun();
    }
  }
}

function jump() {
  gameState.character.velocityY = JUMP_FORCE;
}

function update(deltaTime, timestamp) {
  applyGravity();
  updateCharacterPosition();
  moveObstacles(deltaTime);
  if (timestamp - gameState.lastSpawnTime > SPAWN_INTERVAL) {
    spawnObstacle();
    gameState.lastSpawnTime = timestamp;
  }
  updateScore();
  if (checkCollision()) endGame(timestamp);
}

function render() {
  renderCharacter(gameState.character);
  renderScore(gameState.score);
  renderObstacles(gameState.obstacles);
  renderState();
}

function endGame(timestamp = performance.now()) {
  endGameLogic();
  gameState.gameOverAt = timestamp;
  showGameOver(gameState.score);
  renderState();
  gameOverEl.focus();
}

// ============================================================
// SECTION 2 — Lefa: Logic & State
// ============================================================

function applyGravity() {
  gameState.character.velocityY += GRAVITY;
}

function updateCharacterPosition() {
  gameState.character.y -= gameState.character.velocityY;

  if (gameState.character.y < 0) {
    gameState.character.y = 0;
    gameState.character.velocityY = 0;
  }
}

function spawnObstacle() {
  const containerWidth = gameEl.clientWidth;
  const obstacleHeight = 30 + Math.random() * 30;

  gameState.obstacles.push({
    x: containerWidth,
    y: 0,
    width: 20,
    height: obstacleHeight,
    passed: false
  });
}

function moveObstacles(deltaTime) {
  for (const obstacle of gameState.obstacles) {
    obstacle.x -= OBSTACLE_SPEED * (deltaTime / 16);
  }

  gameState.obstacles = gameState.obstacles.filter(
    (obstacle) => obstacle.x + obstacle.width > 0
  );
}

function checkCollision() {
  const char = gameState.character;

  const charLeft = char.x;
  const charRight = char.x + char.width;
  const charBottom = char.y;
  const charTop = char.y + char.height;

  for (const obstacle of gameState.obstacles) {
    const obsLeft = obstacle.x;
    const obsRight = obstacle.x + obstacle.width;
    const obsBottom = obstacle.y;
    const obsTop = obstacle.y + obstacle.height;

    if (
      charRight > obsLeft &&
      charLeft < obsRight &&
      charTop > obsBottom &&
      charBottom < obsTop
    ) {
      return true;
    }
  }

  return false;
}

function updateScore() {
  const char = gameState.character;

  for (const obstacle of gameState.obstacles) {
    if (!obstacle.passed && obstacle.x + obstacle.width < char.x) {
      obstacle.passed = true;
      gameState.score += 1;
    }
  }
}

function endGameLogic() {
  gameState.gameOver = true;
}

// ============================================================
// SECTION 3 — TONY: Output & Feedback
// ============================================================

const characterEl = document.getElementById('character');
const scoreEl = document.getElementById('score');
const gameEl = document.getElementById('game');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const stateBadgeEl = document.getElementById('state-badge');
const startScreenEl = document.getElementById('start-screen');

const obstacleEls = new WeakMap();

function renderCharacter(char) {
  characterEl.style.left = char.x + 'px';
  characterEl.style.bottom = char.y + 'px';
}

function renderObstacles(obstacles) {
  for (const obstacle of obstacles) {
    if (obstacle.x < -20) {
      const gone = obstacleEls.get(obstacle);
      if (gone) {
        gone.remove();
        obstacleEls.delete(obstacle);
      }
      continue;
    }
    let div = obstacleEls.get(obstacle);
    if (!div) {
      div = document.createElement('div');
      div.className = 'obstacle';
      gameEl.appendChild(div);
      obstacleEls.set(obstacle, div);
    }
    div.style.left = obstacle.x + 'px';
    div.style.height = obstacle.height + 'px';
  }
}

function renderScore(score) {
  scoreEl.textContent = 'Score: ' + score;
}

function showGameOver(finalScore) {
  gameOverEl.classList.remove('hidden');
  finalScoreEl.textContent = finalScore;
}

function renderState() {
  const state = gameState.gameOver ? 'over' : gameState.running ? 'running' : 'ready';
  stateBadgeEl.textContent = { over: 'Game over', running: 'Running', ready: 'Ready' }[state];
  stateBadgeEl.className = 'preview-badge state-' + state;
  startScreenEl.classList.toggle('hidden', state !== 'ready');
}

function clearContainer() {
  gameEl.querySelectorAll('.obstacle').forEach(el => el.remove());
}

document.addEventListener('keydown', handleKeydown);
document.getElementById('restart').addEventListener('click', () => initGame(true));
document.getElementById('start-button').addEventListener('click', startRun);
initGame();
