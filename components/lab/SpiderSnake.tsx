"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useOnScreen } from "@/hooks/useOnScreen";

type Difficulty = "easy" | "normal" | "hard";
type Phase = "idle" | "playing" | "paused" | "over";
interface Pt {
  x: number;
  y: number;
}

// bigger board on wide screens so a round does not end at the first wall
const gridFor = (side: number) => (side >= 520 ? 22 : 16);
const MAX_SIDE = 640;
const POINTS = 10;
const SETTINGS: Record<Difficulty, { label: string; rate: number }> = {
  easy: { label: "EASY", rate: 5 },
  normal: { label: "NORMAL", rate: 8 },
  hard: { label: "HARD", rate: 12 },
};
const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];
const SWIPE_MIN = 24; // px

const PAPER = "#f2efe8";
const CRIMSON = "#ee6c5c";
const CRIMSON_DEEP = "#d4483b";
const GRAPHITE = "#19191e";

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
type DirName = keyof typeof DIRS;
const KEYS: Record<string, DirName> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  W: "up",
  s: "down",
  S: "down",
  a: "left",
  A: "left",
  d: "right",
  D: "right",
};

const bestKey = (d: Difficulty) => `lab-spider-snake-best-${d}`;
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

// squares per second: the base rate, plus a little for every 5 flies caught
const speedFor = (rate: number, flies: number) => Math.min(rate + 4, rate + Math.floor(flies / 5) * 0.5);

interface Game {
  n: number; // squares per side
  segs: Pt[]; // head first
  prev: Pt[]; // positions before the last step, for smooth drawing
  dir: Pt;
  queue: Pt[];
  food: Pt;
  acc: number;
  flies: number;
}

function randomFood(segs: Pt[], n: number): Pt {
  const taken = new Set(segs.map((s) => s.y * n + s.x));
  const free: number[] = [];
  for (let i = 0; i < n * n; i++) if (!taken.has(i)) free.push(i);
  const pick = free[Math.floor(Math.random() * free.length)] ?? 0;
  return { x: pick % n, y: Math.floor(pick / n) };
}

function newGame(n: number): Game {
  const start = [{ x: Math.floor(n / 2), y: Math.floor(n / 2) }];
  return { n, segs: start, prev: start, dir: DIRS.right, queue: [], food: randomFood(start, n), acc: 0, flies: 0 };
}

const same = (a: Pt, b: Pt) => a.x === b.x && a.y === b.y;
const opposite = (a: Pt, b: Pt) => a.x === -b.x && a.y === -b.y;

// Classic "snake" with a spider: steer, catch flies, grow a longer silk
// trail, and don't run into a wall or your own silk. The game advances on a
// fixed step and is drawn between steps so the motion looks smooth.
export default function SpiderSnake() {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const againRef = useRef<HTMLButtonElement>(null);
  const onScreen = useOnScreen(wrapRef, 0);

  const [side, setSide] = useState(400);
  const [ready, setReady] = useState(false); // armed: waiting for the first steer
  const [phase, setPhase] = useState<Phase>("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [flies, setFlies] = useState(0);
  const [best, setBest] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [announce, setAnnounce] = useState("");

  const g = useRef<Game>(newGame(gridFor(400)));
  const phaseRef = useRef<Phase>("idle");
  const diffRef = useRef<Difficulty>("normal");
  const reducedRef = useRef(false);
  const sideRef = useRef(400);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  diffRef.current = difficulty;
  reducedRef.current = reduced;
  sideRef.current = side;

  const setPhaseBoth = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  useEffect(() => {
    setBest(readBest(difficulty));
  }, [difficulty]);

  /* ---- sizing ------------------------------------------------------------ */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.max(240, Math.min(MAX_SIDE, Math.round(el.clientWidth)));
      setSide((s) => (s === w ? s : w));
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
    c.width = Math.round(side * dpr);
    c.height = Math.round(side * dpr);
    // a different board size means a different game: start over
    if (g.current.n !== gridFor(side)) {
      g.current = newGame(gridFor(side));
      setPhaseBoth("idle");
      setReady(false);
      setFlies(0);
    }
  }, [side, setPhaseBoth]);

  /* ---- game logic -------------------------------------------------------- */
  const finish = useCallback(
    (won = false) => {
      const game = g.current;
      const score = game.flies * POINTS;
      setPhaseBoth("over");
      setFlies(game.flies);
      const prev = readBest(diffRef.current);
      if (score > prev) {
        saveBest(diffRef.current, score);
        setBest(score);
        setNewBest(true);
      } else {
        setNewBest(false);
      }
      setAnnounce(
        `${won ? "You filled the whole board! " : "Game over. "}You caught ${game.flies} ${game.flies === 1 ? "fly" : "flies"} for ${score} points.`
      );
    },
    [setPhaseBoth]
  );

  const tick = () => {
    const game = g.current;
    if (game.queue.length) game.dir = game.queue.shift() as Pt;
    const head = game.segs[0];
    const next = { x: head.x + game.dir.x, y: head.y + game.dir.y };
    if (next.x < 0 || next.y < 0 || next.x >= game.n || next.y >= game.n) return finish();
    const eats = same(next, game.food);
    // the tail square is free to enter unless the spider is growing
    const body = eats ? game.segs : game.segs.slice(0, -1);
    if (body.some((s) => same(s, next))) return finish();

    game.prev = game.segs;
    game.segs = [next, ...game.segs];
    if (eats) {
      game.flies += 1;
      setFlies(game.flies);
      if (game.segs.length >= game.n * game.n) return finish(true);
      game.food = randomFood(game.segs, game.n);
    } else {
      game.segs = game.segs.slice(0, -1);
    }
  };

  const steer = (name: DirName) => {
    if (phaseRef.current === "over") return;
    const d = DIRS[name];
    const game = g.current;
    if (phaseRef.current === "paused") return;
    // the first steer starts the round, even if it matches the default heading
    if (phaseRef.current === "idle") {
      game.dir = d;
      game.queue = [];
      setReady(false);
      setPhaseBoth("playing");
      setAnnounce("Game started.");
      return;
    }
    const last = game.queue[game.queue.length - 1] ?? game.dir;
    if (same(d, last)) return;
    if (game.segs.length > 1 && opposite(d, last)) return;
    if (game.queue.length < 2) game.queue.push(d);
  };

  // arms a fresh round: the spider waits in the middle until the first steer
  const start = () => {
    g.current = newGame(gridFor(sideRef.current));
    setFlies(0);
    setNewBest(false);
    setPhaseBoth("idle");
    setReady(true);
    setAnnounce("Ready. Press an arrow key, tap an arrow button or swipe to go.");
    canvasRef.current?.focus({ preventScroll: true });
  };

  const togglePause = useCallback(() => {
    if (phaseRef.current === "playing") {
      setPhaseBoth("paused");
      setAnnounce("Game paused");
    } else if (phaseRef.current === "paused") {
      setPhaseBoth("playing");
      setAnnounce("Game resumed");
    }
  }, [setPhaseBoth]);

  /* ---- drawing ----------------------------------------------------------- */
  const draw = (t: number, time: number) => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const size = sideRef.current;
    const game = g.current;
    const cell = size / game.n;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const mid = (p: Pt) => ({ x: (p.x + 0.5) * cell, y: (p.y + 0.5) * cell });

    // faint web nodes marking the squares
    ctx.fillStyle = PAPER;
    ctx.globalAlpha = 0.09;
    for (let y = 0; y < game.n; y++)
      for (let x = 0; x < game.n; x++) {
        ctx.beginPath();
        ctx.arc((x + 0.5) * cell, (y + 0.5) * cell, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    ctx.globalAlpha = 1;

    // the fly to catch
    {
      const f = mid(game.food);
      const flutter = reducedRef.current ? 0 : Math.sin(time * 40) * 0.3;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.strokeStyle = CRIMSON;
      ctx.fillStyle = CRIMSON;
      ctx.lineWidth = 1.2;
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.rotate(s * (0.7 + flutter));
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(s * cell * 0.22, -cell * 0.1, cell * 0.26, cell * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, cell * 0.13, cell * 0.27, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -cell * 0.3, cell * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // positions drawn between the last two steps
    const k = reducedRef.current ? 1 : Math.max(0, Math.min(1, t));
    const pts = game.segs.map((s, i) => {
      const p = game.prev[i] ?? game.prev[game.prev.length - 1] ?? s;
      return mid({ x: p.x + (s.x - p.x) * k, y: p.y + (s.y - p.y) * k });
    });

    // silk trail
    if (pts.length > 1) {
      ctx.strokeStyle = PAPER;
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = Math.max(2, cell * 0.2);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = GRAPHITE;
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = 1.2;
      for (let i = 1; i < pts.length; i++) {
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, cell * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // the spider, facing the way it is heading
    {
      const h = pts[0];
      const angle = Math.atan2(game.dir.y, game.dir.x);
      const u = cell / 16;
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(angle + Math.PI / 2);
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = Math.max(1.2, u * 1.3);
      for (const s of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(s * 2 * u, (-3 + i * 3) * u);
          ctx.lineTo(s * (7 + i * 0.6) * u, (-8 + i * 5) * u);
          ctx.lineTo(s * 11 * u, (-10 + i * 7) * u);
          ctx.stroke();
        }
      }
      ctx.fillStyle = GRAPHITE;
      ctx.beginPath();
      ctx.ellipse(0, 3 * u, 4.6 * u, 6 * u, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -4 * u, 3 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = CRIMSON_DEEP;
      ctx.beginPath();
      ctx.arc(0, 4 * u, 1.5 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  /* ---- loop: only while the board is on screen ---------------------------- */
  const fns = useRef({ tick, draw });
  fns.current = { tick, draw };
  useEffect(() => {
    if (!onScreen) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      // a game object that does not match the board size (for example kept
      // across a hot reload) is replaced, so the board can never stay blank
      const want = gridFor(sideRef.current);
      if (g.current.n !== want) {
        g.current = newGame(want);
        setPhaseBoth("idle");
        setReady(false);
        setFlies(0);
      }
      const game = g.current;
      let t = 1;
      if (phaseRef.current === "playing") {
        const interval = 1 / speedFor(SETTINGS[diffRef.current].rate, game.flies);
        game.acc += dt;
        while (game.acc >= interval && phaseRef.current === "playing") {
          game.acc -= interval;
          fns.current.tick();
        }
        t = game.acc / interval;
      } else if (phaseRef.current === "paused") {
        t = game.acc / (1 / speedFor(SETTINGS[diffRef.current].rate, game.flies));
      }
      fns.current.draw(t, now / 1000);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [onScreen, setPhaseBoth]);

  // scrolling the board out of view pauses the round
  useEffect(() => {
    if (!onScreen && phaseRef.current === "playing") {
      setPhaseBoth("paused");
      setAnnounce("Game paused");
    }
  }, [onScreen, setPhaseBoth]);

  useEffect(() => {
    if (phase === "over") againRef.current?.focus({ preventScroll: true });
  }, [phase]);

  /* ---- input ------------------------------------------------------------- */
  // while a round is running, the arrow keys steer instead of scrolling the page
  useEffect(() => {
    if (!onScreen) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const p = phaseRef.current;
      const name = KEYS[e.key];
      if (name && (p === "playing" || (p === "idle" && (ready || target === canvasRef.current)))) {
        e.preventDefault();
        steer(name);
      } else if ((e.key === "p" || e.key === "P") && (p === "playing" || p === "paused")) {
        e.preventDefault();
        togglePause();
      } else if (e.key === " " && target === canvasRef.current && (p === "playing" || p === "paused")) {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onScreen, togglePause, ready]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return;
    steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  };

  const score = flies * POINTS;
  const length = g.current.segs.length;
  const active = phase === "playing" || phase === "paused";
  const primary = "border-crimson-bright/60 bg-crimson/25 hover:!bg-crimson/40";

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Difficulty" className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-label tracking-[0.12em] text-paper-muted">SPEED</span>
        <div className="flex">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              className="lab-btn"
              aria-pressed={difficulty === d}
              disabled={active}
              onClick={() => {
                setDifficulty(d);
                setPhaseBoth("idle");
                setReady(false);
                g.current = newGame(gridFor(sideRef.current));
                setFlies(0);
                setNewBest(false);
              }}
            >
              {SETTINGS[d].label}
            </button>
          ))}
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-px border border-paper/15 bg-paper/10">
        {[
          { label: "SCORE", value: String(score) },
          { label: "LENGTH", value: String(length) },
          { label: "BEST", value: String(best) },
        ].map((s) => (
          <div key={s.label} className="flex items-baseline justify-between gap-3 bg-ink-graphite px-3 py-2.5">
            <dt className="font-mono text-label tracking-[0.12em] text-paper-muted">{s.label}</dt>
            <dd className="whitespace-nowrap font-mono text-nav text-paper">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col items-center gap-5 md:flex-row md:items-center md:justify-center md:gap-10">
        <div ref={wrapRef} className="relative w-full max-w-[640px] border border-paper/20 bg-ink md:min-w-0 md:flex-1">
          <canvas
            ref={canvasRef}
            tabIndex={0}
            role="application"
            aria-label="Spider Snake game board. Use the arrow keys or W A S D to steer, or swipe on the board. P pauses."
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (swipe.current = null)}
            style={{ width: "100%", height: side, display: "block", touchAction: "none" }}
          />

          {phase === "idle" && ready && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
              <p className="border border-crimson-bright/50 bg-ink/85 px-3 py-1.5 font-mono text-label tracking-[0.1em] text-paper">
                PRESS AN ARROW TO GO
              </p>
            </div>
          )}

          {phase !== "playing" && !(phase === "idle" && ready) && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/70 p-4 text-center">
              <div className="flex max-w-xs flex-col items-center gap-3">
                {phase === "idle" && (
                  <>
                    <p className="font-display text-card font-medium text-paper">Catch the flies.</p>
                    <p className="text-support text-paper-body">
                      Press START, then press an arrow (or tap an arrow button) to set off. Don&rsquo;t touch the walls or your silk.
                    </p>
                    <button
                      type="button"
                      className={`lab-btn ${primary}`}
                      onClick={start}
                    >
                      START
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
                      {newBest ? "NEW BEST SCORE" : "GAME OVER"}
                    </p>
                    <p className="font-display text-card font-medium text-paper">{score} points</p>
                    <p className="text-support text-paper-body">
                      You caught {flies} {flies === 1 ? "fly" : "flies"}.
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

        {/* controls: below the board on small screens, to the right of it on desktop */}
        <div className="flex flex-col items-center gap-5 md:shrink-0">
          <p className="hidden font-mono text-label tracking-[0.12em] text-paper-muted md:block">STEER</p>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Steering buttons">
            <span />
            <button type="button" className="lab-btn !min-h-[56px] !min-w-[56px] md:!min-h-[72px] md:!min-w-[72px] md:!text-xl" aria-label="Up" onClick={() => steer("up")}>
              ▲
            </button>
            <span />
            <button type="button" className="lab-btn !min-h-[56px] !min-w-[56px] md:!min-h-[72px] md:!min-w-[72px] md:!text-xl" aria-label="Left" onClick={() => steer("left")}>
              ◀
            </button>
            <button type="button" className="lab-btn !min-h-[56px] !min-w-[56px] md:!min-h-[72px] md:!min-w-[72px] md:!text-xl" aria-label="Down" onClick={() => steer("down")}>
              ▼
            </button>
            <button type="button" className="lab-btn !min-h-[56px] !min-w-[56px] md:!min-h-[72px] md:!min-w-[72px] md:!text-xl" aria-label="Right" onClick={() => steer("right")}>
              ▶
            </button>
          </div>
          <p className="hidden max-w-[220px] text-center text-support text-paper-muted md:block">
            Or use the arrow keys / W A S D on your keyboard.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button type="button" className="lab-btn" disabled={!active} onClick={togglePause}>
              {phase === "paused" ? "RESUME" : "PAUSE"}
            </button>
            <button type="button" className="lab-btn" disabled={phase === "idle" && flies === 0} onClick={start}>
              RESTART
            </button>
          </div>
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  );
}
