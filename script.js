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
function initGame() { }

// TODO(Karim): calculates deltaTime, calls update() then render()
function gameLoop(timestamp) { }

// TODO(Karim): calls jump() on spacebar
function handleKeydown(event) { }

// TODO(Karim): sets character.velocityY = JUMP_FORCE
function jump() { }

// TODO(Karim): calls Logic functions in order
function update(deltaTime, timestamp) { }

// TODO(Karim): calls Tony's render functions
function render() { }

// TODO(Karim): orchestrator — calls endGameLogic() + showGameOver()
function endGame() { }

// TODO(Karim): wire keydown listener to handleKeydown here
// TODO(Karim): wire restart button click to initGame() here

// ============================================================
// SECTION 2 — Lefa: Logic & State
// ============================================================

// TODO(Lefa): character.velocityY += GRAVITY
function applyGravity() { }

// TODO(Lefa): character.y += velocityY, clamp to ground (y >= 0)
function updateCharacterPosition() { }

// TODO(Lefa): pushes new obstacle to gameState.obstacles, x at right edge
function spawnObstacle() { }

// TODO(Lefa): each obstacle.x -= OBSTACLE_SPEED * (deltaTime/16)
function moveObstacles(deltaTime) { }

// TODO(Lefa): returns boolean — bounding box overlap
function checkCollision() { }

// TODO(Lefa): increments gameState.score when obstacle passes character's x
function updateScore() { }

// TODO(Lefa): sets gameState.gameOver = true (named endGameLogic to avoid clash with Karim's endGame)
function endGameLogic() { }

// ============================================================
// SECTION 3 — TONY: Output & Feedback
// ============================================================

// element refs (script tag loads after the body, DOM is ready)
const characterEl = document.getElementById('character');
const scoreEl = document.getElementById('score');
const gameEl = document.getElementById('game');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');

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

// removes all obstacle divs from DOM
function clearContainer() {
  gameEl.querySelectorAll('.obstacle').forEach(el => el.remove());
}
