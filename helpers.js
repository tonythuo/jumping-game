/**
 * @brief This file contains helper functions for the project.
 * @author Karim Aouaouda
 * @date 2023-10-01
 */


/**
 * Returns a random integer between min and max (inclusive).
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @param {boolean} float - Whether to return a float or an integer.
 * @returns {number} A random number between min and max.
 */
function getRandomNumber(min, max, float = false) {
    if (float) {
        return Math.random() * (max - min) + min;
    }
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


/**
 * Creates a deep copy of an object.
 * @param {Object} obj - The object to copy.
 * @returns {Object} A deep copy of the object.
 */
function copyObject(obj) {
    let newObj = JSON.parse(JSON.stringify(obj));
    if (typeof newObj === 'object' && newObj !== null) {
        if( typeof newObj.init === 'function') {
            newObj.init();
        }

        return newObj;
    }

    return null;
}


/**
 * Checks if two rectangles are colliding (colliding from the left side).
 * @param {{x: number, y: number, width: number, height: number}} rect1 
 * @param {{x: number, y: number, width: number, height: number}} rect2 
 * @returns 
 */
function isColliding(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

/**
 * Calculates the distance between two rectangles.
 * @param {{x: number, y: number, width: number, height: number}} rect1 
 * @param {{x: number, y: number, width: number, height: number}} rect2 
 * @returns 
 */
function distanceBetweenRects(rect1, rect2) {
    const dx = (rect1.x + rect1.width / 2) - (rect2.x + rect2.width / 2);
    const dy = (rect1.y + rect1.height / 2) - (rect2.y + rect2.height / 2);
    return Math.sqrt(dx * dx + dy * dy);
}

// ============================================
// Game Helper Functions
// =============================================


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