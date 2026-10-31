
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



let frameId = 0;

function resetGame() {
  gameState.score = 0;
  gameState.obstacles = [];
  gameState.gameOver = false;
  gameState.gameOverAt = 0;
  gameState.running = false;
  gameState.lastSpawnTime = 0;
  gameState.lastTimestamp = 0;
  Object.assign(gameState.character, { x: 50, y: 0, velocityY: 0 });
}

function resetUI() {
  clearContainer();
  gameOverEl.classList.add('hidden');
  renderState();
}

function initGame(autoStart = false) {
  resetGame();
  if (autoStart) {
    gameState.running = true;
    gameEl.focus();
  }
  resetUI();
  if (frameId) cancelAnimationFrame(frameId);
  frameId = requestAnimationFrame(gameLoop);
}

function startRun() {
  if (gameState.running || gameState.gameOver) return;
  gameState.running = true;
  renderState();
  gameEl.focus();
}

function frameDelta(timestamp) {
  if (gameState.lastTimestamp === 0) return 0;
  return Math.min(timestamp - gameState.lastTimestamp, MAX_FRAME_DT);
}

function gameLoop(timestamp) {
  if (gameState.gameOver) return;

  const deltaTime = frameDelta(timestamp);
  gameState.lastTimestamp = timestamp;
  if (gameState.running && deltaTime) {
    update(deltaTime, timestamp);
    render();
  }
  frameId = requestAnimationFrame(gameLoop);
}

function restartLockoutElapsed() {
  return performance.now() - gameState.gameOverAt >= RESTART_LOCKOUT_MS;
}

function handleSpaceKey() {
  if (gameState.gameOver) {
    if (restartLockoutElapsed()) {
      initGame(true);
      jump();
    }
    return;
  }
  startRun();
  jump();
}

function handleEnterKey() {
  if (gameState.gameOver) {
    initGame(true);
  } else if (!gameState.running) {
    startRun();
  }
}

function handleKeydown(event) {
  if (event.repeat) return;
  if (event.code === 'Space') {
    event.preventDefault();
    handleSpaceKey();
  } else if (event.code === 'Enter' || event.code === 'NumpadEnter') {
    event.preventDefault();
    handleEnterKey();
  }
}

function jump() {
  if (!isGrounded()) return;
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
  gameState.obstacles.push({
    x: gameEl.clientWidth,
    y: 0,
    width: 20,
    height: 30 + Math.random() * 30,
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

function isGrounded() {
  return gameState.character.y <= 0 && gameState.character.velocityY === 0;
}

function checkCollision() {
  const char = gameState.character;

  for (const obstacle of gameState.obstacles) {
    if (
      char.x + char.width > obstacle.x &&
      char.x < obstacle.x + obstacle.width &&
      char.y + char.height > obstacle.y &&
      char.y < obstacle.y + obstacle.height
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

function isOffscreen(obstacle) {
  return obstacle.x < -20;
}

function removeObstacleDiv(obstacle) {
  const div = obstacleEls.get(obstacle);
  if (!div) return;
  div.remove();
  obstacleEls.delete(obstacle);
}

function updateObstacleDiv(obstacle) {
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

function renderObstacles(obstacles) {
  for (const obstacle of obstacles) {
    if (isOffscreen(obstacle)) {
      removeObstacleDiv(obstacle);
    } else {
      updateObstacleDiv(obstacle);
    }
  }
}

function renderScore(score) {
  scoreEl.textContent = 'Score: ' + score;
}

function showGameOver(finalScore) {
  gameOverEl.classList.remove('hidden');
  finalScoreEl.textContent = finalScore;
}

function currentGameState() {
  if (gameState.gameOver) return 'over';
  return gameState.running ? 'running' : 'ready';
}

function renderBadge(state) {
  stateBadgeEl.textContent = { over: 'Game over', running: 'Running', ready: 'Ready' }[state];
  stateBadgeEl.className = 'preview-badge state-' + state;
}

function renderStartScreen(state) {
  startScreenEl.classList.toggle('hidden', state !== 'ready');
}

function renderState() {
  const state = currentGameState();
  renderBadge(state);
  renderStartScreen(state);
}

function clearContainer() {
  gameEl.querySelectorAll('.obstacle').forEach(el => el.remove());
}

document.addEventListener('keydown', handleKeydown);
document.getElementById('restart').addEventListener('click', () => initGame(true));
document.getElementById('start-button').addEventListener('click', startRun);
initGame();
