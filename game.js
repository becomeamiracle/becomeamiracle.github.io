const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

// ---------- 音效 ----------
let audioCtx = null;
function beep(freq, duration, type = 'square', volume = 0.08) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  osc.start(now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.stop(now + duration);
}

// ---------- 节气 ----------
const SOLAR_TERMS = [
  '立春','雨水','惊蛰','春分','清明','谷雨',
  '立夏','小满','芒种','夏至','小暑','大暑',
  '立秋','处暑','白露','秋分','寒露','霜降',
  '立冬','小雪','大雪','冬至','小寒','大寒',
];

const TOTAL_LEVELS = 25;

// ---------- 24 节气皮肤 ----------
const TERM_SKIN = [
  { hue: 120, ball: '#a5d6a7', paddle: '#81c784', bg: '#0f1f12', particle: '#c8e6c9', style: 'petal'  },
  { hue: 150, ball: '#80cbc4', paddle: '#4db6ac', bg: '#0a1a18', particle: '#b2dfdb', style: 'drop'   },
  { hue: 90,  ball: '#c5e1a5', paddle: '#aed581', bg: '#141f0a', particle: '#dcedc8', style: 'petal'  },
  { hue: 60,  ball: '#fff59d', paddle: '#ffe082', bg: '#1f1c08', particle: '#fff9c4', style: 'sun'    },
  { hue: 100, ball: '#e6ee9c', paddle: '#dce775', bg: '#1a1c0a', particle: '#f0f4c3', style: 'leaf'   },
  { hue: 180, ball: '#b2ebf2', paddle: '#80deea', bg: '#081a1c', particle: '#e0f7fa', style: 'drop'   },
  { hue: 20,  ball: '#ffcc80', paddle: '#ffb74d', bg: '#1f1408', particle: '#ffe0b2', style: 'sun'    },
  { hue: 40,  ball: '#ffe082', paddle: '#ffd54f', bg: '#1f1a08', particle: '#fff8e1', style: 'leaf'   },
  { hue: 30,  ball: '#ffab91', paddle: '#ff8a65', bg: '#1f1008', particle: '#ffccbc', style: 'drop'   },
  { hue: 10,  ball: '#ff8a65', paddle: '#ff7043', bg: '#1f0a05', particle: '#ffab91', style: 'sun'    },
  { hue: 50,  ball: '#ffd54f', paddle: '#ffca28', bg: '#1f1a05', particle: '#fff59d', style: 'sun'    },
  { hue: 0,   ball: '#ef5350', paddle: '#e53935', bg: '#1f0505', particle: '#ffcdd2', style: 'sun'    },
  { hue: 35,  ball: '#ffab91', paddle: '#ff8a65', bg: '#1f1008', particle: '#ffccbc', style: 'leaf'   },
  { hue: 25,  ball: '#ffcc80', paddle: '#ffb74d', bg: '#1f1408', particle: '#ffe0b2', style: 'leaf'   },
  { hue: 200, ball: '#e3f2fd', paddle: '#90caf9', bg: '#0a1420', particle: '#bbdefb', style: 'drop'   },
  { hue: 45,  ball: '#ffe082', paddle: '#ffd54f', bg: '#1f1a08', particle: '#fff8e1', style: 'leaf'   },
  { hue: 210, ball: '#b3e5fc', paddle: '#81d4fa', bg: '#081820', particle: '#e1f5fe', style: 'drop'   },
  { hue: 220, ball: '#b0bec5', paddle: '#90a4ae', bg: '#0d1214', particle: '#cfd8dc', style: 'snow'   },
  { hue: 200, ball: '#e3f2fd', paddle: '#90caf9', bg: '#0a1420', particle: '#bbdefb', style: 'snow'   },
  { hue: 195, ball: '#e1f5fe', paddle: '#81d4fa', bg: '#081a20', particle: '#b3e5fc', style: 'snow'   },
  { hue: 210, ball: '#ffffff', paddle: '#b3e5fc', bg: '#0a1420', particle: '#e1f5fe', style: 'snow'   },
  { hue: 190, ball: '#e0f7fa', paddle: '#80deea', bg: '#081a1c', particle: '#b2ebf2', style: 'snow'   },
  { hue: 240, ball: '#c5cae9', paddle: '#9fa8da', bg: '#0a0a1f', particle: '#e8eaf6', style: 'snow'   },
  { hue: 260, ball: '#d1c4e9', paddle: '#b39ddb', bg: '#100a1f', particle: '#ede7f6', style: 'snow'   },
];

const FINAL_SKIN = { hue: 280, ball: '#ffd54f', paddle: '#ff8a65', bg: '#12081f', particle: '#fff59d', style: 'star' };

let skin = TERM_SKIN[0];

function getSkinForLevel(n) {
  if (n === TOTAL_LEVELS) return FINAL_SKIN;
  return TERM_SKIN[n - 1];
}

// ---------- 每关背景 ----------
const TERM_BG = [
  { type: 'petals',  c1: '#0f1f12', c2: '#1e3a24' },
  { type: 'rain',    c1: '#0a1a18', c2: '#123a36' },
  { type: 'petals',  c1: '#141f0a', c2: '#2a3a14' },
  { type: 'sun',     c1: '#1f1c08', c2: '#3a3410' },
  { type: 'petals',  c1: '#1a1c0a', c2: '#2e3418' },
  { type: 'rain',    c1: '#081a1c', c2: '#103a3e' },
  { type: 'sun',     c1: '#1f1408', c2: '#3a2410' },
  { type: 'petals',  c1: '#1f1a08', c2: '#3a3010' },
  { type: 'rain',    c1: '#1f1008', c2: '#3a2010' },
  { type: 'sun',     c1: '#1f0a05', c2: '#3a140a' },
  { type: 'sun',     c1: '#1f1a05', c2: '#3a3010' },
  { type: 'sun',     c1: '#1f0505', c2: '#3a0a0a' },
  { type: 'petals',  c1: '#1f1008', c2: '#3a2010' },
  { type: 'petals',  c1: '#1f1408', c2: '#3a2410' },
  { type: 'rain',    c1: '#0a1420', c2: '#102a3e' },
  { type: 'petals',  c1: '#1f1a08', c2: '#3a3010' },
  { type: 'rain',    c1: '#081820', c2: '#10303e' },
  { type: 'snow',    c1: '#0d1214', c2: '#1a2428' },
  { type: 'snow',    c1: '#0a1420', c2: '#142a3e' },
  { type: 'snow',    c1: '#081a20', c2: '#10303e' },
  { type: 'snow',    c1: '#0a1420', c2: '#14283e' },
  { type: 'snow',    c1: '#081a1c', c2: '#10303a' },
  { type: 'stars',   c1: '#0a0a1f', c2: '#16163a' },
  { type: 'stars',   c1: '#100a1f', c2: '#1e163a' },
];

const FINAL_BG = { type: 'sparkle', c1: '#12081f', c2: '#24103a' };

function getBgForLevel(n) {
  if (n === TOTAL_LEVELS) return FINAL_BG;
  return TERM_BG[n - 1];
}

let bgConfig = TERM_BG[0];
let bgDots = [];
let bgTime = 0;

// ---------- 关卡配置 ----------
function getLevelRates(n) {
  if (n <= 6)  return { penetrate: 0.50, explode: 0.20 };
  if (n <= 12) return { penetrate: 0.65, explode: 0.40 };
  if (n <= 18) return { penetrate: 0.75, explode: 0.50 };
  if (n <= 24) return { penetrate: 0.80, explode: 0.60 };
  return         { penetrate: 0.90, explode: 0.80 };
}

function getLevelConfig(n) {
  if (n === TOTAL_LEVELS) {
    return { rows: 6, cols: 9, speed: 24.0, name: '二十四节气', lives: 5 };
  }
  const t = (n - 1) / 23;
  const rows = Math.round(1 + t * 5);
  const cols = Math.round(2 + t * 7);
  const speed = 6.5 + t * 7.0;
  return { rows, cols, speed, name: SOLAR_TERMS[n - 1] };
}

// ---------- 状态 ----------
const BASE_R = 11;
const POWER_R = 18;
const paddle = { w: 120, h: 14, x: W / 2, y: H - 40 };

let balls = [];
let lastLevel = 1;
let currentLevel = 1;
let SPEED = 5;
let rates = { penetrate: 0.5, explode: 0.2 };
let BRICK = {};
let bricks = [];
let particles = [];
let floaters = [];
let explosions = [];
let shakeTime = 0;
let combo = 0;
let score = 0;
let lives = 3;
let state = 'start';
let highScore = Number(localStorage.getItem('breakoutHigh') || 0);

// ---------- 工具 ----------
function calcBrickLayout() {
  const { rows, cols } = BRICK;
  const gap = 4;
  const left = 8;
  const top = 50;
  const w = (W - left * 2 - gap * (cols - 1)) / cols;
  const h = 22;
  return { rows, cols, w, h, gap, top, left };
}

function initBricks() {
  const L = calcBrickLayout();
  bricks = [];
  for (let r = 0; r < L.rows; r++) {
    for (let c = 0; c < L.cols; c++) {
      bricks.push({
        x: L.left + c * (L.w + L.gap),
        y: L.top + r * (L.h + L.gap),
        w: L.w,
        h: L.h,
        alive: true,
        color: `hsl(${skin.hue + r * 12}, 65%, ${55 - r * 3}%)`,
      });
    }
  }
}

function initBgDots() {
  bgDots = [];
  const count = 60;
  for (let i = 0; i < count; i++) {
    bgDots.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1 + Math.random() * 2.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.6,
    });
  }
}

function createBall(x, y, speed, angle, boost = 0) {
  const s = speed * (boost > 0 ? 2 : 1);
  return {
    x, y,
    r: BASE_R,
    vx: s * Math.cos(angle),
    vy: s * Math.sin(angle),
    power: false,
    boost: boost,
  };
}

function resetBalls() {
  balls = [];
  const angle = (Math.random() * 0.6 - 0.3) + (-Math.PI / 2);
  balls.push(createBall(W / 2, H / 2, SPEED, angle));
  combo = 0;
}

function loadLevel(n) {
  currentLevel = n;
  lastLevel = n;
  const cfg = getLevelConfig(n);
  SPEED = cfg.speed;
  rates = getLevelRates(n);
  BRICK = { rows: cfg.rows, cols: cfg.cols };
  skin = getSkinForLevel(n);
  canvas.style.background = skin.bg;
  bgConfig = getBgForLevel(n);
  initBgDots();
  initBricks();
  resetBalls();
  lives = cfg.lives || 3;
  explosions = [];
  shakeTime = 0;
  state = 'playing';
}

function restart() {
  score = 0;
  particles = [];
  floaters = [];
  explosions = [];
  shakeTime = 0;
  bgTime = 0;
  loadLevel(lastLevel);
}

// ---------- 输入 ----------
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  paddle.x = e.clientX - rect.left;
  const half = paddle.w / 2;
  if (paddle.x - half < 0) paddle.x = half;
  if (paddle.x + half > W) paddle.x = W - half;
});

function handleAction() {
  if (state === 'start' || state === 'over' || state === 'win') {
    restart();
  } else if (state === 'levelclear') {
    loadLevel(currentLevel + 1);
  }
}
canvas.addEventListener('click', handleAction);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') handleAction();
});

// ---------- 碰撞 ----------
function circleRectCollide(cx, cy, cr, rx, ry, rw, rh) {
  const nearestX = Math.max(rx, Math.min(cx, rx + rw));
  const nearestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy <= cr * cr;
}

// ---------- 特效 ----------
function spawnBrickFX(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 1,
      color,
      size: 2 + Math.random() * 3,
    });
  }
  floaters.push({ x, y, text: '+10', life: 1 });
}

function explodeBricks(sourceBrick) {
  const cx = sourceBrick.x + sourceBrick.w / 2;
  const cy = sourceBrick.y + sourceBrick.h / 2;

  explosions.push({ x: cx, y: cy, r: 10, maxR: 90, life: 1 });
  shakeTime = 12;

  for (let i = 0; i < 24; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 2 + Math.random() * 5;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 1,
      color: Math.random() < 0.5 ? '#ffeb3b' : '#ff7043',
      size: 3 + Math.random() * 4,
    });
  }

  // ★ 上下左右必碎，斜角 50%
  const neighbors = [];
  for (const b of bricks) {
    if (!b.alive || b === sourceBrick) continue;
    const bcx = b.x + b.w / 2;
    const bcy = b.y + b.h / 2;
    const dx = Math.abs(bcx - cx);
    const dy = Math.abs(bcy - cy);

    const isUpDown = dy < sourceBrick.h / 2 && dx < sourceBrick.w + 6;
    const isLeftRight = dx < sourceBrick.w / 2 && dy < sourceBrick.h + 6;
    const isDiagonal = dx < sourceBrick.w + 6 && dy < sourceBrick.h + 6
                       && dx > sourceBrick.w / 2 && dy > sourceBrick.h / 2;

    if (isUpDown || isLeftRight) {
      neighbors.push(b);
    } else if (isDiagonal && Math.random() < 0.5) {
      neighbors.push(b);
    }
  }

  for (const b of neighbors) {
    b.alive = false;
    score += 10;
    spawnBrickFX(b.x + b.w / 2, b.y + b.h / 2, skin.particle);
  }

  beep(200, 0.3, 'sawtooth', 0.1);

  const r = Math.random();
  let count = 0;
  if (r < 0.5) count = 1;
  else if (r < 0.7) count = 2;

  for (let k = 0; k < count; k++) {
    const angle = (Math.random() * 0.8 - 0.4) + (-Math.PI / 2);
    balls.push(createBall(cx, cy, SPEED, angle, 120));
  }
}

function saveHigh() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('breakoutHigh', highScore);
  }
}

// ---------- 更新 ----------
function update() {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life -= 0.03;
  }
  particles = particles.filter(p => p.life > 0);

  for (const f of floaters) {
    f.y -= 1;
    f.life -= 0.02;
  }
  floaters = floaters.filter(f => f.life > 0);

  for (const e of explosions) {
    e.r += (e.maxR - e.r) * 0.15;
    e.life -= 0.05;
  }
  explosions = explosions.filter(e => e.life > 0);

  if (shakeTime > 0) shakeTime--;

  if (state !== 'playing') return;

  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];

    // ★ 加速计时
    if (ball.boost > 0) {
      ball.boost--;
      if (ball.boost === 0) {
        const cur = Math.hypot(ball.vx, ball.vy);
        const target = ball.power ? SPEED * 2 : SPEED;
        if (cur > 0) {
          ball.vx = ball.vx / cur * target;
          ball.vy = ball.vy / cur * target;
        }
      }
    }

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx = -ball.vx;
    } else if (ball.x + ball.r > W) {
      ball.x = W - ball.r;
      ball.vx = -ball.vx;
    }

    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy = -ball.vy;
    }

    const paddleLeft = paddle.x - paddle.w / 2;
    const paddleRight = paddle.x + paddle.w / 2;

    if (
      ball.vy > 0 &&
      ball.y + ball.r > paddle.y &&
      ball.y - ball.r < paddle.y + paddle.h &&
      ball.x > paddleLeft &&
      ball.x < paddleRight
    ) {
      ball.y = paddle.y - ball.r;
      const hitPos = (ball.x - paddle.x) / (paddle.w / 2);
      const angle = hitPos * (Math.PI / 3);
      const spd = ball.boost > 0 ? SPEED * 2 : SPEED;
      ball.vx = spd * Math.sin(angle);
      ball.vy = -spd * Math.cos(angle);
      beep(440, 0.08);

      if (ball.power) {
        ball.power = false;
        ball.r = BASE_R;
        beep(300, 0.2, 'sine', 0.1);
      } else {
        combo++;
        if (combo >= 3) {
          combo = 0;
          if (Math.random() < rates.penetrate) {
            ball.power = true;
            ball.r = POWER_R;
            const cur = Math.hypot(ball.vx, ball.vy);
            const target = ball.boost > 0 ? SPEED * 4 : SPEED * 2;
            if (cur > 0) {
              ball.vx = ball.vx / cur * target;
              ball.vy = ball.vy / cur * target;
            }
            beep(900, 0.15, 'sine', 0.12);
            setTimeout(() => beep(1200, 0.2, 'sine', 0.12), 100);
          }
        }
      }
    }

    for (const b of bricks) {
      if (!b.alive) continue;
      if (circleRectCollide(ball.x, ball.y, ball.r, b.x, b.y, b.w, b.h)) {
        b.alive = false;
        score += 10;
        spawnBrickFX(b.x + b.w / 2, b.y + b.h / 2, skin.particle);
        beep(660 + Math.random() * 120, 0.1, 'triangle');

        if (Math.random() < rates.explode) {
          explodeBricks(b);
        }

        if (!ball.power) {
          const bcx = b.x + b.w / 2;
          const bcy = b.y + b.h / 2;
          const overlapX = (b.w / 2 + ball.r) - Math.abs(ball.x - bcx);
          const overlapY = (b.h / 2 + ball.r) - Math.abs(ball.y - bcy);
          if (overlapX < overlapY) ball.vx = -ball.vx;
          else ball.vy = -ball.vy;
          break;
        }
      }
    }

    if (ball.y - ball.r > H) {
      balls.splice(i, 1);
    }
  }

  if (balls.length === 0) {
    lives--;
    beep(150, 0.3, 'sawtooth');
    if (lives <= 0) {
      state = 'over';
      saveHigh();
      beep(100, 0.6, 'sawtooth', 0.12);
    } else {
      resetBalls();
    }
  }

  if (bricks.every(b => !b.alive)) {
    if (currentLevel >= TOTAL_LEVELS) {
      state = 'win';
      saveHigh();
      beep(880, 0.15, 'sine', 0.1);
      setTimeout(() => beep(1100, 0.3, 'sine', 0.1), 150);
    } else {
      state = 'levelclear';
      beep(880, 0.12, 'sine', 0.1);
      setTimeout(() => beep(1040, 0.12, 'sine', 0.1), 120);
      setTimeout(() => beep(1240, 0.2, 'sine', 0.1), 240);
    }
  }
}

// ---------- 背景绘制 ----------
function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, bgConfig.c2);
  g.addColorStop(1, bgConfig.c1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const t = bgTime;
  const type = bgConfig.type;

  if (type === 'stars' || type === 'sparkle') {
    for (const d of bgDots) {
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(t * d.speed + d.phase));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = type === 'sparkle' ? '#fff59d' : '#ffffff';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

  } else if (type === 'snow') {
    for (const d of bgDots) {
      const y = (d.y + t * 20 * d.speed) % H;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(d.x, y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

  } else if (type === 'rain') {
    for (const d of bgDots) {
      const y = (d.y + t * 80 * d.speed) % H;
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#b3e5fc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(d.x, y);
      ctx.lineTo(d.x - 2, y + 10);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

  } else if (type === 'petals') {
    for (const d of bgDots) {
      const x = (d.x + Math.sin(t * d.speed + d.phase) * 20 + W) % W;
      const y = (d.y + t * 15 * d.speed) % H;
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = skin.particle;
      ctx.beginPath();
      ctx.ellipse(x, y, d.r * 1.5, d.r * 0.8, d.phase, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

  } else if (type === 'sun') {
    const cx = W / 2;
    const cy = H * 0.3;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + t * 0.1;
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = skin.ball;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, Math.max(W, H), a, a + 0.15);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// ---------- 球造型 ----------
function drawBall(ball) {
  const { x, y, r } = ball;
  ctx.save();
  ctx.translate(x, y);

  if (ball.power) {
    const glow = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.4);
    glow.addColorStop(0, skin.ball + 'cc');
    glow.addColorStop(0.45, skin.ball + '66');
    glow.addColorStop(1, skin.ball + '00');
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  const style = skin.style;

  if (style === 'petal') {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = skin.ball;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5,
        r * 0.38, r * 0.22, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffeb3b';
    ctx.fill();

  } else if (style === 'sun') {
    const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, skin.ball);
    g.addColorStop(1, '#ff8f00');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = skin.ball;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a) * r * 1.6, Math.sin(a) * r * 1.6);
      ctx.stroke();
    }

  } else if (style === 'leaf') {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = skin.ball;
    ctx.fill();
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, r * 0.7);
    ctx.lineTo(r * 0.7, -r * 0.7);
    ctx.stroke();
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(i * r * 0.6, -r * 0.4 + i * r * 0.2);
      ctx.stroke();
    }

  } else if (style === 'drop') {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = skin.ball;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();

  } else if (style === 'snow') {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = skin.ball;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
      ctx.stroke();
      const bx = Math.cos(a) * r * 0.6;
      const by = Math.sin(a) * r * 0.6;
      for (const da of [-0.5, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(a + da) * r * 0.3,
                   by + Math.sin(a + da) * r * 0.3);
        ctx.stroke();
      }
    }

  } else {
    const g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, skin.ball);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#fff59d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 === 0 ? r * 1.5 : r * 0.7;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- 球拍造型 ----------
function drawPaddle() {
  const px = paddle.x - paddle.w / 2;
  const py = paddle.y;
  const style = skin.style;

  if (style === 'petal') {
    ctx.fillStyle = skin.paddle;
    ctx.fillRect(px, py, paddle.w, paddle.h);
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 1.5;
    for (let i = 1; i < 4; i++) {
      const x = px + (paddle.w / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, py);
      ctx.lineTo(x, py + paddle.h);
      ctx.stroke();
    }

  } else if (style === 'sun') {
    const g = ctx.createLinearGradient(px, 0, px + paddle.w, 0);
    g.addColorStop(0, '#ff7043');
    g.addColorStop(0.5, skin.paddle);
    g.addColorStop(1, '#ff7043');
    ctx.fillStyle = g;
    ctx.fillRect(px, py, paddle.w, paddle.h);

  } else if (style === 'leaf') {
    ctx.fillStyle = skin.paddle;
    ctx.fillRect(px, py, paddle.w, paddle.h);
    ctx.strokeStyle = 'rgba(93,64,55,0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const y = py + (paddle.h / 6) * i;
      ctx.beginPath();
      ctx.moveTo(px + 4, y);
      ctx.lineTo(px + paddle.w - 4, y);
      ctx.stroke();
    }

  } else if (style === 'drop') {
    ctx.fillStyle = skin.paddle;
    ctx.fillRect(px, py, paddle.w, paddle.h);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(px + paddle.w * 0.3, py + paddle.h * 0.4,
      paddle.w * 0.15, paddle.h * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

  } else if (style === 'snow') {
    ctx.fillStyle = skin.paddle;
    ctx.fillRect(px, py, paddle.w, paddle.h);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(px, py, paddle.w, paddle.h / 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const x = px + 10 + i * ((paddle.w - 20) / 4);
      ctx.beginPath();
      ctx.moveTo(x - 4, py + paddle.h * 0.6);
      ctx.lineTo(x, py + paddle.h * 0.3);
      ctx.lineTo(x + 4, py + paddle.h * 0.6);
      ctx.stroke();
    }

  } else {
    const g = ctx.createLinearGradient(px, 0, px + paddle.w, 0);
    g.addColorStop(0, '#7e57c2');
    g.addColorStop(0.5, skin.paddle);
    g.addColorStop(1, '#7e57c2');
    ctx.fillStyle = g;
    ctx.fillRect(px, py, paddle.w, paddle.h);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(px + 8 + i * (paddle.w - 16) / 4, py + 3, 3, paddle.h - 6);
    }
  }
}

// ---------- 砖块节气纹理 ----------
function drawBrick(b) {
  ctx.fillStyle = b.color;
  ctx.fillRect(b.x, b.y, b.w, b.h);

  const style = skin.style;
  const x = b.x, y = b.y, w = b.w, h = b.h;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  if (style === 'petal') {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 3; i++) {
      const px = x + 10 + i * (w - 20) / 2;
      const py = y + h / 2;
      ctx.beginPath();
      ctx.ellipse(px, py, 4, 2.5, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (style === 'sun') {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const px = x + 8 + i * (w - 16) / 3;
      ctx.beginPath();
      ctx.moveTo(px, y + h - 3);
      ctx.lineTo(px, y + 5);
      ctx.stroke();
    }

  } else if (style === 'leaf') {
    ctx.strokeStyle = 'rgba(93,64,55,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h - 4);
    ctx.lineTo(x + w - 4, y + 4);
    ctx.stroke();
    for (let i = 1; i < 4; i++) {
      const t = i / 4;
      const px = x + 4 + (w - 8) * t;
      const py = y + h - 4 - (h - 8) * t;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - 6, py - 2);
      ctx.moveTo(px, py);
      ctx.lineTo(px + 2, py - 6);
      ctx.stroke();
    }

  } else if (style === 'drop') {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 2; i++) {
      const px = x + 10 + i * (w - 20);
      const py = y + h / 2;
      ctx.beginPath();
      ctx.ellipse(px, py, 2.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (style === 'snow') {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 2; i++) {
      const px = x + 12 + i * (w - 24);
      const py = y + h / 2;
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(px - Math.cos(a) * 4, py - Math.sin(a) * 4);
        ctx.lineTo(px + Math.cos(a) * 4, py + Math.sin(a) * 4);
        ctx.stroke();
      }
    }

  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    const px = x + w / 2;
    const py = y + h / 2;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 === 0 ? 6 : 3;
      const sx = px + Math.cos(a) * rr;
      const sy = py + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x, y, w, 4);
}

// ---------- 绘制 ----------
function draw() {
  bgTime += 0.016;
  ctx.save();
  if (shakeTime > 0) {
    const s = shakeTime * 0.6;
    ctx.translate(
      (Math.random() - 0.5) * s,
      (Math.random() - 0.5) * s
    );
  }
  drawBackground();

  for (const b of bricks) {
    if (!b.alive) continue;
    drawBrick(b);
  }

  for (const ball of balls) {
    drawBall(ball);
  }

  drawPaddle();

  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  for (const e of explosions) {
    ctx.globalAlpha = Math.max(0, e.life) * 0.8;
    ctx.strokeStyle = '#ffeb3b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = Math.max(0, e.life) * 0.4;
    ctx.strokeStyle = '#ff7043';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (const f of floaters) {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';

  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('分数: ' + score, 10, 24);
  ctx.textAlign = 'center';
  ctx.fillText('最高: ' + highScore, W / 2, 24);
  ctx.textAlign = 'right';
  ctx.fillText('生命: ' + lives, W - 10, 24);
  ctx.textAlign = 'left';

  const anyPower = balls.some(b => b.power);
  ctx.fillStyle = anyPower ? '#ffeb3b' : '#aaa';
  ctx.font = '14px sans-serif';
  ctx.fillText(anyPower ? '穿透模式！' : `连击: ${combo}/3`, 10, 44);

  const cfg = getLevelConfig(currentLevel);
  ctx.textAlign = 'center';
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#ddd';
  ctx.fillText(`第 ${currentLevel} 关 · ${cfg.name}`, W / 2, H - 12);
  ctx.textAlign = 'left';

  ctx.restore();

  if (state !== 'playing') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';

    if (state === 'start') {
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText('打砖块', W / 2, H / 2 - 60);
      ctx.font = '18px sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.fillText('鼠标移动控制球拍', W / 2, H / 2 - 10);
      ctx.fillText('共 25 关 · 二十四节气', W / 2, H / 2 + 25);
      ctx.fillText('点击屏幕或按空格开始', W / 2, H / 2 + 65);
    } else if (state === 'levelclear') {
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = '#4fc3f7';
      ctx.fillText('过关！', W / 2, H / 2 - 30);
      const next = getLevelConfig(currentLevel + 1);
      ctx.font = '18px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(`第 ${currentLevel + 1} 关 · ${next.name}`, W / 2, H / 2 + 15);
      ctx.fillStyle = '#aaa';
      ctx.font = '16px sans-serif';
      ctx.fillText('点击或按空格继续', W / 2, H / 2 + 60);
    } else {
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText(state === 'win' ? '通关！' : '游戏结束', W / 2, H / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText('最终分数: ' + score, W / 2, H / 2 + 30);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#ffd54f';
      ctx.fillText('最高分: ' + highScore, W / 2, H / 2 + 58);
      ctx.fillStyle = '#aaa';
      ctx.fillText('点击屏幕或按空格重新开始', W / 2, H / 2 + 100);
    }
    ctx.textAlign = 'left';
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();