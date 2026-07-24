// Canvas and context
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game objects
const paddleHeight = 80;
const paddleWidth = 10;
const ballSize = 7;

let playerPaddle = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 6
};

let computerPaddle = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 5
};

let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: ballSize,
    dx: 5,
    dy: 5,
    speed: 5,
    maxSpeed: 8
};

let scores = {
    player: 0,
    computer: 0
};

let gameRunning = false;
let keys = {};

// Event listeners for keyboard
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Event listener for mouse
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    
    // Smoothly move paddle towards mouse position
    const paddleCenter = playerPaddle.y + playerPaddle.height / 2;
    if (mouseY < paddleCenter - 10) {
        playerPaddle.dy = -playerPaddle.speed;
    } else if (mouseY > paddleCenter + 10) {
        playerPaddle.dy = playerPaddle.speed;
    } else {
        playerPaddle.dy = 0;
    }
});

// Button event listeners
document.getElementById('startBtn').addEventListener('click', () => {
    gameRunning = !gameRunning;
    const btn = document.getElementById('startBtn');
    btn.textContent = gameRunning ? 'Pause Game' : 'Start Game';
    btn.style.background = gameRunning ? '#ff9800' : '#4CAF50';
});

document.getElementById('resetBtn').addEventListener('click', () => {
    scores.player = 0;
    scores.computer = 0;
    gameRunning = false;
    document.getElementById('startBtn').textContent = 'Start Game';
    document.getElementById('startBtn').style.background = '#4CAF50';
    updateScore();
    resetBall();
});

// Update player paddle position based on arrow keys
function updatePlayerPaddle() {
    if (keys['ArrowUp']) {
        playerPaddle.dy = -playerPaddle.speed;
    } else if (keys['ArrowDown']) {
        playerPaddle.dy = playerPaddle.speed;
    } else if (!canvas.matches(':hover')) {
        // Only reset if mouse is not over canvas
        playerPaddle.dy = 0;
    }

    playerPaddle.y += playerPaddle.dy;

    // Boundary collision for player paddle
    if (playerPaddle.y < 0) {
        playerPaddle.y = 0;
    }
    if (playerPaddle.y + playerPaddle.height > canvas.height) {
        playerPaddle.y = canvas.height - playerPaddle.height;
    }
}

// Update computer paddle (AI)
function updateComputerPaddle() {
    const computerCenter = computerPaddle.y + computerPaddle.height / 2;
    const ballCenter = ball.y;

    // Simple AI: track the ball with some lag
    if (ballCenter < computerCenter - 20) {
        computerPaddle.y -= computerPaddle.speed;
    } else if (ballCenter > computerCenter + 20) {
        computerPaddle.y += computerPaddle.speed;
    }

    // Boundary collision for computer paddle
    if (computerPaddle.y < 0) {
        computerPaddle.y = 0;
    }
    if (computerPaddle.y + computerPaddle.height > canvas.height) {
        computerPaddle.y = canvas.height - computerPaddle.height;
    }
}

// Update ball position
function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top and bottom wall collision
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        // Clamp ball position to prevent getting stuck
        ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));
    }

    // Paddle collision - Player
    if (
        ball.x - ball.radius < playerPaddle.x + playerPaddle.width &&
        ball.y > playerPaddle.y &&
        ball.y < playerPaddle.y + playerPaddle.height
    ) {
        ball.dx = -ball.dx;
        ball.x = playerPaddle.x + playerPaddle.width + ball.radius;
        
        // Add spin based on paddle velocity
        const deltaY = ball.y - (playerPaddle.y + playerPaddle.height / 2);
        ball.dy = (deltaY / (playerPaddle.height / 2)) * ball.speed;
        
        // Increase ball speed slightly
        const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
        if (speed < ball.maxSpeed) {
            ball.dx *= 1.02;
            ball.dy *= 1.02;
        }
    }

    // Paddle collision - Computer
    if (
        ball.x + ball.radius > computerPaddle.x &&
        ball.y > computerPaddle.y &&
        ball.y < computerPaddle.y + computerPaddle.height
    ) {
        ball.dx = -ball.dx;
        ball.x = computerPaddle.x - ball.radius;
        
        // Add spin based on paddle velocity
        const deltaY = ball.y - (computerPaddle.y + computerPaddle.height / 2);
        ball.dy = (deltaY / (computerPaddle.height / 2)) * ball.speed;
        
        // Increase ball speed slightly
        const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
        if (speed < ball.maxSpeed) {
            ball.dx *= 1.02;
            ball.dy *= 1.02;
        }
    }

    // Scoring
    if (ball.x - ball.radius < 0) {
        scores.computer++;
        updateScore();
        resetBall();
    }
    if (ball.x + ball.radius > canvas.width) {
        scores.player++;
        updateScore();
        resetBall();
    }
}

// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = (Math.random() - 0.5) * ball.speed;
}

// Update score display
function updateScore() {
    document.getElementById('playerScore').textContent = scores.player;
    document.getElementById('computerScore').textContent = scores.computer;
}

// Draw functions
function drawPaddle(paddle) {
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.strokeStyle = '#00cc00';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawCenterLine() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    drawCenterLine();

    // Draw game objects
    drawPaddle(playerPaddle);
    drawPaddle(computerPaddle);
    drawBall();
}

// Game loop
function gameLoop() {
    if (gameRunning) {
        updatePlayerPaddle();
        updateComputerPaddle();
        updateBall();
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
