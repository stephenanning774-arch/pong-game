// Canvas and context
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const difficulties = {
    easy: { computerSpeed: 3, ballSpeedIncrease: 1.01, ballMaxSpeed: 7 },
    medium: { computerSpeed: 5, ballSpeedIncrease: 1.02, ballMaxSpeed: 8 },
    hard: { computerSpeed: 7, ballSpeedIncrease: 1.03, ballMaxSpeed: 10 }
};

let currentDifficulty = 'medium';

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
    speed: 6,
    baseHeight: paddleHeight
};

let computerPaddle = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: difficulties[currentDifficulty].computerSpeed
};

let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: ballSize,
    dx: 5,
    dy: 5,
    speed: 5,
    maxSpeed: difficulties[currentDifficulty].ballMaxSpeed,
    speedIncrease: difficulties[currentDifficulty].ballSpeedIncrease
};

let scores = {
    player: 0,
    computer: 0
};

let powerups = [];
let activePowerups = {
    biggerPaddle: false,
    slowerBall: false
};

let gameRunning = false;
let gamePaused = false;
let keys = {};
let soundEnabled = true;

// Audio context for sound effects
let audioContext;
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Play sound with Web Audio API
function playSound(frequency, duration, type = 'sine') {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Specific sound effects
function soundBallHit() {
    playSound(400, 0.1);
}

function soundScore() {
    playSound(800, 0.2);
    setTimeout(() => playSound(1000, 0.2), 100);
}

function soundPowerup() {
    playSound(1200, 0.1);
    setTimeout(() => playSound(1500, 0.1), 50);
}

// Event listeners
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    initAudio();
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    initAudio();
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    
    const paddleCenter = playerPaddle.y + playerPaddle.height / 2;
    if (mouseY < paddleCenter - 10) {
        playerPaddle.dy = -playerPaddle.speed;
    } else if (mouseY > paddleCenter + 10) {
        playerPaddle.dy = playerPaddle.speed;
    } else {
        playerPaddle.dy = 0;
    }
});

// Button controls
document.getElementById('startBtn').addEventListener('click', () => {
    initAudio();
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        document.getElementById('startBtn').textContent = '⏹️ Stop Game';
        document.getElementById('gameStatus').textContent = 'Game Running';
    } else {
        gameRunning = false;
        gamePaused = false;
        document.getElementById('startBtn').textContent = '▶️ Start Game';
        document.getElementById('gameStatus').textContent = 'Game Stopped';
    }
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    if (gameRunning) {
        gamePaused = !gamePaused;
        document.getElementById('pauseBtn').textContent = gamePaused ? '▶️ Resume' : '⏸️ Pause';
        document.getElementById('gameStatus').textContent = gamePaused ? 'Game Paused' : 'Game Running';
    }
});

document.getElementById('resetBtn').addEventListener('click', () => {
    scores.player = 0;
    scores.computer = 0;
    gameRunning = false;
    gamePaused = false;
    activePowerups = { biggerPaddle: false, slowerBall: false };
    playerPaddle.height = paddleHeight;
    powerups = [];
    document.getElementById('startBtn').textContent = '▶️ Start Game';
    document.getElementById('gameStatus').textContent = 'Press Start to Play';
    document.getElementById('pauseBtn').textContent = '⏸️ Pause';
    updateScore();
    updatePowerupsDisplay();
    resetBall();
});

document.getElementById('soundToggle').addEventListener('change', (e) => {
    soundEnabled = e.target.checked;
});

document.getElementById('difficulty').addEventListener('change', (e) => {
    if (!gameRunning) {
        currentDifficulty = e.target.value;
        const settings = difficulties[currentDifficulty];
        computerPaddle.speed = settings.computerSpeed;
        ball.maxSpeed = settings.ballMaxSpeed;
        ball.speedIncrease = settings.ballSpeedIncrease;
    }
});

// Update player paddle
function updatePlayerPaddle() {
    if (keys['ArrowUp']) {
        playerPaddle.dy = -playerPaddle.speed;
    } else if (keys['ArrowDown']) {
        playerPaddle.dy = playerPaddle.speed;
    } else if (!canvas.matches(':hover')) {
        playerPaddle.dy = 0;
    }

    playerPaddle.y += playerPaddle.dy;

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

    if (ballCenter < computerCenter - 20) {
        computerPaddle.y -= computerPaddle.speed;
    } else if (ballCenter > computerCenter + 20) {
        computerPaddle.y += computerPaddle.speed;
    }

    if (computerPaddle.y < 0) {
        computerPaddle.y = 0;
    }
    if (computerPaddle.y + computerPaddle.height > canvas.height) {
        computerPaddle.y = canvas.height - computerPaddle.height;
    }
}

// Generate random power-ups
function generatePowerup(x, y) {
    const types = ['biggerPaddle', 'slowerBall'];
    const type = types[Math.floor(Math.random() * types.length)];
    powerups.push({ x, y, type, size: 20, duration: 0 });
}

// Update power-ups
function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        
        // Check collision with player paddle
        if (
            powerup.x > playerPaddle.x &&
            powerup.x < playerPaddle.x + playerPaddle.width &&
            powerup.y > playerPaddle.y &&
            powerup.y < playerPaddle.y + playerPaddle.height
        ) {
            activatePowerup(powerup.type);
            powerups.splice(i, 1);
            soundPowerup();
            continue;
        }
        
        // Remove if off screen
        if (powerup.y > canvas.height || powerup.y < 0) {
            powerups.splice(i, 1);
        }
    }
}

// Activate power-up effects
function activatePowerup(type) {
    if (type === 'biggerPaddle') {
        playerPaddle.height = paddleHeight * 1.5;
        activePowerups.biggerPaddle = true;
        setTimeout(() => {
            playerPaddle.height = paddleHeight;
            activePowerups.biggerPaddle = false;
            updatePowerupsDisplay();
        }, 8000);
    } else if (type === 'slowerBall') {
        activePowerups.slowerBall = true;
        const originalSpeed = ball.speed;
        ball.speed = originalSpeed * 0.7;
        setTimeout(() => {
            ball.speed = originalSpeed;
            activePowerups.slowerBall = false;
            updatePowerupsDisplay();
        }, 8000);
    }
    updatePowerupsDisplay();
}

// Update ball position
function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));
        playSound(200, 0.1);
    }

    // Player paddle collision
    if (
        ball.x - ball.radius < playerPaddle.x + playerPaddle.width &&
        ball.y > playerPaddle.y &&
        ball.y < playerPaddle.y + playerPaddle.height
    ) {
        ball.dx = -ball.dx;
        ball.x = playerPaddle.x + playerPaddle.width + ball.radius;
        
        const deltaY = ball.y - (playerPaddle.y + playerPaddle.height / 2);
        ball.dy = (deltaY / (playerPaddle.height / 2)) * ball.speed;
        
        const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
        if (speed < ball.maxSpeed) {
            ball.dx *= ball.speedIncrease;
            ball.dy *= ball.speedIncrease;
        }
        
        soundBallHit();
        
        // Chance to spawn power-up
        if (Math.random() < 0.15) {
            generatePowerup(ball.x, ball.y);
        }
    }

    // Computer paddle collision
    if (
        ball.x + ball.radius > computerPaddle.x &&
        ball.y > computerPaddle.y &&
        ball.y < computerPaddle.y + computerPaddle.height
    ) {
        ball.dx = -ball.dx;
        ball.x = computerPaddle.x - ball.radius;
        
        const deltaY = ball.y - (computerPaddle.y + computerPaddle.height / 2);
        ball.dy = (deltaY / (computerPaddle.height / 2)) * ball.speed;
        
        const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
        if (speed < ball.maxSpeed) {
            ball.dx *= ball.speedIncrease;
            ball.dy *= ball.speedIncrease;
        }
        
        soundBallHit();
    }

    // Scoring
    if (ball.x - ball.radius < 0) {
        scores.computer++;
        updateScore();
        soundScore();
        resetBall();
    }
    if (ball.x + ball.radius > canvas.width) {
        scores.player++;
        updateScore();
        soundScore();
        resetBall();
    }
}

// Reset ball
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

// Update powerups display
function updatePowerupsDisplay() {
    const active = [];
    if (activePowerups.biggerPaddle) active.push('🎯 Bigger Paddle');
    if (activePowerups.slowerBall) active.push('🐢 Slower Ball');
    document.getElementById('powerupsText').textContent = active.length > 0 ? active.join(', ') : 'None';
}

// Draw functions
function drawPaddle(paddle, color = '#00ff00') {
    ctx.fillStyle = color;
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

function drawPowerups() {
    for (let powerup of powerups) {
        ctx.fillStyle = powerup.type === 'biggerPaddle' ? '#FF6B9D' : '#00D4FF';
        ctx.fillRect(powerup.x - powerup.size / 2, powerup.y - powerup.size / 2, powerup.size, powerup.size);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(powerup.x - powerup.size / 2, powerup.y - powerup.size / 2, powerup.size, powerup.size);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerup.type === 'biggerPaddle' ? '🎯' : '🐢', powerup.x, powerup.y);
    }
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
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawCenterLine();
    drawPaddle(playerPaddle);
    drawPaddle(computerPaddle, '#00ff00');
    drawBall();
    drawPowerups();
}

// Game loop
function gameLoop() {
    if (gameRunning && !gamePaused) {
        updatePlayerPaddle();
        updateComputerPaddle();
        updateBall();
        updatePowerups();
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
