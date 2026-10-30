/* ПАНЕЛЬКИ — procedural pixel art: panel houses, city, weather, people, animals. */
(function () {
  'use strict';

  const W = 320;
  const H = 400;
  const GROUND = 368;

  /* ------------------------------------------------------------------ */
  /* Regimes & weather                                                   */
  /* ------------------------------------------------------------------ */

  const REGIMES = {
    stal: {
      id: 'stal', name: 'ЗАСТОЙ', slogan: 'СЛАВА ТРУДУ!',
      sky: ['#12111d', '#241e2d', '#3d2b36'], accent: '#c4453f', accent2: '#8f8a76',
      news: ['ПЛАН ВЫПОЛНЕН НА 104%', 'НОВЫЙ ДОМ СДАН ДОСРОЧНО', 'ПАРТИЯ РЕКОМЕНДУЕТ СТРОИТЬ ВЫШЕ', 'ТЕЛЕВИЗОР РАБОТАЕТ В ШТАТНОМ РЕЖИМЕ'],
      lit: 0.36, graffiti: 0.18, broken: 0.05, bomb: 1.0
    },
    ottepel: {
      id: 'ottepel', name: 'ОТТЕПЕЛЬ', slogan: 'МИР! ТРУД! МАЙ!',
      sky: ['#1b1730', '#3b2a3e', '#81503f'], accent: '#e0a05a', accent2: '#d6c9a8',
      news: ['КУКУРУЗА СНОВА В МОДЕ', 'СТИХИ ЧИТАЮТ ВСЛУХ', 'ОКНА ОТКРЫТЫ ВЕСНЕ', 'НОВАЯ ПЕСНЯ О ГЛАВНОМ'],
      lit: 0.46, graffiti: 0.14, broken: 0.04, bomb: 0.8
    },
    perestroika: {
      id: 'perestroika', name: 'ПЕРЕСТРОЙКА', slogan: 'ГЛАСНОСТЬ! УСКОРЕНИЕ!',
      sky: ['#101a2e', '#293c55', '#5d6a76'], accent: '#e6dfc5', accent2: '#92a8b8',
      news: ['ГЛАСНОСТЬ НЕ ОТМЕНЯЕТСЯ', 'КООПЕРАТИВ ОТКРЫЛ ПЕРВЫЙ ЛАРЁК', 'НАДО СТРОИТЬ БЫСТРЕЕ', 'ПРАВДА ГДЕ-ТО РЯДОМ'],
      lit: 0.42, graffiti: 0.22, broken: 0.06, bomb: 1.0
    },
    devyan: {
      id: 'devyan', name: 'ЛИХИЕ 90-Е', slogan: 'ВСЁ ПРОДАЁТСЯ',
      sky: ['#160f18', '#2c1520', '#4f2126'], accent: '#d8353a', accent2: '#c99b4a',
      news: ['ВАУЧЕРЫ ОБМЕНЯНЫ НА ВОДКУ', 'КООПЕРАТИВ «ЗАРЯ» ЖДЁТ ВАС', 'БОМБА НЕ ПРОШЛА ПРОВЕРКУ', 'СТРЕЛОЧНИКИ НЕ ДРЕМЛЮТ'],
      lit: 0.26, graffiti: 0.34, broken: 0.15, bomb: 1.5
    },
    stabil: {
      id: 'stabil', name: 'СТАБИЛЬНОСТЬ', slogan: 'ДОРОЖАЕМ СТАБИЛЬНОСТЬЮ',
      sky: ['#111722', '#1e2a3a', '#3f4a59'], accent: '#7fa8c9', accent2: '#b7c2cd',
      news: ['ВСЁ ПО ПЛАНУ', 'ТРУБА ПРОЛОЖЕНА ВОВРЕМЯ', 'РОСТ НАЛИЦО', 'НЕ РАСКАЧИВАЙТЕ ЛОДКУ'],
      lit: 0.5, graffiti: 0.1, broken: 0.04, bomb: 1.15
    },
    glasnost: {
      id: 'glasnost', name: 'ГЛАСНОСТЬ', slogan: 'ГОВОРИ ГРОМЧЕ!',
      sky: ['#1a2030', '#344a5a', '#737e73'], accent: '#e6d27a', accent2: '#a9c0c9',
      news: ['МОЖНО ГОВОРИТЬ', 'ГАЗЕТА ВЫШЛА БЕЗ КУПЮР', 'СПОР В ЭФИРЕ', 'СЛУШАЙТЕ ДРУГ ДРУГА'],
      lit: 0.48, graffiti: 0.26, broken: 0.06, bomb: 0.95
    },
    anarchy: {
      id: 'anarchy', name: 'АНАРХИЯ', slogan: 'ДОЛОЙ!',
      sky: ['#100d16', '#2c172c', '#5a2d36'], accent: '#e05a2b', accent2: '#d0c04a',
      news: ['ВЛАСТИ НЕТ — СТРОЙКА ИДЁТ', 'ВСЁ ОБЩЕЕ', 'БОМБЫ БЕСПЛАТНЫ', 'ДОЛОЙ ВСЁ'],
      lit: 0.3, graffiti: 0.4, broken: 0.18, bomb: 1.7
    }
  };

  const REGIME_ORDER = ['stal', 'ottepel', 'perestroika', 'devyan', 'stabil', 'glasnost', 'anarchy'];

  const WEATHERS = {
    clear: { id: 'clear', name: 'ЯСНО', wind: 0.2 },
    overcast: { id: 'overcast', name: 'ПАСМУРНО', wind: 0.6 },
    rain: { id: 'rain', name: 'ДОЖДЬ', wind: 1.0 },
    snow: { id: 'snow', name: 'СНЕГ', wind: 0.7 },
    fog: { id: 'fog', name: 'ТУМАН', wind: 0.3 },
    storm: { id: 'storm', name: 'ГРОЗА', wind: 2.0 }
  };

  const WEATHER_ORDER = ['clear', 'overcast', 'rain', 'snow', 'fog', 'storm'];

  const PALETTES = [
    { base: '#8f8d87', dark: '#66645f', light: '#aba89f', seam: '#7d7a73', brick: false },
    { base: '#b3a184', dark: '#84765e', light: '#cbb99a', seam: '#9c8c72', brick: false },
    { base: '#85978d', dark: '#60736a', light: '#9fb1a6', seam: '#74877d', brick: false },
    { base: '#9c6e5e', dark: '#734e42', light: '#b68875', seam: '#855c4d', brick: true },
    { base: '#8e96a5', dark: '#68707e', light: '#a7aebb', seam: '#7a8291', brick: false },
    { base: '#a4978a', dark: '#7b7066', light: '#bcb0a2', seam: '#8b7f73', brick: false }
  ];

  const TAGS_LONG = ['ЦОЙ', 'КИНО', 'АЛИСА', 'СПАСИ', '1984', 'ДОМ', 'ЖИЗНЬ', 'БАЛАБАНОВ', 'НАДЕЖДА', 'ВЫХОД', 'СВОБОДА', 'НЕ СПИ'];
  const TAGS_SHORT = ['ЦОЙ', 'КИНО', 'ДОМ', '1984', 'СПАСИ', 'ВЫХОД', 'АЛИСА'];
  const TAG_COLORS = ['#cf5555', '#5b86cf', '#cfc255', '#65c68e', '#d3d0c4', '#bb7ad0', '#d08050'];

  const WINDOW_LIT = ['#e8c26c', '#f2d88f', '#d9a955'];
  const WINDOW_DARK = ['#131820', '#1a222c'];
  const WINDOW_FRAME = '#2b2a2c';
  const WINDOW_SILL = '#b8b4a6';

  /* ------------------------------------------------------------------ */
  /* utils                                                               */
  /* ------------------------------------------------------------------ */

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

  function pick(r, arr) { return arr[Math.floor(r() * arr.length) % arr.length]; }

  function hexToRgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }

  function rgbToHex(c) {
    const t = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return '#' + t(c[0]) + t(c[1]) + t(c[2]);
  }

  function mix(a, b, t) {
    const ca = hexToRgb(a), cb = hexToRgb(b);
    return rgbToHex([ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t]);
  }

  function shade(a, amt) {
    const c = hexToRgb(a);
    return rgbToHex([c[0] + amt, c[1] + amt, c[2] + amt]);
  }

  const skyCache = {};
  function skyColors(regime, weather) {
    const key = regime.id + weather;
    if (skyCache[key]) return skyCache[key];
    let top = regime.sky[0], mid = regime.sky[1], bot = regime.sky[2];
    if (weather === 'overcast') {
      top = mix(top, '#34343d', 0.5); mid = mix(mid, '#484851', 0.55); bot = mix(bot, '#5b5b60', 0.5);
    } else if (weather === 'rain') {
      top = mix(top, '#141c28', 0.55); mid = mix(mid, '#24303e', 0.55); bot = mix(bot, '#3b4652', 0.55);
    } else if (weather === 'snow') {
      top = mix(top, '#48546a', 0.55); mid = mix(mid, '#6b778c', 0.5); bot = mix(bot, '#9aa4b4', 0.55);
    } else if (weather === 'fog') {
      top = mix(top, '#4a4a46', 0.45); mid = mix(mid, '#64645c', 0.5); bot = mix(bot, '#7a786c', 0.5);
    } else if (weather === 'storm') {
      top = mix(top, '#0a0912', 0.55); mid = mix(mid, '#161225', 0.55); bot = mix(bot, '#2a1d2c', 0.5);
    }
    const out = { top, mid, bot };
    skyCache[key] = out;
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Panel specs                                                         */
  /* ------------------------------------------------------------------ */

  const WIN_W = 6;
  const WIN_H = 7;
  const GAP_X = 4;
  const ROWS = 2;

  function makeSpec(seed, w, h, level, regimeId, weather) {
    const regime = REGIMES[regimeId] || REGIMES.stal;
    const r = rng(seed ^ (w * 7919) ^ (level * 104729));
    const pal = pick(r, PALETTES);
    const cols = Math.max(1, Math.floor((w - 8) / (WIN_W + GAP_X)));
    const gridW = cols * WIN_W + (cols - 1) * GAP_X;
    const startX = Math.max(2, Math.floor((w - gridW) / 2));
    const startY = 4;

    let litChance = regime.lit;
    if (weather === 'snow') litChance += 0.14;
    if (weather === 'storm') litChance -= 0.05;
    if (weather === 'rain') litChance += 0.08;
    litChance = Math.max(0.12, Math.min(0.7, litChance));

    const brokenChance = regime.broken + (weather === 'storm' ? 0.1 : 0) + (weather === 'snow' ? 0.01 : 0);
    const dirtyChance = 0.14 + (weather === 'rain' || weather === 'fog' ? 0.12 : 0);

    const windows = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < cols; col++) {
        const roll = r();
        let state = 'dark';
        if (roll < litChance) state = 'lit';
        else if (roll < litChance + 0.14) state = 'curtain';
        else if (roll < litChance + 0.14 + dirtyChance) state = 'dirty';
        else if (roll < litChance + 0.14 + dirtyChance + brokenChance) state = 'broken';
        else if (roll < litChance + 0.14 + dirtyChance + brokenChance + 0.12) state = 'boarded';
        windows.push({
          col, row,
          x: startX + col * (WIN_W + GAP_X),
          y: startY + row * (WIN_H + 3),
          state,
          seed: Math.floor(r() * 99999),
          person: r() < 0.14,
          curtainColor: pick(r, ['#b88a52', '#a86a4e', '#8c8c76', '#b0a06a'])
        });
      }
    }

    const spec = {
      w, h, pal, cols, rows: ROWS, windows,
      startX, startY,
      graffiti: [], plants: [], cats: [], dirt: [], cracks: [], dots: [],
      balcony: null, laundry: false, poster: null,
      antenna: r() < 0.6, dish: r() < 0.4, snow: weather === 'snow',
      roofCat: r() < 0.22, roofCatSeed: Math.floor(r() * 9999),
      electrician: r() < 0.055, elecX: Math.floor(w * 0.2 + r() * w * 0.5), elecSeed: Math.floor(r() * 9999),
      panelRat: r() < 0.18, ratX: Math.floor(4 + r() * Math.max(1, w - 12)), ratSeed: Math.floor(r() * 9999),
      fire: 0, scorch: 0, rim: r() < 0.3,
      variant: pal.brick ? 'brick' : 'panel'
    };

    // static facade noise
    for (let i = 0; i < Math.min(40, w * 0.35); i++) {
      spec.dots.push({
        x: 1 + Math.floor(r() * (w - 2)),
        y: 2 + Math.floor(r() * (h - 3)),
        c: r() < 0.5 ? pal.dark : pal.light
      });
    }

    // balcony (loggia) on lower row
    if (cols >= 3 && r() < 0.34) {
      const count = Math.min(cols, 2 + Math.floor(r() * 2));
      const c0 = Math.floor(r() * (cols - count + 1));
      const x0 = startX + c0 * (WIN_W + GAP_X) - 2;
      const x1 = startX + (c0 + count - 1) * (WIN_W + GAP_X) + WIN_W + 2;
      spec.balcony = { x: x0, y: startY + WIN_H + 3, w: x1 - x0, count, c0 };
    }

    // graffiti
    if (w >= 54 && r() < regime.graffiti + 0.08) {
      addGraffiti(spec, Math.floor(r() * 999999));
    }

    // plants
    if (r() < 0.4 && w > 34) {
      addPlant(spec, Math.floor(r() * 99999));
      if (r() < 0.3) addPlant(spec, Math.floor(r() * 99999));
    }

    // cats
    if (r() < 0.24 && w > 40) addCat(spec, Math.floor(r() * 99999));

    // dirt streaks
    const streaks = 2 + Math.floor(r() * 4);
    for (let i = 0; i < streaks; i++) {
      spec.dirt.push({
        x: 2 + Math.floor(r() * (w - 4)),
        y: 4 + Math.floor(r() * (h - 10)),
        len: 4 + Math.floor(r() * 10),
        a: 0.06 + r() * 0.12
      });
    }

    // a rare poster
    if (r() < 0.12 && w > 50) {
      spec.poster = { x: 3 + Math.floor(r() * (w - 18)), y: 2, w: 13, h: 8 };
    }

    // cracks on grim regimes
    if ((regimeId === 'devyan' || regimeId === 'anarchy') && r() < 0.25) addCrack(spec, Math.floor(r() * 99999));

    // laundry line
    if (r() < 0.16 && w > 60) spec.laundry = true;

    return spec;
  }

  function bottomWindows(spec) {
    return spec.windows.filter((win) => win.row === spec.rows - 1);
  }

  function addGraffiti(spec, seed) {
    if (spec.w < 44) return null;
    const r = rng(seed || (Math.random() * 1e9) | 0);
    const tag = spec.w < 64 ? pick(r, TAGS_SHORT) : pick(r, TAGS_LONG);
    const width = tag.length * 6 - 1;
    const maxX = Math.max(3, spec.w - width - 3);
    const g = {
      text: tag,
      x: 3 + Math.round(r() * Math.max(0, maxX - 3)),
      y: spec.h - 9,
      color: pick(r, TAG_COLORS),
      seed: Math.floor(r() * 9999)
    };
    spec.graffiti.push(g);
    if (spec.graffiti.length > 2) spec.graffiti.shift();
    return g;
  }

  function addPlant(spec, seed, type) {
    if (spec.plants.length >= 4) return null;
    const wins = bottomWindows(spec);
    if (!wins.length) return null;
    const r = rng(seed || (Math.random() * 1e9) | 0);
    const win = pick(r, wins);
    const kinds = ['ficus', 'aloe', 'geranium'];
    const plant = {
      x: win.x + (r() < 0.5 ? 0 : 2),
      y: win.y + 2,
      type: type || pick(r, kinds),
      seed: Math.floor(r() * 9999),
      big: r() < 0.3
    };
    spec.plants.push(plant);
    return plant;
  }

  function addCat(spec, seed) {
    const wins = bottomWindows(spec);
    if (!wins.length) return null;
    const r = rng(seed || (Math.random() * 1e9) | 0);
    const win = pick(r, wins);
    const cat = {
      x: win.x + 1,
      y: win.y + WIN_H - 1,
      seed: Math.floor(r() * 9999),
      dir: r() < 0.5 ? -1 : 1
    };
    spec.cats.push(cat);
    if (spec.cats.length > 2) spec.cats.shift();
    return cat;
  }

  function breakWindow(spec, seed) {
    if (!spec.windows.length) return null;
    const r = rng(seed || (Math.random() * 1e9) | 0);
    const candidates = spec.windows.filter((win) => win.state !== 'broken');
    if (!candidates.length) return null;
    const win = pick(r, candidates);
    win.state = 'broken';
    return win;
  }

  function addDirt(spec, seed) {
    const r = rng(seed || (Math.random() * 1e9) | 0);
    spec.dirt.push({ x: 2 + Math.round(r() * (spec.w - 4)), y: 2 + Math.round(r() * (spec.h - 10)), len: 4 + Math.round(r() * 10), a: 0.1 });
    if (spec.dirt.length > 8) spec.dirt.shift();
  }

  function addCrack(spec, seed) {
    const r = rng(seed || (Math.random() * 1e9) | 0);
    const pts = [];
    let x = 2 + Math.round(r() * (spec.w - 4));
    let y = spec.h - 2;
    for (let i = 0; i < 5; i++) {
      pts.push({ x, y });
      x += Math.round(r() * 3) - 1;
      y -= 2 + Math.round(r() * 3);
    }
    spec.cracks.push(pts);
    if (spec.cracks.length > 4) spec.cracks.shift();
  }

  /* ------------------------------------------------------------------ */
  /* Panel drawing                                                       */
  /* ------------------------------------------------------------------ */

  function drawWindow(ctx, wx, wy, win, r) {
    ctx.fillStyle = WINDOW_FRAME;
    ctx.fillRect(wx - 1, wy - 1, WIN_W + 2, WIN_H + 2);

    if (win.state === 'lit') {
      ctx.fillStyle = WINDOW_LIT[win.seed % WINDOW_LIT.length];
      ctx.fillRect(wx, wy, WIN_W, WIN_H);
      ctx.fillStyle = WINDOW_LIT[(win.seed + 1) % WINDOW_LIT.length];
      ctx.fillRect(wx, wy, WIN_W - 2, 2);
      ctx.fillStyle = '#c99b45';
      ctx.fillRect(wx, wy + WIN_H - 1, WIN_W, 1);
      if (win.person) {
        ctx.fillStyle = '#5a3a2a';
        ctx.fillRect(wx + 3, wy + 3, 2, 4);
        ctx.fillRect(wx + 2, wy + 2, 4, 2);
      }
      // mullions
      ctx.fillStyle = 'rgba(24,22,20,.55)';
      ctx.fillRect(wx + 2, wy, 1, WIN_H);
      ctx.fillRect(wx, wy + 3, WIN_W, 1);
    } else if (win.state === 'curtain') {
      ctx.fillStyle = '#332b26';
      ctx.fillRect(wx, wy, WIN_W, WIN_H);
      ctx.fillStyle = win.curtainColor;
      ctx.fillRect(wx, wy, 2, WIN_H - 1);
      ctx.fillRect(wx + 4, wy, 2, WIN_H - 1);
      ctx.fillStyle = '#8a6a3e';
      ctx.fillRect(wx + 2, wy, 2, 3);
      ctx.fillRect(wx + 2, wy + 4, 2, 2);
    } else if (win.state === 'dirty') {
      ctx.fillStyle = WINDOW_DARK[win.seed % 2];
      ctx.fillRect(wx, wy, WIN_W, WIN_H);
      ctx.fillStyle = 'rgba(112,108,92,.35)';
      ctx.fillRect(wx, wy + 1, WIN_W, 2);
      ctx.fillRect(wx + 1, wy + 4, 3, 2);
      ctx.fillRect(wx, wy, 1, WIN_H);
      ctx.fillStyle = 'rgba(160,155,130,.14)';
      ctx.fillRect(wx + 4, wy, 2, WIN_H);
    } else if (win.state === 'broken') {
      ctx.fillStyle = '#06070a';
      ctx.fillRect(wx, wy, WIN_W, WIN_H);
      ctx.fillStyle = 'rgba(150,170,190,.55)';
      // jagged cracks
      ctx.fillRect(wx + 1, wy + 1, 1, 2);
      ctx.fillRect(wx + 2, wy + 3, 1, 2);
      ctx.fillRect(wx + 3, wy + 2, 1, 2);
      ctx.fillRect(wx + 4, wy + 4, 1, 2);
      ctx.fillRect(wx + 3, wy + 5, 1, 1);
      ctx.fillStyle = 'rgba(90,110,130,.35)';
      ctx.fillRect(wx + 4, wy, 2, 1);
      ctx.fillRect(wx, wy + 6, 2, 1);
    } else if (win.state === 'boarded') {
      ctx.fillStyle = '#161410';
      ctx.fillRect(wx, wy, WIN_W, WIN_H);
      ctx.fillStyle = '#6b4f34';
      ctx.fillRect(wx, wy + 1, WIN_W, 2);
      ctx.fillRect(wx, wy + 4, WIN_W, 2);
      ctx.fillStyle = '#4a3726';
      ctx.fillRect(wx + 1, wy + 1, 1, 6);
      ctx.fillRect(wx + 4, wy + 1, 1, 6);
    } else {
      ctx.fillStyle = WINDOW_DARK[win.seed % 2];
      ctx.fillRect(wx, wy, WIN_W, WIN_H);
      ctx.fillStyle = 'rgba(90,120,150,.10)';
      ctx.fillRect(wx, wy, WIN_W, 2);
      ctx.fillStyle = '#1f2830';
      ctx.fillRect(wx + 2, wy, 1, WIN_H);
      ctx.fillRect(wx, wy + 3, WIN_W, 1);
    }

    // sill
    ctx.fillStyle = WINDOW_SILL;
    ctx.fillRect(wx - 1, wy + WIN_H + 1, WIN_W + 2, 1);
    ctx.fillStyle = 'rgba(30,28,26,.4)';
    ctx.fillRect(wx - 1, wy + WIN_H + 2, WIN_W + 2, 1);
  }

  function drawPlant(ctx, x, y, plant, t) {
    const sway = Math.round(Math.sin(t * 1.4 + plant.seed) * 0.6);
    const px = Math.round(x);
    const py = Math.round(y);
    const pot = '#8a5636';
    const potDark = '#5f3a24';
    const leafA = '#3f7b4a';
    const leafB = '#5b9a5f';
    const leafC = '#2c5c39';

    if (plant.type === 'aloe') {
      ctx.fillStyle = pot;
      ctx.fillRect(px, py + 4, 5, 3);
      ctx.fillStyle = potDark;
      ctx.fillRect(px + 1, py + 6, 3, 1);
      ctx.fillStyle = leafA;
      ctx.fillRect(px + 2 + sway, py, 1, 4);
      ctx.fillRect(px + 1, py + 1, 1, 3);
      ctx.fillRect(px + 3, py + 1, 1, 3);
      ctx.fillStyle = leafB;
      ctx.fillRect(px + 2, py - 1, 1, 2);
      ctx.fillStyle = '#8fbf82';
      ctx.fillRect(px + sway, py + 2, 1, 1);
      ctx.fillRect(px + 4, py + 3, 1, 1);
    } else if (plant.type === 'geranium') {
      ctx.fillStyle = pot;
      ctx.fillRect(px, py + 4, 5, 3);
      ctx.fillStyle = potDark;
      ctx.fillRect(px + 1, py + 6, 3, 1);
      ctx.fillStyle = leafC;
      ctx.fillRect(px + 1, py + 2, 3, 2);
      ctx.fillStyle = leafA;
      ctx.fillRect(px + 1 + sway, py + 1, 2, 2);
      ctx.fillRect(px + 3, py + 2, 1, 2);
      ctx.fillStyle = '#c94a4a';
      ctx.fillRect(px + 1 + sway, py, 1, 1);
      ctx.fillRect(px + 3, py + 1, 1, 1);
      ctx.fillStyle = '#e07a7a';
      ctx.fillRect(px + 2 + sway, py, 1, 1);
    } else {
      // ficus
      ctx.fillStyle = pot;
      ctx.fillRect(px, py + 4, 5, 3);
      ctx.fillStyle = potDark;
      ctx.fillRect(px + 1, py + 6, 3, 1);
      ctx.fillStyle = '#5a3d2a';
      ctx.fillRect(px + 2, py + 1, 1, 4);
      ctx.fillStyle = leafC;
      ctx.fillRect(px + 1 + sway, py + 1, 3, 2);
      ctx.fillStyle = leafA;
      ctx.fillRect(px + sway, py - 1, 2, 2);
      ctx.fillRect(px + 3 + sway, py, 2, 2);
      ctx.fillStyle = leafB;
      ctx.fillRect(px + 1 + sway, py - 2, 1, 1);
      ctx.fillRect(px + 3 + sway, py - 1, 1, 1);
      ctx.fillRect(px + sway, py + 2, 1, 1);
    }
  }

  function drawCat(ctx, x, y, cat, t) {
    const px = Math.round(x);
    const py = Math.round(y);
    const sway = Math.round(Math.sin(t * 2.1 + cat.seed) * 1);
    const body = '#1a161e';
    const rim = '#544a58';
    const chest = '#8f8578';
    // rim light / back edge
    ctx.fillStyle = rim;
    ctx.fillRect(px + 1, py + 2, 5, 3);
    ctx.fillStyle = body;
    ctx.fillRect(px + 1, py + 2, 4, 4);
    ctx.fillRect(px + 1, py + 3, 5, 2);
    // head
    ctx.fillRect(px, py, 4, 3);
    ctx.fillRect(px, py - 1, 1, 1);
    ctx.fillRect(px + 2, py - 1, 1, 1);
    // ear rims
    ctx.fillStyle = rim;
    ctx.fillRect(px, py - 2, 1, 1);
    ctx.fillRect(px + 3, py - 2, 1, 1);
    // chest patch
    ctx.fillStyle = chest;
    ctx.fillRect(px + 2, py + 4, 2, 1);
    // tail
    ctx.fillStyle = body;
    ctx.fillRect(px + 5, py + 3, 1, 3 + (sway > 0 ? 1 : 0));
    ctx.fillRect(px + 6, py + 4, 1, 2);
    ctx.fillRect(px + 6, py + 6 + (sway > 0 ? 1 : 0), 1, 1);
    // eyes
    ctx.fillStyle = '#f2d06a';
    ctx.fillRect(px + 1, py + 1, 1, 1);
    ctx.fillRect(px + 3, py + 1, 1, 1);
    ctx.fillStyle = 'rgba(242,208,106,.18)';
    ctx.fillRect(px, py, 4, 2);
  }

  function drawRoof(ctx, x, y, w, h, spec, t) {
    ctx.fillStyle = spec.pal.light;
    ctx.fillRect(x, y, w, 2);
    ctx.fillStyle = spec.pal.dark;
    ctx.fillRect(x, y + 2, w, 1);
    if (spec.snow) {
      ctx.fillStyle = 'rgba(230,236,245,.9)';
      ctx.fillRect(x, y, w, 1);
    }
    if (spec.antenna) {
      const ax = x + Math.floor(w * 0.24);
      ctx.fillStyle = '#3b3833';
      ctx.fillRect(ax, y - 9, 1, 9);
      ctx.fillRect(ax - 3, y - 6, 7, 1);
      ctx.fillRect(ax - 2, y - 4, 5, 1);
      // blinking light
      if (Math.sin(t * 3.1) > 0.45) {
        ctx.fillStyle = '#e04a3a';
        ctx.fillRect(ax, y - 10, 1, 1);
        ctx.fillStyle = 'rgba(224,74,58,.25)';
        ctx.fillRect(ax - 1, y - 11, 3, 3);
      }
      // wire
      ctx.fillStyle = 'rgba(20,20,22,.6)';
      for (let i = 1; i < 8; i++) {
        const wx = ax + i * 3;
        const wy = y - 7 + Math.round(Math.sin(i * 0.9) * 2) + 2;
        ctx.fillRect(wx, wy, 1, 1);
      }
    }
    if (spec.dish) {
      const dx = x + Math.floor(w * 0.68);
      ctx.fillStyle = '#77787a';
      ctx.fillRect(dx, y - 2, 1, 2);
      ctx.fillRect(dx - 1, y - 5, 4, 3);
      ctx.fillStyle = '#4c4d50';
      ctx.fillRect(dx + 1, y - 4, 1, 1);
      ctx.fillStyle = '#333437';
      ctx.fillRect(dx - 1, y - 5, 1, 1);
    }
    if (spec.roofCat) {
      drawCat(ctx, x + Math.floor(w * 0.76), y - 6, { seed: spec.roofCatSeed }, t);
    }
  }

  function drawPanel(ctx, x, y, w, h, spec, t, opts) {
    opts = opts || {};
    x = Math.round(x);
    y = Math.round(y);
    const pal = spec.pal;

    ctx.fillStyle = pal.base;
    ctx.fillRect(x, y, w, h);

    // brick courses
    if (spec.variant === 'brick') {
      ctx.fillStyle = pal.seam;
      for (let yy = 9; yy < h; yy += 9) {
        ctx.fillRect(x + 1, y + yy, w - 2, 1);
      }
      for (let yy = 0; yy < h; yy += 9) {
        for (let xx = (yy / 9) % 2 ? 4 : 8; xx < w; xx += 8) {
          ctx.fillRect(x + xx, y + yy, 1, 8);
        }
      }
    } else {
      // concrete panel joints
      ctx.fillStyle = pal.seam;
      for (let yy = 10; yy < h; yy += 10) ctx.fillRect(x + 1, y + yy, w - 2, 1);
      for (let xx = 26; xx < w - 4; xx += 34) ctx.fillRect(x + xx, y + 2, 1, h - 3);
    }

    // facade noise
    for (let i = 0; i < spec.dots.length; i++) {
      const d = spec.dots[i];
      ctx.fillStyle = d.c;
      ctx.fillRect(x + d.x, y + d.y, 1, 1);
    }

    // top / bottom / sides
    ctx.fillStyle = pal.light;
    ctx.fillRect(x, y, w, 2);
    ctx.fillStyle = pal.dark;
    ctx.fillRect(x, y + 2, w, 1);
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x, y, 1, h);
    ctx.fillRect(x + w - 1, y, 1, h);

    // balcony recess first
    if (spec.balcony) {
      const b = spec.balcony;
      ctx.fillStyle = 'rgba(16,16,20,.72)';
      ctx.fillRect(x + b.x, y + b.y, b.w, WIN_H + 1);
      ctx.fillStyle = '#5b5a52';
      ctx.fillRect(x + b.x, y + b.y + WIN_H - 1, b.w, 1);
      ctx.fillStyle = '#3e3d38';
      for (let i = 2; i < b.w - 1; i += 3) {
        ctx.fillRect(x + b.x + i, y + b.y + WIN_H - 1, 1, 3);
      }
    }

    // windows
    for (let i = 0; i < spec.windows.length; i++) {
      const win = spec.windows[i];
      drawWindow(ctx, x + win.x, y + win.y, win, null);
    }

    // dirt streaks
    for (let i = 0; i < spec.dirt.length; i++) {
      const d = spec.dirt[i];
      ctx.fillStyle = 'rgba(20,20,18,' + d.a.toFixed(2) + ')';
      ctx.fillRect(x + d.x, y + d.y, 1, d.len);
    }

    // cracks
    ctx.fillStyle = 'rgba(28,26,26,.55)';
    for (let i = 0; i < spec.cracks.length; i++) {
      const pts = spec.cracks[i];
      for (let j = 0; j < pts.length - 1; j++) {
        const a = pts[j], b = pts[j + 1];
        const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
        for (let s = 0; s <= steps; s++) {
          const xx = a.x + (b.x - a.x) * (s / steps);
          const yy = a.y + (b.y - a.y) * (s / steps);
          ctx.fillRect(x + Math.round(xx), y + Math.round(yy), 1, 1);
        }
      }
    }

    // laundry
    if (spec.laundry) {
      const ly = y + h - 6;
      ctx.fillStyle = 'rgba(30,28,28,.7)';
      for (let xx = 2; xx < w - 2; xx += 2) {
        ctx.fillRect(x + xx, ly - 1 + Math.round(Math.sin(xx * 0.3 + t * 1.5) * 0.6), 1, 1);
      }
      const colors = ['#b45b5b', '#5b7fb4', '#c9bd8a', '#8a8a8a'];
      for (let i = 0; i < 3; i++) {
        const cx = x + 6 + i * 12 + Math.round(Math.sin(t * 1.1 + i) * 1);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(cx, ly, 3, 4);
        ctx.fillRect(cx + (i % 2 ? 0 : 2), ly + 4, 1, 1);
      }
    }

    // graffiti
    for (let i = 0; i < spec.graffiti.length; i++) {
      const g = spec.graffiti[i];
      if (g.x + g.text.length * 6 > w) continue;
      const gy = Math.min(h - 8, g.y);
      ctx.globalAlpha = 0.9;
      BMFont.draw(ctx, g.text, x + g.x, y + gy, { scale: 1, spacing: 0, color: g.color, shadow: '#141216' });
      ctx.globalAlpha = 1;
      ctx.fillStyle = g.color;
      ctx.fillRect(x + g.x, y + gy + 8, Math.min(w - g.x, g.text.length * 4), 1);
      if (g.seed % 3 === 0) {
        ctx.fillRect(x + g.x + 2, y + gy + 5, 1, 1);
        ctx.fillRect(x + g.x + g.text.length * 5, y + gy + 4, 1, 1);
      }
    }

    // plants (window plants)
    for (let i = 0; i < spec.plants.length; i++) {
      drawPlant(ctx, x + spec.plants[i].x, y + spec.plants[i].y, spec.plants[i], t);
    }

    // cats
    for (let i = 0; i < spec.cats.length; i++) {
      drawCat(ctx, x + spec.cats[i].x, y + spec.cats[i].y, spec.cats[i], t);
    }

    // a rat on the ledge (or a cat is watching it)
    if (spec.panelRat) {
      drawRat(ctx, x + spec.ratX, y + h - 6, spec.ratSeed, t, spec.ratSeed % 2 ? 1 : -1);
    }

    // electrician working on the facade wiring
    if (spec.electrician) {
      drawElectrician(ctx, x + spec.elecX, y + 5, spec.elecSeed, t);
    }

    // propaganda poster
    if (spec.poster) {
      const p = spec.poster;
      ctx.fillStyle = '#9e2f2f';
      ctx.fillRect(x + p.x, y + p.y + 2, p.w, p.h);
      ctx.fillStyle = '#d9d0b8';
      ctx.fillRect(x + p.x + 1, y + p.y + 3, p.w - 2, 1);
      ctx.fillRect(x + p.x + 1, y + p.y + 7, p.w - 2, 1);
      ctx.fillStyle = '#e5c46a';
      ctx.fillRect(x + p.x + 5, y + p.y + 4, 3, 1);
      ctx.fillRect(x + p.x + 6, y + p.y + 3, 1, 3);
      ctx.fillStyle = '#d9d0b8';
      ctx.fillRect(x + p.x + 2, y + p.y + 8, 3, 1);
      ctx.fillRect(x + p.x + 7, y + p.y + 8, 4, 1);
    }

    // fire / scorch
    if (spec.fire > 0) {
      for (let i = 0; i < 5; i++) {
        const fx = x + 4 + ((i * 17 + Math.floor(t * 7)) % Math.max(4, w - 8));
        const fh = 2 + Math.floor(Math.abs(Math.sin(t * 6 + i * 2)) * 5);
        ctx.fillStyle = i % 2 ? '#e8752f' : '#f2c14a';
        ctx.fillRect(fx, y + h - 2 - fh, 2, fh);
        ctx.fillStyle = '#d94a2a';
        ctx.fillRect(fx + 1, y + h - 2 - Math.floor(fh / 2), 1, Math.floor(fh / 2));
      }
      ctx.fillStyle = 'rgba(20,14,10,.35)';
      ctx.fillRect(x + 2, y + 4, w - 4, 4);
    }

    if (opts.base) {
      // entrance door
      const dx = Math.floor(w / 2) - 4;
      ctx.fillStyle = '#2a2622';
      ctx.fillRect(x + dx, y + h - 10, 8, 10);
      ctx.fillStyle = '#4b3c2d';
      ctx.fillRect(x + dx + 1, y + h - 9, 6, 8);
      ctx.fillStyle = '#1b1916';
      ctx.fillRect(x + dx + 3, y + h - 9, 1, 8);
      ctx.fillStyle = '#d9b45a';
      ctx.fillRect(x + dx + 5, y + h - 5, 1, 1);
      ctx.fillStyle = 'rgba(230,200,120,.2)';
      ctx.fillRect(x + dx - 1, y + h - 12, 10, 2);
    }

    if (opts.top) {
      drawRoof(ctx, x, y, w, h, spec, t);
      // chimney/vent
      ctx.fillStyle = spec.pal.dark;
      ctx.fillRect(x + Math.floor(w * 0.45), y - 4, 4, 4);
      ctx.fillStyle = spec.pal.light;
      ctx.fillRect(x + Math.floor(w * 0.45), y - 4, 4, 1);
    }

    // subtle vertical light edge
    ctx.fillStyle = 'rgba(255,255,255,.035)';
    ctx.fillRect(x + 1, y + 3, 1, h - 5);
  }

  /* ------------------------------------------------------------------ */
  /* Characters                                                          */
  /* ------------------------------------------------------------------ */

  function drawRat(ctx, x, y, seed, t, dir) {
    const px = Math.round(x), py = Math.round(y);
    const step = Math.sin(t * 12 + seed) > 0 ? 1 : 0;
    ctx.fillStyle = '#26242a';
    ctx.fillRect(px, py + 1, 5, 2);
    ctx.fillRect(px + (dir > 0 ? 3 : 0), py, 2, 2);
    ctx.fillStyle = '#16151a';
    ctx.fillRect(px + 1, py + 3 + step, 1, 1);
    ctx.fillRect(px + 3, py + 3 + (1 - step), 1, 1);
    // tail
    ctx.fillStyle = '#5a4c52';
    ctx.fillRect(px + (dir > 0 ? -2 : 6), py + 2, 2, 1);
    // eye
    ctx.fillStyle = '#e8c26c';
    ctx.fillRect(px + (dir > 0 ? 3 : 1), py + 1, 1, 1);
  }

  function drawHomeless(ctx, x, y, seed, t) {
    const px = Math.round(x), py = Math.round(y);
    const bob = Math.sin(t * 0.9 + seed) > 0 ? 0 : 1;
    // legs
    ctx.fillStyle = '#2f2b2e';
    ctx.fillRect(px + 1, py + 10 + bob, 3, 4);
    ctx.fillRect(px + 5, py + 10 + bob, 3, 4);
    // coat
    ctx.fillStyle = '#4a4038';
    ctx.fillRect(px, py + 4 + bob, 9, 7);
    ctx.fillStyle = '#5c5044';
    ctx.fillRect(px + 1, py + 4 + bob, 7, 2);
    // arms
    ctx.fillStyle = '#403830';
    ctx.fillRect(px - 1, py + 6 + bob, 2, 5);
    ctx.fillRect(px + 8, py + 6 + bob, 2, 5);
    // head + hat
    ctx.fillStyle = '#b0896a';
    ctx.fillRect(px + 2, py + bob, 5, 5);
    ctx.fillStyle = '#3a3430';
    ctx.fillRect(px + 1, py - 1 + bob, 7, 2);
    ctx.fillRect(px + 2, py - 3 + bob, 5, 2);
    // beard
    ctx.fillStyle = '#8a8478';
    ctx.fillRect(px + 2, py + 4 + bob, 5, 1);
    // bottle
    ctx.fillStyle = '#59805a';
    ctx.fillRect(px + 9, py + 9 + bob, 2, 5);
    ctx.fillStyle = '#2e4a30';
    ctx.fillRect(px + 9, py + 11 + bob, 2, 3);
    // smoke
    if (Math.sin(t * 0.7 + seed) > 0.8) {
      ctx.fillStyle = 'rgba(150,150,145,.25)';
      ctx.fillRect(px + 6, py - 5 + bob, 1, 1);
      ctx.fillRect(px + 7, py - 7 + bob, 1, 1);
    }
  }

  function drawElectrician(ctx, x, y, seed, t) {
    const px = Math.round(x), py = Math.round(y);
    const bob = Math.round(Math.sin(t * 4 + seed));
    // ladder
    ctx.fillStyle = '#8a7450';
    ctx.fillRect(px - 3, py - 10, 1, 24);
    ctx.fillRect(px + 6, py - 10, 1, 24);
    for (let i = 0; i < 4; i++) ctx.fillRect(px - 3, py - 8 + i * 5, 10, 1);
    // legs
    ctx.fillStyle = '#2f3b56';
    ctx.fillRect(px + 1, py + 8, 2, 5);
    ctx.fillRect(px + 4, py + 8, 2, 5);
    // overalls
    ctx.fillStyle = '#3c4f74';
    ctx.fillRect(px, py + 3, 7, 6);
    ctx.fillStyle = '#d0c05a';
    ctx.fillRect(px + 1, py + 4, 5, 1);
    // arms
    ctx.fillStyle = '#3c4f74';
    ctx.fillRect(px - 2, py + 4 + bob, 2, 4);
    ctx.fillRect(px + 7, py + 4 - bob, 2, 4);
    // head + helmet
    ctx.fillStyle = '#b0896a';
    ctx.fillRect(px + 1, py + bob, 5, 4);
    ctx.fillStyle = '#e0b23c';
    ctx.fillRect(px, py - 2 + bob, 7, 3);
    ctx.fillStyle = '#f2cf62';
    ctx.fillRect(px + 1, py - 2 + bob, 2, 1);
    // spark
    if (Math.sin(t * 11 + seed) > 0.55) {
      const sx = px + 9, sy = py + 3 + bob;
      ctx.fillStyle = '#fff3b0';
      ctx.fillRect(sx, sy, 3, 1);
      ctx.fillRect(sx + 1, sy - 1, 1, 3);
      ctx.fillStyle = '#8ad0e8';
      ctx.fillRect(sx + 3, sy, 1, 1);
    }
  }

  function drawPigeon(ctx, x, y, seed, t) {
    const px = Math.round(x), py = Math.round(y);
    const peck = Math.sin(t * 3 + seed) > 0.6 ? 1 : 0;
    ctx.fillStyle = '#6b6f78';
    ctx.fillRect(px, py, 4, 3);
    ctx.fillRect(px + 3, py + peck, 2, 2);
    ctx.fillStyle = '#4b4f58';
    ctx.fillRect(px + 1, py + 3, 1, 1);
    ctx.fillRect(px + 3, py + 3, 1, 1);
    ctx.fillStyle = '#c9a05a';
    ctx.fillRect(px + 5, py + 1 + peck, 1, 1);
  }

  /* ------------------------------------------------------------------ */
  /* Crane, bomb, particles                                              */
  /* ------------------------------------------------------------------ */

  function drawCrane(ctx, t, hookX, holding, panelW) {
    // jib (kept below the HUD strip)
    const y = 36;
    ctx.fillStyle = '#3a3428';
    ctx.fillRect(8, y - 5, W - 16, 6);
    ctx.fillStyle = '#b6953f';
    ctx.fillRect(8, y - 5, W - 16, 1);
    ctx.fillRect(8, y, W - 16, 1);
    // truss diagonals
    ctx.fillStyle = '#7d672e';
    for (let x = 10; x < W - 10; x += 8) {
      ctx.fillRect(x, y - 4, 1, 1);
      ctx.fillRect(x + 1, y - 3, 1, 1);
      ctx.fillRect(x + 2, y - 2, 1, 1);
      ctx.fillRect(x + 3, y - 1, 1, 1);
    }
    // tower column
    ctx.fillStyle = '#b6953f';
    ctx.fillRect(20, 0, 2, y + 34);
    ctx.fillRect(30, 0, 2, y + 34);
    ctx.fillStyle = '#7d672e';
    for (let yy = y - 3; yy < y + 32; yy += 6) {
      ctx.fillRect(22, yy, 8, 1);
    }
    // counterweight
    ctx.fillStyle = '#4a4640';
    ctx.fillRect(10, y - 3, 12, 8);
    ctx.fillStyle = '#6a665c';
    ctx.fillRect(11, y - 2, 10, 2);
    // trolley
    const hx = Math.round(hookX);
    ctx.fillStyle = '#d9c46a';
    ctx.fillRect(hx - 3, y - 1, 7, 3);
    ctx.fillStyle = '#59513a';
    ctx.fillRect(hx - 2, y + 1, 5, 1);
    // cable
    if (holding) {
      ctx.fillStyle = 'rgba(210,205,185,.55)';
      for (let yy = y + 2; yy < 64; yy += 2) ctx.fillRect(hx, yy, 1, 1);
      // hook
      ctx.fillStyle = '#c9c4b4';
      ctx.fillRect(hx - 2, 61, 5, 1);
      ctx.fillRect(hx - 1, 62, 1, 2);
      ctx.fillRect(hx + 1, 62, 1, 2);
    }
    // warning light
    if (Math.sin(t * 4.2) > 0.3) {
      ctx.fillStyle = '#e04a3a';
      ctx.fillRect(W - 14, y - 4, 2, 2);
      ctx.fillStyle = 'rgba(224,74,58,.2)';
      ctx.fillRect(W - 16, y - 6, 6, 6);
    }
  }

  function drawBomb(ctx, x, y, t, vx, vy) {
    const px = Math.round(x), py = Math.round(y);
    const blink = Math.sin(t * 16) > 0;
    // falling trail
    if (vy) {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = 'rgba(210,80,60,' + (0.22 - i * 0.045).toFixed(2) + ')';
        ctx.fillRect(px + 3, py - 6 - i * 4, 2, 3);
      }
    }
    // danger glow
    ctx.fillStyle = 'rgba(255,80,60,' + (blink ? 0.22 : 0.1) + ')';
    ctx.fillRect(px - 6, py - 7, 22, 22);
    ctx.fillStyle = 'rgba(255,110,80,' + (blink ? 0.5 : 0.22) + ')';
    ctx.fillRect(px - 4, py - 2, 14, 13);
    // target brackets
    ctx.fillStyle = 'rgba(255,130,95,' + (blink ? 0.95 : 0.5) + ')';
    const bx = px - 8, by = py - 7, bw = 20, bh = 21;
    ctx.fillRect(bx, by, 4, 1); ctx.fillRect(bx, by, 1, 4);
    ctx.fillRect(bx + bw - 4, by, 4, 1); ctx.fillRect(bx + bw - 1, by, 1, 4);
    ctx.fillRect(bx, by + bh - 1, 4, 1); ctx.fillRect(bx, by + bh - 4, 1, 4);
    ctx.fillRect(bx + bw - 4, by + bh - 1, 4, 1); ctx.fillRect(bx + bw - 1, by + bh - 4, 1, 4);
    // fins
    ctx.fillStyle = '#3a3a42';
    ctx.fillRect(px - 6, py + 1, 3, 2);
    ctx.fillRect(px + 8, py + 1, 3, 2);
    ctx.fillRect(px - 3, py - 4, 2, 3);
    ctx.fillRect(px + 6, py - 4, 2, 3);
    // body
    ctx.fillStyle = '#17161c';
    ctx.fillRect(px - 3, py, 12, 9);
    ctx.fillRect(px - 2, py - 1, 10, 11);
    ctx.fillRect(px + 1, py + 2, 9, 8);
    // outline
    ctx.fillStyle = 'rgba(210,90,70,.55)';
    ctx.fillRect(px - 3, py - 1, 12, 1);
    ctx.fillRect(px - 3, py + 9, 12, 1);
    // highlight
    ctx.fillStyle = '#4a4a55';
    ctx.fillRect(px - 1, py + 1, 3, 2);
    ctx.fillStyle = '#2c2c35';
    ctx.fillRect(px + 5, py + 5, 3, 3);
    // fuse band
    ctx.fillStyle = '#8a3a32';
    ctx.fillRect(px - 2, py + 4, 10, 1);
    // blinking light
    if (blink) {
      ctx.fillStyle = '#ffe0b0';
      ctx.fillRect(px + 4, py - 3, 2, 2);
      ctx.fillStyle = 'rgba(255,120,90,.45)';
      ctx.fillRect(px + 2, py - 5, 6, 6);
    } else {
      ctx.fillStyle = '#7a2a24';
      ctx.fillRect(px + 4, py - 3, 2, 2);
    }
    // speed lines
    if (vx) {
      ctx.fillStyle = 'rgba(230,220,190,.25)';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(px - Math.sign(vx) * (10 + i * 4), py + 2 + i * 2, 4, 1);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Background                                                          */
  /* ------------------------------------------------------------------ */

  let city = null;
  function buildCity() {
    const r = rng(90210);
    const far = [];
    const near = [];
    for (let x = -20; x < W + 40;) {
      const w = 12 + Math.floor(r() * 26);
      const h = 26 + Math.floor(r() * 66);
      far.push(makeBuilding(r, x, w, h, 320, 0));
      x += w + 2 + Math.floor(r() * 10);
    }
    for (let x = -30; x < W + 40;) {
      const w = 20 + Math.floor(r() * 30);
      const h = 36 + Math.floor(r() * 76);
      near.push(makeBuilding(r, x, w, h, 352, 1));
      x += w + 4 + Math.floor(r() * 20);
    }
    city = { far, near };
  }

  function makeBuilding(r, x, w, h, baseY, layer) {
    const wins = [];
    const cols = Math.max(1, Math.floor((w - 4) / 6));
    const rows = Math.max(1, Math.floor((h - 6) / 7));
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        if (r() < 0.32) {
          wins.push({
            x: 3 + cx * 6,
            y: 4 + cy * 7,
            w: r() < 0.2 ? 2 : 1,
            h: 2,
            seed: Math.floor(r() * 999)
          });
        }
      }
    }
    return { x, w, h, baseY, wins, layer, roof: r() < 0.3, antenna: r() < 0.2 };
  }

  const stars = (() => {
    const r = rng(777);
    const out = [];
    for (let i = 0; i < 54; i++) out.push({ x: Math.floor(r() * W), y: 6 + Math.floor(r() * 150), s: r() < 0.2 ? 2 : 1, p: r() * 6.28 });
    return out;
  })();

  const clouds = (() => {
    const r = rng(4242);
    const out = [];
    for (let i = 0; i < 5; i++) {
      out.push({
        x: r() * W,
        y: 36 + r() * 84,
        w: 26 + Math.floor(r() * 34),
        speed: 0.6 + r() * 1.4,
        puffs: Array.from({ length: 4 }, () => ({ dx: Math.floor(r() * 22) - 10, dy: Math.floor(r() * 6) - 3, w: 8 + Math.floor(r() * 10), h: 4 + Math.floor(r() * 4) }))
      });
    }
    return out;
  })();

  function drawSky(ctx, regime, weather, t) {
    const c = skyColors(regime, weather);
    const bands = 18;
    const bandH = Math.ceil(360 / bands);
    for (let i = 0; i < bands; i++) {
      const p = i / (bands - 1);
      let col;
      if (p < 0.55) col = mix(c.top, c.mid, p / 0.55);
      else col = mix(c.mid, c.bot, (p - 0.55) / 0.45);
      ctx.fillStyle = col;
      ctx.fillRect(0, i * bandH, W, bandH + 1);
    }
  }

  function drawStars(ctx, weather, t) {
    const hide = weather === 'overcast' ? 0.82 : weather === 'rain' ? 0.72 : weather === 'storm' ? 0.9 : weather === 'fog' ? 0.85 : weather === 'snow' ? 0.6 : 0;
    if (hide >= 0.95) return;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.7 + s.p));
      ctx.fillStyle = 'rgba(220,220,205,' + ((1 - hide) * tw * 0.75).toFixed(2) + ')';
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
  }

  function drawMoon(ctx, regime, weather, t) {
    const hidden = weather === 'overcast' || weather === 'rain' || weather === 'storm' ? 0.82 : weather === 'snow' ? 0.4 : weather === 'fog' ? 0.7 : 0;
    const mx = 259, my = 58;
    if (hidden < 0.8) {
      ctx.fillStyle = 'rgba(210,205,175,' + (0.05 * (1 - hidden)).toFixed(2) + ')';
      ctx.fillRect(mx - 14, my - 12, 28, 26);
      ctx.fillStyle = 'rgba(215,210,180,' + (0.08 * (1 - hidden)).toFixed(2) + ')';
      ctx.fillRect(mx - 10, my - 9, 20, 20);
    }
    const a = 1 - hidden;
    if (a <= 0.05) return;
    ctx.fillStyle = 'rgba(228,222,190,' + (a * 0.85).toFixed(2) + ')';
    const rows = [4, 7, 9, 10, 10, 10, 9, 7, 4];
    for (let i = 0; i < rows.length; i++) {
      const rw = rows[i];
      ctx.fillRect(mx - Math.floor(rw / 2), my - 5 + i, rw, 1);
    }
    ctx.fillStyle = 'rgba(175,168,140,' + (a * 0.6).toFixed(2) + ')';
    ctx.fillRect(mx - 2, my - 2, 2, 2);
    ctx.fillRect(mx + 2, my + 1, 2, 1);
    ctx.fillRect(mx - 3, my + 3, 1, 1);
  }

  function drawClouds(ctx, regime, weather, t, camY) {
    let col = '#2a2733';
    let alpha = 0.6;
    if (weather === 'overcast') { col = '#3a3a44'; alpha = 0.9; }
    else if (weather === 'rain') { col = '#232b38'; alpha = 0.85; }
    else if (weather === 'storm') { col = '#191722'; alpha = 0.95; }
    else if (weather === 'snow') { col = '#697386'; alpha = 0.8; }
    else if (weather === 'fog') { col = '#4a4a48'; alpha = 0.55; }
    const drift = t * 1.2;
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      const cx = ((c.x + drift * c.speed) % (W + 90)) - 45;
      const cy = c.y + camY * 0.02 + (weather === 'storm' ? 10 : 0);
      ctx.globalAlpha = alpha;
      for (let j = 0; j < c.puffs.length; j++) {
        const p = c.puffs[j];
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(cx + p.dx), Math.round(cy + p.dy), p.w, p.h);
        ctx.fillRect(Math.round(cx + p.dx + 3), Math.round(cy + p.dy - 2), p.w - 6, 2);
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawSearchlights(ctx, regime, t, camY) {
    const base = 330 + camY * 0.03;
    const beams = [
      { x: 42, a: Math.sin(t * 0.13) * 0.5 - 0.15 },
      { x: 284, a: Math.sin(t * 0.11 + 2) * 0.45 + 0.2 }
    ];
    ctx.save();
    for (let i = 0; i < beams.length; i++) {
      const b = beams[i];
      const len = 260;
      const tipX = b.x + Math.sin(b.a) * len * 0.5;
      const spread = 17;
      ctx.beginPath();
      ctx.moveTo(b.x, base);
      ctx.lineTo(tipX - spread, base - len);
      ctx.lineTo(tipX + spread, base - len);
      ctx.closePath();
      ctx.fillStyle = 'rgba(190,200,210,.035)';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCityLayer(ctx, buildings, baseY, camY, t, regime, layer) {
    const shift = Math.min(60, camY * (layer === 0 ? 0.03 : 0.055));
    const body = layer === 0 ? mix('#151420', regime.sky[1], 0.18) : '#0f0e15';
    const winCol = regime.accent;
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      const y = baseY + shift - b.h;
      ctx.fillStyle = body;
      ctx.fillRect(b.x, y, b.w, b.h + 8);
      // roof
      if (b.roof) {
        ctx.fillStyle = shade(body, 8);
        ctx.fillRect(b.x - 1, y - 2, b.w + 2, 2);
      }
      if (b.antenna) {
        ctx.fillStyle = body;
        ctx.fillRect(b.x + Math.floor(b.w / 2), y - 12, 1, 12);
        if (Math.sin(t * 2 + i) > 0.7) {
          ctx.fillStyle = '#d04a3a';
          ctx.fillRect(b.x + Math.floor(b.w / 2), y - 13, 1, 1);
        }
      }
      // windows
      for (let j = 0; j < b.wins.length; j++) {
        const win = b.wins[j];
        const flick = Math.sin(t * 0.6 + win.seed) > -0.3;
        if (!flick) continue;
        ctx.fillStyle = win.seed % 7 === 0 ? '#d9b45a' : winCol;
        ctx.globalAlpha = 0.22 + (win.seed % 5) * 0.07;
        ctx.fillRect(b.x + win.x, y + win.y, win.w, win.h);
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawStacks(ctx, regime, t, camY) {
    const shift = Math.min(40, camY * 0.03);
    const stacks = [
      { x: 96, h: 74, w: 11 },
      { x: 132, h: 58, w: 9 }
    ];
    for (let i = 0; i < stacks.length; i++) {
      const s = stacks[i];
      const base = 336 + shift;
      const top = base - s.h;
      ctx.fillStyle = '#1a1820';
      ctx.fillRect(s.x, top, s.w, s.h);
      ctx.fillStyle = '#b8b0a0';
      ctx.fillRect(s.x, top, s.w, 2);
      ctx.fillStyle = '#8a3a32';
      for (let yy = top + 4; yy < base; yy += 8) ctx.fillRect(s.x, yy, s.w, 2);
      // smoke
      for (let j = 0; j < 6; j++) {
        const p = (t * 7 + j * 9) % 54;
        const px = s.x + 4 + Math.sin(t * 0.7 + j) * 5 + p * 0.15;
        const py = top - p;
        const a = Math.max(0, 0.26 - p * 0.004);
        ctx.fillStyle = 'rgba(180,178,170,' + a.toFixed(2) + ')';
        const size = 2 + Math.floor(p / 18);
        ctx.fillRect(Math.round(px), Math.round(py), size, size);
      }
    }
  }

  function drawTVTower(ctx, regime, t, camY) {
    const shift = Math.min(40, camY * 0.03);
    const x = 266;
    const base = 352 + shift;
    const top = base - 186;
    ctx.strokeStyle = 'rgba(30,28,36,.9)';
    ctx.fillStyle = '#1d1b24';
    // legs
    for (let yy = top + 36; yy < base; yy += 14) {
      const t0 = (yy - top) / (base - top);
      const half = 2 + t0 * 6;
      ctx.fillRect(Math.round(x - half), yy, 1, 14);
      ctx.fillRect(Math.round(x + half), yy, 1, 14);
      if (Math.floor((yy - top) / 14) % 2 === 0) {
        ctx.fillRect(Math.round(x - half), yy, Math.round(half * 2), 1);
      }
    }
    ctx.fillStyle = '#24222c';
    ctx.fillRect(x - 1, top + 8, 3, base - top - 8);
    ctx.fillRect(x - 5, top + 28, 11, 3);
    ctx.fillRect(x - 8, top + 50, 17, 2);
    // blinking beacon
    if (Math.sin(t * 2.4) > 0.2) {
      ctx.fillStyle = '#e04a3a';
      ctx.fillRect(x, top + 5, 1, 1);
      ctx.fillStyle = 'rgba(224,74,58,.22)';
      ctx.fillRect(x - 2, top + 3, 5, 5);
    }
  }

  function drawBackground(ctx, regime, weather, camY, t) {
    if (!city) buildCity();
    drawSky(ctx, regime, weather, t);
    drawStars(ctx, weather, t);
    drawMoon(ctx, regime, weather, t);
    drawClouds(ctx, regime, weather, t, camY);
    drawSearchlights(ctx, regime, t, camY);
    drawStacks(ctx, regime, t, camY);
    drawTVTower(ctx, regime, t, camY);
    drawCityLayer(ctx, city.far, 320, camY, t, regime, 0);
    drawCityLayer(ctx, city.near, 352, camY, t, regime, 1);
    drawBillboard(ctx, regime, weather, camY, t);
    // haze at horizon
    const c = skyColors(regime, weather);
    ctx.fillStyle = mix(c.bot, c.mid, 0.4);
    ctx.globalAlpha = weather === 'fog' ? 0.55 : 0.3;
    ctx.fillRect(0, 300, W, 60);
    ctx.globalAlpha = 1;
  }

  function drawBillboard(ctx, regime, weather, camY, t) {
    const shift = Math.min(24, camY * 0.025);
    const x = 236;
    const y = 252 + shift;
    // legs
    ctx.fillStyle = '#211f26';
    ctx.fillRect(x + 8, y + 12, 2, 18);
    ctx.fillRect(x + 66, y + 12, 2, 18);
    ctx.fillRect(x + 8, y + 28, 60, 1);
    // frame
    ctx.fillStyle = '#17151a';
    ctx.fillRect(x - 2, y - 2, 80, 17);
    ctx.fillStyle = regime.accent;
    ctx.fillRect(x, y, 76, 13);
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.fillRect(x, y, 76, 1);
    ctx.fillStyle = 'rgba(30,10,10,.35)';
    ctx.fillRect(x, y + 12, 76, 1);
    // little star
    ctx.fillStyle = '#f0e6cc';
    ctx.fillRect(x + 5, y + 5, 3, 1);
    ctx.fillRect(x + 6, y + 3, 1, 5);
    // regime name
    BMFont.draw(ctx, regime.name, x + 38, y + 3, {
      scale: 1, spacing: 1, color: '#f2ead8', align: 'center', alpha: 0.92, shadow: '#3a0c0c'
    });
    // blinking lamps
    if (Math.sin(t * 2.2) > 0.2) {
      ctx.fillStyle = '#f2c14a';
      ctx.fillRect(x + 2, y - 3, 1, 1);
      ctx.fillRect(x + 73, y - 3, 1, 1);
    }
    if (weather === 'snow') {
      ctx.fillStyle = 'rgba(235,240,248,.8)';
      ctx.fillRect(x - 2, y - 3, 80, 1);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Ground                                                              */
  /* ------------------------------------------------------------------ */

  const puddles = (() => {
    const r = rng(333);
    const out = [];
    for (let i = 0; i < 6; i++) out.push({ x: 8 + Math.floor(r() * 290), y: 378 + Math.floor(r() * 18), w: 8 + Math.floor(r() * 18), h: 2 + Math.floor(r() * 3), p: r() * 6.28 });
    return out;
  })();

  function drawLamp(ctx, x, t, regime, weather) {
    const top = 312;
    ctx.fillStyle = '#1b1a20';
    ctx.fillRect(x, top, 2, GROUND - top);
    ctx.fillRect(x - 2, GROUND - 3, 6, 3);
    ctx.fillStyle = '#2a2830';
    ctx.fillRect(x - 3, top, 8, 2);
    ctx.fillStyle = '#e8d08a';
    ctx.fillRect(x - 2, top + 2, 6, 2);
    const flick = weather === 'storm' && Math.sin(t * 13 + x) > 0.7 ? 0.2 : 1;
    ctx.fillStyle = 'rgba(235,208,130,' + (0.05 * flick).toFixed(2) + ')';
    ctx.fillRect(x - 20, top - 12, 40, 60);
    ctx.fillStyle = 'rgba(235,208,130,' + (0.07 * flick).toFixed(2) + ')';
    ctx.fillRect(x - 12, top - 5, 24, 34);
    ctx.fillStyle = 'rgba(240,216,148,' + (0.5 * flick).toFixed(2) + ')';
    ctx.fillRect(x - 1, top + 3, 4, 1);
  }

  function drawGround(ctx, regime, weather, t, camY) {
    // asphalt
    ctx.fillStyle = '#16151a';
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = '#201e24';
    ctx.fillRect(0, GROUND, W, 2);
    ctx.fillStyle = '#3a3740';
    ctx.fillRect(0, GROUND + 2, W, 1);
    ctx.fillStyle = '#242229';
    ctx.fillRect(0, H - 6, W, 6);

    // road dashes
    ctx.fillStyle = 'rgba(150,145,120,.35)';
    for (let x = 4; x < W; x += 26) ctx.fillRect(x, 389, 12, 2);

    // puddles
    for (let i = 0; i < puddles.length; i++) {
      const p = puddles[i];
      const wet = weather === 'rain' || weather === 'storm';
      ctx.fillStyle = 'rgba(90,110,130,' + (wet ? 0.3 : 0.16) + ')';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(180,180,190,' + (wet ? 0.12 : 0.06) + ')';
      ctx.fillRect(p.x + 2, p.y, Math.max(2, p.w - 6), 1);
      if (wet) {
        const rp = (t * 1.7 + p.p) % 2;
        if (rp < 1) {
          ctx.fillStyle = 'rgba(200,205,215,.2)';
          ctx.fillRect(p.x + Math.floor(p.w / 2) - 1, p.y + 1, 2, 1);
        }
      }
    }

    // dumpster
    const dx = 20, dy = 352;
    ctx.fillStyle = '#2f4a34';
    ctx.fillRect(dx, dy, 22, 13);
    ctx.fillStyle = '#3d5e42';
    ctx.fillRect(dx + 1, dy + 1, 20, 3);
    ctx.fillStyle = '#243a28';
    ctx.fillRect(dx + 1, dy + 5, 20, 1);
    ctx.fillRect(dx + 1, dy + 9, 20, 1);
    ctx.fillStyle = '#1d2d21';
    ctx.fillRect(dx + 3, dy + 13, 3, 2);
    ctx.fillRect(dx + 16, dy + 13, 3, 2);
    // graffiti on dumpster
    BMFont.draw(ctx, 'ДОМ', dx + 4, dy + 6, { scale: 1, spacing: 0, color: '#cfc255', alpha: 0.8 });
    // trash bags
    ctx.fillStyle = '#2b2b30';
    ctx.fillRect(dx + 23, dy + 8, 7, 5);
    ctx.fillRect(dx + 26, dy + 5, 5, 4);
    ctx.fillStyle = '#3a3a40';
    ctx.fillRect(dx + 24, dy + 9, 2, 1);
    if (weather === 'snow') {
      ctx.fillStyle = 'rgba(235,240,248,.85)';
      ctx.fillRect(dx, dy - 1, 22, 1);
      ctx.fillRect(dx + 23, dy + 4, 8, 1);
    }

    // bench
    const bx = 258, by = 356;
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(bx, by, 30, 3);
    ctx.fillRect(bx, by + 5, 30, 3);
    ctx.fillStyle = '#2f2620';
    ctx.fillRect(bx + 2, by + 3, 2, 8);
    ctx.fillRect(bx + 26, by + 3, 2, 8);
    ctx.fillStyle = '#6a5640';
    ctx.fillRect(bx + 1, by, 28, 1);
    ctx.fillStyle = '#2e2c30';
    ctx.fillRect(bx + 8, by + 8, 14, 1);

    // lamps
    drawLamp(ctx, 72, t, regime, weather);
    drawLamp(ctx, 246, t, regime, weather);

    // bare tree left
    ctx.fillStyle = '#191820';
    ctx.fillRect(6, 318, 2, GROUND - 318);
    ctx.fillRect(2, 330, 4, 1);
    ctx.fillRect(8, 324, 5, 1);
    ctx.fillRect(10, 320, 1, 5);
    ctx.fillRect(3, 336, 3, 1);
    ctx.fillRect(13, 328, 2, 1);
    ctx.fillRect(11, 318, 1, 7);

    // pigeons
    drawPigeon(ctx, 232, GROUND - 4, 1, t);
    drawPigeon(ctx, 240, GROUND - 3, 2, t + 1);
    drawPigeon(ctx, 290, GROUND - 3, 3, t + 2);

    // snow cover
    if (weather === 'snow') {
      ctx.fillStyle = 'rgba(228,234,244,.62)';
      ctx.fillRect(0, GROUND - 2, W, 2);
      ctx.fillStyle = 'rgba(228,234,244,.3)';
      ctx.fillRect(0, GROUND, W, 3);
      ctx.fillStyle = 'rgba(235,240,248,.8)';
      ctx.fillRect(bx, by - 1, 30, 1);
      ctx.fillRect(6, 318, 2, 1);
      ctx.fillRect(70, 312, 6, 1);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Watermark                                                           */
  /* ------------------------------------------------------------------ */

  function drawWatermark(ctx, regime, t, scene) {
    const col = regime.accent;
    const a = scene === 'title' ? 0.5 : 0.42;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = col;
    ctx.fillRect(52, 116, 24, 1);
    ctx.fillRect(W - 76, 116, 24, 1);
    ctx.globalAlpha = 1;
    BMFont.draw(ctx, 'РЕЖИССЁР', W / 2, 112, {
      scale: 2, spacing: 2, color: col, align: 'center', alpha: a, shadow: '#050508'
    });
    BMFont.draw(ctx, 'АЛЕКСЕЙ БАЛАБАНОВ', W / 2, 131, {
      scale: 2, spacing: 2, color: '#ded8c4', align: 'center', alpha: a + 0.06, shadow: '#050508'
    });
    BMFont.draw(ctx, 'ЛЕНФИЛЬМ · 1985', W / 2, 150, {
      scale: 1, spacing: 1, color: '#9c9888', align: 'center', alpha: 0.4
    });
  }

  /* ------------------------------------------------------------------ */
  /* Weather particles                                                   */
  /* ------------------------------------------------------------------ */

  function drawRain(ctx, particles, t) {
    ctx.fillStyle = 'rgba(140,160,190,.5)';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.globalAlpha = p.a;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, p.len);
    }
    ctx.globalAlpha = 1;
  }

  function drawSnow(ctx, particles) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.big ? '#f0f4fb' : '#c9d2e2';
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.big ? 2 : 1, p.big ? 2 : 1);
    }
    ctx.globalAlpha = 1;
  }

  function drawFog(ctx, t, camY) {
    for (let i = 0; i < 4; i++) {
      const y = 240 + i * 30 + Math.sin(t * 0.2 + i) * 4 + camY * 0.01;
      ctx.fillStyle = 'rgba(160,160,150,' + (0.07 + i * 0.012) + ')';
      ctx.fillRect(0, y, W, 22);
    }
    ctx.fillStyle = 'rgba(150,150,145,.10)';
    ctx.fillRect(0, 280, W, 90);
  }

  function drawVignette(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.fillRect(0, 0, W, 3);
    ctx.fillRect(0, H - 3, W, 3);
    ctx.fillRect(0, 0, 3, H);
    ctx.fillRect(W - 3, 0, 3, H);
    ctx.fillStyle = 'rgba(0,0,0,.1)';
    ctx.fillRect(0, 3, W, 8);
    ctx.fillRect(0, H - 12, W, 9);
    // scanlines
    ctx.fillStyle = 'rgba(0,0,0,.055)';
    for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);
  }

  window.Art = {
    W, H, GROUND,
    REGIMES, REGIME_ORDER, WEATHERS, WEATHER_ORDER, PALETTES, TAGS_LONG,
    rng, mix, shade,
    makeSpec, addGraffiti, addPlant, addCat, breakWindow, addDirt, addCrack,
    drawPanel, drawWindow, drawCat, drawRat, drawHomeless, drawElectrician, drawPigeon,
    drawPlant,
    drawCrane, drawBomb,
    drawBackground, drawGround, drawWatermark,
    drawRain, drawSnow, drawFog, drawVignette,
    drawLamp
  };
})();
