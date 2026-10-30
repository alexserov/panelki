/* ПАНЕЛЬКИ — tower blocks. Main game loop. */
(function () {
  'use strict';

  const W = Art.W;
  const H = Art.H;
  const GROUND = Art.GROUND;
  const PANEL_H = 30;
  const BASE_W = 118;
  const MIN_W = 14;
  const HELD_Y = 64;
  const PROCHNOST_MAX = 3;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const audio = new ChipAudio();

  let best = 0;
  try { best = parseInt(localStorage.getItem('panelki.best') || '0', 10) || 0; } catch (e) { best = 0; }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => {
    if (b === undefined) { b = a; a = 0; }
    return a + Math.random() * (b - a);
  };
  const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const nowSeed = () => ((Math.random() * 0x7fffffff) | 0) ^ ((performance.now() * 1000) | 0);

  const S = {
    mode: 'title',
    t: 0,
    camY: 0,
    panels: [],
    held: null,
    heldDelay: 0,
    falling: null,
    bombs: [],
    particles: [],
    floats: [],
    toasts: [],
    banner: null,
    regime: 'stal',
    weather: 'snow',
    prochnost: PROCHNOST_MAX,
    combo: 0,
    maxFloor: 1,
    weatherTimer: 999,
    regimeTimer: 999,
    bombTimer: 999,
    eventTimer: 999,
    shake: 0,
    flash: 0,
    hitFlash: 0,
    overTimer: 0,
    overReason: '',
    engineer: null,
    roofRat: null,
    groundCats: [],
    groundRats: [],
    homeless: [],
    groundElecs: [],
    stats: null,
    weatherParts: [],
    lightning: 8,
    lastTension: -1,
    lightTimer: 1,
    seed: 1,
    bombDeflectPulse: 0
  };

  function regimeObj() { return Art.REGIMES[S.regime] || Art.REGIMES.stal; }
  function weatherObj() { return Art.WEATHERS[S.weather] || Art.WEATHERS.clear; }

  function freshStats() {
    return {
      rats: 3,
      homeless: 2,
      electricians: 2,
      bombsSwiped: 0,
      bombsHit: 0,
      regimes: 1,
      weathers: 1,
      graffiti: 0,
      windows: 0
    };
  }

  function newSpec(w, level) {
    S.seed = (S.seed * 1103515245 + 12345) & 0x7fffffff;
    return Art.makeSpec(S.seed ^ nowSeed(), w, PANEL_H, level, S.regime, S.weather);
  }

  function topPanel() {
    return S.panels.length ? S.panels[S.panels.length - 1] : null;
  }

  function towerTop() {
    const p = topPanel();
    return p ? p.yBase + p.h : 0;
  }

  function panelScreenY(p) {
    return GROUND - (p.yBase + p.h - S.camY);
  }

  function panelCenterX(p) {
    return p.x + p.w / 2;
  }

  /* ------------------------------------------------------------------ */
  /* Toasts / floating text                                             */
  /* ------------------------------------------------------------------ */

  function addToast(text, color) {
    S.toasts.push({ text: String(text).toUpperCase().slice(0, 52), color: color || '#ded8c4', t: 0, dur: 3.6 });
    if (S.toasts.length > 4) S.toasts.shift();
  }

  function addFloat(text, x, y, color, scale) {
    S.floats.push({ text, x, y, color: color || '#e8e2cf', t: 0, dur: 1.4, scale: scale || 1 });
  }

  function addBanner(title, sub, color, dur) {
    S.banner = { title, sub, color: color || regimeObj().accent, t: 0, dur: dur || 3.4 };
  }

  /* ------------------------------------------------------------------ */
  /* Particles                                                          */
  /* ------------------------------------------------------------------ */

  function particle(o) {
    S.particles.push(Object.assign({
      x: 0, y: 0, vx: 0, vy: 0, life: 1, max: 1, color: '#fff',
      size: 1, grav: 0, grow: 0, alpha: 1
    }, o));
    if (S.particles.length > 420) S.particles.shift();
  }

  function dust(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      particle({
        x: x + rnd(-4, 4), y: y + rnd(-2, 2),
        vx: rnd(-35, 35), vy: rnd(-70, -15),
        life: rnd(0.3, 0.8), max: 0.8,
        color: color || '#b9b5a8', size: rndInt(1, 2), grav: 130
      });
    }
  }

  function explosion(x, y, count) {
    const colors = ['#f2c14a', '#e8752f', '#d94a2a', '#f0e0a0', '#3a332e'];
    for (let i = 0; i < count; i++) {
      const a = rnd(0, Math.PI * 2);
      const sp = rnd(30, 190);
      particle({
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
        life: rnd(0.35, 1.1), max: 1.1,
        color: pick(colors), size: rndInt(1, 3), grav: 210
      });
    }
    for (let i = 0; i < 10; i++) {
      particle({
        x: x + rnd(-8, 8), y: y + rnd(-6, 6),
        vx: rnd(-14, 14), vy: rnd(-42, -8),
        life: rnd(0.8, 1.7), max: 1.7,
        color: '#55524c', size: rndInt(2, 4), grow: rnd(2, 5), alpha: 0.6
      });
    }
  }

  function panelDebris(p) {
    const sy = panelScreenY(p);
    const colors = [p.spec.pal.base, p.spec.pal.dark, p.spec.pal.light, '#2c2a2c'];
    for (let i = 0; i < 18; i++) {
      particle({
        x: p.x + rnd(0, p.w), y: sy + rnd(0, p.h),
        vx: rnd(-70, 70), vy: rnd(-120, -20),
        life: rnd(0.6, 1.6), max: 1.6,
        color: pick(colors), size: rndInt(1, 4), grav: 260
      });
    }
  }

  function smokePuff(x, y) {
    particle({
      x: x + rnd(-5, 5), y: y + rnd(-2, 2),
      vx: rnd(-8, 8), vy: rnd(-34, -12),
      life: rnd(0.8, 1.8), max: 1.8,
      color: '#4a4740', size: rndInt(2, 3), grow: rnd(1.5, 3.5), alpha: 0.5
    });
  }

  /* ------------------------------------------------------------------ */
  /* Setup / scenes                                                     */
  /* ------------------------------------------------------------------ */

  function resetGround() {
    S.groundCats = [
      { x: 290, y: GROUND - 7, dir: -1, speed: 9, seed: 11, pause: 0 },
      { x: 32, y: GROUND - 7, dir: 1, speed: 7, seed: 22, pause: 1 }
    ];
    S.groundRats = [
      { x: 66, y: GROUND - 5, dir: 1, speed: 24, seed: 1 },
      { x: 210, y: GROUND - 5, dir: -1, speed: 18, seed: 2 },
      { x: 300, y: GROUND - 4, dir: -1, speed: 30, seed: 3 }
    ];
    S.homeless = [
      { x: 52, y: GROUND - 18, seed: 3 },
      { x: 266, y: GROUND - 18, seed: 9 }
    ];
    S.groundElecs = [
      { x: 86, seed: 5 },
      { x: 226, seed: 17 }
    ];
  }

  function resetTitle() {
    S.mode = 'title';
    S.t = 0;
    S.camY = 0;
    S.panels = [];
    S.held = null;
    S.heldDelay = 0;
    S.falling = null;
    S.bombs = [];
    S.particles = [];
    S.floats = [];
    S.toasts = [];
    S.banner = null;
    S.regime = 'stal';
    S.weather = 'snow';
    S.prochnost = PROCHNOST_MAX;
    S.combo = 0;
    S.maxFloor = 1;
    S.shake = 0;
    S.flash = 0;
    S.hitFlash = 0;
    S.overTimer = 0;
    S.overReason = '';
    S.engineer = null;
    S.roofRat = null;
    S.stats = freshStats();
    S.weatherTimer = 999;
    S.regimeTimer = 999;
    S.bombTimer = 999;
    S.eventTimer = 999;
    S.lightning = 8;
    S.lastTension = -1;

    resetGround();
    S.seed = nowSeed();

    // small demo tower
    for (let i = 0; i < 4; i++) {
      const spec = newSpec(BASE_W, i);
      if (i === 0) {
        spec.graffiti = [];
        const g = Art.addGraffiti(spec, nowSeed());
        if (!g) spec.graffiti.push({ text: 'ЦОЙ', x: 8, y: spec.h - 9, color: '#cf5555', seed: 3 });
      }
      if (i === 2) Art.addCat(spec, nowSeed());
      if (i === 3) {
        Art.addPlant(spec, nowSeed(), 'geranium');
        Art.addCat(spec, nowSeed());
        spec.antenna = true;
      }
      S.panels.push({ x: 160 - BASE_W / 2, w: BASE_W, h: PANEL_H, yBase: i * PANEL_H, spec });
    }
    initWeatherParts();
  }

  function startGame() {
    audio.init();
    S.mode = 'play';
    S.t = 0;
    S.camY = 0;
    S.panels = [];
    S.held = null;
    S.heldDelay = 0.35;
    S.falling = null;
    S.bombs = [];
    S.particles = [];
    S.floats = [];
    S.toasts = [];
    S.banner = null;
    S.regime = 'stal';
    S.weather = 'clear';
    S.prochnost = PROCHNOST_MAX;
    S.combo = 0;
    S.maxFloor = 1;
    S.shake = 0;
    S.flash = 0;
    S.hitFlash = 0;
    S.overTimer = 0;
    S.overReason = '';
    S.engineer = null;
    S.roofRat = null;
    S.stats = freshStats();
    S.weatherTimer = 30;
    S.regimeTimer = 42;
    S.bombTimer = 15;
    S.eventTimer = 6;
    S.lightning = 6;
    S.lastTension = -1;
    S.bombDeflectPulse = 0;
    S.seed = nowSeed();

    resetGround();
    S.panels.push({
      x: 160 - BASE_W / 2, w: BASE_W, h: PANEL_H, yBase: 0,
      spec: newSpec(BASE_W, 0)
    });

    initWeatherParts();
    audio.setRegime(S.regime);
    audio.setWeather(S.weather);
    audio.setTension(0);
    audio.setScene('play');

    addBanner('СТРОЙКА НАЧАЛАСЬ', regimeObj().name + ' · ' + weatherObj().name, '#c4453f', 3);
    addToast('ПРОБЕЛ / КЛИК — БРОСИТЬ ПАНЕЛЬ', '#a8a294');
    addToast('СВАЙП ВЛЕВО-ВПРАВО — ОТБИТЬ БОМБУ', '#a8a294');
  }

  function makeHeld() {
    const top = topPanel();
    if (!top) return;
    const w = top.w;
    S.held = {
      x: rnd(10, W - 10 - w),
      w,
      h: PANEL_H,
      dir: Math.random() < 0.5 ? -1 : 1,
      speed: 0,
      spec: newSpec(w, S.panels.length)
    };
    if (S.held.x < 8) S.held.x = 8;
    if (S.held.x + w > W - 8) S.held.x = W - 8 - w;
  }

  function initWeatherParts() {
    S.weatherParts = [];
    if (S.weather === 'rain' || S.weather === 'storm') {
      const n = S.weather === 'storm' ? 210 : 135;
      for (let i = 0; i < n; i++) {
        S.weatherParts.push({
          x: rnd(0, W), y: rnd(-H, H),
          len: S.weather === 'storm' ? rnd(4, 12) : rnd(3, 9),
          speed: S.weather === 'storm' ? rnd(340, 540) : rnd(250, 420),
          a: S.weather === 'storm' ? rnd(0.28, 0.68) : rnd(0.2, 0.55),
          wind: S.weather === 'storm' ? 95 : 30
        });
      }
    } else if (S.weather === 'snow') {
      for (let i = 0; i < 110; i++) {
        S.weatherParts.push({
          x: rnd(0, W), y: rnd(-H, H),
          speed: rnd(16, 52), a: rnd(0.4, 1),
          big: Math.random() < 0.3, phase: rnd(0, 6.28), drift: rnd(8, 20)
        });
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Weather / regime                                                   */
  /* ------------------------------------------------------------------ */

  const WEATHER_SUBS = {
    clear: 'ТУЧИ РАСХОДЯТСЯ',
    overcast: 'СЕРЫЙ ДЕНЬ',
    rain: 'ЛУЖИ РАСТУТ',
    snow: 'ДВОР ЗАНОСИТ',
    fog: 'НИЧЕГО НЕ ВИДНО',
    storm: 'ГРОЗА. ДЕРЖИСЬ'
  };

  function changeWeather(force) {
    const options = Art.WEATHER_ORDER.filter((w) => w !== S.weather);
    const next = force || pick(options);
    S.weather = next;
    S.weatherTimer = rnd(28, 46);
    S.stats.weathers++;
    initWeatherParts();
    audio.setWeather(S.weather);
    addBanner('ПОГОДА: ' + weatherObj().name, WEATHER_SUBS[next] || '', '#a8c4d8', 3.2);
    addToast('ПОГОДА СМЕНИЛАСЬ: ' + weatherObj().name, '#a8c4d8');
    if (S.weather === 'storm') {
      S.lightning = rnd(1, 3);
    }
  }

  function changeRegime(force) {
    const options = Art.REGIME_ORDER.filter((r) => r !== S.regime);
    const next = force || pick(options);
    S.regime = next;
    S.regimeTimer = rnd(40, 60);
    S.stats.regimes++;
    audio.setRegime(S.regime);
    audio.fanfare();
    const rg = regimeObj();
    addBanner('СМЕНА КУРСА', rg.name + ' · ' + rg.slogan, rg.accent, 4);
    addToast('НОВЫЙ ЭТАЖ — НОВАЯ ЭПОХА', rg.accent);
    // a new era changes the sky and the music, and sometimes unsettles the house
    if (Math.random() < 0.55) {
      const p = S.panels[rndInt(1, Math.max(1, S.panels.length - 1))];
      if (p) {
        const win = Art.breakWindow(p.spec, nowSeed());
        if (win) addToast('В СМЕНЕ КУРСА РАЗБИЛИ ОКНО', '#c9a05a');
      }
    }
  }

  function breakRandomWindow(text) {
    for (let i = 0; i < 5; i++) {
      const idx = rndInt(0, S.panels.length - 1);
      const p = S.panels[idx];
      if (!p) continue;
      if (Art.breakWindow(p.spec, nowSeed())) {
        if (text) addToast(text, '#c9a05a');
        return true;
      }
    }
    return false;
  }

  /* ------------------------------------------------------------------ */
  /* Actions                                                            */
  /* ------------------------------------------------------------------ */

  function dropPanel() {
    if (S.mode !== 'play' || !S.held) return;
    const h = S.held;
    const worldBottom = S.camY + GROUND - (HELD_Y + h.h);
    S.falling = {
      x: h.x, w: h.w, h: h.h, spec: h.spec,
      worldBottom, vy: 55, vx: 0, tumble: false, life: 2.5
    };
    S.held = null;
    audio.drop();
  }

  function landPanel() {
    const f = S.falling;
    if (!f) return;
    const top = topPanel();
    if (!top) { S.falling = null; return; }

    const topY = top.yBase + top.h;
    const left = Math.max(f.x, top.x);
    const right = Math.min(f.x + f.w, top.x + top.w);
    const overlap = right - left;
    const offset = f.x - top.x;

    if (overlap < 6) {
      missPanel(f, offset);
      return;
    }

    const perfect = Math.abs(offset) <= 2;
    let nx = left;
    let nw = Math.round(overlap);
    if (perfect) { nx = top.x; nw = top.w; }
    if (nw < MIN_W) {
      S.falling = null;
      gameOver('narrow');
      return;
    }

    const spec = perfect ? f.spec : newSpec(nw, S.panels.length);
    S.panels.push({ x: nx, w: nw, h: PANEL_H, yBase: topY, spec });
    S.maxFloor = Math.max(S.maxFloor, S.panels.length);
    S.falling = null;
    S.heldDelay = 0.35;

    const sy = panelScreenY(S.panels[S.panels.length - 1]);
    dust(nx, sy + PANEL_H, 6, spec.pal.light);
    dust(nx + nw, sy + PANEL_H, 6, spec.pal.light);
    audio.land();

    if (perfect) {
      S.combo++;
      audio.perfect();
      addFloat('ИДЕАЛЬНО!', nx + nw / 2, sy - 8, '#7fe0b0', 2);
      if (S.combo > 1 && S.combo % 5 === 0) addToast('ИДЕАЛЬНАЯ КЛАДКА x' + S.combo, '#7fe0b0');
      if (S.combo % 4 === 0 && S.prochnost < PROCHNOST_MAX) {
        S.prochnost++;
        addToast('ЗА КАЧЕСТВО: +1 ПРОЧНОСТЬ', '#7fe0b0');
      }
    } else {
      S.combo = 0;
      audio.shave();
      const cutX = offset > 0 ? nx + nw : nx;
      for (let i = 0; i < 10; i++) {
        particle({
          x: cutX + rnd(-3, 3), y: sy + rnd(0, PANEL_H),
          vx: rnd(-45, 45), vy: rnd(-40, 30),
          life: rnd(0.5, 1.4), max: 1.4,
          color: pick([spec.pal.base, spec.pal.dark, spec.pal.light]),
          size: rndInt(1, 3), grav: 240
        });
      }
      addFloat('СРЕЗ ' + Math.round(Math.abs(offset)), nx + nw / 2, sy - 6, '#c9a05a', 1);
    }

    if (S.panels.length % 10 === 0) {
      audio.fanfare();
      addToast(S.panels.length + ' ЭТАЖЕЙ! ЮБИЛЕЙ.', regimeObj().accent);
      for (let i = 0; i < 24; i++) {
        particle({
          x: nx + rnd(0, nw), y: sy,
          vx: rnd(-90, 90), vy: rnd(-130, -30),
          life: rnd(0.7, 1.6), max: 1.6,
          color: pick(['#e8c26c', '#c4453f', '#7fe0b0', '#a8c4d8']),
          size: rndInt(1, 2), grav: 150
        });
      }
    }
    if (S.panels.length % 15 === 0) changeRegime();

    // electrician climbs up to fix things
    if (S.prochnost < PROCHNOST_MAX && S.panels.length > 2 && Math.random() < 0.2) {
      S.engineer = { idx: S.panels.length - 1, t: 4.2, seed: nowSeed() };
      addToast('ИНЖЕНЕР-ЭЛЕКТРИК ЛЕЗЕТ НА КРЫШУ', '#e0b23c');
    }
  }

  function missPanel(f, offset) {
    f.tumble = true;
    f.vx = (offset >= 0 ? 1 : -1) * rnd(25, 60);
    f.vy = Math.max(f.vy, 70);
    f.life = 2.2;
    S.prochnost--;
    S.combo = 0;
    S.shake = 6;
    audio.crash();
    addToast('МИМО! ПАНЕЛЬ УЛЕТЕЛА ВО ДВОР', '#c9a05a');
    S.heldDelay = 0.8;
    if (S.prochnost <= 0) gameOver('miss');
  }

  function deflectBomb(dir) {
    if (S.mode !== 'play') return false;
    let found = null;
    for (let i = 0; i < S.bombs.length; i++) {
      if (!S.bombs[i].deflected) { found = S.bombs[i]; break; }
    }
    if (!found) return false;
    found.deflected = true;
    found.vx = dir * 320;
    found.vy = Math.max(found.vy, 80);
    if (found.whistle) { found.whistle(); found.whistle = null; }
    audio.swipe();
    S.bombDeflectPulse = 1;
    S.stats.bombsSwiped++;
    addFloat('ОТБИТО!', found.x, found.y - 12, '#7fe0b0', 1);
    return true;
  }

  function spawnBomb() {
    const top = topPanel();
    if (!top) return;
    const cx = panelCenterX(top);
    const x = clamp(cx + rnd(-Math.min(50, top.w / 2), Math.min(50, top.w / 2)), 22, W - 22);
    const whistle = audio.whistleStart();
    S.bombs.push({
      x, y: -18,
      vy: 95 + Math.min(60, S.panels.length * 1.7),
      vx: (cx - x) * 0.03,
      deflected: false,
      t: 0,
      whistle
    });
    audio.warn();
    addToast('БОМБА! СВАЙПНИ ВЛЕВО ИЛИ ВПРАВО', '#ff7a5a');
    S.bombTimer = 13 / Math.max(0.6, regimeObj().bomb) + rnd(2, 7);
  }

  function bombHit(b) {
    if (b.whistle) { b.whistle(); b.whistle = null; }
    audio.explosion();
    audio.setTension(2);
    S.shake = 10;
    S.hitFlash = 1;
    S.stats.bombsHit++;
    explosion(b.x, Math.min(b.y, GROUND - 8), 34);

    if (S.panels.length > 1) {
      const destroyed = S.panels.pop();
      panelDebris(destroyed);
      const top = topPanel();
      if (top) {
        top.spec.fire = Math.max(top.spec.fire, 7);
        Art.addCrack(top.spec, nowSeed());
        Art.addCrack(top.spec, nowSeed());
        Art.breakWindow(top.spec, nowSeed());
        Art.breakWindow(top.spec, nowSeed());
      }
      S.prochnost--;
      addToast('БОМБА СНЕСЛА ВЕРХНИЙ ЭТАЖ: -1 ПРОЧНОСТЬ', '#ff7a5a');
      if (S.engineer) S.engineer = null;
    } else {
      S.prochnost = 0;
      addToast('БОМБА ПОПАЛА В ОСНОВАНИЕ ДОМА', '#ff7a5a');
    }

    if (S.prochnost <= 0) gameOver('bomb');
  }

  function gameOver(reason) {
    if (S.mode !== 'play') return;
    S.mode = 'over';
    S.overReason = reason;
    S.overTimer = 0;
    S.held = null;
    S.falling = null;
    S.engineer = null;
    for (let i = 0; i < S.bombs.length; i++) {
      if (S.bombs[i].whistle) { S.bombs[i].whistle(); S.bombs[i].whistle = null; }
    }
    S.bombs = [];
    const reached = Math.max(S.maxFloor, S.panels.length);
    if (reached > best) {
      best = reached;
      try { localStorage.setItem('panelki.best', String(best)); } catch (e) { /* ignore */ }
    }
    audio.setScene('off');
    audio.gameover();
    audio.setTension(0);
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                             */
  /* ------------------------------------------------------------------ */

  function randomEvent() {
    if (S.panels.length < 2) return;
    const roll = Math.random();
    if (roll < 0.22) graffitiEvent();
    else if (roll < 0.42) windowEvent();
    else if (roll < 0.59) plantEvent();
    else if (roll < 0.74) catEvent();
    else if (roll < 0.84) ratEvent();
    else if (roll < 0.9) homelessEvent();
    else electricianEvent();
  }

  function randomPanel() {
    if (!S.panels.length) return null;
    const idx = rndInt(0, S.panels.length - 1);
    return { p: S.panels[idx], idx };
  }

  function graffitiEvent() {
    for (let attempt = 0; attempt < 5; attempt++) {
      const r = randomPanel();
      if (!r) return;
      const g = Art.addGraffiti(r.p.spec, nowSeed());
      if (g) {
        S.stats.graffiti++;
        addToast('НА ' + (r.idx + 1) + ' ЭТАЖЕ НАПИСАЛИ «' + g.text + '»', '#bb7ad0');
        return;
      }
    }
  }

  function windowEvent() {
    for (let attempt = 0; attempt < 5; attempt++) {
      const r = randomPanel();
      if (!r) return;
      if (Art.breakWindow(r.p.spec, nowSeed())) {
        addToast('НА ' + (r.idx + 1) + ' ЭТАЖЕ РАЗБИЛИ ОКНО', '#8fb4cf');
        return;
      }
    }
  }

  function plantEvent() {
    for (let attempt = 0; attempt < 5; attempt++) {
      const r = randomPanel();
      if (!r) return;
      const p = Art.addPlant(r.p.spec, nowSeed());
      if (p) {
        const names = { ficus: 'ФИКУС', aloe: 'АЛОЭ', geranium: 'ГЕРАНЬ' };
        addToast('НА ' + (r.idx + 1) + ' ЭТАЖЕ ВЫРОС ' + (names[p.type] || 'ЦВЕТОК'), '#7fe0b0');
        return;
      }
    }
  }

  function catEvent() {
    for (let attempt = 0; attempt < 5; attempt++) {
      const r = randomPanel();
      if (!r) return;
      const c = Art.addCat(r.p.spec, nowSeed());
      if (c) {
        audio.meow();
        addToast('КОТ ПЕРЕБРАЛСЯ НА ' + (r.idx + 1) + ' ЭТАЖ', '#e8c26c');
        return;
      }
    }
  }

  function ratEvent() {
    if (S.groundRats.length >= 6) return;
    S.stats.rats++;
    const dir = Math.random() < 0.5 ? 1 : -1;
    S.groundRats.push({
      x: dir > 0 ? -6 : W + 6,
      y: GROUND - rndInt(3, 5),
      dir,
      speed: rnd(18, 36),
      seed: nowSeed() % 999
    });
    audio.squeak();
    addToast('КРЫСЫ ПЕРЕБЕЖАЛИ ДОРОГУ', '#9c9888');
  }

  function homelessEvent() {
    if (S.homeless.length >= 4) return;
    S.stats.homeless++;
    S.homeless.push({ x: Math.random() < 0.5 ? rndInt(14, 80) : rndInt(230, 300), y: GROUND - 18, seed: nowSeed() % 999 });
    addToast('ВО ДВОРЕ ПОЯВИЛСЯ НОВЫЙ ЖИЛЕЦ', '#c9a05a');
  }

  function electricianEvent() {
    if (S.engineer) return;
    if (S.panels.length < 2) return;
    S.engineer = { idx: S.panels.length - 1, t: 4.5, seed: nowSeed() };
    S.stats.electricians++;
    addToast('ИНЖЕНЕР-ЭЛЕКТРИК ПРОВЕРЯЕТ ПРОВОДКУ', '#e0b23c');
  }

  /* ------------------------------------------------------------------ */
  /* Update                                                             */
  /* ------------------------------------------------------------------ */

  function update(dt) {
    S.t += dt;

    if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 16);
    if (S.flash > 0) S.flash = Math.max(0, S.flash - dt * 2.4);
    if (S.hitFlash > 0) S.hitFlash = Math.max(0, S.hitFlash - dt * 1.8);
    if (S.bombDeflectPulse > 0) S.bombDeflectPulse = Math.max(0, S.bombDeflectPulse - dt * 2);

    updateParticles(dt);
    updateToasts(dt);
    updateWeather(dt);
    updateGround(dt);
    updateLights(dt);

    if (S.mode === 'title') return;
    if (S.mode === 'over') {
      S.overTimer += dt;
      return;
    }

    // play
    if (S.banner) {
      S.banner.t += dt;
      if (S.banner.t > S.banner.dur) S.banner = null;
    }

    S.weatherTimer -= dt;
    if (S.weatherTimer <= 0) changeWeather();
    S.regimeTimer -= dt;
    if (S.regimeTimer <= 0) changeRegime();

    S.eventTimer -= dt;
    if (S.eventTimer <= 0) {
      randomEvent();
      S.eventTimer = rnd(5, 9);
    }

    if (S.heldDelay > 0) {
      S.heldDelay -= dt;
      if (S.heldDelay <= 0 && !S.held && S.mode === 'play') makeHeld();
    }

    if (S.held) {
      const boost = S.weather === 'storm' ? 1.4 : S.weather === 'rain' ? 1.18 : 1;
      const speed = (44 + Math.min(76, S.panels.length * 2.4)) * boost;
      S.held.speed = speed;
      S.held.x += S.held.dir * speed * dt;
      const minX = 8;
      const maxX = W - 8 - S.held.w;
      if (S.held.x <= minX) { S.held.x = minX; S.held.dir = 1; }
      if (S.held.x >= maxX) { S.held.x = maxX; S.held.dir = -1; }
      if (S.bombDeflectPulse <= 0 && Math.random() < dt * 0.25) {
        // keep the crane quiet; nothing to do here
      }
    }

    updateFalling(dt);
    updateBombs(dt);
    updateEngineer(dt);
    updateRoofRat(dt);

    // fire / smoke
    for (let i = 0; i < S.panels.length; i++) {
      const p = S.panels[i];
      if (p.spec.fire > 0) {
        p.spec.fire = Math.max(0, p.spec.fire - dt);
        if (Math.random() < dt * 7) smokePuff(p.x + rnd(2, p.w - 2), panelScreenY(p) + 4);
      }
    }

    // camera
    const target = Math.max(0, towerTop() - 172);
    S.camY += (target - S.camY) * Math.min(1, dt * 4.2);
    if (Math.abs(target - S.camY) < 0.2) S.camY = target;

    // lightning
    if (S.weather === 'storm') {
      S.lightning -= dt;
      if (S.lightning <= 0) {
        S.lightning = rnd(2.5, 6.5);
        S.flash = 1;
        audio.thunder(1);
        if (Math.random() < 0.3) breakRandomWindow('МОЛНИЯ РАЗБИЛА ОКНО');
      }
    }

    // bomb spawn
    const activeBomb = S.bombs.some((b) => !b.deflected);
    if (!activeBomb) {
      S.bombTimer -= dt;
      if (S.bombTimer <= 0 && S.held) spawnBomb();
    }

    // music tension
    let tension = 0;
    if (S.prochnost <= 1) tension = 2;
    else if (S.bombs.length || S.hitFlash > 0.2) tension = 1;
    if (tension !== S.lastTension) {
      S.lastTension = tension;
      audio.setTension(tension);
    }
  }

  function updateParticles(dt) {
    for (let i = S.particles.length - 1; i >= 0; i--) {
      const p = S.particles[i];
      p.life -= dt;
      if (p.life <= 0) { S.particles.splice(i, 1); continue; }
      p.vy += (p.grav || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.grow) p.size += p.grow * dt;
    }
    for (let i = S.floats.length - 1; i >= 0; i--) {
      const f = S.floats[i];
      f.t += dt;
      f.y -= 13 * dt;
      if (f.t > f.dur) S.floats.splice(i, 1);
    }
  }

  function updateToasts(dt) {
    // only the two visible toasts age; the rest wait their turn
    for (let i = 0; i < S.toasts.length && i < 2; i++) S.toasts[i].t += dt;
    for (let i = S.toasts.length - 1; i >= 0; i--) {
      if (S.toasts[i].t > S.toasts[i].dur) S.toasts.splice(i, 1);
    }
  }

  function updateWeather(dt) {
    if (S.weather === 'rain' || S.weather === 'storm') {
      for (let i = 0; i < S.weatherParts.length; i++) {
        const p = S.weatherParts[i];
        p.y += p.speed * dt;
        p.x += p.wind * dt;
        if (p.y > H + 12) { p.y = -12; p.x = rnd(0, W); }
        if (p.x > W + 4) p.x -= W + 8;
        if (p.x < -4) p.x += W + 8;
      }
    } else if (S.weather === 'snow') {
      for (let i = 0; i < S.weatherParts.length; i++) {
        const p = S.weatherParts[i];
        p.y += p.speed * dt;
        p.x += (Math.sin(S.t * 1.1 + p.phase) * p.drift + 5) * dt;
        if (p.y > H + 6) { p.y = -6; p.x = rnd(0, W); }
        if (p.x > W + 4) p.x -= W + 8;
        if (p.x < -4) p.x += W + 8;
      }
    }
  }

  function updateLights(dt) {
    S.lightTimer -= dt;
    if (S.lightTimer > 0) return;
    S.lightTimer = rnd(1.2, 4.2);
    if (!S.panels.length) return;
    const p = pick(S.panels);
    if (!p.spec.windows.length) return;
    const w = pick(p.spec.windows);
    if (w.state === 'lit') w.state = 'dark';
    else if (w.state === 'dark' && Math.random() < 0.72) w.state = 'lit';
  }

  function updateGround(dt) {
    for (let i = 0; i < S.groundCats.length; i++) {
      const c = S.groundCats[i];
      if (c.pause > 0) { c.pause -= dt; continue; }
      c.x += c.dir * c.speed * dt;
      if (c.x < 4) { c.x = 4; c.dir = 1; }
      if (c.x > W - 10) { c.x = W - 10; c.dir = -1; }
      if (Math.random() < dt * 0.18) c.pause = rnd(1, 2.5);
      if (Math.random() < dt * 0.018) audio.meow();
    }
    for (let i = 0; i < S.groundRats.length; i++) {
      const r = S.groundRats[i];
      r.x += r.dir * r.speed * dt;
      if (r.x < -8) r.x = W + 8;
      if (r.x > W + 8) r.x = -8;
      if (Math.random() < dt * 0.02) audio.squeak();
    }
  }

  function updateFalling(dt) {
    const f = S.falling;
    if (!f) return;
    if (f.tumble) {
      f.vy += 700 * dt;
      f.worldBottom -= f.vy * dt;
      f.x += f.vx * dt;
      f.life -= dt;
      if (f.life <= 0) S.falling = null;
      return;
    }
    f.vy += 980 * dt;
    const prevBottom = f.worldBottom;
    f.worldBottom -= f.vy * dt;
    if (f.worldBottom <= towerTop()) {
      // don't tunnel through the tower on a slow frame
      f.worldBottom = Math.min(prevBottom, towerTop());
      const wasAbove = prevBottom >= towerTop();
      if (wasAbove) landPanel();
    }
  }

  function updateBombs(dt) {
    for (let i = S.bombs.length - 1; i >= 0; i--) {
      const b = S.bombs[i];
      b.t += dt;
      if (!b.deflected) {
        b.vy += 26 * dt;
        b.y += b.vy * dt;
        b.x += b.vx * dt;
        const top = topPanel();
        if (top) {
          const topScreen = GROUND - (top.yBase + top.h - S.camY);
          if (b.y + 8 >= topScreen) {
            S.bombs.splice(i, 1);
            bombHit(b);
            continue;
          }
        }
        if (b.y > H + 30) {
          S.bombs.splice(i, 1);
          if (b.whistle) { b.whistle(); b.whistle = null; }
        }
      } else {
        b.y += b.vy * dt;
        b.x += b.vx * dt;
        if (b.y > H + 20 && Math.random() < dt * 20) {
          particle({
            x: b.x, y: H - 4, vx: rnd(-30, 30), vy: rnd(-40, -5),
            life: 0.4, max: 0.4, color: '#8a8474', size: 1, grav: 80
          });
        }
        if (b.x < -26 || b.x > W + 26 || b.y > H + 40) {
          explosion(clamp(b.x, 0, W), Math.min(b.y, GROUND), 14);
          if (b.whistle) { b.whistle(); b.whistle = null; }
          S.bombs.splice(i, 1);
        }
      }
    }
  }

  function updateEngineer(dt) {
    if (!S.engineer) return;
    if (S.engineer.idx >= S.panels.length) { S.engineer = null; return; }
    S.engineer.t -= dt;
    if (Math.random() < dt * 3) {
      const p = S.panels[S.engineer.idx];
      const sy = panelScreenY(p);
      particle({
        x: p.x + p.w * 0.6 + rnd(-2, 2), y: sy + rnd(0, 8),
        vx: rnd(-20, 20), vy: rnd(-30, 0),
        life: 0.25, max: 0.25, color: pick(['#fff3b0', '#8ad0e8']), size: 1
      });
    }
    if (S.engineer.t <= 0) {
      if (S.prochnost < PROCHNOST_MAX) {
        S.prochnost++;
        addToast('ЭЛЕКТРИК ПОЧИНИЛ ПРОВОДКУ: +1 ПРОЧНОСТЬ', '#7fe0b0');
        audio.perfect();
      } else {
        addToast('ЭЛЕКТРИК ПРОВЕРИЛ ЩИТОК. ВСЁ В ПОРЯДКЕ', '#e0b23c');
      }
      S.stats.electricians++;
      S.engineer = null;
    }
  }

  function updateRoofRat(dt) {
    if (!S.roofRat) {
      if (S.panels.length > 2 && Math.random() < dt * 0.085) {
        const top = topPanel();
        S.roofRat = { x: top.x + 2, dir: Math.random() < 0.5 ? -1 : 1, life: rnd(3, 5), seed: nowSeed() % 999 };
        addToast('НА КРЫШЕ ЗАМЕТИЛИ КРЫСУ', '#9c9888');
      }
      return;
    }
    const top = topPanel();
    if (!top) { S.roofRat = null; return; }
    S.roofRat.x += S.roofRat.dir * 20 * dt;
    if (S.roofRat.x < top.x - 2 || S.roofRat.x > top.x + top.w) S.roofRat.dir *= -1;
    S.roofRat.life -= dt;
    if (S.roofRat.life <= 0) S.roofRat = null;
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const rg = regimeObj();
    const shakeX = S.shake > 0.2 ? Math.round((Math.random() - 0.5) * S.shake) : 0;
    const shakeY = S.shake > 0.2 ? Math.round((Math.random() - 0.5) * S.shake) : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    Art.drawBackground(ctx, rg, S.weather, S.camY, S.t);
    if (S.mode !== 'over') Art.drawWatermark(ctx, rg, S.t, S.mode);

    // the street lives in world space: it scrolls down and away as the tower grows
    ctx.save();
    ctx.translate(0, S.camY);
    Art.drawGround(ctx, rg, S.weather, S.t, S.camY);
    ctx.restore();

    drawTower();
    drawRoofRat();

    // street life is drawn in front of the building
    ctx.save();
    ctx.translate(0, S.camY);
    drawGroundCreatures();
    ctx.restore();

    if (S.falling) drawFalling();
    if (S.held) {
      Art.drawCrane(ctx, S.t, S.held.x + S.held.w / 2, true, S.held.w);
      Art.drawPanel(ctx, S.held.x, HELD_Y, S.held.w, S.held.h, S.held.spec, S.t, {});
    } else if (S.mode === 'play' || S.mode === 'over') {
      Art.drawCrane(ctx, S.t, W - 40, false, 0);
    }

    drawEngineer();
    drawBombs();
    drawParticles();
    drawFloats();
    drawWeatherOverlay();
    ctx.restore();

    if (S.flash > 0) {
      ctx.fillStyle = 'rgba(225,232,245,' + (S.flash * 0.4).toFixed(2) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (S.hitFlash > 0) {
      ctx.fillStyle = 'rgba(220,70,45,' + (S.hitFlash * 0.24).toFixed(2) + ')';
      ctx.fillRect(0, 0, W, H);
    }

    if (S.mode === 'play') {
      drawHUD();
      drawBombWarning();
      drawToasts();
      drawBanner();
      drawTicker();
    } else if (S.mode === 'title') {
      drawTitle();
    } else {
      drawOver();
    }

    drawGrain();
    Art.drawVignette(ctx);
  }

  function drawTower() {
    for (let i = 0; i < S.panels.length; i++) {
      const p = S.panels[i];
      const sy = panelScreenY(p);
      if (sy > H + 2 || sy + p.h < 0) continue;
      Art.drawPanel(ctx, p.x, sy, p.w, p.h, p.spec, S.t, {
        base: i === 0,
        top: i === S.panels.length - 1
      });
    }
  }

  function drawFalling() {
    const f = S.falling;
    if (!f) return;
    const sy = GROUND - (f.worldBottom + f.h - S.camY);
    if (sy > H + 40) return;
    Art.drawPanel(ctx, f.x, sy, f.w, f.h, f.spec, S.t, {});
  }

  function drawGroundCreatures() {
    for (let i = 0; i < S.homeless.length; i++) {
      const hm = S.homeless[i];
      Art.drawHomeless(ctx, hm.x, hm.y, hm.seed, S.t);
    }
    for (let i = 0; i < S.groundElecs.length; i++) {
      Art.drawElectrician(ctx, S.groundElecs[i].x, GROUND - 13, S.groundElecs[i].seed, S.t);
    }
    for (let i = 0; i < S.groundCats.length; i++) {
      const c = S.groundCats[i];
      Art.drawCat(ctx, c.x, c.y, c, S.t);
    }
    for (let i = 0; i < S.groundRats.length; i++) {
      const r = S.groundRats[i];
      Art.drawRat(ctx, r.x, r.y, r.seed, S.t, r.dir);
    }
  }

  function drawRoofRat() {
    if (!S.roofRat) return;
    const top = topPanel();
    if (!top) return;
    const sy = panelScreenY(top);
    Art.drawRat(ctx, S.roofRat.x, sy - 4, S.roofRat.seed, S.t, S.roofRat.dir);
  }

  function drawEngineer() {
    if (!S.engineer) return;
    const p = S.panels[S.engineer.idx];
    if (!p) return;
    const sy = panelScreenY(p);
    Art.drawElectrician(ctx, p.x + p.w * 0.62, sy - 11, S.engineer.seed, S.t);
  }

  function drawBombs() {
    for (let i = 0; i < S.bombs.length; i++) {
      const b = S.bombs[i];
      const p = topPanel();
      const topScreen = p ? GROUND - (p.yBase + p.h - S.camY) : H;
      if (!b.deflected) {
        // dashed targeting line down to the house
        ctx.fillStyle = 'rgba(230,70,50,.32)';
        for (let yy = Math.max(30, b.y + 13); yy < topScreen; yy += 4) {
          ctx.fillRect(Math.round(b.x), Math.round(yy), 1, 2);
        }
        // if the bomb is still in the HUD/crane band, mark where it comes from
        if (b.y < 58) {
          const mx = Math.round(b.x);
          const blink = Math.sin(S.t * 14) > 0;
          ctx.fillStyle = blink ? '#ff6a4a' : '#a83a2c';
          for (let i = 0; i < 5; i++) {
            ctx.fillRect(mx - 2 + i, 31 + i, 5 - i * 2, 1);
          }
        }
        // target reticle
        ctx.fillStyle = 'rgba(230,70,50,.35)';
        ctx.fillRect(Math.round(b.x) - 4, Math.round(topScreen), 9, 1);
        ctx.fillRect(Math.round(b.x), Math.round(topScreen) - 4, 1, 9);
      }
      Art.drawBomb(ctx, b.x, b.y, S.t, b.deflected ? b.vx : 0, b.deflected ? 0 : b.vy);
    }
  }

  function drawParticles() {
    for (let i = 0; i < S.particles.length; i++) {
      const p = S.particles[i];
      const a = clamp(p.life / p.max, 0, 1) * (p.alpha || 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.max(1, Math.round(p.size)), Math.max(1, Math.round(p.size)));
    }
    ctx.globalAlpha = 1;
  }

  function drawFloats() {
    for (let i = 0; i < S.floats.length; i++) {
      const f = S.floats[i];
      const a = clamp(1 - f.t / f.dur, 0, 1);
      BMFont.draw(ctx, f.text, f.x, f.y, {
        scale: f.scale, align: 'center', color: f.color, alpha: a, shadow: '#050508', spacing: 1
      });
    }
  }

  function drawWeatherOverlay() {
    if (S.weather === 'rain' || S.weather === 'storm') {
      Art.drawRain(ctx, S.weatherParts, S.t);
    } else if (S.weather === 'snow') {
      Art.drawSnow(ctx, S.weatherParts);
    }
    if (S.weather === 'fog') Art.drawFog(ctx, S.t, S.camY);
    if (S.weather === 'overcast') {
      ctx.fillStyle = 'rgba(40,42,52,.12)';
      ctx.fillRect(0, 0, W, H);
    }
  }

  /* ------------------------------------------------------------------ */
  /* UI                                                                 */
  /* ------------------------------------------------------------------ */

  function drawHUD() {
    ctx.fillStyle = 'rgba(7,7,11,.74)';
    ctx.fillRect(0, 0, W, 30);
    ctx.fillStyle = 'rgba(220,214,190,.13)';
    ctx.fillRect(0, 30, W, 1);

    BMFont.draw(ctx, 'ЭТАЖ ' + S.panels.length, 6, 5, { scale: 1, color: '#e8e2cf' });
    BMFont.draw(ctx, 'РЕКОРД ' + Math.max(best, S.maxFloor, S.panels.length), 6, 16, { scale: 1, color: '#8f8b7e' });

    BMFont.draw(ctx, 'ПРОЧНОСТЬ', W / 2, 4, { scale: 1, color: '#9c9888', align: 'center' });
    const iconsX = W / 2 - 13;
    for (let i = 0; i < PROCHNOST_MAX; i++) {
      const x = iconsX + i * 10;
      const on = i < S.prochnost;
      ctx.fillStyle = on ? '#c9c3b0' : '#33323a';
      ctx.fillRect(x, 15, 8, 5);
      ctx.fillStyle = on ? '#8a8474' : '#26252c';
      ctx.fillRect(x + 1, 16, 2, 1);
      ctx.fillRect(x + 4, 17, 2, 1);
      ctx.fillStyle = '#141318';
      ctx.fillRect(x, 20, 8, 1);
    }

    const rg = regimeObj();
    BMFont.draw(ctx, rg.name, W - 6, 4, { scale: 1, color: rg.accent, align: 'right' });
    BMFont.draw(ctx, weatherObj().name, W - 6, 16, { scale: 1, color: '#a8b4c4', align: 'right' });

    if (audio.muted) {
      BMFont.draw(ctx, 'ЗВУК ВЫКЛ', W / 2, 21, { scale: 1, color: '#6a665c', align: 'center' });
    }
  }

  function drawToasts() {
    let y = 44;
    const shown = Math.min(2, S.toasts.length);
    for (let i = 0; i < shown; i++) {
      const t = S.toasts[i];
      const a = Math.min(1, t.t * 6, (t.dur - t.t) * 2);
      if (a <= 0) continue;
      const w = BMFont.measure(t.text, 1, 1);
      ctx.fillStyle = 'rgba(7,7,11,' + (0.86 * a).toFixed(2) + ')';
      ctx.fillRect(W / 2 - w / 2 - 4, y - 3, w + 8, 11);
      BMFont.draw(ctx, t.text, W / 2, y, {
        scale: 1, color: t.color, align: 'center', alpha: a, shadow: '#000'
      });
      y += 12;
    }
  }

  function drawBanner() {
    if (!S.banner) return;
    if (S.bombs.some((b) => !b.deflected)) return;
    const b = S.banner;
    const a = Math.min(1, b.t * 4, (b.dur - b.t) * 2);
    if (a <= 0) return;
    ctx.fillStyle = 'rgba(6,6,10,' + (0.78 * a).toFixed(2) + ')';
    ctx.fillRect(0, 158, W, 29);
    ctx.fillStyle = b.color;
    ctx.globalAlpha = a;
    ctx.fillRect(0, 158, W, 1);
    ctx.fillRect(0, 186, W, 1);
    ctx.globalAlpha = 1;
    BMFont.draw(ctx, b.title, W / 2, 161, {
      scale: 2, color: '#efe9d6', align: 'center', alpha: a, shadow: '#000', spacing: 1
    });
    BMFont.draw(ctx, b.sub, W / 2, 177, {
      scale: 1, color: b.color, align: 'center', alpha: a
    });
  }

  function drawBombWarning() {
    const active = S.bombs.some((b) => !b.deflected);
    if (!active) return;
    const pulse = 0.55 + 0.45 * Math.abs(Math.sin(S.t * 9));
    // pulsing red border, but the centre stays clear so the bomb is visible
    ctx.fillStyle = 'rgba(235,80,55,' + (0.55 * pulse).toFixed(2) + ')';
    ctx.fillRect(0, 30, 3, H - 44);
    ctx.fillRect(W - 3, 30, 3, H - 44);
    ctx.fillRect(0, H - 14, W, 2);
    ctx.fillStyle = 'rgba(70,10,10,' + (0.07 * pulse).toFixed(2) + ')';
    ctx.fillRect(3, 30, W - 6, H - 44);

    const label = 'СВАЙП!';
    const lw = BMFont.measure(label, 2, 1);
    ctx.fillStyle = 'rgba(50,6,6,' + (0.66 * pulse).toFixed(2) + ')';
    ctx.fillRect(W / 2 - lw / 2 - 5, 156, lw + 10, 17);
    BMFont.draw(ctx, label, W / 2, 160, {
      scale: 2, color: '#ff7a5a', align: 'center', alpha: pulse, shadow: '#000'
    });
    BMFont.draw(ctx, '<', 10, 158, { scale: 3, color: '#ff7a5a', alpha: pulse });
    BMFont.draw(ctx, '>', W - 26, 158, { scale: 3, color: '#ff7a5a', alpha: pulse });
    BMFont.draw(ctx, 'ВЛЕВО ИЛИ ВПРАВО', W / 2, 175, {
      scale: 1, color: '#ffb0a0', align: 'center', alpha: pulse, shadow: '#3a0c0c'
    });
  }

  function drawTicker() {
    const rg = regimeObj();
    const news = rg.news;
    const txt = rg.slogan + ' · ' + news.join(' · ') + ' · ';
    const tw = BMFont.measure(txt, 1, 1);
    ctx.fillStyle = 'rgba(7,7,11,.7)';
    ctx.fillRect(0, H - 14, W, 14);
    ctx.fillStyle = 'rgba(220,214,190,.1)';
    ctx.fillRect(0, H - 14, W, 1);
    const x = W - ((S.t * 18) % (tw + W));
    BMFont.draw(ctx, txt, x, H - 11, { scale: 1, color: rg.accent, alpha: 0.65, spacing: 1 });
  }

  function drawTitle() {
    BMFont.draw(ctx, 'ПАНЕЛЬКИ', W / 2, 24, {
      scale: 3, spacing: 2, color: '#e8e2cf', align: 'center', shadow: '#000', alpha: 0.96
    });
    BMFont.draw(ctx, 'ИГРА ПРО ДОМ, БОМБЫ И ПОГОДУ', W / 2, 52, {
      scale: 1, color: '#b9b19b', align: 'center', alpha: 0.9
    });
    BMFont.draw(ctx, '8 БИТ · ОДИН ДОМ · ВСЯ ЭПОХА', W / 2, 63, {
      scale: 1, color: '#7f7a6c', align: 'center', alpha: 0.8
    });

    // small today's weather line
    BMFont.draw(ctx, 'СЕГОДНЯ: ' + regimeObj().name + ' · ' + weatherObj().name, 8, 9, {
      scale: 1, color: regimeObj().accent, alpha: 0.7
    });
    BMFont.draw(ctx, (audio.muted ? 'ЗВУК ВЫКЛ' : 'ЗВУК ВКЛ'), W - 8, 9, {
      scale: 1, color: '#7f7a6c', align: 'right', alpha: 0.7
    });

    if (best > 0) {
      BMFont.draw(ctx, 'РЕКОРД: ' + best, W / 2, 166, {
        scale: 1, color: '#c9a05a', align: 'center', alpha: 0.9
      });
    }
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(S.t * 2.6));
    BMFont.draw(ctx, 'НАЖМИ ПРОБЕЛ', W / 2, 180, {
      scale: 2, color: '#e8e2cf', align: 'center', shadow: '#000', alpha: pulse
    });
    BMFont.draw(ctx, 'ИЛИ КОСНИСЬ ЭКРАНА', W / 2, 198, {
      scale: 1, color: '#9c9888', align: 'center'
    });
    BMFont.draw(ctx, 'ПРОБЕЛ / КЛИК — БРОСИТЬ ПАНЕЛЬ', W / 2, 212, {
      scale: 1, color: '#8f8b7e', align: 'center'
    });
    BMFont.draw(ctx, 'СВАЙП ВЛЕВО ИЛИ ВПРАВО — ОТБИТЬ БОМБУ', W / 2, 224, {
      scale: 1, color: '#8f8b7e', align: 'center'
    });
    BMFont.draw(ctx, 'ПОГОДА И КУРС МЕНЯЮТСЯ САМИ', W / 2, 236, {
      scale: 1, color: '#6f6a5e', align: 'center'
    });
  }

  function overReasonText(reason) {
    switch (reason) {
      case 'bomb': return 'ПРОЧНОСТЬ ИСЧЕРПАНА';
      case 'collapse': return 'ДОМ НЕ ВЫДЕРЖАЛ';
      case 'miss': return 'ПАНЕЛЬ УЛЕТЕЛА ВО ДВОР';
      case 'narrow': return 'СТЕНА СТАЛА СЛИШКОМ ТОНКОЙ';
      default: return 'СТРОЙКА ОСТАНОВЛЕНА';
    }
  }

  function countHouse() {
    let cats = 0, plants = 0, graffiti = 0, broken = 0;
    let ficus = 0, aloe = 0, geranium = 0;
    let panelRats = 0, panelElecs = 0;
    for (let i = 0; i < S.panels.length; i++) {
      const spec = S.panels[i].spec;
      cats += spec.cats.length;
      if (spec.roofCat) cats++;
      plants += spec.plants.length;
      graffiti += spec.graffiti.length;
      if (spec.panelRat) panelRats++;
      if (spec.electrician) panelElecs++;
      for (let j = 0; j < spec.plants.length; j++) {
        if (spec.plants[j].type === 'ficus') ficus++;
        else if (spec.plants[j].type === 'aloe') aloe++;
        else geranium++;
      }
      for (let j = 0; j < spec.windows.length; j++) {
        if (spec.windows[j].state === 'broken') broken++;
      }
    }
    cats += S.groundCats.length;
    return { cats, plants, graffiti, broken, ficus, aloe, geranium, panelRats, panelElecs };
  }

  function drawOver() {
    const rg = regimeObj();
    ctx.fillStyle = 'rgba(5,5,9,.78)';
    ctx.fillRect(0, 0, W, H);

    // keep the director credit visible on the end screen too
    Art.drawWatermark(ctx, rg, S.t, 'over');

    const house = countHouse();
    BMFont.draw(ctx, 'ДОМ СЛОЖИЛСЯ', W / 2, 38, {
      scale: 2, color: '#e8e2cf', align: 'center', shadow: '#000'
    });
    BMFont.draw(ctx, overReasonText(S.overReason), W / 2, 60, {
      scale: 1, color: rg.accent, align: 'center'
    });
    BMFont.draw(ctx, 'ЭТАЖЕЙ ' + S.panels.length + ' · РЕКОРД ' + best, W / 2, 76, {
      scale: 1, color: '#c9a05a', align: 'center'
    });

    BMFont.draw(ctx, 'В ДОМЕ ЖИЛИ:', W / 2, 168, {
      scale: 1, color: '#ded8c4', align: 'center'
    });
    BMFont.draw(ctx, 'КОТЫ ' + house.cats + ' · ФИКУСЫ ' + house.ficus + ' · АЛОЭ ' + house.aloe + ' · ГЕРАНИ ' + house.geranium, W / 2, 180, {
      scale: 1, color: '#9c9888', align: 'center'
    });
    BMFont.draw(ctx, 'КРЫСЫ ' + (S.stats.rats + house.panelRats) + ' · БОМЖИ ' + S.stats.homeless + ' · ЭЛЕКТРИКИ ' + (S.stats.electricians + house.panelElecs), W / 2, 192, {
      scale: 1, color: '#9c9888', align: 'center'
    });
    BMFont.draw(ctx, 'ГРАФФИТИ ' + house.graffiti + ' · РАЗБИТЫХ ОКОН ' + house.broken, W / 2, 204, {
      scale: 1, color: '#9c9888', align: 'center'
    });
    BMFont.draw(ctx, 'ОТБИТО БОМБ ' + S.stats.bombsSwiped + ' · ПОПАДАНИЙ ' + S.stats.bombsHit, W / 2, 216, {
      scale: 1, color: '#c9a05a', align: 'center'
    });
    BMFont.draw(ctx, 'СМЕН КУРСА ' + Math.max(0, S.stats.regimes - 1) + ' · СМЕН ПОГОДЫ ' + Math.max(0, S.stats.weathers - 1), W / 2, 228, {
      scale: 1, color: '#8f8b7e', align: 'center'
    });

    if (S.overTimer > 0.9) {
      const pulse = 0.6 + 0.4 * Math.abs(Math.sin(S.t * 2.8));
      ctx.fillStyle = 'rgba(5,5,9,.72)';
      ctx.fillRect(W / 2 - 112, 246, 224, 12);
      BMFont.draw(ctx, 'ПРОБЕЛ / КОСНИСЬ — НОВЫЙ ДОМ', W / 2, 250, {
        scale: 1, color: '#e8e2cf', align: 'center', shadow: '#000', alpha: pulse
      });
    }
    BMFont.draw(ctx, 'ПАНЕЛЬКИ · 8 БИТ · ЛЕНФИЛЬМ 1985', W / 2, 266, {
      scale: 1, color: '#56534a', align: 'center'
    });
  }

  function drawGrain() {
    ctx.fillStyle = 'rgba(255,255,255,.035)';
    for (let i = 0; i < 22; i++) {
      ctx.fillRect(rndInt(0, W - 1), rndInt(0, H - 1), 1, 1);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Input                                                              */
  /* ------------------------------------------------------------------ */

  let ptr = null;

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height)
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { audio.init(); } catch (err) { /* ignore */ }
    const pos = canvasPos(e);
    if (S.mode === 'title') {
      startGame();
      return;
    }
    if (S.mode === 'over') {
      if (S.overTimer > 0.9) startGame();
      return;
    }
    ptr = { x: pos.x, y: pos.y, swiped: false, moved: false, id: e.pointerId };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });

  window.addEventListener('pointermove', (e) => {
    if (!ptr) return;
    const pos = canvasPos(e);
    const dx = pos.x - ptr.x;
    if (Math.abs(dx) > 8) ptr.moved = true;
    if (!ptr.swiped && Math.abs(dx) >= 20 && S.bombs.some((b) => !b.deflected)) {
      deflectBomb(dx > 0 ? 1 : -1);
      ptr.swiped = true;
    }
  });

  window.addEventListener('pointerup', (e) => {
    if (!ptr) return;
    const pos = canvasPos(e);
    const dist = Math.hypot(pos.x - ptr.x, pos.y - ptr.y);
    if (!ptr.swiped && dist < 14 && !ptr.moved) {
      dropPanel();
    }
    ptr = null;
  });

  window.addEventListener('pointercancel', () => { ptr = null; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    const key = e.key;
    const isSpace = key === ' ' || key === 'Spacebar' || key === 'Enter';
    const isLeft = key === 'ArrowLeft' || key === 'a' || key === 'A' || key === 'ф' || key === 'Ф';
    const isRight = key === 'ArrowRight' || key === 'd' || key === 'D' || key === 'в' || key === 'В';
    if (isSpace || isLeft || isRight) e.preventDefault();
    try { audio.init(); } catch (err) { /* ignore */ }

    if (key === 'm' || key === 'M' || key === 'ь' || key === 'Ь') {
      const muted = audio.toggleMute();
      addToast(muted ? 'ЗВУК ВЫКЛЮЧЕН' : 'ЗВУК ВКЛЮЧЕН', '#a8c4d8');
      return;
    }

    if (S.mode === 'title') {
      if (isSpace) startGame();
      return;
    }
    if (S.mode === 'over') {
      if (isSpace && S.overTimer > 0.9) startGame();
      return;
    }

    if (isLeft) deflectBomb(-1);
    else if (isRight) deflectBomb(1);
    else if (isSpace) dropPanel();
  });

  /* ------------------------------------------------------------------ */
  /* Resize / boot                                                      */
  /* ------------------------------------------------------------------ */

  function fit() {
    const mobile = window.innerWidth < 560;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const maxW = window.innerWidth - (mobile ? 8 : 28);
    const maxH = window.innerHeight - (standalone ? 16 : mobile ? 16 : 58);
    let scale = Math.min(maxW / W, maxH / H);
    if (scale >= 2) scale = Math.floor(scale);
    else scale = Math.max(0.55, Math.floor(scale * 20) / 20);
    canvas.style.width = Math.round(W * scale) + 'px';
    canvas.style.height = Math.round(H * scale) + 'px';
  }

  window.addEventListener('resize', fit);

  let last = performance.now();
  function frame(ts) {
    const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000));
    last = ts;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  resetTitle();
  fit();
  requestAnimationFrame(frame);

  // expose for debugging / evidence / automated screenshots
  window.__PANELKI = {
    S, startGame, resetTitle, deflectBomb, dropPanel, gameOver,
    changeWeather, changeRegime, spawnBomb, makeHeld, initWeatherParts,
    countHouse, audio, Art
  };
})();
