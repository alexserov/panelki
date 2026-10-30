/* ПАНЕЛЬКИ — живой фон вокруг игрового экрана: птицы, крысы, бомжи, менты и бандиты. */
(function () {
  'use strict';

  const canvas = document.getElementById('ambient');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const A = {
    W: 0, H: 0, t: 0,
    stars: [], city: [], clouds: [],
    birds: [], rats: [], pigeons: [],
    smoke: [], weather: [], weatherType: '',
    police: null, bandit: null,
    cop: { x: 0, seed: 1 }, banditGuy: { x: 0, seed: 2 },
    dog: { x: 0, seed: 3 }, cat: { x: 0, dir: 1, seed: 4 },
    groundY: 0, lastWeather: ''
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => {
    if (b === undefined) { b = a; a = 0; }
    return a + Math.random() * (b - a);
  };
  const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gameWeather() {
    try {
      if (window.__PANELKI && window.__PANELKI.S) return window.__PANELKI.S.weather;
    } catch (e) { /* ignore */ }
    return 'snow';
  }

  function colors() {
    const w = gameWeather();
    let top = '#17132a', mid = '#2b1c33', bot = '#4a2a33';
    if (w === 'rain') { top = '#10151f'; mid = '#1c2733'; bot = '#353a42'; }
    else if (w === 'storm') { top = '#0b0912'; mid = '#1a1225'; bot = '#34202c'; }
    else if (w === 'snow') { top = '#323a52'; mid = '#4b5068'; bot = '#777a86'; }
    else if (w === 'fog') { top = '#3d3d3a'; mid = '#55534c'; bot = '#777366'; }
    else if (w === 'overcast') { top = '#2a2a34'; mid = '#3d3b44'; bot = '#58545a'; }
    return { top, mid, bot };
  }

  function resize() {
    const vw = Math.max(240, window.innerWidth);
    const vh = Math.max(320, window.innerHeight);
    const w = vw < 560 ? 170 : 240;
    const h = clamp(Math.round(w * vh / vw), 180, 460);
    A.W = w;
    A.H = h;
    canvas.width = w;
    canvas.height = h;
    ctx.imageSmoothingEnabled = false;
    initScene();
  }

  function initScene() {
    const W = A.W, H = A.H;
    const r = rng(19850 + W * 31);
    A.t = 0;
    A.groundY = H - Math.max(24, Math.round(H * 0.10));
    A.stars = [];
    for (let i = 0; i < 46; i++) {
      A.stars.push({ x: rndInt(0, W - 1), y: rndInt(2, Math.max(4, A.groundY - 50)), big: r() < 0.16, p: rnd(0, 6.28) });
    }
    A.city = [];
    let x = -6;
    while (x < W + 10) {
      const w = 7 + Math.floor(r() * 12);
      const h = 14 + Math.floor(r() * 44);
      const wins = [];
      for (let cy = 3; cy < h - 4; cy += 6) {
        for (let cx = 2; cx < w - 2; cx += 4) {
          if (r() < 0.38) wins.push({ x: cx, y: cy, on: r() < 0.7, seed: Math.floor(r() * 999) });
        }
      }
      A.city.push({ x, w, h, wins, roof: r() < 0.25 });
      x += w + 1 + Math.floor(r() * 4);
    }
    A.clouds = [];
    for (let i = 0; i < 3; i++) {
      A.clouds.push({ x: r() * W, y: 8 + r() * 30, w: 18 + r() * 16, speed: 1 + r() * 2 });
    }
    A.birds = [];
    for (let i = 0; i < 5; i++) {
      A.birds.push({
        x: r() * W, y: 8 + r() * Math.max(8, H * 0.07),
        speed: 4 + r() * 8, dir: r() < 0.5 ? 1 : -1,
        phase: r() * 6.28, size: r() < 0.5 ? 1 : 2
      });
    }
    A.rats = [];
    for (let i = 0; i < 3; i++) {
      A.rats.push({ x: r() * W, y: A.groundY - 2, dir: r() < 0.5 ? 1 : -1, speed: 8 + r() * 12, seed: r() * 99, top: false });
    }
    A.rats.push({ x: W * 0.1, y: 8, dir: 1, speed: 5, seed: 3, top: true });
    A.rats.push({ x: W * 0.6, y: 8, dir: -1, speed: 4, seed: 7, top: true });
    A.pigeons = [
      { x: W * 0.6, y: A.groundY - 2, seed: 1 },
      { x: W * 0.65, y: A.groundY - 2, seed: 2 },
      { x: W * 0.3, y: A.groundY - 2, seed: 3 }
    ];
    A.cop.x = W * 0.72;
    A.banditGuy.x = W * 0.17;
    A.dog.x = W * 0.1;
    A.cat.x = W * 0.55;
    A.cat.dir = 1;
    A.smoke = [];
    A.weather = [];
    A.weatherType = '';
    A.lastWeather = '';
    A.police = { x: -30, dir: 1, active: false, timer: rnd(2, 5), speed: rnd(17, 27) };
    A.bandit = { x: W + 30, dir: -1, active: false, timer: rnd(5, 10), speed: rnd(15, 25) };
    initWeather();
  }

  function initWeather() {
    const w = gameWeather();
    A.weatherType = w;
    A.weather = [];
    if (w === 'rain' || w === 'storm') {
      for (let i = 0; i < 55; i++) {
        A.weather.push({ x: rnd(0, A.W), y: rnd(0, A.H), len: rnd(2, 6), speed: rnd(60, 110), a: rnd(0.12, 0.3) });
      }
    } else if (w === 'snow') {
      for (let i = 0; i < 42; i++) {
        A.weather.push({ x: rnd(0, A.W), y: rnd(0, A.H), speed: rnd(5, 16), a: rnd(0.25, 0.7), phase: rnd(0, 6.28) });
      }
    }
  }

  function update(dt) {
    A.t += dt;
    const w = gameWeather();
    if (w !== A.lastWeather) {
      A.lastWeather = w;
      initWeather();
    }
    for (let i = 0; i < A.clouds.length; i++) {
      const c = A.clouds[i];
      c.x += c.speed * dt;
      if (c.x > A.W + 30) c.x = -35;
    }
    for (let i = 0; i < A.birds.length; i++) {
      const b = A.birds[i];
      b.x += b.dir * b.speed * dt;
      if (b.x < -8) { b.x = A.W + 6; b.dir = -1; }
      if (b.x > A.W + 8) { b.x = -6; b.dir = 1; }
    }
    for (let i = 0; i < A.rats.length; i++) {
      const r = A.rats[i];
      r.x += r.dir * r.speed * dt;
      if (r.top) {
        if (r.x < 4) { r.x = 4; r.dir = 1; }
        if (r.x > A.W - 5) { r.x = A.W - 5; r.dir = -1; }
      } else {
        if (r.x < 2) { r.x = A.W - 2; }
        if (r.x > A.W - 2) { r.x = 2; }
      }
    }
    A.cat.x += A.cat.dir * 3 * dt;
    if (A.cat.x < A.W * 0.3) { A.cat.x = A.W * 0.3; A.cat.dir = 1; }
    if (A.cat.x > A.W * 0.8) { A.cat.x = A.W * 0.8; A.cat.dir = -1; }

    // cars
    if (!A.police.active) {
      A.police.timer -= dt;
      if (A.police.timer <= 0) {
        A.police.active = true;
        A.police.x = A.police.dir > 0 ? -28 : A.W + 28;
      }
    } else {
      A.police.x += A.police.dir * A.police.speed * dt;
      if (A.police.x < -34 || A.police.x > A.W + 34) {
        A.police.active = false;
        A.police.timer = rnd(10, 20);
        A.police.dir *= -1;
      }
    }
    if (!A.bandit.active) {
      A.bandit.timer -= dt;
      if (A.bandit.timer <= 0) {
        A.bandit.active = true;
        A.bandit.x = A.bandit.dir > 0 ? -30 : A.W + 30;
      }
    } else {
      A.bandit.x += A.bandit.dir * A.bandit.speed * dt;
      if (A.bandit.x < -36 || A.bandit.x > A.W + 36) {
        A.bandit.active = false;
        A.bandit.timer = rnd(15, 28);
        A.bandit.dir *= -1;
      }
    }

    // weather
    for (let i = 0; i < A.weather.length; i++) {
      const p = A.weather[i];
      if (A.weatherType === 'snow') {
        p.y += p.speed * dt;
        p.x += Math.sin(A.t + p.phase) * 3 * dt;
      } else {
        p.y += p.speed * dt;
        p.x += 12 * dt;
      }
      if (p.y > A.H + 4) { p.y = -4; p.x = rnd(0, A.W); }
      if (p.x > A.W + 4) p.x = -4;
    }

    // smoke
    if (Math.random() < dt * 8) {
      A.smoke.push({
        x: A.W * 0.34 + rnd(-4, 4), y: A.groundY - rnd(7, 12),
        vy: rnd(-8, -3), vx: rnd(-2, 2), life: rnd(1.2, 2.6), max: 2.6, size: 1
      });
    }
    for (let i = A.smoke.length - 1; i >= 0; i--) {
      const s = A.smoke[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0) A.smoke.splice(i, 1);
    }
  }

  function px(x, y, w, h, c, a) {
    ctx.globalAlpha = a === undefined ? 1 : a;
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
    ctx.globalAlpha = 1;
  }

  function drawSky() {
    const c = colors();
    const bands = 12;
    const end = A.groundY;
    for (let i = 0; i < bands; i++) {
      const p = i / (bands - 1);
      let col;
      if (p < 0.5) col = mixColor(c.top, c.mid, p / 0.5);
      else col = mixColor(c.mid, c.bot, (p - 0.5) / 0.5);
      ctx.fillStyle = col;
      ctx.fillRect(0, Math.floor(i * end / bands), A.W, Math.ceil(end / bands) + 1);
    }
  }

  function mixColor(a, b, t) {
    const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
    const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
    const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  function drawStars() {
    for (let i = 0; i < A.stars.length; i++) {
      const s = A.stars[i];
      const a = 0.25 + 0.65 * Math.abs(Math.sin(A.t * 0.6 + s.p));
      px(s.x, s.y, s.big ? 2 : 1, s.big ? 2 : 1, '#d9d5c2', a);
    }
    // moon
    const mx = Math.round(A.W * 0.78), my = Math.round(A.H * 0.06);
    px(mx - 6, my - 6, 12, 12, 'rgba(220,215,185,.06)');
    px(mx - 4, my - 4, 8, 8, '#d6d0ac', 0.7);
    px(mx - 2, my - 2, 3, 3, '#b5ae8e', 0.6);
  }

  function drawClouds() {
    for (let i = 0; i < A.clouds.length; i++) {
      const c = A.clouds[i];
      px(c.x, c.y, c.w, 3, '#2b2733', 0.55);
      px(c.x + 4, c.y - 2, c.w * 0.6, 2, '#2b2733', 0.55);
      px(c.x + c.w * 0.2, c.y + 3, c.w * 0.7, 2, '#2b2733', 0.4);
    }
  }

  function drawCity() {
    const gy = A.groundY;
    for (let i = 0; i < A.city.length; i++) {
      const b = A.city[i];
      const top = gy - b.h;
      px(b.x, top, b.w, b.h, '#14121c');
      if (b.roof) px(b.x - 1, top - 1, b.w + 2, 1, '#1c1924');
      for (let j = 0; j < b.wins.length; j++) {
        const w = b.wins[j];
        if (!w.on && Math.sin(A.t * 0.5 + w.seed) < 0.7) continue;
        px(b.x + w.x, top + w.y, 1, 2, w.seed % 7 === 0 ? '#d7ad5c' : '#b99b6a', 0.65);
      }
    }
    // TV tower
    const tx = Math.round(A.W * 0.83);
    px(tx, gy - 54, 1, 54, '#1b1822');
    px(tx - 3, gy - 38, 7, 1, '#1b1822');
    px(tx - 5, gy - 30, 11, 1, '#1b1822');
    if (Math.sin(A.t * 2) > 0.2) px(tx, gy - 56, 1, 1, '#e04a3a', 0.9);
    // chimneys + smoke
    for (let i = 0; i < 2; i++) {
      const sx = A.W * (0.14 + i * 0.08);
      const sy = gy - 33 - i * 9;
      px(sx, sy, 3, 33 + i * 9, '#1b1822');
      for (let j = 0; j < 3; j++) {
        const p = (A.t * 5 + j * 7 + i * 4) % 26;
        px(sx + 1 + Math.sin(A.t + j) * 2, sy - p, 2, 2, '#6a6860', 0.18);
      }
    }
    // searchlights
    for (let i = 0; i < 2; i++) {
      const bx = i ? A.W * 0.9 : A.W * 0.12;
      const ang = Math.sin(A.t * 0.12 + i * 2) * 0.5;
      const tip = bx + Math.sin(ang) * 80;
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#cdd4dc';
      ctx.beginPath();
      ctx.moveTo(bx, gy - 18);
      ctx.lineTo(tip - 10, gy - 130);
      ctx.lineTo(tip + 10, gy - 130);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawWires() {
    const y1 = Math.round(A.H * 0.075);
    const y2 = Math.round(A.H * 0.10);
    for (const wy of [y1, y2]) {
      ctx.fillStyle = 'rgba(18,16,22,.7)';
      for (let x = 0; x < A.W; x += 2) {
        const yy = wy + Math.round(Math.sin(x * 0.08 + wy) * 1.5);
        ctx.fillRect(x, yy, 2, 1);
      }
    }
    // birds on wire
    for (let i = 0; i < 3; i++) {
      const bx = Math.round(A.W * (0.2 + i * 0.12));
      const by = y1 - 2 + Math.round(Math.sin(bx * 0.08 + y1) * 1.5);
      px(bx, by, 2, 2, '#0d0c11');
      px(bx + 2, by, 1, 1, '#0d0c11');
    }
    // cat on wire
    const cx = Math.round(A.cat.x);
    const cy = y2 - 2 + Math.round(Math.sin(cx * 0.08 + y2) * 1.5);
    px(cx, cy, 3, 2, '#0d0c11');
    px(cx, cy - 1, 1, 1, '#0d0c11');
    px(cx + 2, cy - 1, 1, 1, '#0d0c11');
    px(cx + 3, cy, 1, 2, '#0d0c11');
    px(cx + 2, cy + 1, 1, 1, '#e8c26c', 0.9);
  }

  function drawCrane() {
    const y = Math.round(A.H * 0.055);
    const h = 5;
    // jib
    ctx.fillStyle = '#25211c';
    ctx.fillRect(0, y, A.W, 2);
    ctx.fillRect(0, y + h, A.W, 1);
    for (let x = 2; x < A.W; x += 7) {
      ctx.fillRect(x, y + 2, 1, 1);
      ctx.fillRect(x + 1, y + 3, 1, 1);
      ctx.fillRect(x + 2, y + 4, 1, 1);
    }
    // mast
    px(A.W * 0.86, y - 4, 2, 14, '#25211c');
    // warning light
    if (Math.sin(A.t * 3) > 0.4) px(A.W * 0.86, y - 6, 1, 1, '#e04a3a', 0.8);
    // rats on the jib
    for (let i = 0; i < A.rats.length; i++) {
      const r = A.rats[i];
      if (!r.top) continue;
      px(r.x, y + 1, 3, 1, '#0c0b10');
      px(r.x + 3, y + 1, 1, 1, '#0c0b10');
      px(r.x + (r.dir > 0 ? -1 : 4), y + 1, 1, 1, '#5a4c52');
      px(r.x + (r.dir > 0 ? 2 : 1), y, 1, 1, '#e8c26c', 0.9);
    }
  }

  function drawBirds() {
    for (let i = 0; i < A.birds.length; i++) {
      const b = A.birds[i];
      const flap = Math.sin(A.t * 8 + b.phase) > 0;
      const x = Math.round(b.x), y = Math.round(b.y);
      ctx.fillStyle = '#121016';
      if (flap) {
        ctx.fillRect(x, y, 2, 1);
        ctx.fillRect(x - 1, y - 1, 1, 1);
        ctx.fillRect(x + 2, y - 1, 1, 1);
      } else {
        ctx.fillRect(x, y, 2, 1);
        ctx.fillRect(x - 1, y + 1, 1, 1);
        ctx.fillRect(x + 2, y + 1, 1, 1);
      }
      if (b.size === 2) ctx.fillRect(x + 1, y, 1, 1);
    }
  }

  function drawStreet() {
    const gy = A.groundY;
    px(0, gy, A.W, A.H - gy, '#17161b');
    px(0, gy, A.W, 1, '#2d2a33');
    px(0, gy + 2, A.W, 1, '#3c3842');
    // road dashes
    for (let x = 4; x < A.W; x += 20) px(x, A.H - 7, 8, 1, '#57524a', 0.35);
    // puddles
    px(A.W * 0.55, gy + 7, 12, 2, '#35404c', 0.4);
    px(A.W * 0.72, gy + 12, 8, 1, '#35404c', 0.3);
    // dumpster
    const dx = Math.round(A.W * 0.07), dy = gy + 2;
    px(dx, dy, 14, 9, '#2f4a34');
    px(dx + 1, dy + 1, 12, 2, '#3d5e42');
    px(dx + 2, dy + 9, 2, 1, '#1d2d21');
    px(dx + 10, dy + 9, 2, 1, '#1d2d21');
    if (typeof BMFont !== 'undefined') {
      BMFont.draw(ctx, 'ДОМ', dx + 4, dy + 4, { scale: 1, spacing: 0, color: '#cfc255', alpha: 0.8 });
    }
    // kiosk
    const kx = Math.round(A.W * 0.78), ky = gy - 12;
    px(kx, ky, 20, 15, '#2a2530');
    px(kx + 2, ky + 3, 16, 8, '#4f4b3c');
    px(kx + 3, ky + 4, 14, 6, '#d8b96a', 0.32);
    px(kx, ky - 2, 20, 2, '#6a3a32');
    if (typeof BMFont !== 'undefined') {
      BMFont.draw(ctx, 'ПИВО', kx + 10, ky - 10, { scale: 1, spacing: 0, color: '#d9c46a', align: 'center', alpha: 0.8 });
    }
    // bench
    px(A.W * 0.48, gy + 4, 14, 2, '#4a3a2a');
    px(A.W * 0.48, gy + 7, 14, 1, '#4a3a2a');
    px(A.W * 0.49, gy + 6, 1, 2, '#2f2620');
    px(A.W * 0.58, gy + 6, 1, 2, '#2f2620');
  }

  function drawPeople() {
    const gy = A.groundY;
    // barrel fire
    const bx = Math.round(A.W * 0.34), by = gy - 2;
    px(bx, by - 5, 6, 6, '#3a3430');
    px(bx + 1, by - 6, 4, 1, '#4a423a');
    const fl = Math.sin(A.t * 9) > 0 ? 2 : 1;
    px(bx + 2, by - 8 - fl, 2, 2 + fl, '#e8752f');
    px(bx + 3, by - 10 - fl, 1, 2, '#f2c14a');
    px(bx + 1, by - 7, 4, 1, '#d94a2a', 0.8);
    px(bx - 3, by - 7, 12, 8, '#f2a14a', 0.05);
    // homeless sitting
    const hx = Math.round(A.W * 0.28);
    px(hx, by - 7, 5, 6, '#4a4038');
    px(hx + 1, by - 9, 3, 2, '#b0896a');
    px(hx, by - 10, 5, 1, '#3a3430');
    px(hx + 5, by - 2, 5, 2, '#2f2b2e');
    // homeless standing with bottle
    const hx2 = Math.round(A.W * 0.4);
    px(hx2, by - 10, 4, 9, '#4a4038');
    px(hx2 + 1, by - 13, 3, 3, '#b0896a');
    px(hx2, by - 14, 5, 1, '#3a3430');
    px(hx2 + 4, by - 5, 1, 4, '#59805a');
    px(hx2 - 1, by - 8, 1, 5, '#403830');
    // dog
    const dx = Math.round(A.dog.x);
    px(dx, by - 4, 6, 3, '#3a3330');
    px(dx + 5, by - 5, 2, 2, '#3a3330');
    px(dx + 7, by - 3, 2, 1, '#3a3330');
    px(dx + 6, by - 4, 1, 1, '#d9b45a', 0.8);
    px(dx + 1, by - 1, 1, 2, '#2a2420');
    px(dx + 4, by - 1, 1, 2, '#2a2420');
    // cop near kiosk
    const cx = Math.round(A.cop.x), cy = by - 12;
    px(cx, cy + 2, 5, 8, '#2c3446');
    px(cx, cy, 5, 3, '#b0896a');
    px(cx - 1, cy - 1, 7, 1, '#24304a');
    px(cx + 1, cy - 2, 3, 1, '#24304a');
    px(cx + 5, cy + 3, 1, 4, '#1f2636');
    px(cx + 6, cy + 6, 1, 1, '#d9d0b8');
    // bandit near dumpster
    const gx = Math.round(A.banditGuy.x), gyy = by - 12;
    px(gx, gyy + 2, 5, 8, '#17151a');
    px(gx, gyy, 4, 3, '#b0896a');
    px(gx - 1, gyy - 1, 6, 1, '#0d0c11');
    px(gx + 5, gyy + 4, 1, 1, '#f2c14a');
    px(gx + 6, gyy + 5, 1, 1, '#e8752f', Math.sin(A.t * 3) > 0 ? 0.7 : 0.2);
    // pigeons
    for (let i = 0; i < A.pigeons.length; i++) {
      const p = A.pigeons[i];
      const peck = Math.sin(A.t * 3 + p.seed) > 0.7 ? 1 : 0;
      px(p.x, p.y - 2, 3, 2, '#6b6f78');
      px(p.x + 3, p.y - 2 + peck, 1, 1, '#6b6f78');
      px(p.x + 4, p.y - 2 + peck, 1, 1, '#c9a05a');
      px(p.x + 1, p.y, 1, 1, '#4b4f58');
    }
    // bottom rats
    for (let i = 0; i < A.rats.length; i++) {
      const r = A.rats[i];
      if (r.top) continue;
      px(r.x, r.y - 1, 3, 1, '#26242a');
      px(r.x + 3, r.y - 1, 1, 1, '#26242a');
      px(r.x + (r.dir > 0 ? -1 : 4), r.y - 1, 1, 1, '#5a4c52');
      px(r.x + (r.dir > 0 ? 2 : 1), r.y - 2, 1, 1, '#e8c26c', 0.8);
    }
    // smoke
    for (let i = 0; i < A.smoke.length; i++) {
      const s = A.smoke[i];
      const a = clamp(s.life / s.max, 0, 1) * 0.3;
      px(s.x, s.y, s.size + 1, s.size + 1, '#8a8478', a);
    }
  }

  function drawCars() {
    const gy = A.groundY;
    if (A.police.active) {
      const x = Math.round(A.police.x), y = gy + 3;
      px(x, y, 24, 6, '#d9d5c2');
      px(x + 2, y - 3, 18, 4, '#d9d5c2');
      px(x + 4, y - 2, 6, 2, '#2c3446');
      px(x + 12, y - 2, 6, 2, '#2c3446');
      px(x + 3, y + 2, 18, 1, '#2c3446');
      const blink = Math.sin(A.t * 14) > 0;
      px(x + 6, y - 5, 3, 2, blink ? '#4a7fff' : '#1a2a55');
      px(x + 12, y - 5, 3, 2, blink ? '#1a2a55' : '#e04a3a');
      px(x + 1, y + 6, 3, 2, '#111014');
      px(x + 20, y + 6, 3, 2, '#111014');
      px(x - 2, y + 2, 2, 1, '#f2e0a0', 0.6);
    }
    if (A.bandit.active) {
      const x = Math.round(A.bandit.x), y = gy + 4;
      px(x, y, 20, 5, '#0d0c11');
      px(x + 2, y - 3, 16, 4, '#0d0c11');
      px(x + 3, y - 2, 6, 2, '#202b3a');
      px(x + 10, y - 2, 6, 2, '#202b3a');
      px(x + 2, y + 1, 16, 1, '#3a3238');
      px(x + 1, y + 5, 3, 2, '#c9a05a', 0.85);
      px(x + 16, y + 5, 3, 2, '#c9a05a', 0.85);
      px(x + 18, y + 1, 2, 1, '#e04a3a', 0.8);
      px(x - 2, y + 1, 2, 1, '#f2e0a0', 0.4);
    }
  }

  function drawWeather() {
    const w = A.weatherType;
    if (w === 'rain' || w === 'storm') {
      for (let i = 0; i < A.weather.length; i++) {
        const p = A.weather[i];
        px(p.x, p.y, 1, p.len, '#8fa0b8', p.a);
      }
    } else if (w === 'snow') {
      for (let i = 0; i < A.weather.length; i++) {
        const p = A.weather[i];
        px(p.x, p.y, 1, 1, '#dce4f0', p.a);
      }
    } else if (w === 'fog') {
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = 'rgba(150,148,138,.05)';
        ctx.fillRect(0, A.H * 0.3 + i * 20, A.W, 14);
      }
    }
  }

  function draw() {
    if (!A.W) return;
    ctx.clearRect(0, 0, A.W, A.H);
    drawSky();
    drawStars();
    drawClouds();
    drawCity();
    drawCrane();
    drawBirds();
    drawWires();
    drawStreet();
    drawPeople();
    drawCars();
    drawWeather();
    // subtle vignette
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.fillRect(0, 0, A.W, 2);
    ctx.fillRect(0, A.H - 2, A.W, 2);
    ctx.fillRect(0, 0, 2, A.H);
    ctx.fillRect(A.W - 2, 0, 2, A.H);
  }

  window.Ambient = {
    init() {
      resize();
      window.addEventListener('resize', resize);
    },
    update,
    draw,
    resize,
    state: A
  };
})();
