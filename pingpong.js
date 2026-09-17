(() => {
  const WORLD_W = 960;
  const WORLD_H = 540;
  const FIXED_DT = 1 / 60;
  const MAX_FRAME_DT = 0.1;
  const PADDLE_W = 14;
  const BALL_R = 9;
  const PLAYER_SPEED = 720;
  const LIVES = 5;
  const STORAGE_KEY = "simple-pong-v2";
  const POWER_DURATION = 7;
  const POWER_SPAWN_CHANCE = 0.16;
  const GAME_KEYS = new Set(["ArrowUp", "ArrowDown", "KeyW", "KeyS", "Space", "KeyR", "Escape", "KeyP"]);

  const LEVELS = [
    { name: "Beginner", ballSpeed: 320, cpuSpeed: 280, paddleHeight: 118, pointsToAdvance: 3, aiError: 48, aiDelay: 0.28 },
    { name: "Novice", ballSpeed: 350, cpuSpeed: 310, paddleHeight: 108, pointsToAdvance: 3, aiError: 40, aiDelay: 0.24 },
    { name: "Rookie", ballSpeed: 380, cpuSpeed: 340, paddleHeight: 98, pointsToAdvance: 3, aiError: 34, aiDelay: 0.21 },
    { name: "Amateur", ballSpeed: 410, cpuSpeed: 370, paddleHeight: 90, pointsToAdvance: 4, aiError: 28, aiDelay: 0.18 },
    { name: "Intermediate", ballSpeed: 440, cpuSpeed: 400, paddleHeight: 82, pointsToAdvance: 4, aiError: 22, aiDelay: 0.16 },
    { name: "Skilled", ballSpeed: 470, cpuSpeed: 430, paddleHeight: 76, pointsToAdvance: 4, aiError: 18, aiDelay: 0.14 },
    { name: "Advanced", ballSpeed: 500, cpuSpeed: 460, paddleHeight: 70, pointsToAdvance: 5, aiError: 14, aiDelay: 0.12 },
    { name: "Expert", ballSpeed: 535, cpuSpeed: 500, paddleHeight: 64, pointsToAdvance: 5, aiError: 10, aiDelay: 0.1 },
    { name: "Master", ballSpeed: 570, cpuSpeed: 540, paddleHeight: 58, pointsToAdvance: 5, aiError: 7, aiDelay: 0.08 },
    { name: "Legend", ballSpeed: 620, cpuSpeed: 590, paddleHeight: 52, pointsToAdvance: 6, aiError: 4, aiDelay: 0.06 },
  ];

  const POWER_LABEL = { wide: "WIDE", slow: "SLOW", multi: "MULTI", magnet: "MAGNET", burst: "BURST" };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  const DEFAULT_SETTINGS = { master: 0.8, sfx: 0.9, music: 0.35, shake: true };

  function loadSave() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { highscore: 0, bestLevel: 1, settings: { ...DEFAULT_SETTINGS } };
      const p = JSON.parse(raw);
      return {
        highscore: p.highscore || 0,
        bestLevel: p.bestLevel || 1,
        settings: { ...DEFAULT_SETTINGS, ...(p.settings || {}) },
      };
    } catch {
      return { highscore: 0, bestLevel: 1, settings: { ...DEFAULT_SETTINGS } };
    }
  }

  function writeSave(save) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); } catch { /* ignore */ }
  }

  const audio = (() => {
    let ctx = null, master = null, sfxBus = null, musicBus = null, musicTimer = null, musicStep = 0;
    const theme = [262, 330, 392, 523, 392, 330, 294, 349];
    function ensure() {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC({ latencyHint: "interactive" });
      master = ctx.createGain();
      sfxBus = ctx.createGain();
      musicBus = ctx.createGain();
      sfxBus.connect(master);
      musicBus.connect(master);
      master.connect(ctx.destination);
      return ctx;
    }
    function ramp(g, value) {
      if (!ctx) return;
      g.gain.setTargetAtTime(value * value, ctx.currentTime, 0.04);
    }
    function apply(s) {
      if (!master) return;
      ramp(master, s.master); ramp(sfxBus, s.sfx); ramp(musicBus, s.music);
    }
    function beep(freq, dur, type, gain, pan = 0, bus = sfxBus) {
      if (!ctx || !bus) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const p = ctx.createStereoPanner();
      osc.type = type;
      osc.frequency.value = freq;
      p.pan.value = pan;
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(gain, now + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(g); g.connect(p); p.connect(bus);
      osc.start(now);
      osc.stop(now + dur + 0.02);
      osc.onended = () => { osc.disconnect(); g.disconnect(); p.disconnect(); };
    }
    return {
      unlock(s) {
        const c = ensure();
        if (c.state === "suspended") void c.resume();
        apply(s);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible" && ctx?.state === "suspended") void ctx.resume();
        });
      },
      apply,
      sfxHit(n, pan) { const f = 220 + n * 280 + (Math.random() * 30 - 15); beep(f, 0.09, "square", 0.12, pan); beep(f * 0.5, 0.12, "triangle", 0.08, pan); },
      sfxWall() { beep(140 + Math.random() * 20, 0.07, "sine", 0.08); },
      sfxScore(ok) { if (ok) { beep(523, 0.12, "triangle", 0.14); beep(784, 0.18, "sine", 0.1); } else { beep(196, 0.18, "sawtooth", 0.1); beep(130, 0.22, "sine", 0.08); } },
      sfxLevel() { beep(392, 0.12, "triangle", 0.12); setTimeout(() => beep(523, 0.12, "triangle", 0.12), 90); setTimeout(() => beep(659, 0.2, "triangle", 0.14), 180); },
      sfxPower() { beep(880, 0.1, "square", 0.1); beep(1320, 0.16, "sine", 0.08); },
      sfxUi() { beep(640, 0.06, "triangle", 0.07); },
      sfxOver(win) {
        const notes = win ? [523, 659, 784, 1046] : [330, 247, 196, 130];
        notes.forEach((f, i) => setTimeout(() => beep(f, 0.2, win ? "triangle" : "sine", 0.11), i * 110));
      },
      startMusic() {
        this.stopMusic();
        if (!ctx) return;
        const tick = () => {
          if (!ctx || !musicBus) return;
          const f = theme[musicStep % theme.length];
          musicStep += 1;
          beep(f, 0.22, "sine", 0.045, 0, musicBus);
          beep(f / 2, 0.28, "triangle", 0.03, 0, musicBus);
          musicTimer = window.setTimeout(tick, 420);
        };
        tick();
      },
      stopMusic() { if (musicTimer != null) { clearTimeout(musicTimer); musicTimer = null; } },
    };
  })();

  class Input {
    constructor() {
      this.keys = new Set();
      this.pointerY = null;
      this.holdDir = 0;
      this.prevPause = false;
      this.prevRestart = false;
      this.canvas = null;
      this.surface = null;
      this.pointerId = null;
      this.onKeyDown = (e) => {
        if (GAME_KEYS.has(e.code)) { e.preventDefault(); e.stopPropagation(); }
        this.keys.add(e.code);
      };
      this.onKeyUp = (e) => this.keys.delete(e.code);
      this.onBlur = () => { this.keys.clear(); this.holdDir = 0; };
      this.onPointerDown = (e) => {
        if (e.target.closest("button, a, input, [role='button']")) return;
        this.pointerId = e.pointerId;
        this.surface?.setPointerCapture?.(e.pointerId);
        this.samplePointer(e);
        e.preventDefault();
      };
      this.onPointerMove = (e) => {
        if (this.pointerId != null && e.pointerId !== this.pointerId) return;
        if (e.pointerType === "mouse") { this.samplePointer(e); return; }
        if (this.pointerId != null || e.buttons) this.samplePointer(e);
      };
      this.onPointerUp = (e) => {
        if (this.pointerId != null && e.pointerId !== this.pointerId) return;
        this.pointerId = null;
        if (e.pointerType !== "mouse") this.pointerY = null;
      };
      this.onPointerLeave = (e) => {
        if (e.pointerType === "mouse" && this.pointerId == null) this.pointerY = null;
      };
    }
    attach(canvas, surface) {
      this.canvas = canvas;
      this.surface = surface;
      canvas.tabIndex = 0;
      const opts = { capture: true };
      window.addEventListener("keydown", this.onKeyDown, opts);
      window.addEventListener("keyup", this.onKeyUp, opts);
      window.addEventListener("blur", this.onBlur);
      surface.addEventListener("pointerdown", this.onPointerDown);
      surface.addEventListener("pointermove", this.onPointerMove);
      surface.addEventListener("pointerup", this.onPointerUp);
      surface.addEventListener("pointercancel", this.onPointerUp);
      surface.addEventListener("pointerleave", this.onPointerLeave);
    }
    focus() { this.canvas?.focus({ preventScroll: true }); }
    samplePointer(e) {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.height <= 0) return;
      this.pointerY = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    }
    sample() {
      let moveY = this.holdDir;
      if (this.keys.has("ArrowUp") || this.keys.has("KeyW")) moveY -= 1;
      if (this.keys.has("ArrowDown") || this.keys.has("KeyS")) moveY += 1;
      try {
        for (const pad of navigator.getGamepads?.() ?? []) {
          if (!pad) continue;
          const axis = pad.axes[1] ?? 0;
          if (Math.abs(axis) > 0.18) moveY += axis;
          if (pad.buttons[12]?.pressed) moveY -= 1;
          if (pad.buttons[13]?.pressed) moveY += 1;
        }
      } catch { /* ignore */ }
      moveY = clamp(moveY, -1, 1);
      const pauseHeld = this.keys.has("Space") || this.keys.has("Escape") || this.keys.has("KeyP");
      const restartHeld = this.keys.has("KeyR");
      const pausePressed = pauseHeld && !this.prevPause;
      const restartPressed = restartHeld && !this.prevRestart;
      this.prevPause = pauseHeld;
      this.prevRestart = restartHeld;
      return { moveY, pointerY: moveY === 0 ? this.pointerY : null, pausePressed, restartPressed };
    }
  }

  class Juice {
    constructor() {
      this.pool = Array.from({ length: 220 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, r: 2, color: "#fff", alive: false }));
      this.floaters = [];
      this.trauma = 0;
      this.hitstop = 0;
      this.paddleSquashL = 1;
      this.paddleSquashR = 1;
      this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.shakeEnabled = true;
    }
    addTrauma(v) { if (this.shakeEnabled && !this.reduced) this.trauma = Math.min(1, this.trauma + v); }
    burst(x, y, color, n = 16, speed = 220) {
      const count = this.reduced ? Math.ceil(n * 0.35) : n;
      for (let i = 0; i < count; i++) {
        const p = this.pool.find((q) => !q.alive);
        if (!p) break;
        const a = Math.random() * Math.PI * 2;
        const s = speed * (0.4 + Math.random() * 0.8);
        Object.assign(p, { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.25 + Math.random() * 0.45, r: 1.5 + Math.random() * 2.5, color, alive: true });
        p.max = p.life;
      }
    }
    pop(x, y, text, color) { this.floaters.push({ x, y, text, color, life: 0.85, max: 0.85 }); }
    step(dt) {
      this.trauma = Math.max(0, this.trauma - dt * 1.8);
      this.hitstop = Math.max(0, this.hitstop - dt);
      this.paddleSquashL += (1 - this.paddleSquashL) * (1 - Math.exp(-14 * dt));
      this.paddleSquashR += (1 - this.paddleSquashR) * (1 - Math.exp(-14 * dt));
      for (const p of this.pool) {
        if (!p.alive) continue;
        p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 80 * dt;
        if (p.life <= 0) p.alive = false;
      }
      this.floaters = this.floaters.filter((f) => { f.life -= dt; f.y -= 46 * dt; return f.life > 0; });
    }
    shakeOffset(t) {
      const s = this.trauma * this.trauma;
      if (s <= 0.001) return { x: 0, y: 0 };
      return { x: (Math.sin(t * 47.1) * 11 + Math.sin(t * 23.7) * 5) * s, y: (Math.cos(t * 41.3) * 9 + Math.sin(t * 17.2) * 4) * s };
    }
  }

  class Game {
    constructor(canvas, surface) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.input = new Input();
      this.juice = new Juice();
      const save = loadSave();
      this.highscore = save.highscore;
      this.bestLevel = save.bestLevel;
      this.settings = save.settings;
      this.juice.shakeEnabled = this.settings.shake;
      this.mode = "menu";
      this.won = false;
      this.level = 1;
      this.playerScore = 0;
      this.cpuScore = 0;
      this.lives = LIVES;
      this.progress = 0;
      this.rally = 0;
      this.longestRally = 0;
      this.left = { x: 28, y: WORLD_H / 2 - 55, w: PADDLE_W, h: 110, vy: 0 };
      this.right = { x: WORLD_W - 28 - PADDLE_W, y: WORLD_H / 2 - 55, w: PADDLE_W, h: 110, vy: 0 };
      this.balls = [];
      this.power = null;
      this.activePower = null;
      this.powerLeft = 0;
      this.aiTarget = WORLD_H / 2;
      this.aiDelay = 0;
      this.acc = 0;
      this.last = 0;
      this.time = 0;
      this.transitionT = 0;
      this.running = false;
      this.onHud = () => {};
      this.input.attach(canvas, surface);
      this.resize();
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") this.persist(); });
    }
    persist() { writeSave({ highscore: this.highscore, bestLevel: this.bestLevel, settings: this.settings }); }
    setSettings(partial) {
      this.settings = { ...this.settings, ...partial };
      this.juice.shakeEnabled = this.settings.shake;
      audio.apply(this.settings);
      this.persist();
      this.onHud();
    }
    hud() {
      const lv = LEVELS[this.level - 1];
      return {
        mode: this.mode, playerScore: this.playerScore, cpuScore: this.cpuScore, lives: this.lives,
        level: this.level, levelName: lv.name, progress: this.progress, progressMax: lv.pointsToAdvance,
        highscore: this.highscore, rally: this.rally, powerUp: this.activePower, powerLeft: this.powerLeft,
        won: this.won, settings: this.settings, longestRally: this.longestRally, bestLevel: this.bestLevel,
      };
    }
    resize() {
      const parent = this.canvas.parentElement;
      const maxW = parent?.clientWidth || window.innerWidth;
      const maxH = parent?.clientHeight || window.innerHeight;
      const scale = Math.min(maxW / WORLD_W, maxH / WORLD_H);
      const cssW = Math.max(1, Math.floor(WORLD_W * scale));
      const cssH = Math.max(1, Math.floor(WORLD_H * scale));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.style.width = cssW + "px";
      this.canvas.style.height = cssH + "px";
      this.canvas.width = Math.floor(cssW * dpr);
      this.canvas.height = Math.floor(cssH * dpr);
    }
    startLoop() {
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      const loop = (t) => {
        if (!this.running) return;
        let dt = Math.min((t - this.last) / 1000, MAX_FRAME_DT);
        this.last = t;
        this.acc += dt;
        this.time = t / 1000;
        const inp = this.input.sample();
        this.handleMeta(inp);
        while (this.acc >= FIXED_DT) { this.update(FIXED_DT, inp); this.acc -= FIXED_DT; }
        this.draw();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
    handleMeta(inp) {
      if (this.mode === "playing" && inp.pausePressed) { this.pause(); audio.sfxUi(); }
      else if (this.mode === "paused" && inp.pausePressed) { this.resume(); audio.sfxUi(); }
      else if (this.mode === "gameover" && inp.restartPressed) this.beginRun();
    }
    beginRun() {
      audio.unlock(this.settings);
      audio.startMusic();
      this.won = false;
      this.level = 1;
      this.playerScore = 0;
      this.cpuScore = 0;
      this.lives = LIVES;
      this.progress = 0;
      this.rally = 0;
      this.longestRally = 0;
      this.activePower = null;
      this.powerLeft = 0;
      this.power = null;
      this.applyLevel();
      this.left.y = (WORLD_H - this.left.h) / 2;
      this.right.y = (WORLD_H - this.right.h) / 2;
      this.serve(Math.random() > 0.5);
      this.mode = "playing";
      this.input.focus();
      this.onHud();
    }
    pause() { if (this.mode === "playing") { this.mode = "paused"; this.onHud(); } }
    resume() { if (this.mode === "paused") { this.mode = "playing"; this.onHud(); } }
    applyLevel() {
      const lv = LEVELS[this.level - 1];
      this.left.h = lv.paddleHeight;
      this.right.h = lv.paddleHeight;
      this.left.y = clamp(this.left.y, 0, WORLD_H - this.left.h);
      this.right.y = clamp(this.right.y, 0, WORLD_H - this.right.h);
      this.progress = 0;
    }
    serve(towardRight) {
      const lv = LEVELS[this.level - 1];
      const angle = rand(-0.55, 0.55);
      const speed = lv.ballSpeed * (this.activePower === "slow" ? 0.62 : 1);
      this.balls = [{ x: WORLD_W / 2, y: WORLD_H / 2, r: BALL_R, speed, dx: Math.cos(angle) * speed * (towardRight ? 1 : -1), dy: Math.sin(angle) * speed, trail: [] }];
    }
    grantPower(kind) {
      this.activePower = kind;
      this.powerLeft = POWER_DURATION;
      audio.sfxPower();
      this.juice.pop(WORLD_W / 2, 90, POWER_LABEL[kind], "#38bdf8");
      if (kind === "wide") this.left.h = Math.min(LEVELS[this.level - 1].paddleHeight * 1.55, 170);
      if (kind === "multi" && this.balls[0]) {
        const b = this.balls[0];
        this.balls.push({ ...b, trail: [], dy: -b.dy || rand(-180, 180), dx: b.dx * 0.92 });
      }
      this.onHud();
    }
    clearPower() {
      this.activePower = null;
      this.powerLeft = 0;
      this.left.h = LEVELS[this.level - 1].paddleHeight;
      this.left.y = clamp(this.left.y, 0, WORLD_H - this.left.h);
      this.onHud();
    }
    update(dt, inp) {
      this.juice.step(dt);
      if (this.mode === "levelup") {
        this.transitionT -= dt;
        if (this.transitionT <= 0) { this.mode = "playing"; this.serve(Math.random() > 0.5); this.onHud(); }
        return;
      }
      if (this.mode !== "playing" || this.juice.hitstop > 0) return;
      const prevY = this.left.y;
      if (inp.moveY !== 0) this.left.y += inp.moveY * PLAYER_SPEED * dt;
      else if (inp.pointerY != null) {
        const target = inp.pointerY * WORLD_H - this.left.h / 2;
        this.left.y += (target - this.left.y) * (1 - Math.exp(-22 * dt));
      }
      this.left.y = clamp(this.left.y, 0, WORLD_H - this.left.h);
      this.left.vy = (this.left.y - prevY) / dt;
      this.updateAi(dt);
      if (this.activePower) {
        this.powerLeft -= dt;
        if (this.powerLeft <= 0) this.clearPower();
      }
      if (this.power) { this.power.life -= dt; if (this.power.life <= 0) this.power = null; }
      for (const b of [...this.balls]) this.stepBall(b, dt);
      if (this.balls.length === 0) this.serve(true);
    }
    updateAi(dt) {
      const lv = LEVELS[this.level - 1];
      const approaching = this.balls.find((b) => b.dx > 0);
      this.aiDelay -= dt;
      if (this.aiDelay <= 0) {
        this.aiDelay = lv.aiDelay * (0.7 + Math.random() * 0.6);
        if (approaching) {
          const t = (this.right.x - approaching.x) / Math.max(approaching.dx, 1);
          let pred = approaching.y + approaching.dy * t;
          const period = WORLD_H * 2;
          pred = ((pred % period) + period) % period;
          if (pred > WORLD_H) pred = period - pred;
          this.aiTarget = pred + (Math.random() * 2 - 1) * lv.aiError;
        } else this.aiTarget = WORLD_H / 2;
      }
      const center = this.right.y + this.right.h / 2;
      const diff = this.aiTarget - center;
      const prev = this.right.y;
      if (Math.abs(diff) > 6) this.right.y += Math.sign(diff) * lv.cpuSpeed * dt;
      else this.right.y += (WORLD_H / 2 - this.right.h / 2 - this.right.y) * 0.4 * dt;
      this.right.y = clamp(this.right.y, 0, WORLD_H - this.right.h);
      this.right.vy = (this.right.y - prev) / dt;
    }
    stepBall(b, dt) {
      if (this.activePower === "magnet" && b.dx < 0) b.dy += (this.left.y + this.left.h / 2 - b.y) * 1.6 * dt;
      b.x += b.dx * dt; b.y += b.dy * dt;
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 8) b.trail.shift();
      if (b.y - b.r <= 0) { b.y = b.r; b.dy = Math.abs(b.dy); audio.sfxWall(); this.juice.burst(b.x, 4, "#c4c4cc", 8, 140); }
      else if (b.y + b.r >= WORLD_H) { b.y = WORLD_H - b.r; b.dy = -Math.abs(b.dy); audio.sfxWall(); this.juice.burst(b.x, WORLD_H - 4, "#c4c4cc", 8, 140); }
      if (b.dx < 0 && this.hitPaddle(b, this.left)) { this.bounce(b, this.left, 1); this.juice.paddleSquashL = 0.78; this.onRallyHit(b, -0.7); }
      else if (b.dx > 0 && this.hitPaddle(b, this.right)) { this.bounce(b, this.right, -1); this.juice.paddleSquashR = 0.78; this.onRallyHit(b, 0.7); }
      if (this.power && Math.hypot(b.x - this.power.x, b.y - this.power.y) < 22 + b.r) {
        const k = this.power.kind; this.power = null; this.grantPower(k);
      }
      if (b.x + b.r < 0) { this.removeBall(b); if (!this.balls.length) this.onCpuPoint(); }
      else if (b.x - b.r > WORLD_W) { this.removeBall(b); if (!this.balls.length) this.onPlayerPoint(); }
    }
    removeBall(b) { this.balls = this.balls.filter((x) => x !== b); }
    hitPaddle(b, p) {
      const nx = clamp(b.x, p.x, p.x + p.w);
      const ny = clamp(b.y, p.y, p.y + p.h);
      return (b.x - nx) ** 2 + (b.y - ny) ** 2 <= b.r * b.r;
    }
    bounce(b, p, dir) {
      b.x = dir > 0 ? p.x + p.w + b.r + 0.2 : p.x - b.r - 0.2;
      const rel = (b.y - (p.y + p.h / 2)) / (p.h / 2);
      const spin = clamp(p.vy / 900, -0.35, 0.35);
      const ang = clamp(rel * 0.95 + spin, -1.05, 1.05) + rand(-0.05, 0.05);
      const lv = LEVELS[this.level - 1];
      const burst = this.activePower === "burst" ? 1.28 : 1;
      b.speed = Math.min(b.speed * 1.035, lv.ballSpeed * 1.65) * burst;
      if (this.activePower === "slow") b.speed = Math.min(b.speed, lv.ballSpeed * 0.7);
      b.dx = Math.cos(ang) * b.speed * dir;
      b.dy = Math.sin(ang) * b.speed;
      if (Math.abs(b.dx) < 80) b.dx = 80 * dir;
    }
    onRallyHit(b, pan) {
      this.rally += 1;
      this.longestRally = Math.max(this.longestRally, this.rally);
      const speedN = clamp(b.speed / 700, 0, 1);
      audio.sfxHit(speedN, pan);
      this.juice.addTrauma(0.12 + speedN * 0.12);
      this.juice.hitstop = this.juice.reduced ? 0 : 0.02;
      this.juice.burst(b.x, b.y, pan < 0 ? "#9fd8f6" : "#f6b38b", 10, 140 + speedN * 80);
      if (!this.power && !this.activePower && Math.random() < POWER_SPAWN_CHANCE) {
        const kinds = ["wide", "slow", "multi", "magnet", "burst"];
        this.power = { x: clamp(WORLD_W / 2 + rand(-40, 40), 180, WORLD_W - 180), y: clamp(b.y + rand(-60, 60), 40, WORLD_H - 40), kind: kinds[Math.floor(Math.random() * kinds.length)], life: 8 };
      }
      this.onHud();
    }
    bumpHigh() {
      if (this.playerScore > this.highscore) this.highscore = this.playerScore;
      if (this.level > this.bestLevel) this.bestLevel = this.level;
      this.persist();
    }
    onPlayerPoint() {
      this.playerScore += 1; this.progress += 1; this.rally = 0;
      audio.sfxScore(true);
      this.juice.addTrauma(0.4);
      this.juice.pop(WORLD_W * 0.35, WORLD_H / 2, "+1", "#9fd8f6");
      this.bumpHigh();
      const lv = LEVELS[this.level - 1];
      if (this.progress >= lv.pointsToAdvance) {
        if (this.level >= LEVELS.length) this.finish(true);
        else {
          this.level += 1; this.applyLevel(); this.mode = "levelup"; this.transitionT = 1.35;
          audio.sfxLevel(); this.juice.addTrauma(0.55); this.juice.burst(WORLD_W / 2, WORLD_H / 2, "#9fd8f6", 24, 240);
        }
      } else this.serve(false);
      this.onHud();
    }
    onCpuPoint() {
      this.cpuScore += 1; this.lives -= 1; this.rally = 0;
      audio.sfxScore(false);
      this.juice.addTrauma(0.5);
      this.juice.pop(WORLD_W * 0.65, WORLD_H / 2, "FAULT", "#f6b38b");
      if (this.lives <= 0) this.finish(false);
      else this.serve(true);
      this.onHud();
    }
    finish(won) {
      this.won = won; this.mode = "gameover"; this.bumpHigh();
      audio.sfxOver(won); audio.stopMusic(); this.onHud();
    }
    draw() {
      const { ctx, canvas } = this;
      ctx.setTransform(canvas.width / WORLD_W, 0, 0, canvas.height / WORLD_H, 0, 0);
      ctx.clearRect(0, 0, WORLD_W, WORLD_H);
      const shake = this.juice.shakeOffset(this.time);
      ctx.translate(shake.x, shake.y);
      const g = ctx.createLinearGradient(0, 0, 0, WORLD_H);
      g.addColorStop(0, "#031323"); g.addColorStop(1, "#061827");
      ctx.fillStyle = g; ctx.fillRect(-20, -20, WORLD_W + 40, WORLD_H + 40);
      ctx.fillStyle = "#123244";
      for (let i = 0; i < WORLD_H; i += 24) ctx.fillRect(WORLD_W / 2 - 2, i, 4, 12);
      this.drawPaddle(this.left, "#9fd8f6", this.juice.paddleSquashL);
      this.drawPaddle(this.right, "#f6b38b", this.juice.paddleSquashR);
      if (this.power) {
        ctx.fillStyle = "#38bdf8"; ctx.beginPath(); ctx.arc(this.power.x, this.power.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#031323"; ctx.font = "700 9px Inter, system-ui, Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(this.power.kind[0].toUpperCase(), this.power.x, this.power.y + 0.5);
      }
      for (const b of this.balls) {
        b.trail.forEach((t, i) => {
          ctx.fillStyle = `rgba(231,246,255,${((i + 1) / b.trail.length) * 0.18})`;
          ctx.beginPath(); ctx.arc(t.x, t.y, b.r * 0.7, 0, Math.PI * 2); ctx.fill();
        });
        ctx.fillStyle = "#e7f6ff"; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      }
      for (const p of this.juice.pool) {
        if (!p.alive) continue;
        ctx.globalAlpha = (p.life / p.max) * 0.85;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.r * 0.5, p.y - p.r * 0.5, p.r, p.r);
        ctx.globalAlpha = 1;
      }
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#bfe9ff"; ctx.font = "bold 20px Inter, system-ui, Arial";
      ctx.fillText(`Level ${this.level}: ${LEVELS[this.level - 1].name}`, WORLD_W / 2, 28);
      ctx.font = "bold 36px Inter, system-ui, Arial";
      ctx.fillStyle = "#9fd8f6"; ctx.fillText(String(this.playerScore), WORLD_W / 2 - 100, 62);
      ctx.fillStyle = "#f6b38b"; ctx.fillText(String(this.cpuScore), WORLD_W / 2 + 100, 62);
      for (const f of this.juice.floaters) {
        ctx.globalAlpha = f.life / f.max; ctx.fillStyle = f.color;
        ctx.font = "600 18px Inter, system-ui, Arial"; ctx.fillText(f.text, f.x, f.y); ctx.globalAlpha = 1;
      }
      if (this.mode === "levelup") {
        ctx.fillStyle = "rgba(11, 18, 32, 0.72)"; ctx.fillRect(0, 0, WORLD_W, WORLD_H);
        ctx.fillStyle = "#e6eef7"; ctx.font = "600 32px Inter, system-ui, Arial";
        ctx.fillText(`Level ${this.level}: ${LEVELS[this.level - 1].name}`, WORLD_W / 2, WORLD_H / 2);
      }
      if (this.mode === "paused") { ctx.fillStyle = "rgba(11, 18, 32, 0.55)"; ctx.fillRect(0, 0, WORLD_W, WORLD_H); }
    }
    drawPaddle(p, color, squash) {
      const h = p.h * squash;
      this.ctx.fillStyle = color;
      this.ctx.fillRect(p.x, p.y + (p.h - h) / 2, p.w, h);
    }
  }

  const canvas = document.getElementById("game");
  const court = document.getElementById("court");
  const game = new Game(canvas, court);
  const overlay = document.getElementById("overlay");
  const panels = {
    menu: document.getElementById("menuPanel"),
    pause: document.getElementById("pausePanel"),
    over: document.getElementById("overPanel"),
    settings: document.getElementById("settingsPanel"),
  };
  const pauseBtn = document.getElementById("pauseBtn");
  const controls = document.getElementById("paddle-controls");
  let settingsOpen = false;

  function showPanel(name) {
    const any = Boolean(name);
    overlay.hidden = !any;
    for (const [k, el] of Object.entries(panels)) el.hidden = k !== name;
  }

  function renderHud() {
    const h = game.hud();
    document.getElementById("score").textContent =
      `Player ${h.playerScore} — ${h.cpuScore} Computer | Level ${h.level}: ${h.levelName} | Highscore ${h.highscore}`;
    let meta = `${h.lives} lives`;
    if (h.rally) meta += ` · rally ${h.rally}`;
    if (h.powerUp) meta += ` · ${h.powerUp} ${h.powerLeft.toFixed(1)}s`;
    document.getElementById("meta").textContent = meta;
    document.getElementById("progress").style.width = `${(h.progress / Math.max(1, h.progressMax)) * 100}%`;
    document.getElementById("menuStats").textContent = `Best ${h.highscore} · Highest court ${h.bestLevel}`;
    pauseBtn.hidden = h.mode !== "playing" && h.mode !== "paused";
    pauseBtn.textContent = h.mode === "paused" ? "Resume" : "Pause";
    controls.hidden = h.mode !== "playing" && h.mode !== "paused";
    if (settingsOpen) showPanel("settings");
    else if (h.mode === "menu") showPanel("menu");
    else if (h.mode === "paused") showPanel("pause");
    else if (h.mode === "gameover") {
      document.getElementById("overTitle").textContent = h.won ? "You cleared Legend" : "Game over";
      document.getElementById("overBody").textContent = `Score ${h.playerScore} · Rally ${h.longestRally} · Court ${h.level}: ${h.levelName}`;
      showPanel("over");
    } else showPanel(null);
  }

  game.onHud = renderHud;
  game.startLoop();
  renderHud();
  window.addEventListener("resize", () => game.resize());
  new ResizeObserver(() => game.resize()).observe(court);

  document.getElementById("playBtn").onclick = () => game.beginRun();
  document.getElementById("resumeBtn").onclick = () => game.resume();
  document.getElementById("restartBtn").onclick = () => game.beginRun();
  document.getElementById("againBtn").onclick = () => game.beginRun();
  pauseBtn.onclick = () => { if (game.mode === "playing") game.pause(); else game.resume(); };
  document.getElementById("settingsBtn").onclick = () => {
    audio.sfxUi();
    settingsOpen = true;
    if (game.mode === "playing") game.pause();
    const s = game.settings;
    document.getElementById("volMaster").value = s.master;
    document.getElementById("volSfx").value = s.sfx;
    document.getElementById("volMusic").value = s.music;
    document.getElementById("shake").checked = s.shake;
    renderHud();
  };
  document.getElementById("closeSettings").onclick = () => { settingsOpen = false; renderHud(); };
  for (const id of ["volMaster", "volSfx", "volMusic"]) {
    document.getElementById(id).oninput = (e) => {
      const key = id === "volMaster" ? "master" : id === "volSfx" ? "sfx" : "music";
      game.setSettings({ [key]: Number(e.target.value) });
    };
  }
  document.getElementById("shake").onchange = (e) => game.setSettings({ shake: e.target.checked });

  function bindHold(btn, dir) {
    const down = (e) => { e.preventDefault(); e.stopPropagation(); btn.setPointerCapture(e.pointerId); game.input.holdDir = dir; game.input.focus(); };
    const up = () => { game.input.holdDir = 0; };
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
    btn.addEventListener("lostpointercapture", up);
  }
  bindHold(document.getElementById("upBtn"), -1);
  bindHold(document.getElementById("downBtn"), 1);
})();
