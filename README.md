# Jumping Game

Project 2 — team jumping game. Full schedule and role assignments live in [`AGENTS.md`](AGENTS.md); read it before writing code.

## Layout

- `game/index.html` — page structure
- `game/style.css` — styles
- `game/script.js` — all game code

## Who owns what

| Person | Section in `game/script.js` | Owns |
|---|---|---|
| Karim | Section 1 | `initGame`, `gameLoop`, `handleKeydown`, `jump`, `update`, `render`, `endGame` — structure, input, orchestration |
| Logic | Section 2 | `applyGravity`, `updateCharacterPosition`, `spawnObstacle`, `moveObstacles`, `checkCollision`, `updateScore`, `endGameLogic` — logic & state |
| Tony | Section 3 | `renderCharacter`, `renderObstacles`, `renderScore`, `showGameOver`, `clearContainer` — output & feedback |

## Rules

- Everything is a stub — find your `TODO(<name>)` markers and fill them in.
- The contract block at the top of `game/script.js` (`gameState` + constants) is agreed — don't rename anything without team sign-off.
- Note the naming split: Karim's orchestrator is `endGame()`; Logic's is `endGameLogic()`.
- One function, one job.

## Run

Open `game/index.html` in a browser.
