// ============================================================
// JUMPING GAME — interface contract (agreed, do not rename)
// Sections below: Karim (input/orchestration), Logic (state), Tony (output)
// ============================================================

const player = {
  x: 50,
  y: 0,
  width: 40,
  height: 40,
  velocityY: 0,
  gravity: 0.5,
  jumpForce: -12,
  isJumping: false,
  isGrounded: true,
  state: 'idle', // 'idle', 'jumping', 'falling'

  jump(){},
  updateJump(){},
  updateFall(){},
  updateGravity(){},
  init(){}
}


const obstacle = {
  x: 0,
  y: 0,
  width: 20,
  height: 40,
  speed: 5,

  init(){}
};
// --- CONTRACT: shared state + constants (edit only with team sign-off) ---
// NOTE: `running` added Oct 31 — ready-pause until first Space. Sign-off pending.
const gameState = {
  character: player,
  obstacles: [],
  score: 0,
  gameOver: false,
  running: false, // false = ready-pause on load/restart, true = run in progress
  lastSpawnTime: 0,
  lastTimestamp: 0
};

const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const OBSTACLE_SPEED = 5;
const SPAWN_INTERVAL = 1500;

// ============================================================
// SECTION 1 — KARIM: Structure, Input & Orchestration
// ============================================================

// resets gameState, starts loop
let frameId = 0;
function initGame() {
  gameState.score = 0;
  gameState.obstacles = [];
  gameState.gameOver = false;
  gameState.running = false; // ready-pause: first Space starts the run
  gameState.lastSpawnTime = 0;
  gameState.lastTimestamp = 0;
  Object.assign(gameState.character, { x: 50, y: 0, velocityY: 0 });
  clearContainer();
  gameOverEl.classList.add('hidden');
  renderState();
  if (frameId) cancelAnimationFrame(frameId); // no double loop on restart
  frameId = requestAnimationFrame(gameLoop);
}

// calculates deltaTime, calls update() then render()
function gameLoop(timestamp) {
  if (gameState.gameOver) return; // stop the loop, schedule nothing

  if (gameState.lastTimestamp === 0) {
    // first frame after (re)start: seed the clock only, no delta yet
    gameState.lastTimestamp = timestamp;
  } else if (gameState.running) {
    const deltaTime = timestamp - gameState.lastTimestamp;
    gameState.lastTimestamp = timestamp;
    update(deltaTime, timestamp);
    render();
  } else {
    // ready-pause: world frozen, loop ticks so the first Space is instant
    gameState.lastTimestamp = timestamp;
  }
  frameId = requestAnimationFrame(gameLoop);
}

// calls jump() on spacebar; Enter restarts when game over
function handleKeydown(event) {
  if (event.repeat) return;
  if (event.code === 'Space') {
    event.preventDefault(); // keep space from scrolling the page
    if (!gameState.running) gameState.running = true; // first Space starts the run
    jump();
  } else if ((event.code === 'Enter' || event.code === 'NumpadEnter') && gameState.gameOver) {
    event.preventDefault(); // stop the focused restart button from also firing
    initGame();
  }
}

// sets character.velocityY = JUMP_FORCE
function jump() {
  gameState.character.velocityY = JUMP_FORCE;
}

// calls Logic functions in order
function update(deltaTime, timestamp) {
  applyGravity();
  updateCharacterPosition();
  moveObstacles(deltaTime);
  if (timestamp - gameState.lastSpawnTime > SPAWN_INTERVAL) {
    spawnObstacle();
    gameState.lastSpawnTime = timestamp;
  }
  updateScore();
  if (checkCollision()) endGame();
}

// calls Tony's render functions
function render() {
  renderCharacter(gameState.character);
  renderScore(gameState.score);
  renderObstacles(gameState.obstacles);
  renderState();
}

// orchestrator — calls endGameLogic() + showGameOver()
function endGame() {
  endGameLogic();
  showGameOver(gameState.score);
  renderState();
}

// ============================================================
// SECTION 2 — Lefa: Logic & State
// ============================================================

function applyGravity() {
  gameState.character.velocityY += GRAVITY;
}

function updateCharacterPosition() {
  // velocityY is downward-positive (JUMP_FORCE -12 = up), y is height
  // above ground, so position integrates against velocity
  gameState.character.y -= gameState.character.velocityY;

  // y is from the bottom, so < 0 means below ground
  if (gameState.character.y < 0) {
    gameState.character.y = 0;
    gameState.character.velocityY = 0;
  }
}

function spawnObstacle() {
  const containerWidth = gameEl.clientWidth;
  const obstacleHeight = 30 + Math.random() * 30; // 30–60px, matches CSS height

  gameState.obstacles.push({
    x: containerWidth,
    y: 0,
    width: 20,          // matches .obstacle width in CSS
    height: obstacleHeight,
    passed: false       // ensures score counts once per obstacle
  });
}

function moveObstacles(deltaTime) {
  // /16 normalizes speed to ~60fps so slow frames don't make obstacles jump
  for (const obstacle of gameState.obstacles) {
    obstacle.x -= OBSTACLE_SPEED * (deltaTime / 16);
  }

  // Remove obstacles fully off the left edge
  gameState.obstacles = gameState.obstacles.filter(
    (obstacle) => obstacle.x + obstacle.width > 0
  );
}

function checkCollision() {
  const char = gameState.character;

  // y is from the bottom: top edge = y + height, bottom edge = y
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
    // passed flag prevents double-counting the same obstacle
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

// element refs (script tag loads after the body, DOM is ready)
const characterEl = document.getElementById('character');
const scoreEl = document.getElementById('score');
const gameEl = document.getElementById('game');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const stateBadgeEl = document.getElementById('state-badge');
const readyHintEl = document.getElementById('ready-hint');

const obstacleEls = new WeakMap(); // obstacle object -> its div

// sets character div's left and bottom from char.x / char.y
function renderCharacter(char) {
  characterEl.style.left = char.x + 'px';
  characterEl.style.bottom = char.y + 'px';
}

// creates/updates obstacle divs (class "obstacle"); removes divs off-screen
function renderObstacles(obstacles) {
  for (const obstacle of obstacles) {
    if (obstacle.x < -20) { // 20 = .obstacle width in style.css
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

// sets score div's textContent
function renderScore(score) {
  scoreEl.textContent = 'Score: ' + score;
}

// removes hidden class from game-over div, sets final score text
function showGameOver(finalScore) {
  gameOverEl.classList.remove('hidden');
  finalScoreEl.textContent = finalScore;
}

// badge + ready hint mirror gameState (called from render and endGame)
function renderState() {
  const state = gameState.gameOver ? 'over' : gameState.running ? 'running' : 'ready';
  stateBadgeEl.textContent = { over: 'Game over', running: 'Running', ready: 'Ready' }[state];
  stateBadgeEl.className = 'preview-badge state-' + state;
  readyHintEl.classList.toggle('hidden', state !== 'ready');
}

// removes all obstacle divs from DOM
function clearContainer() {
  gameEl.querySelectorAll('.obstacle').forEach(el => el.remove());
}

// wiring (after element refs — initGame touches gameEl/gameOverEl on load)
document.addEventListener('keydown', handleKeydown);
document.getElementById('restart').addEventListener('click', initGame);
initGame(); // start the loop on page load, not only on restart
