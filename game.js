// Shadow Survivors - Hybrid of Swordigo + Zelda + Vampire Survivors + Dead Cells
// Simple HTML5 starter for GitHub testing

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Resize canvas
function resize() {
  const container = document.getElementById('game-container');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}
window.addEventListener('resize', resize);
resize();

// Game state
let gameRunning = false;
let gameTime = 0;
let kills = 0;
let souls = 0;

// Player
const player = {
  x: 0,
  y: 0,
  w: 28,
  h: 40,
  vx: 0,
  vy: 0,
  speed: 3.2,
  hp: 100,
  maxHp: 100,
  facing: 1,
  attacking: false,
  attackTimer: 0,
  dashTimer: 0,
  invuln: 0,
  color: '#a070ff'
};

// Enemies
let enemies = [];
let spawnTimer = 0;

// Particles
let particles = [];

// Input
const keys = {};
let joyActive = false;
let joyDX = 0;
let joyDY = 0;

// Joystick
const joystickArea = document.getElementById('joystick-area');
const knob = document.getElementById('joystick-knob');
const base = document.getElementById('joystick-base');

function setupJoystick() {
  let startX, startY;

  function handleStart(e) {
    e.preventDefault();
    joyActive = true;
    const touch = e.touches ? e.touches[0] : e;
    const rect = base.getBoundingClientRect();
    startX = rect.left + rect.width / 2;
    startY = rect.top + rect.height / 2;
  }

  function handleMove(e) {
    if (!joyActive) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    let dx = touch.clientX - startX;
    let dy = touch.clientY - startY;
    const max = 35;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > max) {
      dx = (dx / dist) * max;
      dy = (dy / dist) * max;
    }
    joyDX = dx / max;
    joyDY = dy / max;
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function handleEnd() {
    joyActive = false;
    joyDX = 0;
    joyDY = 0;
    knob.style.transform = 'translate(0, 0)';
  }

  joystickArea.addEventListener('touchstart', handleStart, {passive: false});
  joystickArea.addEventListener('touchmove', handleMove, {passive: false});
  joystickArea.addEventListener('touchend', handleEnd);
  joystickArea.addEventListener('mousedown', handleStart);
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);
}

// Buttons
document.getElementById('attack-btn').addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (player.attackTimer <= 0) {
    player.attacking = true;
    player.attackTimer = 20;
  }
});
document.getElementById('attack-btn').addEventListener('mousedown', () => {
  if (player.attackTimer <= 0) {
    player.attacking = true;
    player.attackTimer = 20;
  }
});

document.getElementById('dash-btn').addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (player.dashTimer <= 0) {
    player.vx = player.facing * 12;
    player.dashTimer = 40;
    player.invuln = 15;
  }
});
document.getElementById('dash-btn').addEventListener('mousedown', () => {
  if (player.dashTimer <= 0) {
    player.vx = player.facing * 12;
    player.dashTimer = 40;
    player.invuln = 15;
  }
});

// Keyboard support
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) { x = -30; y = Math.random() * canvas.height; }
  else if (side === 1) { x = canvas.width + 30; y = Math.random() * canvas.height; }
  else if (side === 2) { x = Math.random() * canvas.width; y = -30; }
  else { x = Math.random() * canvas.width; y = canvas.height + 30; }

  enemies.push({
    x, y,
    w: 24,
    h: 24,
    hp: 20 + Math.floor(gameTime / 20),
    speed: 1.1 + Math.random() * 0.6,
    color: '#c04040'
  });
}

function createParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 20 + Math.random() * 15,
      color
    });
  }
}

function update() {
  if (!gameRunning) return;

  gameTime++;
  document.getElementById('time').textContent = Math.floor(gameTime / 60);

  // Player movement
  let mx = 0, my = 0;
  if (keys['a'] || keys['arrowleft']) mx = -1;
  if (keys['d'] || keys['arrowright']) mx = 1;
  if (keys['w'] || keys['arrowup']) my = -1;
  if (keys['s'] || keys['arrowdown']) my = 1;

  if (joyActive) {
    mx = joyDX;
    my = joyDY;
  }

  if (mx !== 0 || my !== 0) {
    const len = Math.sqrt(mx*mx + my*my) || 1;
    player.vx = (mx / len) * player.speed;
    player.vy = (my / len) * player.speed;
    if (mx !== 0) player.facing = mx > 0 ? 1 : -1;
  } else {
    player.vx *= 0.8;
    player.vy *= 0.8;
  }

  if (player.dashTimer > 0) player.dashTimer--;
  if (player.attackTimer > 0) player.attackTimer--;
  if (player.invuln > 0) player.invuln--;

  player.x += player.vx;
  player.y += player.vy;

  // Keep player in bounds
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));

  // Spawn enemies (Vampire Survivors style)
  spawnTimer++;
  const spawnRate = Math.max(20, 80 - Math.floor(gameTime / 100));
  if (spawnTimer > spawnRate) {
    spawnTimer = 0;
    spawnEnemy();
    if (gameTime > 600) spawnEnemy(); // more enemies later
  }

  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dx = player.x + player.w/2 - (e.x + e.w/2);
    const dy = player.y + player.h/2 - (e.y + e.h/2);
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    e.x += (dx / dist) * e.speed;
    e.y += (dy / dist) * e.speed;

    // Collision with player
    if (player.invuln <= 0 &&
        player.x < e.x + e.w && player.x + player.w > e.x &&
        player.y < e.y + e.h && player.y + player.h > e.y) {
      player.hp -= 8;
      player.invuln = 30;
      createParticles(player.x + player.w/2, player.y + player.h/2, '#ff6060');
      if (player.hp <= 0) {
        gameOver();
        return;
      }
    }

    // Attack collision (simple sword arc)
    if (player.attacking && player.attackTimer > 10) {
      const swordX = player.facing > 0 ? player.x + player.w : player.x - 40;
      const swordW = 40;
      if (swordX < e.x + e.w && swordX + swordW > e.x &&
          player.y < e.y + e.h && player.y + player.h > e.y) {
        e.hp -= 25;
        createParticles(e.x + e.w/2, e.y + e.h/2, '#a070ff');
        if (e.hp <= 0) {
          kills++;
          souls += 3 + Math.floor(Math.random() * 4);
          createParticles(e.x + e.w/2, e.y + e.h/2, '#c0a0ff', 12);
          enemies.splice(i, 1);
          document.getElementById('kills').textContent = kills;
          document.getElementById('souls').textContent = souls;
        }
      }
    }
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Update UI
  document.getElementById('hp').textContent = Math.max(0, Math.floor(player.hp));
}

function draw() {
  ctx.fillStyle = '#0d0d14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Simple dark ground grid
  ctx.strokeStyle = '#1a1a28';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Player
  ctx.save();
  if (player.invuln > 0 && Math.floor(player.invuln / 3) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  // simple head
  ctx.fillStyle = '#c0a0ff';
  ctx.fillRect(player.x + 6, player.y - 8, 16, 12);

  // Sword when attacking
  if (player.attacking && player.attackTimer > 8) {
    ctx.fillStyle = '#e0d0ff';
    const sx = player.facing > 0 ? player.x + player.w : player.x - 36;
    ctx.fillRect(sx, player.y + 10, 36, 8);
  }
  ctx.restore();

  // Enemies
  enemies.forEach(e => {
    ctx.fillStyle = e.color;
    ctx.fillRect(e.x, e.y, e.w, e.h);
    // eyes
    ctx.fillStyle = '#ffaaaa';
    ctx.fillRect(e.x + 5, e.y + 6, 4, 4);
    ctx.fillRect(e.x + 15, e.y + 6, 4, 4);
  });

  // Particles
  particles.forEach(p => {
    ctx.globalAlpha = p.life / 30;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
  });
  ctx.globalAlpha = 1;
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  document.getElementById('message').style.display = 'none';
  gameRunning = true;
  player.x = canvas.width / 2 - 14;
  player.y = canvas.height / 2 - 20;
  player.hp = 100;
  kills = 0;
  souls = 0;
  gameTime = 0;
  enemies = [];
  particles = [];
  document.getElementById('hp').textContent = 100;
  document.getElementById('kills').textContent = 0;
  document.getElementById('souls').textContent = 0;
}

function gameOver() {
  gameRunning = false;
  const msg = document.getElementById('message');
  msg.style.display = 'block';
  msg.innerHTML = `
    <h2>You Fell</h2>
    <p>Survived ${Math.floor(gameTime/60)}s | Kills: ${kills} | Souls: ${souls}</p>
    <button id="start-btn">Try Again</button>
  `;
  document.getElementById('start-btn').onclick = startGame;
}

// Init
setupJoystick();
document.getElementById('message').style.display = 'block';
document.getElementById('start-btn').onclick = startGame;
gameLoop();
