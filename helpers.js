function getRandomNumber(min, max, float = false) {
  if (float) {
    return Math.random() * (max - min) + min;
  }
  min = Math.ceil(min);
  max = Math.floor(max);

}

function copyObject(obj) {
  let newObj = JSON.parse(JSON.stringify(obj));
  if (typeof newObj === 'object' && newObj !== null) {
    if (typeof newObj.init === 'function') {
      newObj.init();
    }

    return newObj;
  }

  return null;
}

function isColliding(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

function distanceBetweenRects(rect1, rect2) {
  const dx = (rect1.x + rect1.width / 2) - (rect2.x + rect2.width / 2);
  const dy = (rect1.y + rect1.height / 2) - (rect2.y + rect2.height / 2);
  return Math.sqrt(dx * dx + dy * dy);
}

function isGrounded(character) {
  return character.y <= 0 && character.velocityY === 0;
}

function currentGameState(state) {
  if (state.gameOver) return 'over';
  return state.running ? 'running' : 'ready';
}

function isOffscreen(obstacle) {
  return obstacle.x < -20;
}

function moveRect(rect, speed, direction) {
  switch (direction) {
    case 'up':
      rect.y -= speed;
      break;
    case 'down':
      rect.y += speed;
      break;
    case 'left':
      rect.x -= speed;
      break;
    case 'right':
      rect.x += speed;
      break;
  }
}
