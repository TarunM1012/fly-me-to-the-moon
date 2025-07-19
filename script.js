// Game constants
const GRAVITY_CONSTANT = 1500; // Realistic orbital gravity
const EARTH_RADIUS = 40;
const ROCKET_SIZE = 8;
const MOON_RADIUS = 25;
const TRAIL_LENGTH = 100; // Longer trail for orbital paths
const ASTEROID_RADIUS = 8;

// Game state
let gameState = {
    score: 0,
    attempts: 0,
    isDragging: false,
    isLaunched: false,
    gameWon: false,
    difficulty: 'easy', // 'easy', 'medium', 'hard'
    upgrades: {
        ionEngine: false,
        wormhole: false
    }
};

// Visual effects
let explosions = [];
let confetti = [];
let rocketLanded = false;

// Physics objects
let earth = { x: 400, y: 300, r: EARTH_RADIUS }; // Centered on screen
let rocket = { 
    x: earth.x,
    y: earth.y - earth.r - 10, // Just above Earth
    vx: 0, 
    vy: 0, 
    trail: [],
    isLaunched: false,
    orbitRadius: 0,
    orbitAngle: 0,
    isOrbiting: false,
    launchPoint: { x: earth.x, y: earth.y - earth.r - 10 } // Launch point on Earth
};
let moon = { 
    x: 400, 
    y: 200, 
    orbitCenter: { x: 400, y: 300 },
    orbitRadius: 250,
    orbitSpeed: 0.005, // Much slower
    orbitAngle: 0
};
let asteroids = [];

// Mouse/touch state
let mouse = { x: 0, y: 0, isDown: false };

// Fun space facts
const spaceFacts = [
    "🧠 Did you know the moon's gravity is only 1/6th of Earth's?",
    "🌟 The moon is 238,855 miles away from Earth!",
    "🚀 Projectile motion follows parabolic trajectories!",
    "🌍 The moon orbits Earth at 2,288 mph!",
    "💫 Isaac Newton discovered the laws of motion!",
    "🌙 The moon has no atmosphere - perfect for physics!",
    "⚡ Gravity affects all objects equally (Galileo's discovery)!",
    "🔭 The moon's surface is covered in craters!",
    "🌌 Orbital mechanics are used for space travel!",
    "🛸 Escape velocity from Earth is 25,020 mph!"
];

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Initialize game
function initGame() {
    updateScore();
    resetRocket();
    randomizeMoon();
    generateAsteroids();
    gameLoop();
}

// Main game loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // Update moon movement
    updateMoon();
    
    // Update asteroids
    updateAsteroids();
    
    // Update rocket physics
    if (rocket.isLaunched) {
        updateRocket();
    }
    
    // Update visual effects
    updateExplosions();
    updateConfetti();
    
    // Check collisions
    checkCollisions();
}

// Update moon movement (orbital around Earth)
function updateMoon() {
    // Orbital movement around Earth
    moon.orbitAngle += moon.orbitSpeed;
    moon.x = moon.orbitCenter.x + Math.cos(moon.orbitAngle) * moon.orbitRadius;
    moon.y = moon.orbitCenter.y + Math.sin(moon.orbitAngle) * moon.orbitRadius;
}

// Update asteroids
function updateAsteroids() {
    for (let asteroid of asteroids) {
        // Move asteroids in different patterns
        asteroid.x += asteroid.vx;
        asteroid.y += asteroid.vy;
        
        // Wrap around screen
        if (asteroid.x < -50) asteroid.x = canvas.width + 50;
        if (asteroid.x > canvas.width + 50) asteroid.x = -50;
        if (asteroid.y < -50) asteroid.y = canvas.height + 50;
        if (asteroid.y > canvas.height + 50) asteroid.y = -50;
    }
}

// Create explosion effect
function createExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
        explosions.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            decay: 0.02,
            size: Math.random() * 8 + 4,
            color: `hsl(${Math.random() * 60 + 10}, 100%, 50%)`
        });
    }
}

// Update explosions
function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        explosion.x += explosion.vx;
        explosion.y += explosion.vy;
        explosion.life -= explosion.decay;
        explosion.vx *= 0.98;
        explosion.vy *= 0.98;
        
        if (explosion.life <= 0) {
            explosions.splice(i, 1);
        }
    }
}

// Create confetti effect
function createConfetti() {
    for (let i = 0; i < 100; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: -10,
            vx: (Math.random() - 0.5) * 8,
            vy: Math.random() * 3 + 2,
            life: 1.0,
            decay: 0.005,
            size: Math.random() * 6 + 3,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
        });
    }
}

// Update confetti
function updateConfetti() {
    for (let i = confetti.length - 1; i >= 0; i--) {
        const piece = confetti[i];
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.vy += 0.1; // Gravity
        piece.life -= piece.decay;
        piece.rotation += piece.rotationSpeed;
        
        if (piece.life <= 0 || piece.y > canvas.height + 20) {
            confetti.splice(i, 1);
        }
    }
}

// Generate asteroids based on difficulty
function generateAsteroids() {
    asteroids = [];
    
    let asteroidCount = 0;
    switch (gameState.difficulty) {
        case 'easy':
            asteroidCount = 0;
            break;
        case 'medium':
            asteroidCount = 5;
            break;
        case 'hard':
            asteroidCount = 15;
            break;
    }
    
    for (let i = 0; i < asteroidCount; i++) {
        asteroids.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2
        });
    }
}

// Update rocket physics with realistic orbital mechanics
function updateRocket() {
    if (rocket.isLaunched) {
        // Apply realistic gravitational force towards Earth
        const dx = earth.x - rocket.x;
        const dy = earth.y - rocket.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only apply gravity if rocket is outside Earth's surface
        if (distance > EARTH_RADIUS) {
            // Realistic orbital gravity from Earth's surface
            const force = GRAVITY_CONSTANT / (distance * distance);
            rocket.vx += (dx / distance) * force;
            rocket.vy += (dy / distance) * force;
        } else {
            // If rocket is inside Earth, push it out to surface
            const angle = Math.atan2(dy, dx);
            rocket.x = earth.x + Math.cos(angle) * EARTH_RADIUS;
            rocket.y = earth.y + Math.sin(angle) * EARTH_RADIUS;
            // Stop the rocket if it hits Earth
            rocket.vx = 0;
            rocket.vy = 0;
            rocket.isLaunched = false;
            gameState.isLaunched = false;
            showMessage("💥 Rocket crashed into Earth!", "#ff6b6b");
            setTimeout(() => {
                resetGame();
            }, 2000);
            return;
        }
        
        // Update position
        rocket.x += rocket.vx;
        rocket.y += rocket.vy;
    }
    
    // Add to trail
    rocket.trail.push({ x: rocket.x, y: rocket.y });
    if (rocket.trail.length > TRAIL_LENGTH) {
        rocket.trail.shift();
    }
    
    // Check if rocket is off screen (smaller bounds)
    if (rocket.y > canvas.height || rocket.x < 0 || rocket.x > canvas.width) {
        if (!gameState.gameWon) {
            setTimeout(() => {
                showMessage("Missed! Try again!", "#ff6b6b");
                document.getElementById('retryBtn').style.display = 'inline-block';
            }, 1000);
        }
    }
}

// Check for collisions
function checkCollisions() {
    if (!rocket.isLaunched) return;
    
    // Check moon collision
    const dx = rocket.x - moon.x;
    const dy = rocket.y - moon.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < MOON_RADIUS + ROCKET_SIZE) {
        gameWon();
    }
    
    // Check asteroid collisions
    for (let asteroid of asteroids) {
        const dx = rocket.x - asteroid.x;
        const dy = rocket.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < ASTEROID_RADIUS + ROCKET_SIZE) {
            gameLost();
            return;
        }
    }
}

// Handle game win
function gameWon() {
    gameState.gameWon = true;
    gameState.score += 100;
    gameState.attempts++;
    updateScore();
    
    // Create confetti and land rocket on moon
    createConfetti();
    rocketLanded = true;
    
    showMessage("🎉 SUCCESS! You hit the moon!", "#00ff00");
    showRandomFact();
    
    setTimeout(() => {
        resetGame();
    }, 5000);
}

// Handle game loss (asteroid collision)
function gameLost() {
    gameState.attempts++;
    updateScore();
    
    // Create explosion at rocket position
    createExplosion(rocket.x, rocket.y);
    
    showMessage("💥 CRASH! Asteroid collision!", "#ff6b6b");
    
    setTimeout(() => {
        resetGame();
    }, 2000);
}

// Render everything
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars background
    drawStars();
    
    // Draw Earth
    drawEarth();
    
    // Draw asteroids
    drawAsteroids();
    
    // Draw moon
    drawMoon();
    
    // Draw rocket (unless landed on moon)
    if (!rocketLanded) {
        drawRocket();
    }
    
    // Draw visual effects
    drawExplosions();
    drawConfetti();
    
    // Draw landed rocket on moon
    if (rocketLanded) {
        drawLandedRocket();
    }
    
    // Draw trajectory preview
    if (gameState.isDragging && !rocket.isLaunched) {
        drawTrajectory();
    }
}

// Draw stars
function drawStars() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 37) % canvas.width;
        const y = (i * 73) % canvas.height;
        const size = Math.sin(Date.now() * 0.001 + i) * 0.5 + 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw Earth
function drawEarth() {
    // Earth glow
    const gradient = ctx.createRadialGradient(earth.x, earth.y, 0, earth.x, earth.y, EARTH_RADIUS + 15);
    gradient.addColorStop(0, 'rgba(0, 150, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(earth.x, earth.y, EARTH_RADIUS + 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Earth
    ctx.fillStyle = '#0066cc';
    ctx.beginPath();
    ctx.arc(earth.x, earth.y, EARTH_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // Earth continents
    ctx.fillStyle = '#00aa44';
    ctx.beginPath();
    ctx.arc(earth.x - 10, earth.y - 5, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(earth.x + 8, earth.y + 3, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Earth border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(earth.x, earth.y, EARTH_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
}

// Draw asteroids
function drawAsteroids() {
    ctx.fillStyle = '#8B4513';
    for (let asteroid of asteroids) {
        ctx.beginPath();
        ctx.arc(asteroid.x, asteroid.y, ASTEROID_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
        // Asteroid details
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(asteroid.x - 2, asteroid.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(asteroid.x + 3, asteroid.y + 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B4513';
    }
}

// Draw moon
function drawMoon() {
    // Moon glow
    const gradient = ctx.createRadialGradient(moon.x, moon.y, 0, moon.x, moon.y, MOON_RADIUS + 15);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, MOON_RADIUS + 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Moon
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, MOON_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // Moon craters
    ctx.fillStyle = '#d0d0d0';
    ctx.beginPath();
    ctx.arc(moon.x - 8, moon.y - 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moon.x + 10, moon.y + 5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moon.x - 5, moon.y + 12, 2.5, 0, Math.PI * 2);
    ctx.fill();
}

// Draw rocket
function drawRocket() {
    // Draw trail
    if (rocket.trail.length > 1) {
        ctx.strokeStyle = gameState.upgrades.ionEngine ? '#00ffff' : '#ffa500';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rocket.trail[0].x, rocket.trail[0].y);
        
        for (let i = 1; i < rocket.trail.length; i++) {
            const alpha = i / rocket.trail.length;
            ctx.strokeStyle = gameState.upgrades.ionEngine ? 
                `rgba(0, 255, 255, ${alpha})` : 
                `rgba(255, 165, 0, ${alpha})`;
            ctx.lineTo(rocket.trail[i].x, rocket.trail[i].y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(rocket.trail[i].x, rocket.trail[i].y);
        }
    }
    
    // Draw rocket
    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    
    // Calculate rotation based on velocity
    const angle = Math.atan2(rocket.vy, rocket.vx);
    ctx.rotate(angle);
    
    // Rocket body
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(-ROCKET_SIZE, -ROCKET_SIZE, ROCKET_SIZE * 2, ROCKET_SIZE * 2);
    
    // Rocket tip
    ctx.fillStyle = '#ff6666';
    ctx.beginPath();
    ctx.moveTo(ROCKET_SIZE, 0);
    ctx.lineTo(ROCKET_SIZE + 8, -4);
    ctx.lineTo(ROCKET_SIZE + 8, 4);
    ctx.closePath();
    ctx.fill();
    
    // Engine flame
    if (rocket.isLaunched) {
        ctx.fillStyle = gameState.upgrades.ionEngine ? '#00ffff' : '#ffa500';
        ctx.beginPath();
        ctx.moveTo(-ROCKET_SIZE, 0);
        ctx.lineTo(-ROCKET_SIZE - 12, -6);
        ctx.lineTo(-ROCKET_SIZE - 8, 0);
        ctx.lineTo(-ROCKET_SIZE - 12, 6);
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.restore();
}

// Draw trajectory preview
function drawTrajectory() {
    // Calculate velocity from launch point to mouse
    const dx = mouse.x - rocket.launchPoint.x;
    const dy = mouse.y - rocket.launchPoint.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(Math.hypot(dx, dy), 100);
    const speed = distance * 0.1;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Draw trajectory points with realistic orbital mechanics
    let x = rocket.launchPoint.x;
    let y = rocket.launchPoint.y;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    for (let i = 0; i < 300; i++) {
        // Apply gravitational force BEFORE updating position
        const dxToEarth = earth.x - x;
        const dyToEarth = earth.y - y;
        const distanceToEarth = Math.sqrt(dxToEarth * dxToEarth + dyToEarth * dyToEarth);
        
        // Only apply gravity if trajectory is outside Earth's surface
        if (distanceToEarth > EARTH_RADIUS) {
            // Use realistic orbital gravity from Earth's surface
            const force = GRAVITY_CONSTANT / (distanceToEarth * distanceToEarth);
            vx += (dxToEarth / distanceToEarth) * force;
            vy += (dyToEarth / distanceToEarth) * force;
        } else {
            // If trajectory would go inside Earth, stop it
            break;
        }
        
        x += vx;
        y += vy;
        
        ctx.lineTo(x, y);
        
        // Stop if trajectory goes off screen (smaller bounds)
        if (y > canvas.height || x < 0 || x > canvas.width) break;
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
}

// Draw explosions
function drawExplosions() {
    for (let explosion of explosions) {
        ctx.save();
        ctx.globalAlpha = explosion.life;
        ctx.fillStyle = explosion.color;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Draw confetti
function drawConfetti() {
    for (let piece of confetti) {
        ctx.save();
        ctx.globalAlpha = piece.life;
        ctx.fillStyle = piece.color;
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rotation * Math.PI / 180);
        ctx.fillRect(-piece.size/2, -piece.size/2, piece.size, piece.size);
        ctx.restore();
    }
}

// Draw landed rocket on moon
function drawLandedRocket() {
    // Draw rocket on moon surface
    ctx.save();
    ctx.translate(moon.x, moon.y + MOON_RADIUS - 5);
    
    // Rocket body
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(-ROCKET_SIZE, -ROCKET_SIZE, ROCKET_SIZE * 2, ROCKET_SIZE * 2);
    
    // Rocket tip
    ctx.fillStyle = '#ff6666';
    ctx.beginPath();
    ctx.moveTo(ROCKET_SIZE, 0);
    ctx.lineTo(ROCKET_SIZE + 8, -4);
    ctx.lineTo(ROCKET_SIZE + 8, 4);
    ctx.closePath();
    ctx.fill();
    
    // Landing gear
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-ROCKET_SIZE - 5, ROCKET_SIZE);
    ctx.lineTo(-ROCKET_SIZE - 10, ROCKET_SIZE + 8);
    ctx.moveTo(ROCKET_SIZE + 5, ROCKET_SIZE);
    ctx.lineTo(ROCKET_SIZE + 10, ROCKET_SIZE + 8);
    ctx.stroke();
    
    ctx.restore();
}

// Mouse event handlers
function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    
    // Check if clicking on Earth
    const dx = mouse.x - earth.x;
    const dy = mouse.y - earth.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < EARTH_RADIUS && !rocket.isLaunched) {
        // Set launch point on Earth surface
        const angle = Math.atan2(dy, dx);
        rocket.launchPoint.x = earth.x + Math.cos(angle) * EARTH_RADIUS;
        rocket.launchPoint.y = earth.y + Math.sin(angle) * EARTH_RADIUS;
        
        // Position rocket at launch point
        rocket.x = rocket.launchPoint.x;
        rocket.y = rocket.launchPoint.y;
        
        gameState.isDragging = true;
        mouse.isDown = true;
    }
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
}

function handleMouseUp(e) {
    if (gameState.isDragging && !rocket.isLaunched) {
        launchRocket();
    }
    gameState.isDragging = false;
    mouse.isDown = false;
}

// Launch rocket
function launchRocket() {
    // Calculate velocity from launch point to mouse
    const dx = mouse.x - rocket.launchPoint.x;
    const dy = mouse.y - rocket.launchPoint.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(Math.hypot(dx, dy), 100);
    const speed = distance * 0.1; // Realistic orbital speed
    
    rocket.vx = Math.cos(angle) * speed;
    rocket.vy = Math.sin(angle) * speed;
    rocket.isLaunched = true;
    gameState.isLaunched = true;
    gameState.attempts++;
    
    showMessage("🚀 Rocket launched!", "#ffff00");
    updateScore();
}

// Reset rocket
function resetRocket() {
    rocket.x = earth.x;
    rocket.y = earth.y - earth.r - 10; // Just above Earth
    rocket.launchPoint.x = earth.x;
    rocket.launchPoint.y = earth.y - earth.r - 10;
    rocket.vx = 0;
    rocket.vy = 0;
    rocket.isLaunched = false;
    rocket.isOrbiting = false;
    rocket.trail = [];
    gameState.isLaunched = false;
    gameState.gameWon = false;
    gameState.isDragging = false;
    rocketLanded = false;
    
    // Clear visual effects
    explosions = [];
    confetti = [];
    
    document.getElementById('retryBtn').style.display = 'none';
    showMessage("Click anywhere on Earth to choose launch point, then drag to aim!", "#fff");
}

// Reset game
function resetGame() {
    resetRocket();
    randomizeMoon();
}

// Randomize moon position
function randomizeMoon() {
    // Moon orbits around Earth center
    moon.orbitCenter.x = earth.x;
    moon.orbitCenter.y = earth.y;
    moon.orbitRadius = 250;
    moon.orbitSpeed = 0.005; // Very slow
    moon.orbitAngle = Math.random() * Math.PI * 2;
}

// Show message
function showMessage(text, color = "#fff") {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.style.color = color;
}

// Show random fact
function showRandomFact() {
    const fact = document.getElementById('fact');
    const randomFact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
    fact.textContent = randomFact;
    fact.style.display = 'block';
    
    setTimeout(() => {
        fact.style.display = 'none';
    }, 5000);
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('attempts').textContent = gameState.attempts;
}

// Change difficulty
function changeDifficulty() {
    const difficultySelect = document.getElementById('difficultySelect');
    gameState.difficulty = difficultySelect.value;
    generateAsteroids();
    resetGame();
}

// Toggle upgrades
function toggleUpgrade(upgrade) {
    const btn = document.getElementById(upgrade);
    gameState.upgrades[upgrade] = !gameState.upgrades[upgrade];
    
    if (gameState.upgrades[upgrade]) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
}

// Event listeners
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);

// Touch events for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleMouseUp();
});

// Initialize game
window.addEventListener('load', initGame); 