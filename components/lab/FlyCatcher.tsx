"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsCoarsePointer } from "@/hooks/useIsCoarsePointer";
import { useOnScreen } from "@/hooks/useOnScreen";

type Difficulty = "easy" | "normal" | "hard";
type Phase = "idle" | "playing" | "paused" | "over";

const ROUND_SECONDS = 30;
const MOTH_PENALTY = 15;
const BASE_POINTS = 10;
const COMBO_STEP = 3; // catches in a row per +1 multiplier
const MAX_MULT = 4;

// spawn: seconds between new insects, speed: px/s at a 640px-wide game area,
// max: insects on screen at once, moth: chance that a new insect is a moth
const SETTINGS: Record<Difficulty, { label: string; spawn: number; speed: number; max: number; moth: number }> = {
  easy: { label: "EASY", spawn: 0.95, speed: 55, max: 5, moth: 0.1 },
  normal: { label: "NORMAL", spawn: 0.65, speed: 85, max: 7, moth: 0.18 },
  hard: { label: "HARD", spawn: 0.45, speed: 125, max: 9, moth: 0.25 },
};
const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

const PAPER = "#f2efe8";
const MUTED = "#b4b2b8";
const CRIMSON = "#ee6c5c";
const CRIMSON_DEEP = "#d4483b";
const GRAPHITE = "#19191e";

interface Insect {
  kind: "fly" | "moth";
  x: number;
  y: number;
  vx: number;
  vy: number;
  wobble: number;
  age: number;
  /** seconds since it was caught; null while still flying */
  caught: number | null;
}
interface Shot {
  tx: number;
  ty: number;
  age: number;
  hit: boolean;
}
interface Floater {
  x: number;
  y: number;
  text: string;
  age: number;
  bad: boolean;
}
interface Game {
  w: number;
  h: number;
  insects: Insect[];
  shots: Shot[];
  floaters: Floater[];
  spawnIn: number;
  timeLeft: number;
  score: number;
  combo: number;
  caught: number;
  angle: number; // the way the spider faces, radians
  aim: { x: number; y: number };
  showAim: boolean;
}

const SPOKES = Array.from({ length: 14 }, (_, i) => (i / 14) * Math.PI * 2 + Math.sin(i * 12.9898) * 0.12);
const RINGS = [0.14, 0.27, 0.42, 0.58, 0.76];

const bestKey = (d: Difficulty) => `lab-fly-catcher-best-${d}`;
function readBest(d: Difficulty): number {
  try {
    const v = Number(window.localStorage.getItem(bestKey(d)));
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}
function saveBest(d: Difficulty, v: number) {
  try {
    window.localStorage.setItem(bestKey(d), String(v));
  } catch {
    /* storage unavailable: the best score just isn't remembered */
  }
}

const multFor = (combo: number) => Math.min(MAX_MULT, 1 + Math.floor(combo / COMBO_STEP));
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function newGame(w: number, h: number): Game {
  return {
    w,
    h,
    insects: [],
    shots: [],
    floaters: [],
    spawnIn: 0,
    timeLeft: ROUND_SECONDS,
    score: 0,
    combo: 0,
    caught: 0,
    angle: -Math.PI / 2,
    aim: { x: w / 2, y: h * 0.3 },
    showAim: false,
  };
}

// A short reaction game on a canvas: tap a fly to shoot silk at it, avoid
// the moths, chain catches for a combo. Game state lives in a ref and is
// updated from a requestAnimationFrame loop; React only holds what the
// surrounding UI displays.
export default function FlyCatcher() {
  const reduced = useReducedMotion();
  const coarse = useIsCoarsePointer();

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const againRef = useRef<HTMLButtonElement>(null);
  const onScreen = useOnScreen(wrapRef, 0);

  const [size, setSize] = useState({ w: 640, h: 372 });
  const [phase, setPhase] = useState<Phase>("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [calm, setCalm] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [caught, setCaught] = useState(0);
  const [time, setTime] = useState(ROUND_SECONDS);
  const [best, setBest] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [announce, setAnnounce] = useState("");

  const g = useRef<Game>(newGame(640, 372));
  const phaseRef = useRef<Phase>("idle");
  const diffRef = useRef<Difficulty>("normal");
  const calmRef = useRef(false);
  const reducedRef = useRef(false);
  const coarseRef = useRef(false);
  const timeShown = useRef(ROUND_SECONDS);
  const dprRef = useRef(1);
  diffRef.current = difficulty;
  calmRef.current = calm;
  reducedRef.current = reduced;
  coarseRef.current = coarse;

  const setPhaseBoth = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // motion-sensitive visitors start in the calmer mode (they can switch it off)
  useEffect(() => {
    if (reduced) setCalm(true);
  }, [reduced]);

  useEffect(() => {
    setBest(readBest(difficulty));
  }, [difficulty]);

  /* ---- sizing ------------------------------------------------------------ */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.max(240, Math.round(el.clientWidth));
      const h = Math.round(w < 520 ? w * 1.0 : w * 0.58);
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    dprRef.current = dpr;
    c.width = Math.round(size.w * dpr);
    c.height = Math.round(size.h * dpr);
    // keep everything in proportion when the area is resized mid-round
    const game = g.current;
    const sx = size.w / game.w;
    const sy = size.h / game.h;
    for (const it of game.insects) {
      it.x *= sx;
      it.y *= sy;
    }
    game.shots = [];
    game.aim = { x: game.aim.x * sx, y: game.aim.y * sy };
    game.w = size.w;
    game.h = size.h;
  }, [size]);

  /* ---- game logic -------------------------------------------------------- */
  const scale = () => clamp(g.current.w / 640, 0.75, 1.25);

  const spawn = () => {
    const game = g.current;
    const cfg = SETTINGS[diffRef.current];
    const S = scale();
    const fromSide = Math.random() < 0.7;
    const dirPos = Math.random() < 0.5;
    let x: number;
    let y: number;
    let tx: number;
    let ty: number;
    if (fromSide) {
      x = dirPos ? -24 : game.w + 24;
      y = game.h * (0.08 + Math.random() * 0.84);
      tx = dirPos ? game.w + 24 : -24;
      ty = game.h * (0.08 + Math.random() * 0.84);
    } else {
      y = dirPos ? -24 : game.h + 24;
      x = game.w * (0.08 + Math.random() * 0.84);
      ty = dirPos ? game.h + 24 : -24;
      tx = game.w * (0.08 + Math.random() * 0.84);
    }
    const dx = tx - x;
    const dy = ty - y;
    const len = Math.hypot(dx, dy) || 1;
    const speed = cfg.speed * S * (0.8 + Math.random() * 0.5) * (calmRef.current ? 0.65 : 1);
    game.insects.push({
      kind: Math.random() < cfg.moth ? "moth" : "fly",
      x,
      y,
      vx: (dx / len) * speed,
      vy: (dy / len) * speed,
      wobble: Math.random() * Math.PI * 2,
      age: 0,
      caught: null,
    });
  };

  const sync = () => {
    const game = g.current;
    setScore(game.score);
    setCombo(game.combo);
    setCaught(game.caught);
  };

  const finish = useCallback(() => {
    const game = g.current;
    setPhaseBoth("over");
    if (!calmRef.current) {
      const prev = readBest(diffRef.current);
      if (game.score > prev) {
        saveBest(diffRef.current, game.score);
        setBest(game.score);
        setNewBest(true);
      } else {
        setNewBest(false);
      }
    } else {
      setNewBest(false);
    }
    setScore(game.score);
    setCaught(game.caught);
    setCombo(0);
    setAnnounce(
      `Round over. You caught ${game.caught} ${game.caught === 1 ? "fly" : "flies"} and scored ${game.score} points.`
    );
  }, [setPhaseBoth]);

  const step = (dt: number) => {
    const game = g.current;
    const cfg = SETTINGS[diffRef.current];

    game.spawnIn -= dt;
    const live = game.insects.filter((i) => i.caught === null).length;
    if (game.spawnIn <= 0) {
      if (live < cfg.max) spawn();
      game.spawnIn = cfg.spawn * (0.7 + Math.random() * 0.6) * (calmRef.current ? 1.3 : 1);
    }

    for (const it of game.insects) {
      it.age += dt;
      if (it.caught !== null) {
        it.caught += dt;
        continue;
      }
      // a gentle sideways weave, perpendicular to the direction of travel
      const speed = Math.hypot(it.vx, it.vy) || 1;
      const weave = reducedRef.current ? 0 : Math.sin(it.age * 3 + it.wobble) * speed * 0.35;
      it.x += (it.vx + (-it.vy / speed) * weave) * dt;
      it.y += (it.vy + (it.vx / speed) * weave) * dt;
    }
    game.insects = game.insects.filter((it) => {
      if (it.caught !== null) return it.caught < 0.45;
      const out = it.x < -60 || it.x > game.w + 60 || it.y < -60 || it.y > game.h + 60;
      return !(out && it.age > 0.5);
    });

    for (const s of game.shots) s.age += dt;
    game.shots = game.shots.filter((s) => s.age < 0.22);
    for (const f of game.floaters) f.age += dt;
    game.floaters = game.floaters.filter((f) => f.age < 0.8);

    if (!calmRef.current) {
      game.timeLeft = Math.max(0, game.timeLeft - dt);
      const shown = Math.ceil(game.timeLeft);
      if (shown !== timeShown.current) {
        timeShown.current = shown;
        setTime(shown);
      }
      if (game.timeLeft <= 0) finish();
    }
  };

  const shoot = (x: number, y: number) => {
    if (phaseRef.current !== "playing") return;
    const game = g.current;
    const S = scale();
    const hitR = (coarseRef.current ? 40 : 32) * S;

    let target: Insect | null = null;
    let bestD = hitR;
    for (const it of game.insects) {
      if (it.caught !== null) continue;
      const d = Math.hypot(it.x - x, it.y - y);
      if (d <= bestD) {
        bestD = d;
        target = it;
      }
    }

    const sx = game.w / 2;
    const sy = game.h / 2;
    const aimX = target ? target.x : x;
    const aimY = target ? target.y : y;
    game.angle = Math.atan2(aimY - sy, aimX - sx);
    game.shots.push({ tx: aimX, ty: aimY, age: 0, hit: !!target });

    if (!target) {
      game.combo = 0;
    } else if (target.kind === "fly") {
      target.caught = 0;
      game.combo += 1;
      game.caught += 1;
      const pts = BASE_POINTS * multFor(game.combo);
      game.score += pts;
      game.floaters.push({ x: target.x, y: target.y - 14 * S, text: `+${pts}`, age: 0, bad: false });
    } else {
      target.caught = 0;
      game.combo = 0;
      if (calmRef.current) {
        game.floaters.push({ x: target.x, y: target.y - 14 * S, text: "MOTH", age: 0, bad: true });
        setAnnounce("That was a moth. Combo reset.");
      } else {
        game.score = Math.max(0, game.score - MOTH_PENALTY);
        game.floaters.push({ x: target.x, y: target.y - 14 * S, text: `-${MOTH_PENALTY}`, age: 0, bad: true });
        setAnnounce(`That was a moth. Minus ${MOTH_PENALTY} points.`);
      }
    }
    sync();
  };

  /* ---- drawing ----------------------------------------------------------- */
  const draw = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const game = g.current;
    const dpr = dprRef.current;
    const S = scale();
    const cx = game.w / 2;
    const cy = game.h / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, game.w, game.h);
    ctx.lineCap = "round";

    // the web behind everything (static, low contrast)
    const R = Math.min(game.w, game.h) * 0.5;
    ctx.strokeStyle = PAPER;
    ctx.globalAlpha = 0.13;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const a of SPOKES) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * R * RINGS[RINGS.length - 1] * 1.32, cy + Math.sin(a) * R * RINGS[RINGS.length - 1] * 1.32);
    }
    for (const rf of RINGS) {
      const r = R * rf * 1.32;
      for (let i = 0; i < SPOKES.length; i++) {
        const a0 = SPOKES[i];
        const a1 = SPOKES[(i + 1) % SPOKES.length] + (i === SPOKES.length - 1 ? Math.PI * 2 : 0);
        const am = (a0 + a1) / 2;
        const x0 = cx + Math.cos(a0) * r;
        const y0 = cy + Math.sin(a0) * r;
        if (i === 0) ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(cx + Math.cos(am) * r * 0.94, cy + Math.sin(am) * r * 0.94, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // silk lines
    for (const s of game.shots) {
      const k = 1 - s.age / 0.22;
      ctx.strokeStyle = s.hit ? CRIMSON : PAPER;
      ctx.globalAlpha = 0.85 * k;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(s.tx, s.ty);
      ctx.stroke();
      if (!s.hit) {
        // a miss leaves a small ring where the silk landed
        ctx.beginPath();
        ctx.arc(s.tx, s.ty, 5 * S + (1 - k) * 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // insects
    for (const it of game.insects) {
      ctx.save();
      ctx.translate(it.x, it.y);
      if (it.caught !== null) {
        const k = 1 - it.caught / 0.45;
        ctx.globalAlpha = Math.max(0, k);
        ctx.fillStyle = "#2c2428";
        ctx.strokeStyle = CRIMSON;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 6 * S, 10 * S, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-6 * S, -3 * S);
        ctx.lineTo(6 * S, 3 * S);
        ctx.moveTo(-6 * S, 3 * S);
        ctx.lineTo(6 * S, -3 * S);
        ctx.stroke();
        ctx.restore();
        continue;
      }
      ctx.rotate(Math.atan2(it.vy, it.vx) + Math.PI / 2);
      const flutter = reducedRef.current ? 0 : Math.sin(it.age * 45) * 0.35;
      if (it.kind === "fly") {
        ctx.fillStyle = PAPER;
        ctx.strokeStyle = PAPER;
        ctx.lineWidth = 1;
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(side * 3.5 * S, -1 * S);
          ctx.rotate(side * (0.6 + flutter));
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.ellipse(side * 3 * S, 0, 5 * S, 2.4 * S, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 0.7;
          ctx.stroke();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.8 * S, 5 * S, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // moth: larger, soft broad wings, and a dashed crimson ring so the
        // warning does not rely on colour alone
        ctx.fillStyle = MUTED;
        ctx.strokeStyle = MUTED;
        ctx.lineWidth = 1;
        for (const side of [-1, 1]) {
          ctx.globalAlpha = 0.22;
          ctx.beginPath();
          ctx.moveTo(0, -2 * S);
          ctx.lineTo(side * (14 + flutter * 3) * S, -8 * S);
          ctx.lineTo(side * 12 * S, 7 * S);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 0.75;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, 3 * S, 7 * S, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.rotate(-(Math.atan2(it.vy, it.vx) + Math.PI / 2));
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = CRIMSON;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(0, 0, 19 * S, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    // the spider, facing the last shot
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(game.angle + Math.PI / 2);
    ctx.strokeStyle = PAPER;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 1.3;
    for (const side of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(side * 3 * S, (-4 + k * 3.5) * S);
        ctx.lineTo(side * (11 + k) * S, (-11 + k * 6) * S);
        ctx.lineTo(side * 19 * S, (-14 + k * 10) * S);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = GRAPHITE;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 5 * S, 6.5 * S, 8.5 * S, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -5.5 * S, 4.2 * S, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = CRIMSON_DEEP;
    ctx.beginPath();
    ctx.arc(0, 6 * S, 2.2 * S, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // score pop-ups
    ctx.font = `600 ${Math.round(13 * S)}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    for (const f of game.floaters) {
      const k = 1 - f.age / 0.8;
      ctx.globalAlpha = Math.max(0, k);
      ctx.fillStyle = f.bad ? CRIMSON : PAPER;
      ctx.fillText(f.text, f.x, f.y - (reducedRef.current ? 0 : f.age * 28));
    }
    ctx.globalAlpha = 1;

    // keyboard aim marker
    if (game.showAim && phaseRef.current !== "idle") {
      const { x, y } = game.aim;
      ctx.strokeStyle = CRIMSON;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 11 * S, 0, Math.PI * 2);
      ctx.moveTo(x - 17 * S, y);
      ctx.lineTo(x - 6 * S, y);
      ctx.moveTo(x + 6 * S, y);
      ctx.lineTo(x + 17 * S, y);
      ctx.moveTo(x, y - 17 * S);
      ctx.lineTo(x, y - 6 * S);
      ctx.moveTo(x, y + 6 * S);
      ctx.lineTo(x, y + 17 * S);
      ctx.stroke();
    }
  };

  /* ---- loop: only runs while the game area is on screen ------------------ */
  const loopFns = useRef({ step, draw });
  loopFns.current = { step, draw };
  useEffect(() => {
    if (!onScreen) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (phaseRef.current === "playing") loopFns.current.step(dt);
      loopFns.current.draw();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [onScreen]);

  // scrolling the game out of view must not let the clock run on
  useEffect(() => {
    if (!onScreen && phaseRef.current === "playing") {
      setPhaseBoth("paused");
      setAnnounce("Game paused");
    }
  }, [onScreen, setPhaseBoth]);

  useEffect(() => {
    if (phase === "over") againRef.current?.focus({ preventScroll: true });
  }, [phase]);

  /* ---- controls ---------------------------------------------------------- */
  const start = () => {
    g.current = newGame(size.w, size.h);
    g.current.spawnIn = 0;
    for (let i = 0; i < 3; i++) spawn();
    g.current.spawnIn = SETTINGS[diffRef.current].spawn;
    timeShown.current = ROUND_SECONDS;
    setTime(ROUND_SECONDS);
    setScore(0);
    setCombo(0);
    setCaught(0);
    setNewBest(false);
    setPhaseBoth("playing");
    setAnnounce(
      calmRef.current ? "Calm round started. Catch the flies, avoid the moths." : "Round started. Thirty seconds."
    );
    canvasRef.current?.focus({ preventScroll: true });
  };

  const togglePause = () => {
    if (phaseRef.current === "playing") {
      setPhaseBoth("paused");
      setAnnounce("Game paused");
    } else if (phaseRef.current === "paused") {
      setPhaseBoth("playing");
      setAnnounce("Game resumed");
      canvasRef.current?.focus({ preventScroll: true });
    }
  };

  const reset = () => {
    g.current = newGame(size.w, size.h);
    timeShown.current = ROUND_SECONDS;
    setTime(ROUND_SECONDS);
    setScore(0);
    setCombo(0);
    setCaught(0);
    setNewBest(false);
    setPhaseBoth("idle");
    setAnnounce("Game reset");
  };

  const canvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * g.current.w, y: ((e.clientY - r.top) / r.height) * g.current.h };
  };
  const downAt = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    downAt.current = { x: e.clientX, y: e.clientY };
    g.current.showAim = false;
  };
  // a tap shoots on release; a drag (the visitor scrolling the page) does not
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = downAt.current;
    downAt.current = null;
    if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12) return;
    const p = canvasPoint(e);
    shoot(p.x, p.y);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const game = g.current;
    const move = (e.shiftKey ? 48 : 24) * scale();
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (e.key in arrows && phaseRef.current === "playing") {
      e.preventDefault();
      game.showAim = true;
      const [dx, dy] = arrows[e.key];
      game.aim = { x: clamp(game.aim.x + dx * move, 8, game.w - 8), y: clamp(game.aim.y + dy * move, 8, game.h - 8) };
    } else if ((e.key === "Enter" || e.key === " ") && phaseRef.current === "playing") {
      e.preventDefault();
      game.showAim = true;
      shoot(game.aim.x, game.aim.y);
    } else if ((e.key === "p" || e.key === "P" || e.key === "Escape") && phaseRef.current !== "idle" && phaseRef.current !== "over") {
      e.preventDefault();
      togglePause();
    }
  };

  const active = phase === "playing" || phase === "paused";
  const mult = multFor(combo);
  const primary = "border-crimson-bright/60 bg-crimson/25 hover:!bg-crimson/40";

  return (
    <div className="flex flex-col gap-4">
      {/* settings */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div role="group" aria-label="Difficulty" className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-label tracking-[0.12em] text-paper-muted">DIFFICULTY</span>
            <div className="flex">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  className="lab-btn"
                  aria-pressed={difficulty === d}
                  disabled={active}
                  onClick={() => setDifficulty(d)}
                >
                  {SETTINGS[d].label}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="lab-btn" aria-pressed={calm} disabled={active} onClick={() => setCalm((c) => !c)}>
            CALM MODE · {calm ? "ON" : "OFF"}
          </button>
        </div>
        <p className="text-support text-paper-muted">Calm mode: no timer and no moth penalty (no best score is recorded).</p>
      </div>

      {/* score bar */}
      <dl className="grid grid-cols-2 gap-px border border-paper/15 bg-paper/10 md:grid-cols-4">
        {[
          { label: "SCORE", value: String(score) },
          { label: "COMBO", value: combo > 0 ? `${combo} · ×${mult}` : "0 · ×1" },
          { label: "TIME", value: calm ? "NO LIMIT" : `${time}s` },
          { label: "BEST", value: calm ? "—" : String(best) },
        ].map((s) => (
          <div key={s.label} className="flex items-baseline justify-between gap-3 bg-ink-graphite px-3 py-2.5">
            <dt className="font-mono text-label tracking-[0.12em] text-paper-muted">{s.label}</dt>
            <dd className="font-mono text-nav text-paper">{s.value}</dd>
          </div>
        ))}
      </dl>

      {/* game area */}
      <div ref={wrapRef} className="relative w-full border border-paper/20 bg-ink">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          role="application"
          aria-label="Fly Catcher game area. Tap or click a fly to catch it. With a keyboard, use the arrow keys to aim and Enter to shoot; P pauses."
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (downAt.current = null)}
          onKeyDown={onKeyDown}
          style={{ width: "100%", height: size.h, display: "block", touchAction: "pan-y" }}
        />

        {phase !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/80 p-4 text-center">
            <div className="flex max-w-sm flex-col items-center gap-3">
              {phase === "idle" && (
                <>
                  <p className="font-display text-card font-medium text-paper">Catch the flies.</p>
                  <p className="text-support text-paper-body">
                    Tap a fly to shoot silk at it. Leave the moths (dashed red ring) alone.
                    {calm ? " No timer in calm mode." : ` You have ${ROUND_SECONDS} seconds.`}
                  </p>
                  <button type="button" className={`lab-btn ${primary}`} onClick={start}>
                    START ROUND
                  </button>
                </>
              )}
              {phase === "paused" && (
                <>
                  <p className="font-display text-card font-medium text-paper">Paused</p>
                  <button type="button" className={`lab-btn ${primary}`} onClick={togglePause}>
                    RESUME
                  </button>
                </>
              )}
              {phase === "over" && (
                <>
                  <p className="font-mono text-label tracking-[0.14em] text-crimson-text">
                    {newBest ? "NEW BEST SCORE" : "ROUND OVER"}
                  </p>
                  <p className="font-display text-card font-medium text-paper">{score} points</p>
                  <p className="text-support text-paper-body">
                    You caught {caught} {caught === 1 ? "fly" : "flies"}.
                    {!calm && !newBest && best > 0 ? ` Best on ${SETTINGS[difficulty].label.toLowerCase()}: ${best}.` : ""}
                  </p>
                  <button ref={againRef} type="button" className={`lab-btn ${primary}`} onClick={start}>
                    PLAY AGAIN
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* round controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="lab-btn" disabled={!active} onClick={togglePause}>
          {phase === "paused" ? "RESUME" : "PAUSE"}
        </button>
        <button type="button" className="lab-btn" disabled={!active} onClick={finish}>
          END ROUND
        </button>
        <button type="button" className="lab-btn" disabled={phase === "idle"} onClick={reset}>
          RESET
        </button>
      </div>

      <ul className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-label tracking-[0.08em] text-paper-muted">
        <li>FLY · +{BASE_POINTS} (×{MAX_MULT} MAX COMBO)</li>
        <li>MOTH, DASHED RING · {calm ? "RESETS COMBO" : `−${MOTH_PENALTY} AND RESETS COMBO`}</li>
        <li>MISS · RESETS COMBO</li>
      </ul>

      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  );
}
