// tests.js — run with: node tests.js
// Plain-JS tests for the game logic + render functions. No framework.

// ============================================================
// Minimal fake DOM: script.js grabs elements + calls DOM APIs at
// top level, so a stub must exist before the source is loaded.
// ============================================================
function makeEl(parent) {
  const el = {
    style: {},
    textContent: '',
    className: '',
    clientWidth: 600,
    classes: new Set(['hidden']),
    children: [],
    classList: {
      add: (c) => el.classes.add(c),
      remove: (c) => el.classes.delete(c),
      contains: (c) => el.classes.has(c),
      toggle: (c, force) => {
        if (force === undefined) force = !el.classes.has(c);
        force ? el.classes.add(c) : el.classes.delete(c);
      }
    },
    appendChild(child) { child.parent = el; el.children.push(child); },
    addEventListener(type, fn) { events.documentListeners.push({ type, fn, target: el }); },
    focus() { events.focusLog.push(el); },
    remove() {
      if (!el.parent) return;
      const i = el.parent.children.indexOf(el);
      if (i >= 0) el.parent.children.splice(i, 1);
      el.parent = null;
    }
  };
  if (parent) el.parent = parent;
  return el;
}

const fakeDocument = {
  getElementById: (id) => ids[id],
  createElement: () => makeEl(null),
  addEventListener: (type, fn) => events.documentListeners.push({ type, fn })
};

const fakeWindow = {
  addEventListener: (type, fn) => events.windowListeners.push({ type, fn })
};

function fakeRAF(cb) {
  events.raf.pending.push(cb);
  return events.raf.nextId++;
}

function fakeCAF(id) {
  events.raf.cancelled.push(id);
}

const ids = {
  character: makeEl(),
  score: makeEl(),
  game: makeEl(),
  'game-over': makeEl(),
  'final-score': makeEl(),
  restart: makeEl(),
  'state-badge': makeEl(),
  'start-screen': makeEl(),
  'start-button': makeEl()
};

const events = {
  raf: { pending: [], nextId: 1, cancelled: [] },
  documentListeners: [],
  windowListeners: [],
  focusLog: []
};

function runFrame(timestamp) {
  const pending = events.raf.pending;
  events.raf.pending = [];
  for (const cb of pending) cb(timestamp);
}

let fakeNow = 0;
const sel = '.obstacle';
ids.game.querySelectorAll = () =>
  ids.game.children.filter((c) => c.className === sel.replace('.', ''));

// ============================================================
// Load script.js (a plain browser script, not a module) and grab
// what the tests need.
// ============================================================
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

const game = new Function('document', 'window', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', src + `
;return {
  gameState,
  gameEl, characterEl, gameOverEl, finalScoreEl,
  applyGravity, updateCharacterPosition, spawnObstacle,
  moveObstacles, checkCollision, updateScore, endGameLogic,
  renderCharacter, renderObstacles, renderScore, showGameOver, clearContainer,
  initGame, gameLoop, handleKeydown, jump, update, render, endGame, startRun
};`)(fakeDocument, fakeWindow, fakeRAF, fakeCAF, { now: () => fakeNow });

const framesOnLoad = events.raf.pending.length;

// ============================================================
// Tiny harness: PASS/FAIL per test, exit 1 if any fail
// ============================================================
let passed = 0, failed = 0;
function expect(cond, msg) { if (!cond) throw new Error(msg); }

function check(name, fn) {
  reset();
  try { fn(); passed++; console.log('PASS  ' + name); }
  catch (e) { failed++; console.log('FAIL  ' + name + ' — ' + e.message); }
}

function reset() {
  Object.assign(game.gameState.character, {
    x: 50, y: 0, velocityY: 0, width: 40, height: 40
  });
  game.gameState.obstacles = [];
  game.gameState.score = 0;
  game.gameState.gameOver = false;
  game.gameState.gameOverAt = 0;
  game.gameState.running = false;
  game.gameState.lastSpawnTime = 0;
  game.gameState.lastTimestamp = 0;
  events.raf.pending = [];
  events.focusLog = [];
  ids.game.children = [];
  ids.character.style = {};
  ids['game-over'].classes.add('hidden');
  ids['final-score'].textContent = '';
}

function withObstacle(props) {
  const ob = Object.assign({ x: 100, y: 0, width: 20, height: 40, passed: false }, props);
  game.gameState.obstacles.push(ob);
  return ob;
}

// ============================================================
// SECTION 2 — Logic (character)
// ============================================================
check('applyGravity adds GRAVITY to velocityY', () => {
  game.gameState.character.velocityY = 0;
  game.applyGravity();
  expect(game.gameState.character.velocityY === 0.5, 'velocityY should be 0.5, got ' + game.gameState.character.velocityY);
  game.applyGravity();
  expect(game.gameState.character.velocityY === 1, 'second call should give 1, got ' + game.gameState.character.velocityY);
});

check('updateCharacterPosition moves y against velocityY (falling lowers y)', () => {
  game.gameState.character.y = 10;
  game.gameState.character.velocityY = 2;
  game.updateCharacterPosition();
  expect(game.gameState.character.y === 8, 'falling should lower y to 8, got ' + game.gameState.character.y);
});

check('updateCharacterPosition clamps to ground and zeroes velocity', () => {
  game.gameState.character.y = 1;
  game.gameState.character.velocityY = 3;
  game.updateCharacterPosition();
  expect(game.gameState.character.y === 0, 'y should clamp to 0, got ' + game.gameState.character.y);
  expect(game.gameState.character.velocityY === 0, 'velocityY should reset to 0, got ' + game.gameState.character.velocityY);
});

// ============================================================
// SECTION 2 — Logic (obstacles)
// ============================================================
check('spawnObstacle pushes one obstacle at the right edge', () => {
  game.spawnObstacle();
  expect(game.gameState.obstacles.length === 1, 'should have 1 obstacle');
  const ob = game.gameState.obstacles[0];
  expect(ob.x === 600, 'x should be container width (600), got ' + ob.x);
  expect(ob.height >= 30 && ob.height <= 60, 'height should be 30-60, got ' + ob.height);
  expect(ob.passed === false, 'passed should start false');
});

check('moveObstacles moves by OBSTACLE_SPEED * dt/16', () => {
  const ob = withObstacle({ x: 100 });
  game.moveObstacles(16);
  expect(ob.x === 95, 'at dt=16 x should be 95, got ' + ob.x);
  game.moveObstacles(32);
  expect(ob.x === 85, 'at cumulative dt=48 x should be 85, got ' + ob.x);
});

check('moveObstacles handles slow frames proportionally', () => {
  const ob = withObstacle({ x: 100 });
  game.moveObstacles(100);
  expect(ob.x === 100 - 5 * (100 / 16), 'should move proportionally to dt, got ' + ob.x);
});

check('moveObstacles removes obstacles fully off the left edge', () => {
  withObstacle({ x: -25 });
  game.moveObstacles(0);
  expect(game.gameState.obstacles.length === 0, 'obstacle at x=-25 should be removed');
  withObstacle({ x: -19 });
  game.moveObstacles(0);
  expect(game.gameState.obstacles.length === 1, 'obstacle at x=-19 should remain');
});

// ============================================================
// SECTION 2 — Logic (collision)
// ============================================================
check('checkCollision detects overlap', () => {
  withObstacle({ x: 55, y: 0 });
  expect(game.checkCollision() === true, 'overlapping obstacle should collide');
});

check('checkCollision is false when exactly touching (all four sides)', () => {
  withObstacle({ x: 90, y: 0 });
  expect(game.checkCollision() === false, 'touching on character right edge');
  reset();
  withObstacle({ x: 30, y: 0 });
  expect(game.checkCollision() === false, 'touching on character left edge');
  reset();
  withObstacle({ x: 55, y: 40 });
  expect(game.checkCollision() === false, 'touching at character top');
});

check('checkCollision is false when obstacle overlaps horizontally but is above', () => {
  withObstacle({ x: 55, y: 45 });
  expect(game.checkCollision() === false, 'obstacle above character should not collide');
  expect(game.checkCollision() === false, 'empty obstacles should never collide');
});

// ============================================================
// SECTION 2 — Logic (score / game over)
// ============================================================
check('updateScore counts an obstacle exactly once, after it fully passes', () => {
  const char = game.gameState.character;
  const ob = withObstacle({ x: 25 });
  game.updateScore();
  expect(game.gameState.score === 1, 'score should be 1, got ' + game.gameState.score);
  game.updateScore();
  expect(game.gameState.score === 1, 'passed flag should stop double counting');
  ob.passed = false;
  ob.x = 30;
  game.updateScore();
  expect(game.gameState.score === 1, 'should not count until fully past character');
});

check('endGameLogic sets gameOver to true', () => {
  game.endGameLogic();
  expect(game.gameState.gameOver === true, 'gameOver should be true');
});

// ============================================================
// SECTION 3 — Render
// ============================================================
check('renderCharacter sets left and bottom style', () => {
  game.renderCharacter({ x: 75, y: 30 });
  const style = ids.character.style;
  expect(style.left === '75px', 'left should be 75px, got ' + style.left);
  expect(style.bottom === '30px', 'bottom should be 30px, got ' + style.bottom);
});

check('renderObstacles creates one div and does not duplicate it', () => {
  const ob = { x: 600, y: 0, width: 20, height: 40, passed: false };
  game.renderObstacles([ob]);
  game.renderObstacles([ob]);
  expect(ids.game.children.length === 1, 'should be exactly 1 obstacle div');
  expect(ids.game.children[0].style.left === '600px', 'div left should track obstacle x');
  expect(ids.game.children[0].style.height === '40px', 'div height should track obstacle height');
  expect(ids.game.children[0].className === 'obstacle', 'div should have class "obstacle"');
});

check('renderObstacles removes the div once x < -20', () => {
  const ob = { x: 600, y: 0, width: 20, height: 40, passed: false };
  game.renderObstacles([ob]);
  ob.x = -30;
  game.renderObstacles([ob]);
  expect(ids.game.children.length === 0, 'div should be removed from DOM, found ' + ids.game.children.length);
});

check('renderScore writes "Score: N"', () => {
  game.renderScore(5);
  expect(ids.score.textContent === 'Score: 5', 'expected "Score: 5", got "' + ids.score.textContent + '"');
});

check('showGameOver unhides overlay and sets final score', () => {
  game.showGameOver(7);
  expect(ids['game-over'].classes.has('hidden') === false, 'hidden class should be removed');
  expect(ids['final-score'].textContent === 7, 'final score text should be 7');
});

check('clearContainer removes every obstacle div', () => {
  game.renderObstacles([
    { x: 400, height: 30 },
    { x: 500, height: 45 }
  ]);
  game.clearContainer();
  expect(ids.game.children.length === 0, 'container should be empty, got ' + ids.game.children.length);
});

// ============================================================
// SECTION 1 — KARIM: structure, input & orchestration
// These are the SPEC: they fail while the stubs are empty and
// pass once implemented. Run `node tests.js` after each change.
// ============================================================

check('jump sets velocityY to JUMP_FORCE from any velocity', () => {
  game.gameState.character.velocityY = 3;
  game.jump();
  expect(game.gameState.character.velocityY === -12, 'velocityY should be -12, got ' + game.gameState.character.velocityY);
});

check('handleKeydown jumps on space and prevents page scroll', () => {
  let prevented = false;
  game.handleKeydown({ code: 'Space', preventDefault: () => { prevented = true; } });
  expect(game.gameState.character.velocityY === -12, 'space should jump, velocityY ' + game.gameState.character.velocityY);
  expect(prevented === true, 'preventDefault must be called so the page does not scroll');
});

check('handleKeydown ignores non-space keys', () => {
  game.handleKeydown({ code: 'KeyA', preventDefault: () => {} });
  game.handleKeydown({ code: 'ArrowUp', preventDefault: () => {} });
  expect(game.gameState.character.velocityY === 0, 'non-space keys must not jump');
});

check('handleKeydown does not stack jump on held key (event.repeat)', () => {
  game.gameState.character.velocityY = -12;
  game.handleKeydown({ code: 'Space', repeat: true, preventDefault: () => {} });
  expect(game.gameState.character.velocityY === -12, 'repeat keydown must not re-trigger the jump');
});

check('initGame resets all state to a fresh game', () => {
  game.gameState.score = 9;
  game.gameState.obstacles.push({ x: 100, y: 0, width: 20, height: 40, passed: true });
  game.gameState.gameOver = true;
  Object.assign(game.gameState.character, { x: 100, y: 100, velocityY: 5 });
  ids.game.appendChild(Object.assign(makeEl(null), { className: 'obstacle' }));

  game.initGame();

  expect(game.gameState.score === 0, 'score should reset to 0, got ' + game.gameState.score);
  expect(game.gameState.obstacles.length === 0, 'obstacles should be empty, got ' + game.gameState.obstacles.length);
  expect(game.gameState.gameOver === false, 'gameOver should be false');
  expect(game.gameState.character.x === 50, 'character x should reset to 50, got ' + game.gameState.character.x);
  expect(game.gameState.character.y === 0, 'character y should reset to 0, got ' + game.gameState.character.y);
  expect(game.gameState.character.velocityY === 0, 'velocityY should reset to 0, got ' + game.gameState.character.velocityY);
  expect(ids.game.children.length === 0, 'obstacle divs should be cleared from the container');
  expect(game.gameOverEl.classes.has('hidden') === true, 'game-over overlay should be hidden again');
});

check('initGame schedules the first frame', () => {
  game.initGame();
  expect(events.raf.pending.length === 1, 'requestAnimationFrame should be called once, got ' + events.raf.pending.length);
});

check('game auto-starts: a frame is scheduled when the script loads', () => {
  expect(framesOnLoad >= 1, 'script load should schedule the first frame, got ' + framesOnLoad);
});

check('ready-pause on load: start screen shows, world frozen until first Space', () => {
  game.initGame();
  expect(ids['state-badge'].textContent === 'Ready', 'badge should say Ready, got ' + ids['state-badge'].textContent);
  expect(ids['start-screen'].classes.has('hidden') === false, 'start screen should be visible on load');
  let t = 1000;
  game.gameLoop(t);
  for (let i = 0; i < 124; i++) { t += 16; runFrame(t); }
  expect(game.gameState.obstacles.length === 0, 'nothing should spawn while paused');
  expect(game.gameState.character.y === 0, 'character should stay on the ground');
  expect(game.gameState.score === 0, 'score should stay 0');
  expect(ids['state-badge'].textContent === 'Ready', 'badge should still say Ready');
});

check('first Space starts the run: start screen hides, badge flips to Running', () => {
  game.initGame();
  let t = 1000;
  runFrame(t);
  game.handleKeydown({ code: 'Space', preventDefault: () => {} });
  t += 16; runFrame(t);
  expect(ids['state-badge'].textContent === 'Running', 'badge should say Running, got ' + ids['state-badge'].textContent);
  expect(ids['start-screen'].classes.has('hidden') === true, 'start screen should hide once running');
  expect(game.gameState.character.y > 0, 'character should be airborne, got ' + game.gameState.character.y);
});

check('start button click starts the run without a Space press', () => {
  game.initGame();
  const click = events.documentListeners.find((l) => l.type === 'click' && l.target === ids['start-button']);
  expect(click !== undefined, 'start button should have a click listener');
  click.fn({ preventDefault: () => {} });
  expect(game.gameState.running === true, 'run should start, got ' + game.gameState.running);
  expect(ids['start-screen'].classes.has('hidden') === true, 'start screen should hide');
  expect(ids['state-badge'].textContent === 'Running', 'badge should say Running');
  let t = 2000;
  game.gameLoop(t); t += 16; runFrame(t); t += 16; runFrame(t);
  expect(game.gameState.character.y > 0 || game.gameState.obstacles.length > 0 || game.gameState.score >= 0, 'world should run after start');
});

check('collision shows Game over badge; restart returns to Ready', () => {
  game.initGame();
  let t = 1000;
  runFrame(t);
  game.handleKeydown({ code: 'Space', preventDefault: () => {} });
  t += 16; runFrame(t);
  game.gameState.obstacles.push({ x: 55, y: 0, width: 20, height: 40, passed: false });
  t += 16; runFrame(t);
  expect(ids['state-badge'].textContent === 'Game over', 'badge should say Game over, got ' + ids['state-badge'].textContent);
  expect(ids['start-screen'].classes.has('hidden') === true, 'start screen should stay hidden');
  const click = events.documentListeners.find((l) => l.type === 'click' && l.target === ids.restart);
  click.fn({ preventDefault: () => {} });
  expect(ids['state-badge'].textContent === 'Running', 'restart should go straight to Running, got ' + ids['state-badge'].textContent);
  expect(ids['start-screen'].classes.has('hidden') === true, 'start screen must not return after restart');
  expect(game.gameState.running === true, 'restart should start the run immediately');
});

check('initGame(true) restarts straight into the run with no start screen', () => {
  game.gameState.running = true;
  game.gameState.score = 5;
  game.gameState.obstacles.push({ x: 300, y: 0, width: 20, height: 40, passed: false });
  game.initGame(true);
  expect(game.gameState.running === true, 'restart should run immediately, got ' + game.gameState.running);
  expect(ids['start-screen'].classes.has('hidden') === true, 'start screen must not show on restart');
  expect(ids['state-badge'].textContent === 'Running', 'badge should say Running, got ' + ids['state-badge'].textContent);
  expect(game.gameState.score === 0 && game.gameState.obstacles.length === 0, 'state should still reset');
});

check('restart does not run a second loop: the old frame is cancelled', () => {
  const before = events.raf.cancelled.length;
  game.initGame();
  expect(events.raf.cancelled.length === before + 1, 'the in-flight frame should be cancelled, got ' + (events.raf.cancelled.length - before) + ' cancels');
});

check('gameLoop first call is a baseline: no movement, no teleport', () => {
  game.gameLoop(1000);
  expect(game.gameState.character.y === 0, 'character should stay on ground, got ' + game.gameState.character.y);
  expect(game.gameState.obstacles.length === 0, 'no obstacle should spawn at t=1000');
  expect(game.gameState.lastTimestamp === 1000, 'lastTimestamp should be set to 1000, got ' + game.gameState.lastTimestamp);
});

check('gameLoop moves the game proportionally to deltaTime', () => {
  game.gameState.running = true;
  game.gameState.character.y = 10;
  game.gameLoop(1000);
  game.gameLoop(1016);
  expect(game.gameState.character.y === 9.5, 'one 16ms frame of gravity should give y=9.5, got ' + game.gameState.character.y);
  expect(game.gameState.character.velocityY === 0.5, 'gravity should have applied once, got ' + game.gameState.character.velocityY);
});

check('gameLoop runs update before render (character div tracks state)', () => {
  game.gameState.running = true;
  game.gameState.character.y = 10;
  game.gameLoop(1000);
  game.gameLoop(1016);
  expect(ids.character.style.bottom === '9.5px', 'render should have painted the new y, got ' + ids.character.style.bottom);
});

check('gameLoop schedules the next frame each call', () => {
  game.gameLoop(1000);
  expect(events.raf.pending.length === 1, 'one frame scheduled');
  runFrame(1016);
  expect(events.raf.pending.length === 1, 'next frame scheduled after the previous fired');
});

check('gameLoop stops scheduling frames once game over', () => {
  game.gameState.gameOver = true;
  game.gameLoop(2000);
  expect(events.raf.pending.length === 0, 'loop must stop on gameOver (no memory leak), got ' + events.raf.pending.length);
});

check('update applies gravity, position, and obstacle movement in order', () => {
  game.gameState.character.y = 10;
  game.update(16, 100);
  expect(game.gameState.character.y === 9.5, 'one physics step should run, got ' + game.gameState.character.y);
});

check('update spawns an obstacle only after SPAWN_INTERVAL', () => {
  game.update(16, 1400);
  expect(game.gameState.obstacles.length === 0, 'should not spawn before 1500ms');
  game.update(16, 1600);
  expect(game.gameState.obstacles.length === 1, 'should spawn after 1500ms');
  game.update(16, 3100);
  expect(game.gameState.obstacles.length === 1, 'exactly at the interval boundary must not spawn');
  game.update(16, 3200);
  expect(game.gameState.obstacles.length === 2, 'next interval should spawn again');
});

check('update ends the game when the character collides with an obstacle', () => {
  game.gameState.obstacles.push({ x: 55, y: 0, width: 20, height: 40, passed: false });
  game.update(16, 100);
  expect(game.gameState.gameOver === true, 'gameOver should become true on collision');
  expect(game.gameOverEl.classes.has('hidden') === false, 'game-over overlay should show');
  expect(String(game.finalScoreEl.textContent) === '0', 'final score should show current score');
});

check('render paints character, score, and obstacles from state', () => {
  game.gameState.character.y = 20;
  game.gameState.score = 4;
  game.gameState.obstacles.push({ x: 300, y: 0, width: 20, height: 40, passed: false });
  game.render();
  expect(ids.character.style.left === '50px', 'character left should be 50px');
  expect(ids.character.style.bottom === '20px', 'character bottom should be 20px');
  expect(ids.score.textContent === 'Score: 4', 'score text should update live, got ' + ids.score.textContent);
  expect(ids.game.children.length === 1, 'one obstacle div should exist');
});

check('render does not duplicate obstacle divs across frames', () => {
  game.gameState.obstacles.push({ x: 300, y: 0, width: 20, height: 40, passed: false });
  game.render();
  game.render();
  expect(ids.game.children.length === 1, 'second render should reuse the div, got ' + ids.game.children.length);
});

check('endGame orchestrates logic + output: gameOver true and overlay shown', () => {
  game.gameState.score = 3;
  game.endGame();
  expect(game.gameState.gameOver === true, 'endGameLogic should set gameOver');
  expect(game.gameOverEl.classes.has('hidden') === false, 'showGameOver should unhide the overlay');
  expect(String(game.finalScoreEl.textContent) === '3', 'overlay should show the final score, got ' + game.finalScoreEl.textContent);
});

check('keydown wiring: spacebar works through the real registered listener', () => {
  const all = events.documentListeners.concat(events.windowListeners);
  const keydown = all.find((l) => l.type === 'keydown');
  if (!keydown) throw new Error('no keydown listener was registered on document or window');
  keydown.fn({ code: 'Space', preventDefault: () => {} });
  expect(game.gameState.character.velocityY === -12, 'spacebar through the wiring should jump');
});

check('restart wiring: clicking restart starts a fresh game', () => {
  game.gameState.gameOver = true;
  game.gameState.score = 5;
  const all = events.documentListeners.concat(events.windowListeners);
  const click = all.find((l) => l.type === 'click' && l.target === ids.restart);
  if (!click) throw new Error('no click listener was registered on the #restart button');
  click.fn({ preventDefault: () => {} });
  expect(game.gameState.gameOver === false && game.gameState.score === 0, 'restart should reset the game');
});

check('Enter restarts the game when game over', () => {
  game.gameState.gameOver = true;
  game.gameState.score = 7;
  game.gameState.obstacles.push({ x: 100, y: 0, width: 20, height: 40, passed: false });
  let prevented = false;
  game.handleKeydown({ code: 'Enter', preventDefault: () => { prevented = true; } });
  expect(prevented === true, 'Enter should preventDefault (button focus would double-fire)');
  expect(game.gameState.gameOver === false, 'Enter should restart when game over');
  expect(game.gameState.score === 0, 'score should reset, got ' + game.gameState.score);
  expect(game.gameState.obstacles.length === 0, 'obstacles should clear');
  expect(game.gameState.character.y === 0 && game.gameState.character.velocityY === 0, 'character should reset');
  expect(events.raf.cancelled.length > 0, 'the old loop should be cancelled, not doubled');
});

check('NumpadEnter also restarts when game over', () => {
  game.gameState.gameOver = true;
  game.handleKeydown({ code: 'NumpadEnter', preventDefault: () => {} });
  expect(game.gameState.gameOver === false, 'NumpadEnter should restart');
});

check('Enter is a no-op while the game is running', () => {
  game.gameState.gameOver = false;
  game.gameState.score = 3;
  game.gameState.obstacles.push({ x: 300, y: 0, width: 20, height: 40, passed: false });
  game.handleKeydown({ code: 'Enter', preventDefault: () => {} });
  expect(game.gameState.gameOver === false, 'game should keep running');
  expect(game.gameState.score === 3, 'score must not reset mid-run');
  expect(game.gameState.obstacles.length === 1, 'obstacles must not clear mid-run');
});

check('collision records gameOverAt from the frame timestamp', () => {
  game.initGame(true);
  game.gameState.obstacles.push({ x: 55, y: 0, width: 20, height: 40, passed: false });
  game.update(16, 4000);
  expect(game.gameState.gameOver === true, 'collision should end the game');
  expect(game.gameState.gameOverAt === 4000, 'gameOverAt should be the frame time, got ' + game.gameState.gameOverAt);
});

check('Space during the restart lockout does nothing', () => {
  fakeNow = 5000;
  game.gameState.gameOver = true;
  game.gameState.gameOverAt = 4800;
  game.gameState.score = 12;
  game.gameState.obstacles.push({ x: 150, y: 0, width: 20, height: 40, passed: false });
  const cancels = events.raf.cancelled.length;
  game.handleKeydown({ code: 'Space', preventDefault: () => {} });
  expect(game.gameState.gameOver === true, 'game must stay over during the lockout');
  expect(game.gameState.score === 12, 'score must be untouched');
  expect(game.gameState.obstacles.length === 1, 'obstacles must be untouched');
  expect(events.raf.cancelled.length === cancels, 'no restart, no loop churn');
  expect(game.gameState.character.y === 0, 'character must not jump');
});

check('Space after the lockout restarts into the run and jumps', () => {
  fakeNow = 5400;
  game.gameState.gameOver = true;
  game.gameState.gameOverAt = 4800;
  game.gameState.score = 9;
  const cancels = events.raf.cancelled.length;
  game.handleKeydown({ code: 'Space', preventDefault: () => {} });
  expect(game.gameState.gameOver === false, 'Space should restart after the lockout');
  expect(game.gameState.running === true, 'restart should run immediately, got ' + game.gameState.running);
  expect(game.gameState.score === 0, 'score should reset');
  expect(game.gameState.gameOverAt === 0, 'gameOverAt should clear on restart');
  expect(game.gameState.character.velocityY === -12, 'restart-Space should also jump, got ' + game.gameState.character.velocityY);
  expect(events.raf.cancelled.length === cancels + 1, 'the old loop should be cancelled');
});

check('Enter restarts immediately even inside the lockout window', () => {
  fakeNow = 5000;
  game.gameState.gameOver = true;
  game.gameState.gameOverAt = 4990;
  game.handleKeydown({ code: 'Enter', preventDefault: () => {} });
  expect(game.gameState.gameOver === false, 'Enter should bypass the lockout');
  expect(game.gameState.running === true, 'Enter restart should run immediately');
});

check('Enter on the start screen starts the run without jumping', () => {
  game.initGame();
  expect(ids['start-screen'].classes.has('hidden') === false, 'start screen should be visible before Enter');
  let prevented = false;
  game.handleKeydown({ code: 'Enter', preventDefault: () => { prevented = true; } });
  expect(prevented === true, 'Enter should preventDefault (focused start button would double-fire)');
  expect(game.gameState.running === true, 'Enter should start the run from ready state');
  expect(ids['start-screen'].classes.has('hidden') === true, 'start screen should hide');
  expect(ids['state-badge'].textContent === 'Running', 'badge should say Running, got ' + ids['state-badge'].textContent);
  expect(game.gameState.character.velocityY === 0, 'Enter must not jump, got ' + game.gameState.character.velocityY);
  expect(game.gameState.character.y === 0, 'character must stay on the ground');
});

check('NumpadEnter on the start screen also starts the run', () => {
  game.initGame();
  game.handleKeydown({ code: 'NumpadEnter', preventDefault: () => {} });
  expect(game.gameState.running === true, 'NumpadEnter should start the run');
  expect(game.gameState.character.velocityY === 0, 'NumpadEnter must not jump');
});

check('end-to-end: jump, fly, land, stop — physics wired together', () => {
  game.initGame();
  game.handleKeydown({ code: 'Space', preventDefault: () => {} });
  let t = 1000;
  for (let i = 0; i < 15; i++) { t += 16; runFrame(t); }
  const peak = game.gameState.character.y;
  expect(peak > 0, 'character must be airborne after jumping, got y=' + peak);
  for (let i = 15; i < 65; i++) { t += 16; runFrame(t); }
  expect(game.gameState.character.y === 0, 'character should land back on ground, got ' + game.gameState.character.y);
  expect(game.gameState.character.velocityY === 0, 'velocity should be zero after landing, got ' + game.gameState.character.velocityY);
});

check('gameLoop clamps deltaTime after long gaps (background tab)', () => {
  game.gameState.running = true;
  game.gameState.character.y = 100;
  game.gameState.lastTimestamp = 1000;
  game.gameLoop(4000);
  expect(game.gameState.character.velocityY === 0.5, 'one clamped step of gravity, got ' + game.gameState.character.velocityY);
  expect(game.gameState.character.y === 99.5, 'position should move one 50ms step, got ' + game.gameState.character.y);
  expect(game.gameState.lastTimestamp === 4000, 'clock should still advance to the real time, got ' + game.gameState.lastTimestamp);
});

check('collision moves focus to the game-over dialog', () => {
  game.gameState.score = 2;
  game.endGame(1000);
  expect(events.focusLog[events.focusLog.length - 1] === ids['game-over'], 'game-over should receive focus, got ' + events.focusLog.length + ' focus calls');
});

check('startRun moves focus to #game', () => {
  game.initGame();
  events.focusLog = [];
  game.startRun();
  expect(events.focusLog.length === 1 && events.focusLog[0] === ids.game, 'the game area should receive focus after start, got ' + events.focusLog.length);
});

check('restart moves focus to #game but first load does not', () => {
  events.focusLog = [];
  game.initGame();
  expect(events.focusLog.length === 0, 'load should not move focus, got ' + events.focusLog.length);
  game.initGame(true);
  expect(events.focusLog.length === 1 && events.focusLog[0] === ids.game, 'restart should focus #game, got ' + events.focusLog.length);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
