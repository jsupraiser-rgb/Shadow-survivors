// =====================================================
// Shadow Survivors - Level 1: Dust of Champions
// Kael bare-hand combat + Void Leeches
// =====================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  const c = document.getElementById('game-container');
  canvas.width = c.clientWidth;
  canvas.height = c.clientHeight;
}
window.addEventListener('resize', resize);
resize();

// ---------- STATE ----------
let gameRunning = false;
let kills = 0;
let souls = 0;
let cameraX = 0;
let levelComplete = false;

// ---------- PLAYER (Kael) ----------
const player = {
  x: 120, y: 0, w: 30, h: 44,
  vx: 0, vy: 0,
  speed: 4.4,
  jumpForce: -11.8,
  doubleJumpForce: -10.5,
  onGround: false,
  jumpsLeft: 2,
  facing: 1,
  hp: 100, maxHp: 100,
  invuln: 0,
  // Combat
  attacking: false,
  attackTimer: 0,
  attackType: 0,       // 1=Jab, 2=Cross, 3=SpinKick, 4=Heavy
  comboCount: 0,
  comboTimer: 0,
  lastAttackTime: 0,
  _jumpHeld: false
};

// ---------- COMBO DATA (from design) ----------
const COMBO_WINDOW = 55;
const ATTACKS = {
  jab:      { damage: 8,  startup: 4,  active: 3,  recovery: 8,  hitstun: 12, range: 38, knockback: 2.2 },
  cross:    { damage: 14, startup: 6,  active: 4,  recovery: 12, hitstun: 16, range: 46, knockback: 4.5 },
  spinKick: { damage: 22, startup: 8,  active: 5,  recovery: 18, hitstun: 22, range: 54, knockback: 7.0 },
  heavy:    { damage: 26, startup: 14, active: 5,  recovery: 22, hitstun: 18, range: 48, knockback: 8.5 }
};

function getComboMultiplier() {
  if (player.comboCount >= 3) return 1.35;
  if (player.comboCount >= 2) return 1.15;
  return 1.0;
}

function updateComboUI() {
  const counter = document.getElementById('combo-counter');
  const num = document.getElementById('combo-num');
  const multEl = document.getElementById('combo-mult');
  if (!counter || !num) return;
  if (player.comboCount >= 2) {
    counter.style.display = 'block';
    num.textContent = player.comboCount;
    const m = getComboMultiplier();
    if (multEl) multEl.textContent = m > 1 ? `x${m.toFixed(2)}` : '';
  } else {
    counter.style.display = 'none';
    if (multEl) multEl.textContent = '';
  }
}

function registerAttack(type) {
  const now = performance.now();
  if (now - player.lastAttackTime > 750) player.comboCount = 0;

  player.lastAttackTime = now;
  player.attacking = true;
  player.attackType = type;

  if (type === 4) { // Heavy
    player.attackTimer = ATTACKS.heavy.startup + ATTACKS.heavy.active + 5;
    player.comboCount = 0;
  } else {
    player.comboCount = Math.min(player.comboCount + 1, 3);
    player.comboTimer = COMBO_WINDOW;
    const atk = type === 1 ? ATTACKS.jab : type === 2 ? ATTACKS.cross : ATTACKS.spinKick;
    player.attackTimer = atk.startup + atk.active + 4;
  }

  updateComboUI();

  // Floating text
  const comboEl = document.getElementById('combo-display');
  if (player.comboCount === 3 && type === 3) {
    comboEl.textContent = '3-HIT COMBO!';
    comboEl.style.opacity = 1;
    setTimeout(() => comboEl.style.opacity = 0, 900);
  } else if (type === 4) {
    comboEl.textContent = 'HEAVY FIST!';
    comboEl.style.opacity = 1;
    setTimeout(() => comboEl.style.opacity = 0, 700);
  }
}

function getCurrentAttackDamage() {
  let base = 8;
  if (player.attackType === 1) base = ATTACKS.jab.damage;
  else if (player.attackType === 2) base = ATTACKS.cross.damage;
  else if (player.attackType === 3) base = ATTACKS.spinKick.damage;
  else if (player.attackType === 4) base = ATTACKS.heavy.damage;
  return Math.round(base * getComboMultiplier());
}

// ---------- LEVEL 1 LAYOUT ----------
const LEVEL_WIDTH = 2000;
const platforms = [
  { x: 0, y: 430, w: 2000, h: 50 },          // main ground
  { x: 420, y: 360, w: 120, h: 18 },
  { x: 620, y: 310, w: 100, h: 18 },
  { x: 980, y: 370, w: 140, h: 18 },
  { x: 1250, y: 320, w: 110, h: 18 },
  { x: 1550, y: 360, w: 130, h: 18 },
  { x: 1780, y: 390, w: 160, h: 20 }         // exit platform
];

const exitGate = { x: 1860, y: 320, w: 50, h: 70 };

// ---------- ENEMIES (Void Leeches) ----------
let enemies = [];
let particles = [];
let spawnPlan = [];

function createLeech(x, y) {
  return {
    x, y, w: 28, h: 22,
    hp: 28, maxHp: 28,
    speed: 1.15 + Math.random() * 0.3,
    facing: -1,
    state: 'crawl',      // crawl | lunge | hurt | dead
    lungeTimer: 0,
    hurtTimer: 0,
    dead: false
  };
}

function setupLevel1() {
  enemies = [];
  particles = [];
  kills = 0;
  souls = 0;
  levelComplete = false;
  cameraX = 0;

  player.x = 100;
  player.y = 350;
  player.vx = 0;
  player.vy = 0;
  player.hp = 100;
  player.jumpsLeft = 2;
  player.comboCount = 0;
  player.attacking = false;
  player.invuln = 0;

  // Zone spawns
  // Zone 1
  enemies.push(createLeech(380, 400));
  enemies.push(createLeech(460, 400));

  // Zone 2
  enemies.push(createLeech(700, 400));
  enemies.push(createLeech(780, 280));
  enemies.push(createLeech(860, 400));

  // Zone 3
  enemies.push(createLeech(1100, 400));
  enemies.push(createLeech(1180, 400));
  enemies.push(createLeech(1300, 290));
  enemies.push(createLeech(1380, 400));

  // Zone 4 final wave
  enemies.push(createLeech(1600, 400));
  enemies.push(createLeech(1680, 400));
  enemies.push(createLeech(1750, 400));
  enemies.push(createLeech(1620, 330));
  enemies.push(createLeech(1700, 330));

  document.getElementById('hp').textContent = 100;
  document.getElementById('kills').textContent = 0;
  document.getElementById('souls').textContent = 0;
  updateComboUI();
}

// ---------- PARTICLES ----------
function spawnParticles(x, y, color, n = 8, type = 'hit') {
  for (let i = 0; i < n; i++) {
    let vx, vy, size, life, gravity = 0;
    if (type === 'hit') {
      vx = (Math.random() - 0.5) * 9;
      vy = (Math.random() - 0.5) * 9;
      size = 2.5 + Math.random() * 3.5;
      life = 12 + Math.random() * 10;
    } else if (type === 'death') {
      vx = (Math.random() - 0.5) * 11;
      vy = (Math.random() - 0.7) * 9;
      size = 3.5 + Math.random() * 4;
      life = 18 + Math.random() * 14;
      gravity = 0.18;
    } else if (type === 'slash') {
      vx = (Math.random() - 0.5) * 5 + player.facing * 5;
      vy = (Math.random() - 0.5) * 4;
      size = 2 + Math.random() * 2.5;
      life = 8 + Math.random() * 7;
    } else {
      vx = (Math.random() - 0.5) * 6;
      vy = (Math.random() - 0.5) * 6;
      size = 2.5 + Math.random() * 3;
      life = 12 + Math.random() * 10;
    }
    particles.push({ x, y, vx, vy, life, maxLife: life, color, size, gravity });
  }
}

// ---------- INPUT ----------
const keys = {};
let joyDX = 0, joyActive = false;

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (['z', 'j', 'k'].includes(e.key.toLowerCase())) tryAttack();
  if (e.key.toLowerCase() === 'x') tryHeavy();
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function setupJoystick() {
  const area = document.getElementById('joystick-area');
  const knob = document.getElementById('joystick-knob');
  const base = document.getElementById('joystick-base');
  let cx, cy;

  function start(e) {
    e.preventDefault();
    joyActive = true;
    const r = base.getBoundingClientRect();
    cx = r.left + r.width / 2;
    cy = r.top + r.height / 2;
  }
  function move(e) {
    if (!joyActive) return;
    e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    let dx = t.clientX - cx;
    let dy = t.clientY - cy;
    const max = 32;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    joyDX = dx / max;
    knob.style.transform = `translate(${dx}px,${dy}px)`;
  }
  function end() {
    joyActive = false;
    joyDX = 0;
    knob.style.transform = 'translate(0,0)';
  }
  area.addEventListener('touchstart', start, { passive: false });
  area.addEventListener('touchmove', move, { passive: false });
  area.addEventListener('touchend', end);
  area.addEventListener('mousedown', start);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
}

function tryAttack() {
  if (player.attackTimer > 6) return;

  // Determine next step in combo
  let type = 1; // Jab
  if (player.comboCount === 1 && player.comboTimer > 0) type = 2; // Cross
  else if (player.comboCount === 2 && player.comboTimer > 0) type = 3; // Spin Kick

  registerAttack(type);
}

function tryHeavy() {
  if (player.attackTimer > 4) return;
  registerAttack(4);
}

function tryJump() {
  if (player.jumpsLeft <= 0) return;
  if (player.onGround) {
    player.vy = player.jumpForce;
    player.jumpsLeft = 1;
    spawnParticles(player.x + player.w / 2, player.y + player.h, '#8888aa', 5, 'hit');
  } else {
    player.vy = player.doubleJumpForce;
    player.jumpsLeft = 0;
    spawnParticles(player.x + player.w / 2, player.y + player.h, '#a070ff', 7, 'slash');
  }
  player.onGround = false;
}

document.getElementById('attack-btn').addEventListener('touchstart', e => { e.preventDefault(); tryAttack(); });
document.getElementById('attack-btn').addEventListener('mousedown', tryAttack);
document.getElementById('jump-btn').addEventListener('touchstart', e => { e.preventDefault(); tryJump(); });
document.getElementById('jump-btn').addEventListener('mousedown', tryJump);
document.getElementById('special-btn').addEventListener('touchstart', e => { e.preventDefault(); tryHeavy(); });
document.getElementById('special-btn').addEventListener('mousedown', tryHeavy);

// ---------- UPDATE ----------
function update() {
  if (!gameRunning || levelComplete) return;

  // Movement
  let move = 0;
  if (keys['a'] || keys['arrowleft']) move = -1;
  if (keys['d'] || keys['arrowright']) move = 1;
  if (joyActive) move = joyDX;

  if (Math.abs(move) > 0.15) {
    player.vx = move * player.speed;
    player.facing = move > 0 ? 1 : -1;
  } else {
    player.vx *= 0.78;
  }

  // Jump (keyboard)
  if (keys['w'] || keys['arrowup'] || keys[' ']) {
    if (!player._jumpHeld) {
      tryJump();
      player._jumpHeld = true;
    }
  } else {
    player._jumpHeld = false;
  }

  // Gravity
  player.vy += 0.55;
  if (player.vy > 14) player.vy = 14;

  player.x += player.vx;
  player.y += player.vy;

  // Ground collision
  player.onGround = false;
  for (const p of platforms) {
    if (player.x + player.w > p.x && player.x < p.x + p.w &&
        player.y + player.h > p.y && player.y + player.h < p.y + 22 &&
        player.vy >= 0) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
      player.jumpsLeft = 2;
    }
  }

  // Bounds
  if (player.x < 0) player.x = 0;
  if (player.x > LEVEL_WIDTH - player.w) player.x = LEVEL_WIDTH - player.w;
  if (player.y > canvas.height + 80) {
    player.hp -= 20;
    player.x = 120;
    player.y = 300;
    player.vy = 0;
    if (player.hp <= 0) return gameOver();
  }

  // Timers
  if (player.attackTimer > 0) player.attackTimer--;
  else player.attacking = false;

  if (player.comboTimer > 0) {
    player.comboTimer--;
    if (player.comboTimer <= 0) {
      player.comboCount = 0;
      updateComboUI();
    }
  }
  if (player.invuln > 0) player.invuln--;

  // Camera
  cameraX = player.x - canvas.width * 0.35;
  if (cameraX < 0) cameraX = 0;
  if (cameraX > LEVEL_WIDTH - canvas.width) cameraX = Math.max(0, LEVEL_WIDTH - canvas.width);

  // ----- Enemies -----
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.dead) continue;

    // AI
    const dx = player.x - e.x;
    e.facing = dx > 0 ? 1 : -1;

    if (e.hurtTimer > 0) {
      e.hurtTimer--;
    } else {
      e.x += e.facing * e.speed;

      // Simple lunge
      if (Math.abs(dx) < 70 && Math.random() < 0.008) {
        e.x += e.facing * 18;
      }
    }

    // Gravity for leeches
    e.y += 5;
    for (const p of platforms) {
      if (e.x + e.w > p.x && e.x < p.x + p.w &&
          e.y + e.h > p.y && e.y + e.h < p.y + 18) {
        e.y = p.y - e.h;
      }
    }

    // Player attack hit
    if (player.attacking && player.attackTimer > 4) {
      const atk = player.attackType === 1 ? ATTACKS.jab :
                  player.attackType === 2 ? ATTACKS.cross :
                  player.attackType === 3 ? ATTACKS.spinKick : ATTACKS.heavy;
      const sx = player.facing > 0 ? player.x + player.w - 8 : player.x - atk.range + 8;
      const sw = atk.range;

      if (sx < e.x + e.w && sx + sw > e.x &&
          player.y < e.y + e.h && player.y + player.h > e.y) {
        const dmg = getCurrentAttackDamage();
        e.hp -= dmg;
        e.hurtTimer = 12;
        e.x += player.facing * atk.knockback * 3;

        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#c9a0ff', 6, 'hit');
        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#e0d0ff', 4, 'slash');

        if (e.hp <= 0) {
          e.dead = true;
          kills++;
          const gain = 4 + (player.comboCount >= 3 ? 2 : 0);
          souls += gain;
          spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#a070ff', 14, 'death');
          document.getElementById('kills').textContent = kills;
          document.getElementById('souls').textContent = souls;
        }
      }
    }

    // Touch damage
    if (player.invuln <= 0 &&
        player.x < e.x + e.w && player.x + player.w > e.x &&
        player.y < e.y + e.h && player.y + player.h > e.y) {
      player.hp -= 9;
      player.invuln = 35;
      spawnParticles(player.x + 15, player.y + 22, '#ff5555', 8, 'hit');
      if (player.hp <= 0) return gameOver();
    }
  }
  enemies = enemies.filter(e => !e.dead);

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.gravity) p.vy += p.gravity;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Exit check
  if (player.x + player.w > exitGate.x && player.x < exitGate.x + exitGate.w &&
      player.y + player.h > exitGate.y && player.y < exitGate.y + exitGate.h) {
    levelComplete = true;
    gameRunning = false;
    const msg = document.getElementById('message');
    msg.style.display = 'flex';
    msg.innerHTML = `
      <h1>Level 1 Complete</h1>
      <p>Dust of Champions cleared</p>
      <p>Kills: ${kills} | Souls: ${souls}</p>
      <p style="margin-top:8px;color:#aaa;font-size:13px">The arena is collapsing… keep moving!</p>
      <button id="start-btn">Play Again</button>
    `;
    document.getElementById('start-btn').onclick = startGame;
  }

  document.getElementById('hp').textContent = Math.max(0, Math.floor(player.hp));
}

// ---------- DRAW ----------
function draw() {
  // Background
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Simple distant ruins + purple sky glow
  ctx.fillStyle = '#12121f';
  for (let i = 0; i < 7; i++) {
    const bx = ((i * 220) - cameraX * 0.2) % (canvas.width + 250) - 120;
    ctx.fillRect(bx, 40 + (i % 3) * 35, 140, 160);
  }

  // Purple rift hint
  ctx.fillStyle = 'rgba(120, 40, 180, 0.12)';
  ctx.beginPath();
  ctx.arc(canvas.width * 0.7, 60, 90, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(-cameraX, 0);

  // Platforms
  platforms.forEach(p => {
    ctx.fillStyle = '#1c1c2c';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#2a2a40';
    ctx.fillRect(p.x, p.y, p.w, 5);
    // cracks
    ctx.strokeStyle = 'rgba(140, 60, 200, 0.35)';
    ctx.beginPath();
    ctx.moveTo(p.x + 10, p.y + 2);
    ctx.lineTo(p.x + p.w - 10, p.y + 2);
    ctx.stroke();
  });

  // Exit gate
  ctx.fillStyle = '#2a1a4a';
  ctx.fillRect(exitGate.x, exitGate.y, exitGate.w, exitGate.h);
  ctx.fillStyle = 'rgba(160, 80, 255, 0.5)';
  ctx.fillRect(exitGate.x + 8, exitGate.y + 10, 34, 50);
  ctx.fillStyle = '#c9a0ff';
  ctx.font = '12px sans-serif';
  ctx.fillText('EXIT', exitGate.x + 10, exitGate.y - 8);

  // Enemies – Void Leeches
  enemies.forEach(e => {
    // body
    ctx.fillStyle = e.hurtTimer > 0 ? '#aa66cc' : '#4a2060';
    ctx.beginPath();
    ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // eye
    ctx.fillStyle = '#cc66ff';
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2 + e.facing * 3, e.y + e.h / 2 - 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a0a20';
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2 + e.facing * 3, e.y + e.h / 2 - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // tentacles
    ctx.strokeStyle = '#6a3080';
    ctx.lineWidth = 2;
    for (let t = 0; t < 3; t++) {
      ctx.beginPath();
      ctx.moveTo(e.x + 6 + t * 7, e.y + e.h - 2);
      ctx.quadraticCurveTo(e.x + 4 + t * 7, e.y + e.h + 8, e.x + 2 + t * 8, e.y + e.h + 12);
      ctx.stroke();
    }
  });

  // Player – Kael
  ctx.save();
  if (player.invuln > 0 && Math.floor(player.invuln / 3) % 2 === 0) ctx.globalAlpha = 0.4;

  // body
  ctx.fillStyle = '#2a2a35';
  ctx.fillRect(player.x + 4, player.y + 14, 22, 30); // torso
  // head
  ctx.fillStyle = '#d4a88c';
  ctx.fillRect(player.x + 7, player.y, 16, 16);
  // hair
  ctx.fillStyle = '#1a1a22';
  ctx.fillRect(player.x + 5, player.y - 4, 20, 10);
  // eyes
  ctx.fillStyle = '#c070ff';
  ctx.fillRect(player.x + 9, player.y + 6, 4, 3);
  ctx.fillRect(player.x + 17, player.y + 6, 4, 3);
  // arms / energy
  ctx.fillStyle = '#c9a0ff';
  if (player.facing > 0) {
    ctx.fillRect(player.x + 24, player.y + 18, 8, 6);
  } else {
    ctx.fillRect(player.x - 2, player.y + 18, 8, 6);
  }

  // Attack visuals
  if (player.attacking && player.attackTimer > 3) {
    ctx.fillStyle = player.attackType === 3 ? '#ff66ff' :
                    player.attackType === 4 ? '#ffaa44' : '#e0d0ff';
    const sx = player.facing > 0 ? player.x + player.w : player.x - 42;
    const sh = player.attackType >= 3 ? 18 : 10;
    ctx.fillRect(sx, player.y + 14, 44, sh);
    // energy arc for spin kick
    if (player.attackType === 3) {
      ctx.strokeStyle = 'rgba(200, 120, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x + player.w / 2, player.y + 22, 40, 0, Math.PI * 1.2);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Particles
  particles.forEach(p => {
    const alpha = Math.max(0, p.life / (p.maxLife || 20));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, (p.size || 3) * alpha, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  ctx.restore();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function startGame() {
  document.getElementById('message').style.display = 'none';
  gameRunning = true;
  setupLevel1();
}

function gameOver() {
  gameRunning = false;
  const msg = document.getElementById('message');
  msg.style.display = 'flex';
  msg.innerHTML = `
    <h1>You Fell</h1>
    <p>Level 1 – Dust of Champions</p>
    <p>Kills: ${kills} | Souls: ${souls}</p>
    <button id="start-btn">Try Again</button>
  `;
  document.getElementById('start-btn').onclick = startGame;
}

setupJoystick();
document.getElementById('start-btn').onclick = startGame;
loop();
