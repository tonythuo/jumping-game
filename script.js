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

/**
 * Resets all game state to the values of a fresh run.
 */
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

/**
 * Clears the playfield and overlays to their fresh-run appearance.
 */
function resetUI() {
  clearContainer();
  gameOverEl.classList.add('hidden');
  renderState();
}

/**
 * Starts a fresh game and schedules the game loop.
 * @param {boolean} [autoStart=false] - When true the run begins immediately, otherwise the start screen shows.
 */
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

/**
 * Leaves the ready-pause and starts the current run.
 */
function startRun() {
  if (gameState.running || gameState.gameOver) return;
  gameState.running = true;
  renderState();
  gameEl.focus();
}

/**
 * Computes the delta time for the current frame, clamped to a maximum.
 * @param {number} timestamp - The current frame's timestamp in milliseconds.
 * @returns {number} 0 on the first frame, otherwise the clamped delta.
 */
function frameDelta(timestamp) {
  if (gameState.lastTimestamp === 0) return 0;
  return Math.min(timestamp - gameState.lastTimestamp, MAX_FRAME_DT);
}

/**
 * Runs one frame of the game: updates the world, renders it, and schedules the next frame.
 * @param {number} timestamp - The current frame's timestamp in milliseconds.
 */
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

/**
 * Checks if the restart lockout after a game over has passed.
 * @returns {boolean} True when Space may restart the game.
 */
function restartLockoutElapsed() {
  return performance.now() - gameState.gameOverAt >= RESTART_LOCKOUT_MS;
}

/**
 * Applies the Space key: jumps, starts the run, or restarts after the lockout.
 */
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

/**
 * Applies the Enter key: starts the run or restarts it, without jumping.
 */
function handleEnterKey() {
  if (gameState.gameOver) {
    initGame(true);
  } else if (!gameState.running) {
    startRun();
  }
}

/**
 * Routes keyboard input to the matching key handler.
 * @param {KeyboardEvent} event - The keydown event to route.
 */
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

/**
 * Launches the character upwards, unless it is mid-air.
 */
function jump() {
  if (!isGrounded(gameState.character)) return;
  gameState.character.velocityY = JUMP_FORCE;
}

/**
 * Advances the world by one physics step: gravity, position, obstacles, spawning, score.
 * @param {number} deltaTime - Time since the previous frame in milliseconds.
 * @param {number} timestamp - The current frame's timestamp in milliseconds.
 */
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

/**
 * Paints the current game state onto the page.
 */
function render() {
  renderCharacter(gameState.character);
  renderScore(gameState.score);
  renderObstacles(gameState.obstacles);
  renderState();
}

/**
 * Ends the current run: records the time, shows the game-over overlay, moves focus to it.
 * @param {number} [timestamp=performance.now()] - When the run ended, in milliseconds.
 */
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

/**
 * Accelerates the character downwards by one gravity step.
 */
function applyGravity() {
  gameState.character.velocityY += GRAVITY;
}

/**
 * Integrates the character's vertical velocity into its position and clamps it to the ground.
 */
function updateCharacterPosition() {
  gameState.character.y -= gameState.character.velocityY;

  if (gameState.character.y < 0) {
    gameState.character.y = 0;
    gameState.character.velocityY = 0;
  }
}

/**
 * Adds one obstacle at the right edge of the playfield with a random height.
 */
function spawnObstacle() {
  gameState.obstacles.push({
    x: gameEl.clientWidth,
    y: 0,
    width: 20,
    height: getRandomNumber(30, 60, true),
    passed: false
  });
}

/**
 * Moves all obstacles left and removes the ones fully off screen.
 * @param {number} deltaTime - Time since the previous frame in milliseconds.
 */
function moveObstacles(deltaTime) {
  for (const obstacle of gameState.obstacles) {
    obstacle.x -= OBSTACLE_SPEED * (deltaTime / 16);
  }
  gameState.obstacles = gameState.obstacles.filter(
    (obstacle) => obstacle.x + obstacle.width > 0
  );
}

/**
 * Checks whether the character overlaps any obstacle.
 * @returns {boolean} True when a collision exists.
 */
function checkCollision() {
  return gameState.obstacles.some((obstacle) => isColliding(gameState.character, obstacle));
}

/**
 * Awards one point for each obstacle that has fully passed the character.
 */
function updateScore() {
  const char = gameState.character;

  for (const obstacle of gameState.obstacles) {
    if (!obstacle.passed && obstacle.x + obstacle.width < char.x) {
      obstacle.passed = true;
      gameState.score += 1;
    }
  }
}

/**
 * Marks the game as over.
 */
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

/**
 * Positions the character element from its state coordinates.
 * @param {{x: number, y: number}} char - The character state to paint.
 */
function renderCharacter(char) {
  characterEl.style.left = char.x + 'px';
  characterEl.style.bottom = char.y + 'px';
}

/**
 * Removes an obstacle's element from the page and drops it from the cache.
 * @param {Object} obstacle - The obstacle whose div should be removed.
 */
function removeObstacleDiv(obstacle) {
  const div = obstacleEls.get(obstacle);
  if (!div) return;
  div.remove();
  obstacleEls.delete(obstacle);
}

/**
 * Creates an obstacle's element if missing and paints it from the obstacle state.
 * @param {{x: number, height: number}} obstacle - The obstacle state to paint.
 */
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

/**
 * Reconciles the obstacle elements with the obstacle state, creating and removing as needed.
 * @param {Array<{x: number, height: number}>} obstacles - The obstacles to paint.
 */
function renderObstacles(obstacles) {
  for (const obstacle of obstacles) {
    if (isOffscreen(obstacle)) {
      removeObstacleDiv(obstacle);
    } else {
      updateObstacleDiv(obstacle);
    }
  }
}
/**
 * Writes the current score into the score element.
 * @param {number} score - The score to display.
 */
function renderScore(score) {
  scoreEl.textContent = 'Score: ' + score;
}

/**
 * Reveals the game-over overlay and writes the final score into it.
 * @param {number} finalScore - The score the run ended with.
 */
function showGameOver(finalScore) {
  gameOverEl.classList.remove('hidden');
  finalScoreEl.textContent = finalScore;
}

/**
 * Updates the state badge text and styling.
 * @param {'over'|'running'|'ready'} state - The display state to render.
 */
function renderBadge(state) {
  stateBadgeEl.textContent = { over: 'Game over', running: 'Running', ready: 'Ready' }[state];
  stateBadgeEl.className = 'preview-badge state-' + state;
}

/**
 * Shows the start screen only while the game is in the ready state.
 * @param {'over'|'running'|'ready'} state - The display state to render.
 */
function renderStartScreen(state) {
  startScreenEl.classList.toggle('hidden', state !== 'ready');
}

/**
 * Mirrors the game state into the badge and the start screen visibility.
 */
function renderState() {
  const state = currentGameState(gameState);
  renderBadge(state);
  renderStartScreen(state);
}

/**
 * Removes every obstacle element from the playfield.
 */
function clearContainer() {
  gameEl.querySelectorAll('.obstacle').forEach(el => el.remove());
}

document.addEventListener('keydown', handleKeydown);
document.getElementById('restart').addEventListener('click', () => initGame(true));
document.getElementById('start-button').addEventListener('click', startRun);
initGame();
