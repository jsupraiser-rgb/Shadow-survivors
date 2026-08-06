// =====================================================
// Shadow Survivors - Full Side-Scroller
// Swordigo + Zelda + Vampire Survivors + Dead Cells hybrid
// 5 Levels • 2 Bosses • 3/5/7 Hit Combos
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

// ---------- GAME STATE ----------
let gameRunning = false;
let currentLevel = 0;
let kills = 0;
let souls = 0;
let cameraX = 0;

// ---------- PLAYER ----------
const player = {
  x: 80, y: 0, w: 28, h: 42,
  vx: 0, vy: 0,
  speed: 4.2,
  jumpForce: -11.5,
  doubleJumpForce: -10.2,
  onGround: false,
  jumpsLeft: 2,          // allows double jump
  facing: 1,
  hp: 100, maxHp: 100,
  invuln: 0,
  attacking: false,
  attackTimer: 0,
  comboCount: 0,
  comboTimer: 0,
  lastAttackTime: 0,
  weapon: 'sword'
};

// ---------- COMBO SYSTEM ----------
const COMBO_WINDOW = 50;

function updateComboUI() {
  const counter = document.getElementById('combo-counter');
  const num = document.getElementById('combo-num');
  const multEl = document.getElementById('combo-mult');
  if (!counter || !num) return;
  if (player.comboCount >= 2) {
    counter.style.display = 'block';
    num.textContent = player.comboCount;
    const m = getComboMultiplier();
    if (multEl) {
      multEl.textContent = m > 1 ? `x${m}` : '';
    }
  } else {
    counter.style.display = 'none';
    if (multEl) multEl.textContent = '';
  }
}

function registerAttack() {
  const now = performance.now();
  if (now - player.lastAttackTime > 700) {
    player.comboCount = 0;
  }
  player.lastAttackTime = now;
  player.comboCount++;
  player.comboTimer = COMBO_WINDOW;
  player.attacking = true;
  player.attackTimer = 18;

  updateComboUI();

  const comboEl = document.getElementById('combo-display');
  if (player.comboCount === 3) {
    comboEl.textContent = '3-HIT COMBO!';
    comboEl.style.opacity = 1;
    setTimeout(() => { comboEl.style.opacity = 0; }, 800);
  } else if (player.comboCount === 5) {
    comboEl.textContent = '5-HIT COMBO!';
    comboEl.style.opacity = 1;
    setTimeout(() => { comboEl.style.opacity = 0; }, 800);
  } else if (player.comboCount >= 7) {
    comboEl.textContent = '7-HIT SPECIAL!!!';
    comboEl.style.opacity = 1;
    player.comboCount = 7;
    setTimeout(() => { comboEl.style.opacity = 0; }, 900);
  }
}

function getComboMultiplier() {
  // Multiplier grows with combo count
  if (player.comboCount >= 7) return 2.5;
  if (player.comboCount >= 5) return 1.8;
  if (player.comboCount >= 3) return 1.4;
  if (player.comboCount >= 2) return 1.15;
  return 1.0;
}

function getAttackDamage() {
  let base = 15;
  if (player.weapon === 'gun') base = 36;
  else if (player.weapon === 'heavy') base = 46;

  // Apply combo multiplier
  const dmg = Math.round(base * getComboMultiplier());
  return dmg;
}

function getSoulReward(base) {
  // Higher combos give more souls
  return Math.round(base * getComboMultiplier());
}

// ---------- 5 LEVELS ----------
const levels = [
  {
    name: 'Level 1 – Shadow Gate',
    width: 2200,
    platforms: [
      {x:0, y:420, w:2200, h:40},
      {x:300, y:340, w:160, h:20},
      {x:550, y:280, w:140, h:20},
      {x:850, y:340, w:180, h:20},
      {x:1200, y:300, w:200, h:20},
      {x:1550, y:250, w:160, h:20},
      {x:1850, y:340, w:200, h:20}
    ],
    enemies: [
      {x:400, y:380, type:'skel'},
      {x:700, y:380, type:'skel'},
      {x:1000, y:380, type:'skel'},
      {x:1400, y:380, type:'beast'},
      {x:1700, y:380, type:'skel'}
    ],
    exitX: 2050
  },
  {
    name: 'Level 2 – Bone Corridor',
    width: 2400,
    platforms: [
      {x:0, y:420, w:2400, h:40},
      {x:200, y:350, w:120, h:20},
      {x:450, y:290, w:150, h:20},
      {x:750, y:350, w:100, h:20},
      {x:1000, y:280, w:180, h:20},
      {x:1300, y:340, w:140, h:20},
      {x:1600, y:260, w:160, h:20},
      {x:1950, y:320, w:200, h:20}
    ],
    enemies: [
      {x:350, y:380, type:'skel'},
      {x:600, y:380, type:'beast'},
      {x:900, y:380, type:'skel'},
      {x:1200, y:380, type:'skel'},
      {x:1500, y:380, type:'beast'},
      {x:1800, y:380, type:'skel'}
    ],
    exitX: 2250
  },
  {
    name: 'Level 3 – Blood Altar',
    width: 2000,
    platforms: [
      {x:0, y:420, w:2000, h:40},
      {x:250, y:340, w:180, h:20},
      {x:550, y:270, w:160, h:20},
      {x:900, y:340, w:200, h:20},
      {x:1300, y:280, w:180, h:20},
      {x:1650, y:350, w:150, h:20}
    ],
    enemies: [
      {x:400, y:380, type:'beast'},
      {x:700, y:380, type:'skel'},
      {x:1100, y:380, type:'beast'},
      {x:1450, y:380, type:'skel'},
      {x:1750, y:380, type:'beast'}
    ],
    exitX: 1850
  },
  {
    name: 'BOSS – Wraith Lord',
    width: 1100,
    platforms: [
      {x:0, y:420, w:1100, h:40},
      {x:150, y:320, w:120, h:18},
      {x:450, y:280, w:140, h:18},
      {x:780, y:320, w:120, h:18}
    ],
    enemies: [],
    isBoss: true,
    boss: { name:'Wraith Lord', hp:320, x:700, y:360, w:50, h:60 },
    exitX: 1000
  },
  {
    name: 'Level 5 – Throne of Night',
    width: 2600,
    platforms: [
      {x:0, y:420, w:2600, h:40},
      {x:200, y:350, w:140, h:20},
      {x:500, y:290, w:160, h:20},
      {x:850, y:340, w:130, h:20},
      {x:1150, y:260, w:180, h:20},
      {x:1500, y:320, w:150, h:20},
      {x:1850, y:250, w:170, h:20},
      {x:2200, y:330, w:200, h:20}
    ],
    enemies: [
      {x:400, y:380, type:'beast'},
      {x:700, y:380, type:'skel'},
      {x:1000, y:380, type:'beast'},
      {x:1300, y:380, type:'skel'},
      {x:1600, y:380, type:'beast'},
      {x:2000, y:380, type:'skel'}
    ],
    isBoss: true,
    boss: { name:'Shadow Emperor', hp:520, x:2300, y:350, w:60, h:70 },
    exitX: 2500
  }
];

let platforms = [];
let enemies = [];
let boss = null;
let particles = [];
let projectiles = [];

// ---------- INPUT ----------
const keys = {};
let joyDX = 0, joyDY = 0, joyActive = false;

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (['z', 'j'].includes(e.key.toLowerCase())) tryAttack();
  if (['x', 'k'].includes(e.key.toLowerCase())) trySpecial();
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
    const d = Math.sqrt(dx*dx + dy*dy) || 1;
    if (d > max) { dx = dx/d*max; dy = dy/d*max; }
    joyDX = dx / max;
    joyDY = dy / max;
    knob.style.transform = `translate(${dx}px,${dy}px)`;
  }
  function end() {
    joyActive = false;
    joyDX = joyDY = 0;
    knob.style.transform = 'translate(0,0)';
  }
  area.addEventListener('touchstart', start, {passive:false});
  area.addEventListener('touchmove', move, {passive:false});
  area.addEventListener('touchend', end);
  area.addEventListener('mousedown', start);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
}

function tryAttack() {
  if (player.attackTimer > 6) return;
  registerAttack();
}
function trySpecial() {
  if (player.weapon === 'gun') {
    projectiles.push({
      x: player.facing > 0 ? player.x + player.w : player.x - 10,
      y: player.y + 18,
      vx: player.facing * 12,
      life: 55,
      dmg: 42
    });
  } else {
    player.comboCount = Math.max(player.comboCount, 5);
    registerAttack();
    player.attackTimer = 26;
  }
}
function tryJump() {
  // Can jump if we still have jumps left
  if (player.jumpsLeft <= 0) return;

  if (player.onGround) {
    // First jump from ground
    player.vy = player.jumpForce;
    player.jumpsLeft = 1;          // leave 1 for the air jump
    spawnWeaponParticles(player.x + player.w/2, player.y + player.h, 'jump', 6);
  } else {
    // Double jump in air
    player.vy = player.doubleJumpForce;
    player.jumpsLeft = 0;          // no more jumps
    spawnWeaponParticles(player.x + player.w/2, player.y + player.h, 'jump', 8);
    spawnWeaponParticles(player.x + player.w/2, player.y + player.h/2, 'combo', 5);
  }
  player.onGround = false;
}

document.getElementById('attack-btn').addEventListener('touchstart', e => { e.preventDefault(); tryAttack(); });
document.getElementById('attack-btn').addEventListener('mousedown', tryAttack);
document.getElementById('jump-btn').addEventListener('touchstart', e => { e.preventDefault(); tryJump(); });
document.getElementById('jump-btn').addEventListener('mousedown', tryJump);
document.getElementById('special-btn').addEventListener('touchstart', e => { e.preventDefault(); trySpecial(); });
document.getElementById('special-btn').addEventListener('mousedown', trySpecial);

// ---------- LEVEL LOAD ----------
function loadLevel(idx) {
  currentLevel = idx;
  const lvl = levels[idx];
  document.getElementById('level-name').textContent = lvl.name;
  platforms = lvl.platforms;
  enemies = [];
  boss = null;
  projectiles = [];
  particles = [];

  player.x = 60;
  player.y = 300;
  player.vx = player.vy = 0;
  player.jumpsLeft = 2;
  player.hp = Math.min(player.hp + 20, player.maxHp);
  cameraX = 0;

  lvl.enemies.forEach(e => {
    enemies.push({
      x: e.x, y: e.y, w: 26, h: 32,
      hp: e.type === 'beast' ? 48 : 28,
      type: e.type,
      speed: e.type === 'beast' ? 1.7 : 1.25,
      facing: -1,
      dead: false
    });
  });

  if (lvl.isBoss && lvl.boss) {
    boss = {
      ...lvl.boss,
      maxHp: lvl.boss.hp,
      facing: -1,
      attackTimer: 0
    };
  }

  if (idx >= 2) player.weapon = 'gun';
  if (idx >= 4) player.weapon = 'heavy';
  document.getElementById('weapon').textContent =
    player.weapon === 'sword' ? 'Sword' :
    player.weapon === 'gun' ? 'Shadow Gun' : 'Heavy Cleaver';
}

// Weapon-themed colors (will also support heroes later)
function getWeaponColors() {
  switch (player.weapon) {
    case 'gun':
      return { hit:'#66ccff', slash:'#aaddff', death:'#3399ff', combo:'#88eeff', jump:'#5577aa', special:'#00ccff' };
    case 'heavy':
      return { hit:'#ff8844', slash:'#ffaa66', death:'#cc4400', combo:'#ffcc44', jump:'#885533', special:'#ff6622' };
    default: // sword
      return { hit:'#c9a0ff', slash:'#e0d0ff', death:'#a070ff', combo:'#ffcc66', jump:'#8888aa', special:'#ff66ff' };
  }
}

function spawnWeaponParticles(x, y, type, n) {
  const colors = getWeaponColors();
  const color = colors[type] || colors.hit;
  const count = n || (type === 'death' ? 16 : type === 'combo' ? 10 : 7);
  spawnParticles(x, y, color, count, type);
}

function spawnParticles(x, y, color, n=8, type='normal') {
  for (let i = 0; i < n; i++) {
    let vx, vy, size, life, gravity = 0;

    if (type === 'hit') {
      vx = (Math.random() - 0.5) * 10;
      vy = (Math.random() - 0.5) * 10;
      size = 3 + Math.random() * 4;
      life = 12 + Math.random() * 12;
    } else if (type === 'death') {
      vx = (Math.random() - 0.5) * 12;
      vy = (Math.random() - 0.8) * 10;
      size = 4 + Math.random() * 5;
      life = 20 + Math.random() * 18;
      gravity = 0.15;
    } else if (type === 'jump') {
      vx = (Math.random() - 0.5) * 4;
      vy = Math.random() * 2 + 1;
      size = 2 + Math.random() * 3;
      life = 10 + Math.random() * 8;
    } else if (type === 'combo') {
      vx = (Math.random() - 0.5) * 8;
      vy = (Math.random() - 0.5) * 8 - 2;
      size = 3 + Math.random() * 5;
      life = 16 + Math.random() * 14;
    } else if (type === 'slash') {
      vx = (Math.random() - 0.5) * 6 + (player.facing * 4);
      vy = (Math.random() - 0.5) * 5;
      size = 2 + Math.random() * 3;
      life = 8 + Math.random() * 8;
    } else {
      vx = (Math.random() - 0.5) * 7;
      vy = (Math.random() - 0.5) * 7;
      size = 3 + Math.random() * 3;
      life = 15 + Math.random() * 12;
    }

    particles.push({ x, y, vx, vy, life, maxLife: life, color, size, gravity });
  }
}

// ---------- UPDATE ----------
function update() {
  if (!gameRunning) return;

  let move = 0;
  if (keys['a'] || keys['arrowleft']) move = -1;
  if (keys['d'] || keys['arrowright']) move = 1;
  if (joyActive) move = joyDX;

  if (Math.abs(move) > 0.15) {
    player.vx = move * player.speed;
    player.facing = move > 0 ? 1 : -1;
  } else {
    player.vx *= 0.75;
  }

  // Keyboard jump (edge-triggered so holding doesn't spam)
  if (keys['w'] || keys['arrowup'] || keys[' ']) {
    if (!player._jumpHeld) {
      tryJump();
      player._jumpHeld = true;
    }
  } else {
    player._jumpHeld = false;
  }

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
      player.jumpsLeft = 2;   // fully restore jumps on landing
    }
  }

  const lvlW = levels[currentLevel].width;
  if (player.x < 0) player.x = 0;
  if (player.x > lvlW - player.w) player.x = lvlW - player.w;
  if (player.y > canvas.height + 60) {
    player.hp -= 25;
    player.x = 80; player.y = 200; player.vy = 0;
    if (player.hp <= 0) return gameOver();
  }

  if (player.attackTimer > 0) player.attackTimer--;
  if (player.comboTimer > 0) {
    player.comboTimer--;
    if (player.comboTimer <= 0) {
      player.comboCount = 0;
      updateComboUI();
    }
  }
  if (player.invuln > 0) player.invuln--;

  cameraX = player.x - canvas.width * 0.35;
  if (cameraX < 0) cameraX = 0;
  if (cameraX > lvlW - canvas.width) cameraX = Math.max(0, lvlW - canvas.width);

  // Enemies
  for (let i = enemies.length-1; i >= 0; i--) {
    const e = enemies[i];
    if (e.dead) continue;

    const dx = player.x - e.x;
    e.facing = dx > 0 ? 1 : -1;
    e.x += e.facing * e.speed;

    e.y += 5;
    for (const p of platforms) {
      if (e.x + e.w > p.x && e.x < p.x + p.w &&
          e.y + e.h > p.y && e.y + e.h < p.y + 18) {
        e.y = p.y - e.h;
      }
    }

    if (player.attacking && player.attackTimer > 8) {
      const sx = player.facing > 0 ? player.x + player.w - 5 : player.x - 42;
      if (sx < e.x + e.w && sx + 48 > e.x &&
          player.y < e.y + e.h && player.y + player.h > e.y) {
        e.hp -= getAttackDamage();
        spawnWeaponParticles(e.x + e.w/2, e.y + e.h/2, 'hit', 6);
        spawnWeaponParticles(e.x + e.w/2, e.y + e.h/2, 'slash', 4);
        if (e.hp <= 0) {
          e.dead = true;
          kills++;
          const baseSouls = e.type === 'beast' ? 9 : 4;
          souls += getSoulReward(baseSouls);
          spawnWeaponParticles(e.x + e.w/2, e.y + e.h/2, 'death', 16);
          if (player.comboCount >= 5) {
            spawnWeaponParticles(e.x + e.w/2, e.y + e.h/2, 'combo', 10);
          }
          document.getElementById('kills').textContent = kills;
          document.getElementById('souls').textContent = souls;
        }
      }
    }

    if (player.invuln <= 0 &&
        player.x < e.x + e.w && player.x + player.w > e.x &&
        player.y < e.y + e.h && player.y + player.h > e.y) {
      player.hp -= 10;
      player.invuln = 35;
      spawnParticles(player.x + 14, player.y + 20, '#ff5555', 10, 'hit');
      if (player.hp <= 0) return gameOver();
    }
  }
  enemies = enemies.filter(e => !e.dead);

  // Boss
  if (boss && boss.hp > 0) {
    const dx = player.x - boss.x;
    boss.facing = dx > 0 ? 1 : -1;
    if (Math.abs(dx) > 90) boss.x += boss.facing * 1.9;
    boss.attackTimer--;
    if (boss.attackTimer <= 0 && Math.abs(dx) < 130) {
      boss.attackTimer = 65;
      boss.x += boss.facing * 45;
    }

    if (player.attacking && player.attackTimer > 8) {
      const sx = player.facing > 0 ? player.x + player.w - 5 : player.x - 42;
      if (sx < boss.x + boss.w && sx + 48 > boss.x &&
          player.y < boss.y + boss.h && player.y + player.h > boss.y) {
        boss.hp -= getAttackDamage();
        spawnWeaponParticles(boss.x + boss.w/2, boss.y + 30, 'hit', 12);
        spawnWeaponParticles(boss.x + boss.w/2, boss.y + 30, 'slash', 6);
      }
    }

    if (player.invuln <= 0 &&
        player.x < boss.x + boss.w && player.x + player.w > boss.x &&
        player.y < boss.y + boss.h && player.y + player.h > boss.y) {
      player.hp -= 15;
      player.invuln = 40;
      if (player.hp <= 0) return gameOver();
    }

    if (boss.hp <= 0) {
      souls += getSoulReward(60);
      kills += 1;
      spawnWeaponParticles(boss.x + 25, boss.y + 30, 'death', 30);
      spawnWeaponParticles(boss.x + 25, boss.y + 30, 'combo', 15);
      document.getElementById('souls').textContent = souls;
    }
  }

  // Projectiles
  for (let i = projectiles.length-1; i >= 0; i--) {
    const pr = projectiles[i];
    pr.x += pr.vx;
    pr.life--;
    for (const e of enemies) {
      if (pr.x > e.x && pr.x < e.x + e.w && pr.y > e.y && pr.y < e.y + e.h) {
        e.hp -= pr.dmg;
        pr.life = 0;
        spawnWeaponParticles(e.x, e.y, 'hit', 6);
      }
    }
    if (boss && boss.hp > 0 &&
        pr.x > boss.x && pr.x < boss.x + boss.w &&
        pr.y > boss.y && pr.y < boss.y + boss.h) {
      boss.hp -= pr.dmg;
      pr.life = 0;
    }
    if (pr.life <= 0) projectiles.splice(i, 1);
  }

  for (let i = particles.length-1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.gravity) p.vy += p.gravity;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Next level
  if (player.x > levels[currentLevel].exitX) {
    if (currentLevel < levels.length - 1) {
      loadLevel(currentLevel + 1);
    } else {
      gameRunning = false;
      const msg = document.getElementById('message');
      msg.style.display = 'flex';
      msg.innerHTML = `
        <h1>Victory</h1>
        <p>You conquered the Shadow Realm</p>
        <p>Kills: ${kills} | Souls: ${souls}</p>
        <button id="start-btn">Play Again</button>
      `;
      document.getElementById('start-btn').onclick = startGame;
    }
  }

  document.getElementById('hp').textContent = Math.max(0, Math.floor(player.hp));
}

// ---------- DRAW ----------
function draw() {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Simple parallax
  ctx.fillStyle = '#12121c';
  for (let i = 0; i < 9; i++) {
    const bx = ((i * 190) - cameraX * 0.25) % (canvas.width + 220) - 110;
    ctx.fillRect(bx, 60 + (i%3)*50, 130, 200);
  }

  ctx.save();
  ctx.translate(-cameraX, 0);

  // Platforms
  platforms.forEach(p => {
    ctx.fillStyle = '#1c1c2c';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#2c2c40';
    ctx.fillRect(p.x, p.y, p.w, 5);
  });

  // Enemies
  enemies.forEach(e => {
    ctx.fillStyle = e.type === 'beast' ? '#8b1a1a' : '#55557a';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = '#ff6666';
    ctx.fillRect(e.x + 5, e.y + 8, 5, 5);
    ctx.fillRect(e.x + 15, e.y + 8, 5, 5);
  });

  // Boss
  if (boss && boss.hp > 0) {
    ctx.fillStyle = '#4a0066';
    ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
    ctx.fillStyle = '#ff44aa';
    ctx.fillRect(boss.x + 10, boss.y + 14, 10, 10);
    ctx.fillRect(boss.x + 30, boss.y + 14, 10, 10);
    // HP bar
    ctx.fillStyle = '#222';
    ctx.fillRect(boss.x - 15, boss.y - 20, boss.w + 30, 11);
    ctx.fillStyle = '#cc2266';
    ctx.fillRect(boss.x - 15, boss.y - 20, (boss.w + 30) * (boss.hp / boss.maxHp), 11);
  }

  // Player
  ctx.save();
  if (player.invuln > 0 && Math.floor(player.invuln/3) % 2 === 0) ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#9b6dff';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = '#c9a0ff';
  ctx.fillRect(player.x + 5, player.y - 10, 18, 14);

  if (player.attacking && player.attackTimer > 6) {
    ctx.fillStyle = player.comboCount >= 7 ? '#ff66ff' :
                    player.comboCount >= 5 ? '#aaaaff' : '#e0d0ff';
    const sx = player.facing > 0 ? player.x + player.w : player.x - 42;
    const sh = player.comboCount >= 5 ? 16 : 10;
    ctx.fillRect(sx, player.y + 12, 44, sh);
  }
  ctx.restore();

  // Projectiles
  projectiles.forEach(pr => {
    ctx.fillStyle = '#88ccff';
    ctx.fillRect(pr.x, pr.y, 13, 5);
  });

  // Particles
  particles.forEach(p => {
    const alpha = Math.max(0, p.life / (p.maxLife || 25));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    const s = p.size || 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, s * alpha, 0, Math.PI * 2);
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
  kills = 0;
  souls = 0;
  player.hp = 100;
  player.weapon = 'sword';
  player.comboCount = 0;
  document.getElementById('kills').textContent = 0;
  document.getElementById('souls').textContent = 0;
  updateComboUI();
  loadLevel(0);
}

function gameOver() {
  gameRunning = false;
  const msg = document.getElementById('message');
  msg.style.display = 'flex';
  msg.innerHTML = `
    <h1>You Fell</h1>
    <p>Reached: ${levels[currentLevel].name}</p>
    <p>Kills: ${kills} | Souls: ${souls}</p>
    <button id="start-btn">Try Again</button>
  `;
  document.getElementById('start-btn').onclick = startGame;
}

setupJoystick();
document.getElementById('start-btn').onclick = startGame;
loop();
