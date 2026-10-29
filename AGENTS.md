PROJECT 2: JUMPING GAME — Detailed Schedule
Project Lead: Karim
Deadline: Friday submission
Rule: One Function, One Job

Team Roles
Person	Layer	Functions They Own
Karim	Structure, Input & Orchestration (Lead)	HTML, game loop, keyboard, update() and render() orchestrators
You	Logic & State	Gravity, movement, spawning, collision, score, end game
Tony	Output & Feedback	Rendering character, obstacles, score, game over screen
TUESDAY (Today) — Structure + Stubs + Core Logic
Morning (15 min): Contract Agreement & Setup

All three confirm the interface contract (at the bottom of this document).

Create the /game folder.

Copy the stub files (index.html, style.css, script.js) into the folder.

Resolve the naming conflict: You will name your logic function endGameLogic() so it doesn't clash with Karim's orchestrator endGame().

Afternoon: Build (Parallel)

Person	Tasks	Deliverable by End of Day
Karim	HTML/CSS: Write the structure — game container, character div, score div, game-over div. Add basic CSS (container relative, character absolute).
JS: Write initGame() — resets gameState, calls requestAnimationFrame.
Write gameLoop(timestamp) — calculates deltaTime, calls update() then render(), calls requestAnimationFrame.
Write handleKeydown(event) — calls jump() on spacebar.
Write jump() — sets character.velocityY = JUMP_FORCE.
Write update(deltaTime, timestamp) — calls Your logic functions in order.
Write render() — calls Tony's render functions.	Loop runs. Character visible on screen. Spacebar changes character.velocityY (log to console). Obstacles array exists but empty.
You	Write applyGravity() — adds GRAVITY to character.velocityY.
Write updateCharacterPosition() — adds velocityY to character.y, clamps to ground (y >= 0).
Write spawnObstacle() — pushes new obstacle object to gameState.obstacles with x at right edge.
Write moveObstacles(deltaTime) — subtracts OBSTACLE_SPEED * deltaTime from each obstacle's x.
Write checkCollision() — returns true if character overlaps any obstacle.
Write updateScore() — increments gameState.score when obstacle passes character's x.
Write endGameLogic() — sets gameState.gameOver = true.
Test each in console.	All logic functions work in console: applyGravity() changes velocity, checkCollision() returns correct boolean, updateScore() increments.
Tony	Write renderCharacter(char) — sets character div's left and bottom based on char.x and char.y.
Write renderObstacles(obstacles) — for each obstacle, create/update a div with class obstacle, position it, remove it from DOM if off-screen.
Write renderScore(score) — sets score div's textContent.
Write showGameOver(finalScore) — removes hidden class from game-over div, sets final score text.
Write clearContainer() — removes all obstacle divs from DOM.
Test with hardcoded values.	renderCharacter({x: 50, y: 100}) shows character at correct position. renderObstacles([{x: 500, height: 40}]) shows obstacle. renderScore(5) shows "Score: 5".
End of Day Checkpoint (5 PM, 15 min):

Game loop runs, character visible, spacebar sets velocity.

All logic functions verified in console.

All render functions verified with hardcoded data.

No integration yet — each layer works independently.

WEDNESDAY — Full Integration + Playable Game
Morning Standup (10 min): Each person: what finished, what's today, what's blocking.

Person	Tasks	Deliverable by End of Day
Karim	Integration: Wire update(deltaTime, timestamp) to call Your functions in order: applyGravity() → updateCharacterPosition() → moveObstacles(deltaTime) → spawnObstacle() (if enough time passed) → checkCollision() (if true, call endGame()).
Wire render() to call Tony's functions: renderCharacter() → renderObstacles() → renderScore().
Wire endGame() → endGameLogic() (You) + showGameOver() (Tony).
Add restart logic: on game over, pressing space or clicking restart calls initGame() and clearContainer().	Game playable: character jumps with gravity, obstacles spawn and move, collision ends game, score displays, restart works.
You	Logic Polish: Fix edge cases — character shouldn't go below ground (y clamped to 0), obstacle spawning at consistent intervals (timestamp - lastSpawnTime > SPAWN_INTERVAL), score increments only once per obstacle (track passed flag on each obstacle), checkCollision() handles all four sides of bounding box.	Logic robust: no falling through floor, obstacles spawn regularly, score accurate, collision reliable.
Tony	Rendering Polish: Fix rendering — obstacles removed from DOM when x < 0, character position smooth (no jumping gaps), score updates live, game-over screen shows correctly, clearContainer() removes all obstacles on restart.
Add CSS: character and obstacles styled nicely, score prominent, game-over screen centered.	Game looks clean, no DOM leaks, restart clears everything.
End of Day Checkpoint (5 PM, 15 min):

Game fully playable in browser.

Character jumps with gravity.

Obstacles spawn, move, and are removed when off-screen.

Collision detection ends the game.

Score increments correctly.

Game-over screen displays final score.

Restart works cleanly.

Game is presentable.

THURSDAY — Polish + Cross-Test
Morning Standup (10 min).

Person	Tasks	Deliverable by End of Day
Karim	Final Integration Test: requestAnimationFrame stops on game over (no memory leak), restart resets all state, deltaTime doesn't cause jumps, keyboard doesn't scroll page. Fix any integration bugs.	Game loop stable, no memory leaks, restart clean.
You	Final Logic Test: Collision edge cases (character landing exactly on obstacle, obstacle spawning off-screen), score timing (only after obstacle passes), gravity/velocity balance (jump feels right). Fix any logic bugs.	Game feels fair, score accurate, collision reliable.
Tony	Final Output Test: All DOM elements update correctly, no orphaned obstacle divs, game-over screen hides on restart, score formatting clear. Add optional polish: CSS transitions, sound effects (if time). Fix any rendering bugs.	Game visually polished, no DOM issues.
Afternoon (1 hour): Cross-Testing

You test Game end-to-end (you didn't build input or output).

Tony tests Game end-to-end (he didn't build input or logic).

Karim fixes any bugs reported.

End of Day Checkpoint (5 PM):

Game fully working, cross-tested, bugs fixed.

Code reviewed for One-Function-One-Job violations.

Presentation rehearsal — Karim does a 5-min walkthrough.

FRIDAY — Final Test + Submit
Morning (9–11 AM):

Person	Task
Karim	Final end-to-end test. Verify collision, score, restart. Package folder.
You	Verify logic functions do exactly one job. No function does "and."
Tony	Verify render functions don't calculate — they only display.
11 AM: Submit /game folder (index.html, style.css, script.js).

Presentation: Karim presents Game (5 min) — explains the project, the split, and one example of One-Function-One-Job.

Game Interface Contract (Your Team's Rulebook)
javascript
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

// Karim (Input + Orchestration) provides:
initGame()                         // resets gameState, starts loop
gameLoop(timestamp)                // calculates deltaTime, calls update() + render()
handleKeydown(event)               // calls jump() on spacebar
jump()                             // sets character.velocityY = JUMP_FORCE
update(deltaTime, timestamp)       // calls Your logic in order
render()                           // calls Tony's render functions
endGame()                          // orchestrator: calls Your endGameLogic() + Tony's showGameOver()

// You (Logic) provide:
applyGravity()                     // character.velocityY += GRAVITY
updateCharacterPosition()          // character.y += velocityY, clamp to ground
spawnObstacle()                    // pushes new obstacle to gameState.obstacles
moveObstacles(deltaTime)           // each obstacle.x -= OBSTACLE_SPEED * (deltaTime/16)
checkCollision()                   // returns boolean (bounding box overlap)
updateScore()                      // increments gameState.score
endGameLogic()                     // sets gameState.gameOver = true

// Tony (Output) provides:
renderCharacter(char)              // updates character div position
renderObstacles(obstacles)         // creates/updates/removes obstacle divs
renderScore(score)                 // updates score div textContent
showGameOver(finalScore)           // shows game-over div with final score
clearContainer()                   // removes all obstacle divs
