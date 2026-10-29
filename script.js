// ============================================================
// JUMPING GAME — interface contract (agreed, do not rename)
// Sections below: Karim (input/orchestration), Logic (state), Tony (output)
// ============================================================

// --- CONTRACT: shared state + constants (edit only with team sign-off) ---
const gameState = {
  character: { x: 50, y: 0, velocityY: 0, width: 40, height: 40 },
  obstacles: [],
  score: 0,
  gameOver: false,
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

// TODO(Karim): resets gameState, starts loop
function initGame() {}

// TODO(Karim): calculates deltaTime, calls update() then render()
function gameLoop(timestamp) {}

// TODO(Karim): calls jump() on spacebar
function handleKeydown(event) {}

// TODO(Karim): sets character.velocityY = JUMP_FORCE
function jump() {}

// TODO(Karim): calls Logic functions in order
function update(deltaTime, timestamp) {}

// TODO(Karim): calls Tony's render functions
function render() {}

// TODO(Karim): orchestrator — calls endGameLogic() + showGameOver()
function endGame() {}

// TODO(Karim): wire keydown listener to handleKeydown here
// TODO(Karim): wire restart button click to initGame() here

// ============================================================
// SECTION 2 — LOGIC: Logic & State
// ============================================================

// TODO(Logic): character.velocityY += GRAVITY
function applyGravity() {}

// TODO(Logic): character.y += velocityY, clamp to ground (y >= 0)
function updateCharacterPosition() {}

// TODO(Logic): pushes new obstacle to gameState.obstacles, x at right edge
function spawnObstacle() {}

// TODO(Logic): each obstacle.x -= OBSTACLE_SPEED * (deltaTime/16)
function moveObstacles(deltaTime) {}

// TODO(Logic): returns boolean — bounding box overlap
function checkCollision() {}

// TODO(Logic): increments gameState.score when obstacle passes character's x
function updateScore() {}

// TODO(Logic): sets gameState.gameOver = true (named endGameLogic to avoid clash with Karim's endGame)
function endGameLogic() {}

// ============================================================
// SECTION 3 — TONY: Output & Feedback
// ============================================================

// TODO(Tony): sets character div's left and bottom from char.x / char.y
function renderCharacter(char) {}

// TODO(Tony): creates/updates obstacle divs (class "obstacle"); removes divs off-screen
function renderObstacles(obstacles) {}

// TODO(Tony): sets score div's textContent
function renderScore(score) {}

// TODO(Tony): removes hidden class from game-over div, sets final score text
function showGameOver(finalScore) {}

// TODO(Tony): removes all obstacle divs from DOM
function clearContainer() {}
