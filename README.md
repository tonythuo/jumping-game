# Jumping Game

Project 2 — team jumping game. Team schedule and role assignments live in [`AGENTS.md`](AGENTS.md).

## Layout

- `index.html` — page structure
- `style.css` — styles
- `helpers.js` — shared helper functions (Karim)
- `script.js` — all game code

## Who owns what

| Person | Section in `script.js` | Owns |
|---|---|---|
| Karim | Section 1 + `helpers.js` | `initGame`, `resetGame`, `resetUI`, `startRun`, `frameDelta`, `gameLoop`, `handleKeydown`, `handleSpaceKey`, `handleEnterKey`, `restartLockoutElapsed`, `jump`, `update`, `render`, `endGame` — structure, input, orchestration; `helpers.js` — `isColliding`, `getRandomNumber`, `isGrounded`, `currentGameState`, `isOffscreen`, `copyObject`, `moveRect`, `distanceBetweenRects` |
| Lefa | Section 2 | `applyGravity`, `updateCharacterPosition`, `spawnObstacle`, `moveObstacles`, `checkCollision`, `updateScore`, `endGameLogic` — logic & state |
| Tony | Section 3 | `renderCharacter`, `renderObstacles`, `renderScore`, `showGameOver`, `renderState`, `clearContainer` — output & feedback |

## How the game works

- The page loads into a **ready-pause**: the start screen is up and the world is frozen.
- **Space** starts the run and jumps (also restarts after game over, after a 400 ms lockout so key spam can't wipe the game-over screen before you've read it). **Enter** starts or restarts without jumping. Both work everywhere, for consistency.
- One jump per press, only from the ground — mid-air presses are ignored.
- The run is endless: obstacles spawn from the right, each one fully passed is a point, one collision ends the run.
- Restarting (button, Space, or Enter) goes straight back into the run — no start screen again.

## Run

Open `index.html` in a browser. If your browser blocks local scripts, serve the folder first (e.g. `python3 -m http.server 8000` and visit `http://localhost:8000`).
