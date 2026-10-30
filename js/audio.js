/* ПАНЕЛЬКИ — 8-bit audio engine. Chiptune sequencer + weather ambience + SFX. */
(function () {
  'use strict';

  const midiFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const SCALES = {
    minor: [0, 2, 3, 5, 7, 8, 10],
    major: [0, 2, 4, 5, 7, 9, 11],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    harm: [0, 2, 3, 5, 7, 8, 11],
    whole: [0, 2, 4, 6, 8, 10]
  };

  /* Each regime has its own key, scale, tempo, chord progression and melody.
     32 steps = four bars of eighth notes. */
  const MOODS = {
    stal: {
      bpm: 84, root: 45, scale: 'minor', prog: [0, 0, 5, 3], style: 'heavy',
      lead: [0, -1, 3, -1, 4, -1, 3, -1, 2, -1, 1, -1, 0, -1, -1, -1,
             0, -1, 3, -1, 4, -1, 6, -1, 4, -1, 3, -1, 2, -1, -1, -1]
    },
    ottepel: {
      bpm: 100, root: 48, scale: 'major', prog: [0, 3, 4, 0], style: 'warm',
      lead: [4, -1, 5, -1, 7, -1, 5, -1, 4, -1, 2, -1, 4, -1, -1, -1,
             7, -1, 8, -1, 7, -1, 4, -1, 5, -1, 4, -1, 2, -1, -1, -1]
    },
    perestroika: {
      bpm: 116, root: 50, scale: 'dorian', prog: [0, 3, 4, 3], style: 'bright',
      lead: [0, -1, 2, 3, -1, 4, -1, 2, 0, -1, -1, 4, 5, -1, 4, -1,
             2, -1, 3, 4, -1, 5, -1, 4, 2, -1, 0, -1, 2, -1, -1, -1]
    },
    devyan: {
      bpm: 138, root: 44, scale: 'phrygian', prog: [0, 1, 0, 5], style: 'heavy',
      lead: [0, 0, -1, 1, 0, -1, 3, -1, 0, 0, -1, 1, 4, -1, 3, -1,
             0, -1, 1, 0, -1, 4, 3, -1, 2, -1, 1, -1, 0, -1, -1, -1]
    },
    stabil: {
      bpm: 96, root: 46, scale: 'harm', prog: [0, 4, 5, 0], style: 'official',
      lead: [0, -1, 4, -1, 7, -1, 4, -1, 3, -1, 2, -1, 0, -1, -1, -1,
             5, -1, 4, -1, 3, -1, 2, -1, 0, -1, 2, -1, 4, -1, -1, -1]
    },
    glasnost: {
      bpm: 122, root: 52, scale: 'lydian', prog: [0, 4, 5, 3], style: 'bright',
      lead: [4, -1, 6, -1, 7, -1, 9, -1, 7, -1, 6, -1, 4, -1, -1, -1,
             2, -1, 4, -1, 6, -1, 7, -1, 6, -1, 4, -1, 2, -1, -1, -1]
    },
    anarchy: {
      bpm: 152, root: 43, scale: 'whole', prog: [0, 2, 4, 1], style: 'chaos',
      lead: [0, 2, 4, 6, 8, 6, 4, 2, 1, 3, 5, 7, 9, 7, 5, 3,
             0, 4, 2, 6, 1, 5, 3, 7, 8, -1, 6, -1, 4, -1, 0, -1]
    }
  };

  function noiseBuffer(ctx, seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }

  class ChipAudio {
    constructor() {
      this.ctx = null;
      this.ready = false;
      this.muted = false;
      this.paused = false;
      try { this.muted = localStorage.getItem('panelki.muted') === '1'; } catch (e) { /* ignore */ }
      this.mood = MOODS.stal;
      this.weather = 'clear';
      this.tension = 0;
      this.scene = 'off';
      this.step = 0;
      this.nextTime = 0;
      this.playing = false;
      this.amb = {};
      this.timer = null;
      this.notesPlayed = 0;
    }

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended' && !this.paused) this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this.ctx = ctx;

      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 18;
      comp.ratio.value = 5;
      comp.attack.value = 0.004;
      comp.release.value = 0.22;
      this.master.connect(comp);
      comp.connect(ctx.destination);

      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = 0.62;
      this.musicBus.connect(this.master);

      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = 0.8;
      this.sfxBus.connect(this.master);

      this.ambBus = ctx.createGain();
      this.ambBus.gain.value = 0.5;
      this.ambBus.connect(this.master);

      this.delay = ctx.createDelay(0.8);
      this.delay.delayTime.value = 0.27;
      const fb = ctx.createGain();
      fb.gain.value = 0.3;
      const dlp = ctx.createBiquadFilter();
      dlp.type = 'lowpass';
      dlp.frequency.value = 2100;
      this.delay.connect(dlp);
      dlp.connect(fb);
      fb.connect(this.delay);
      const dOut = ctx.createGain();
      dOut.gain.value = 0.5;
      dlp.connect(dOut);
      dOut.connect(this.musicBus);

      this.noiseBuf = noiseBuffer(ctx, 2.2);
      this.startAmbience();
      this.ready = true;
      this.timer = setInterval(() => this.tick(), 25);
    }

    startAmbience() {
      const ctx = this.ctx;

      // rain / static hiss
      const rainSrc = ctx.createBufferSource();
      rainSrc.buffer = this.noiseBuf;
      rainSrc.loop = true;
      const rainF = ctx.createBiquadFilter();
      rainF.type = 'bandpass';
      rainF.frequency.value = 1500;
      rainF.Q.value = 0.55;
      const rainG = ctx.createGain();
      rainG.gain.value = 0;
      rainSrc.connect(rainF);
      rainF.connect(rainG);
      rainG.connect(this.ambBus);
      rainSrc.start();
      this.amb.rain = rainG;

      // wind
      const windSrc = ctx.createBufferSource();
      windSrc.buffer = this.noiseBuf;
      windSrc.loop = true;
      const windF = ctx.createBiquadFilter();
      windF.type = 'lowpass';
      windF.frequency.value = 330;
      const windG = ctx.createGain();
      windG.gain.value = 0;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.07;
      const lfoG = ctx.createGain();
      lfoG.gain.value = 170;
      lfo.connect(lfoG);
      lfoG.connect(windF.frequency);
      lfo.start();
      windSrc.connect(windF);
      windF.connect(windG);
      windG.connect(this.ambBus);
      windSrc.start();
      this.amb.wind = windG;

      // city hum
      const hum = ctx.createOscillator();
      hum.type = 'sine';
      hum.frequency.value = 49;
      const humG = ctx.createGain();
      humG.gain.value = 0.02;
      hum.connect(humG);
      humG.connect(this.ambBus);
      hum.start();
      this.amb.hum = humG;
    }

    applyMood() {
      if (this.ready) this.setWeather(this.weather);
    }

    bpm() {
      let b = this.mood.bpm;
      if (this.scene === 'title') b *= 0.82;
      if (this.weather === 'storm') b *= 1.05;
      if (this.weather === 'snow') b *= 0.94;
      if (this.tension >= 2) b *= 1.05;
      return clamp(b, 50, 180);
    }

    setRegime(id) {
      this.mood = MOODS[id] || MOODS.stal;
      this.applyMood();
    }

    setScene(scene) {
      this.scene = scene;
      if (!this.ready) return;
      if (scene === 'off') {
        this.playing = false;
      } else {
        if (!this.playing) {
          this.playing = true;
          this.step = 0;
          this.nextTime = this.ctx.currentTime + 0.12;
        }
      }
    }

    setPaused(paused) {
      this.paused = !!paused;
      if (!this.ctx) return;
      const ctx = this.ctx;
      if (paused) {
        this.playing = false;
        if (ctx.state === 'running') {
          ctx.suspend().catch(() => {});
        }
      } else {
        ctx.resume().catch(() => {});
        if (this.scene !== 'off') {
          this.playing = true;
          this.nextTime = ctx.currentTime + 0.12;
        }
      }
    }

    setWeather(w) {
      this.weather = w;
      if (!this.ready) return;
      const rain = this.amb.rain, wind = this.amb.wind, hum = this.amb.hum;
      const now = this.ctx.currentTime;
      const ramp = (node, v) => {
        if (!node) return;
        node.gain.cancelScheduledValues(now);
        node.gain.setTargetAtTime(v, now, 0.9);
      };
      let rv = 0.02, wv = 0.02;
      if (w === 'rain') { rv = 0.15; wv = 0.045; }
      else if (w === 'storm') { rv = 0.26; wv = 0.11; }
      else if (w === 'snow') { rv = 0.005; wv = 0.06; }
      else if (w === 'fog') { rv = 0.005; wv = 0.035; }
      else if (w === 'overcast') { rv = 0.02; wv = 0.05; }
      else { rv = 0.008; wv = 0.02; }
      ramp(rain, rv);
      ramp(wind, wv);
      ramp(hum, 0.018);
    }

    setTension(n) {
      this.tension = n;
    }

    tick() {
      const ctx = this.ctx;
      if (!ctx || !this.playing || this.scene === 'off') return;
      if (ctx.state !== 'running') return;
      const look = 0.18;
      let guard = 0;
      while (this.nextTime < ctx.currentTime + look && guard++ < 12) {
        const dur = 60 / this.bpm() / 4;
        this.scheduleStep(this.step, this.nextTime);
        this.nextTime += dur;
        this.step = (this.step + 1) % 64;
      }
    }

    scheduleStep(step, time) {
      const m = this.mood;
      const scale = SCALES[m.scale] || SCALES.minor;
      const bar = (step >> 4) & 3;
      const s = step & 15;
      const chordDeg = m.prog[bar];
      const rainy = this.weather === 'rain' || this.weather === 'storm';
      const snow = this.weather === 'snow';
      const fog = this.weather === 'fog';
      const tense = this.tension >= 2;

      const degMidi = (deg, oct) => {
        const l = scale.length;
        const o = Math.floor(deg / l) + (oct || 0);
        const idx = ((deg % l) + l) % l;
        return m.root + scale[idx] + 12 * o;
      };

      const bassMidi = degMidi(chordDeg, -1);

      // bass line
      if (s === 0 || s === 8) {
        this.tone({ freq: midiFreq(bassMidi), time, dur: 0.3, type: 'triangle', vol: 0.14, bus: 'music' });
      } else if (s === 6 || s === 14) {
        this.tone({ freq: midiFreq(degMidi(chordDeg + 4, -1)), time, dur: 0.15, type: 'triangle', vol: 0.075, bus: 'music' });
      }

      // lead melody
      if (s % 2 === 0) {
        let deg = m.lead[(step >> 1) % 32];
        if (this.scene === 'title' && bar % 2 === 1) deg = -1;
        if (deg >= 0) {
          let leadMidi = degMidi(deg, 1);
          if (tense) leadMidi -= 1;
          this.tone({
            freq: midiFreq(leadMidi), time, dur: 0.13, type: 'square',
            vol: 0.05, bus: 'music', delaySend: true,
            detune: tense ? -16 : 0
          });
        }
      }

      // arpeggio
      if (!snow && s % 2 === 1) {
        const tones = [0, 2, 4, 2];
        const deg = chordDeg + tones[(step >> 1) % 4];
        this.tone({ freq: midiFreq(degMidi(deg, 2)), time, dur: 0.055, type: 'square', vol: 0.018, bus: 'music' });
      }

      // percussion
      if (s === 0 || s === 8 || (this.weather === 'storm' && s === 11)) this.kick(time, 1);
      if (s === 4 || s === 12) this.snare(time);
      if (s % 2 === 0 || rainy) this.hat(time, rainy ? 0.022 : 0.012);

      if (snow && (s === 0 || s === 8)) {
        this.tone({ freq: midiFreq(degMidi(chordDeg + 4, 2)), time, dur: 0.55, type: 'sine', vol: 0.035, bus: 'music', attack: 0.003 });
      }
      if (fog && s === 0) {
        this.tone({ freq: midiFreq(bassMidi), time, dur: 2.2, type: 'sawtooth', vol: 0.016, bus: 'music', filter: 380, attack: 0.3 });
      }
      if (this.weather === 'storm' && s === 0 && Math.random() < 0.12) this.thunder(0.35);
      if (tense && s === 14) {
        this.tone({ freq: midiFreq(degMidi(chordDeg + 6, 1)), time, dur: 0.18, type: 'square', vol: 0.016, bus: 'music' });
      }
      if (m.style === 'heavy' && (s === 3 || s === 11)) this.kick(time, 0.45);
      if (m.style === 'bright' && s === 15) {
        this.tone({ freq: midiFreq(degMidi(chordDeg + 7, 2)), time, dur: 0.09, type: 'square', vol: 0.02, bus: 'music' });
      }
      if (m.style === 'chaos' && s === 7) {
        this.tone({ freq: midiFreq(degMidi(chordDeg + 1, 2)) * 1.01, time, dur: 0.05, type: 'square', vol: 0.02, bus: 'music' });
      }
    }

    /* ---------------- tone + noise primitives ---------------- */

    tone(o) {
      if (!this.ctx || this.muted) return;
      this.notesPlayed++;
      const ctx = this.ctx;
      const t = o.time === undefined ? ctx.currentTime : o.time;
      const dur = o.dur === undefined ? 0.15 : o.dur;
      const vol = o.vol === undefined ? 0.08 : o.vol;
      const osc = ctx.createOscillator();
      osc.type = o.type || 'square';
      if (o.detune) osc.detune.value = o.detune;
      const g = ctx.createGain();
      const atk = o.attack === undefined ? 0.005 : o.attack;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + atk);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.frequency.setValueAtTime(Math.max(20, o.freq), t);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
      let node = g;
      if (o.filter) {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = o.filter;
        g.connect(f);
        node = f;
      }
      osc.connect(g);
      const dest = o.bus === 'sfx' ? this.sfxBus : o.bus === 'amb' ? this.ambBus : this.musicBus;
      node.connect(dest);
      if (o.delaySend && this.delay) g.connect(this.delay);
      osc.start(t);
      osc.stop(t + dur + 0.06);
    }

    noise(o) {
      if (!this.ctx || this.muted) return;
      this.notesPlayed++;
      const ctx = this.ctx;
      const t = o.time === undefined ? ctx.currentTime : o.time;
      const dur = o.dur === undefined ? 0.15 : o.dur;
      const vol = o.vol === undefined ? 0.1 : o.vol;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = o.filter || 'highpass';
      f.frequency.setValueAtTime(o.freq || 1000, t);
      if (o.toFreq) f.frequency.exponentialRampToValueAtTime(o.toFreq, t + dur);
      f.Q.value = o.q === undefined ? 1 : o.q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(Math.max(0.0002, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(o.bus === 'amb' ? this.ambBus : this.sfxBus);
      src.start(t);
      src.stop(t + dur + 0.05);
    }

    kick(time, scale) {
      scale = scale === undefined ? 1 : scale;
      this.tone({ freq: 150, to: 42, time, dur: 0.13, type: 'sine', vol: 0.2 * scale, bus: 'music' });
      this.noise({ time, dur: 0.02, vol: 0.05 * scale, filter: 'highpass', freq: 1800, bus: 'music' });
    }

    snare(time) {
      this.noise({ time, dur: 0.11, vol: 0.055, filter: 'bandpass', freq: 1900, q: 0.7, bus: 'music' });
      this.tone({ freq: 185, to: 140, time, dur: 0.07, type: 'triangle', vol: 0.04, bus: 'music' });
    }

    hat(time, vol) {
      this.noise({ time, dur: 0.025, vol, filter: 'highpass', freq: 7000, bus: 'music' });
    }

    /* ---------------- SFX ---------------- */

    click() {
      this.tone({ freq: 660, dur: 0.045, type: 'square', vol: 0.05, bus: 'sfx' });
    }

    drop() {
      this.tone({ freq: 300, to: 520, dur: 0.1, type: 'square', vol: 0.05, bus: 'sfx' });
      this.noise({ dur: 0.09, vol: 0.04, filter: 'bandpass', freq: 900, bus: 'sfx' });
    }

    land() {
      this.noise({ dur: 0.09, vol: 0.12, filter: 'lowpass', freq: 700, bus: 'sfx' });
      this.tone({ freq: 95, to: 55, dur: 0.14, type: 'sine', vol: 0.16, bus: 'sfx' });
    }

    shave() {
      this.noise({ dur: 0.3, vol: 0.06, filter: 'bandpass', freq: 1200, toFreq: 300, bus: 'sfx' });
    }

    perfect() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone({ time: t, freq: midiFreq(88), dur: 0.09, type: 'square', vol: 0.05, bus: 'sfx' });
      this.tone({ time: t + 0.09, freq: midiFreq(95), dur: 0.16, type: 'square', vol: 0.05, bus: 'sfx' });
      this.tone({ time: t + 0.09, freq: midiFreq(83), dur: 0.16, type: 'triangle', vol: 0.05, bus: 'sfx' });
    }

    crash() {
      this.noise({ dur: 0.6, vol: 0.2, filter: 'lowpass', freq: 1400, toFreq: 180, bus: 'sfx' });
      this.tone({ freq: 68, to: 30, dur: 0.5, type: 'sine', vol: 0.18, bus: 'sfx' });
    }

    explosion() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.noise({ time: t, dur: 0.85, vol: 0.3, filter: 'lowpass', freq: 900, toFreq: 90, bus: 'sfx' });
      this.tone({ time: t, freq: 90, to: 26, dur: 0.7, type: 'sine', vol: 0.22, bus: 'sfx' });
      this.noise({ time: t + 0.05, dur: 0.35, vol: 0.12, filter: 'bandpass', freq: 500, bus: 'sfx' });
    }

    swipe() {
      this.noise({ dur: 0.18, vol: 0.14, filter: 'bandpass', freq: 500, toFreq: 2600, q: 1.4, bus: 'sfx' });
      this.tone({ freq: 220, to: 880, dur: 0.15, type: 'square', vol: 0.035, bus: 'sfx' });
    }

    warn() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        this.tone({ time: t + i * 0.14, freq: 880, dur: 0.1, type: 'square', vol: 0.06, bus: 'sfx' });
        this.tone({ time: t + i * 0.14, freq: 440, dur: 0.1, type: 'square', vol: 0.04, bus: 'sfx' });
      }
    }

    whistleStart() {
      if (!this.ctx || this.muted) return () => {};
      const ctx = this.ctx;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 1.7);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.055, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.85);
      osc.connect(g);
      g.connect(this.sfxBus);
      osc.start(t);
      osc.stop(t + 1.9);
      return () => {
        try {
          g.gain.cancelScheduledValues(ctx.currentTime);
          g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
          osc.stop(ctx.currentTime + 0.08);
        } catch (e) { /* ignore */ }
      };
    }

    meow() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      const g = this.ctx.createGain();
      osc.frequency.setValueAtTime(620, t);
      osc.frequency.linearRampToValueAtTime(880, t + 0.12);
      osc.frequency.linearRampToValueAtTime(520, t + 0.32);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.035, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      osc.connect(g);
      g.connect(this.sfxBus);
      osc.start(t);
      osc.stop(t + 0.4);
    }

    ufo() {
      if (!this.ctx || this.muted) return;
      const ctx = this.ctx;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 5.5;
      const lg = ctx.createGain();
      lg.gain.value = 80;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + 0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      osc.connect(g);
      g.connect(this.sfxBus);
      osc.start(t);
      lfo.start(t);
      osc.stop(t + 1.6);
      lfo.stop(t + 1.6);
      this.notesPlayed += 2;
    }

    powerupDrop() {
      if (!this.ctx || this.muted) return;
      const ctx = this.ctx;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(1300, t + 0.35);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.045, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      osc.connect(g);
      g.connect(this.sfxBus);
      osc.start(t);
      osc.stop(t + 0.5);
      this.notesPlayed++;
    }

    powerup() {
      if (!this.ctx || this.muted) return;
      const ctx = this.ctx;
      const t = ctx.currentTime;
      const notes = [72, 76, 79, 84];
      notes.forEach((n, i) => {
        this.tone({
          time: t + i * 0.07,
          freq: midiFreq(n),
          dur: i === 3 ? 0.35 : 0.09,
          type: 'square',
          vol: 0.055,
          bus: 'sfx',
          delaySend: true
        });
      });
    }

    squeak() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      const g = this.ctx.createGain();
      osc.frequency.setValueAtTime(1700, t);
      osc.frequency.exponentialRampToValueAtTime(2600, t + 0.05);
      osc.frequency.exponentialRampToValueAtTime(2000, t + 0.09);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.02, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      osc.connect(g);
      g.connect(this.sfxBus);
      osc.start(t);
      osc.stop(t + 0.12);
    }

    thunder(vol) {
      vol = vol === undefined ? 1 : vol;
      this.noise({ dur: 1.6 * vol + 0.5, vol: 0.17 * vol, filter: 'lowpass', freq: 220, toFreq: 60, bus: 'sfx' });
      this.tone({ freq: 55, to: 35, dur: 1.3, type: 'sine', vol: 0.08 * vol, bus: 'sfx' });
    }

    fanfare() {
      if (!this.ctx) return;
      const scale = SCALES[this.mood.scale] || SCALES.minor;
      const t = this.ctx.currentTime;
      const seq = [0, 4, 7, 12];
      seq.forEach((d, i) => {
        const idx = d % scale.length;
        const oct = Math.floor(d / scale.length);
        const mm = this.mood.root + scale[idx] + 12 * (oct + 1);
        this.tone({ time: t + i * 0.1, freq: midiFreq(mm), dur: i === 3 ? 0.4 : 0.1, type: 'square', vol: 0.055, bus: 'sfx', delaySend: true });
      });
    }

    gameover() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [72, 67, 63, 58];
      notes.forEach((n, i) => {
        this.tone({ time: t + i * 0.24, freq: midiFreq(n), dur: i === 3 ? 1.2 : 0.32, type: 'square', vol: 0.065, bus: 'sfx', delaySend: true });
      });
      this.tone({ time: t, freq: midiFreq(36), dur: 1.8, type: 'triangle', vol: 0.07, bus: 'sfx' });
    }

    toggleMute() {
      this.muted = !this.muted;
      try { localStorage.setItem('panelki.muted', this.muted ? '1' : '0'); } catch (e) { /* ignore */ }
      if (this.ctx) {
        const now = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, now, 0.04);
      }
      return this.muted;
    }
  }

  ChipAudio.midiFreq = midiFreq;
  window.ChipAudio = ChipAudio;
})();
