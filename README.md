# Jumping Game

Project 2 — team jumping game. Team schedule and role assignments live in [`AGENTS.md`](AGENTS.md).

## Layout

- `index.html` — page structure
- `style.css` — styles
- `script.js` — all game code
- `tests.js` — test suite, run with `node tests.js`

## Who owns what

| Person | Section in `script.js` | Owns |
|---|---|---|
| Karim | Section 1 | `initGame`, `startRun`, `gameLoop`, `handleKeydown`, `jump`, `update`, `render`, `endGame` — structure, input, orchestration |
| Lefa | Section 2 | `applyGravity`, `updateCharacterPosition`, `spawnObstacle`, `moveObstacles`, `checkCollision`, `updateScore`, `endGameLogic` — logic & state |
| Tony | Section 3 | `renderCharacter`, `renderObstacles`, `renderScore`, `showGameOver`, `renderState`, `clearContainer` — output & feedback |

## How the game works

- The page loads into a **ready-pause**: the start screen is up and the world is frozen.
- **Space** starts the run and jumps (also restarts after game over, after a 400 ms lockout so the final score can't be wiped by key spam). **Enter** starts or restarts without jumping. Both work everywhere, for consistency.
- The run is endless: obstacles spawn from the right, each one fully passed is a point, one collision ends the run and shows the game-over overlay.
- Restarting (button, Space, or Enter) goes straight back into the run — no start screen again.

## Contract

- `gameState` + the constants at the top of `script.js` are the agreed contract — don't rename anything without team sign-off.
- Naming split: Karim's orchestrator is `endGame()`; Lefa's is `endGameLogic()`.
- One function, one job.

## Run

Open `index.html` in a browser, or serve the folder (`python3 -m http.server 8000`) if your browser blocks local scripts.

## Test

`node tests.js` — prints PASS/FAIL per test and exits non-zero if any fail.
