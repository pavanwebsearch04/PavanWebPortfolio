// Imperative simulation for the crawling hero spiders. One instance drives
// every spider from a single requestAnimationFrame loop and writes straight
// to SVG attributes — React never re-renders while they walk.
//
// A spider is always "(edge, distance along edge, direction)". It can only
// change edge at a graph node, and a graph node is a real crossing of two
// strands of the hero web, so it can never leave the web or jump a gap.

import {
  edgeBlockedAt,
  edgePoint,
  edgeTangent,
  strandPoint,
  strandTangent,
  type Pt,
  type RouteEdge,
  type RouteGraph,
} from "@/lib/heroSpiderGraph";
import type { WebDepth } from "@/lib/webData";
import { mulberry32 } from "@/lib/seededRandom";
import { poseLegs, type SpiderHandle } from "./HeroSpiderArt";

const RAD = 180 / Math.PI;
const CRAWL = 0;
const PAUSE = 1;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const wrap180 = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

export const MAX_SPIDERS = 3;

// Per-spider personality: crawl speed (px/s), size, and how long it dwells.
const PERSONALITY = [
  { speed: 24, scale: 0.78, dwell: 1.0, restless: 0.55 },
  { speed: 33, scale: 0.7, dwell: 0.7, restless: 0.72 },
  { speed: 20, scale: 0.82, dwell: 1.45, restless: 0.4 },
  { speed: 29, scale: 0.74, dwell: 0.9, restless: 0.62 },
  { speed: 22, scale: 0.68, dwell: 1.2, restless: 0.48 },
] as const;

interface Rect {
  l: number;
  t: number;
  r: number;
  b: number;
}

interface Departure {
  edge: number;
  dir: 1 | -1;
  u: number;
}

interface Sim {
  index: number;
  h: SpiderHandle;
  on: boolean;
  shown: number;
  placed: boolean;
  edge: number;
  u: number;
  dir: 1 | -1;
  speed: number;
  base: number;
  scale: number;
  dwell: number;
  restless: number;
  mode: number;
  pause: number;
  waited: number;
  next: Departure | null;
  pauseAtNext: boolean;
  hold: number;
  holdCool: number;
  startDelay: number;
  escape: boolean;
  crowded: number;
  pointerCool: number;
  heading: number;
  abdomen: number;
  phase: number;
  amp: number;
  settle: number;
  slideX: number;
  slideY: number;
  offX: number;
  offY: number;
  twitch: Float32Array;
  twitchT: number;
  palp: number;
  recent: number[];
  visits: Map<number, number>;
  px: number;
  py: number;
  vx: number;
  vy: number;
  rng: () => number;
}

export interface EngineOptions {
  graph: RouteGraph;
  handles: SpiderHandle[];
  svg: SVGSVGElement;
  section: HTMLElement;
  canvas: { width: number; height: number };
  /** pointer in canvas coordinates, or null when it should be ignored */
  getPointer: () => Pt | null;
  /** 0..1 — how far the hero has been scrolled away */
  getScroll: () => number;
  seed: number;
}

export class HeroSpiderEngine {
  private readonly g: RouteGraph;
  private readonly sims: Sim[];
  private readonly svg: SVGSVGElement;
  private readonly section: HTMLElement;
  private readonly canvas: { width: number; height: number };
  private readonly getPointer: () => Pt | null;
  private readonly getScroll: () => number;

  private sx = 1;
  private sy = 1;
  private width = 0;
  private height = 0;
  private rects: Rect[] = [];
  private signature = "";
  private edgeFree: Uint8Array;
  private layers = new Map<WebDepth, { outer: Element | null; sway: Element | null }>();
  private offsets = new Map<WebDepth, Pt>();

  private running = false;
  private raf = 0;
  private last = 0;
  private lastLayout = 0;
  private clock = 0;
  private frame = 0;
  private count = 0;
  private placedOnce = false;
  private reduced = false;

  // frame-time monitor → quality ladder (0 full, 1 lighter legs, 2 no highlight)
  private ema = 16;
  private slowFor = 0;
  private fastFor = 0;
  private quality = 0;
  private coarse = false;

  private readonly P: Pt = { x: 0, y: 0 };
  private readonly T: Pt = { x: 0, y: 0 };
  private readonly Q: Pt = { x: 0, y: 0 };

  constructor(opts: EngineOptions) {
    this.g = opts.graph;
    this.svg = opts.svg;
    this.section = opts.section;
    this.canvas = opts.canvas;
    this.getPointer = opts.getPointer;
    this.getScroll = opts.getScroll;
    this.edgeFree = new Uint8Array(this.g.edges.length);

    this.sims = opts.handles.map((h, index) => {
      const p = PERSONALITY[index % PERSONALITY.length];
      const rng = mulberry32(opts.seed * 31 + index * 977 + 5);
      return {
        index,
        h,
        on: false,
        shown: 0,
        placed: false,
        edge: 0,
        u: 0,
        dir: 1,
        speed: 0,
        base: p.speed * (0.92 + rng() * 0.16),
        scale: p.scale,
        dwell: p.dwell,
        restless: p.restless,
        mode: PAUSE,
        pause: 0,
        waited: 0,
        next: null,
        pauseAtNext: true,
        hold: 0,
        holdCool: 3 + rng() * 5,
        startDelay: 0,
        escape: false,
        crowded: 0,
        pointerCool: 0,
        heading: 0,
        abdomen: 0,
        phase: rng() * Math.PI * 2,
        amp: 0,
        settle: 0,
        slideX: 0,
        slideY: 0,
        offX: 0,
        offY: 0,
        twitch: new Float32Array(8),
        twitchT: 0.4 + rng() * 0.8,
        palp: rng() * 6,
        recent: [],
        visits: new Map<number, number>(),
        px: 0,
        py: 0,
        vx: 0,
        vy: 0,
        rng,
      };
    });
  }

  /* ---- configuration ---------------------------------------------------- */

  setReduced(reduced: boolean) {
    this.reduced = reduced;
  }

  setCoarse(coarse: boolean) {
    this.coarse = coarse;
  }

  /** Spiders 0..n-1 are in play; the rest stay hidden. */
  setCount(n: number) {
    const next = clamp(Math.round(n), 0, this.sims.length);
    this.count = next;
    this.sims.forEach((s, i) => {
      const want = i < next && this.placedOnce;
      if (want && !s.on) {
        s.on = true;
        s.h.root.style.display = "";
        if (!s.placed) this.placeOne(s);
      }
      if (!want && s.on) s.on = false; // fades out, then hides itself
    });
  }

  /** Re-measure the hero. Cheap when nothing moved. Returns true on change. */
  layout(force = false): boolean {
    const r = this.svg.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return false;
    const rects: Rect[] = [];
    const push = (el: Element, fallbackPad: number) => {
      const b = el.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) return;
      const attr = el instanceof HTMLElement ? parseFloat(el.dataset.heroAvoid ?? "") : NaN;
      const pad = Number.isFinite(attr) ? attr : fallbackPad;
      rects.push({
        l: b.left - r.left - pad,
        t: b.top - r.top - pad,
        r: b.right - r.left + pad,
        b: b.bottom - r.top + pad,
      });
    };
    this.section.querySelectorAll("[data-hero-avoid]").forEach((el) => push(el, 16));
    const header = document.querySelector("header");
    if (header) push(header, 8);

    const sig = [r.width, r.height, ...rects.flatMap((q) => [q.l, q.t, q.r, q.b])]
      .map((n) => Math.round(n / 3))
      .join(",");
    if (!force && sig === this.signature) return false;
    this.signature = sig;

    this.width = r.width;
    this.height = r.height;
    this.sx = r.width / this.canvas.width;
    this.sy = r.height / this.canvas.height;
    this.rects = rects;

    // a strand sample is unusable when it sits under text / the portrait, or
    // outside the visible hero — spiders turn back there instead of entering
    const mx = 26;
    const my = 20;
    for (const st of this.g.strands) {
      for (let i = 0; i <= st.count; i++) {
        const x = st.xs[i] * this.sx;
        const y = st.ys[i] * this.sy;
        let bad = x < mx || x > this.width - mx || y < my || y > this.height - my;
        if (!bad) {
          for (const q of rects) {
            if (x > q.l && x < q.r && y > q.t && y < q.b) {
              bad = true;
              break;
            }
          }
        }
        st.blocked[i] = bad ? 1 : 0;
      }
    }
    this.g.edges.forEach((e) => {
      const st = this.g.strands[e.strand];
      let free = 1;
      for (let u = 0; u <= e.length && free; u += st.step * 2) {
        if (edgeBlockedAt(this.g, e, u)) free = 0;
      }
      this.edgeFree[e.id] = free && !edgeBlockedAt(this.g, e, e.length) ? 1 : 0;
    });
    return true;
  }

  /** First-time placement: spread spiders over distinct regions of the web. */
  init(): boolean {
    if (this.placedOnce) return true;
    if (!this.layout(true)) return false;
    this.placedOnce = true;
    this.pickAnchors();    this.setCount(this.count);
    return true;
  }

  private anchors: Array<{ edge: number; u: number; dir: 1 | -1 }> = [];

  // Greedy farthest-point choice over every fully usable edge, so the first
  // spiders sit in different parts of the web (top / side / lower / ...).
  private pickAnchors() {
    const { edges, strands } = this.g;
    interface Cand {
      id: number;
      x: number;
      y: number;
      u: number;
      group: number;
    }
    const full: Cand[] = [];
    const partial: Cand[] = [];
    const p = { x: 0, y: 0 };
    const t = { x: 0, y: 0 };
    const comp = this.freeComponents();
    for (const e of edges) {
      if (strands[e.strand].depth === "ambient") continue;
      const step = strands[e.strand].step;
      // longest unobstructed stretch of this strand
      let bestLen = 0;
      let bestMid = 0;
      let runStart = -1;
      for (let u = 0; u <= e.length + 0.001; u += step) {
        const free = u <= e.length && !edgeBlockedAt(this.g, e, u);
        if (free && runStart < 0) runStart = u;
        if ((!free || u + step > e.length) && runStart >= 0) {
          const end = free ? u : u - step;
          if (end - runStart > bestLen) {
            bestLen = end - runStart;
            bestMid = (end + runStart) / 2;
          }
          runStart = -1;
        }
      }
      if (bestLen <= 0) continue;
      edgePoint(this.g, e, bestMid, p);
      edgeTangent(this.g, e, bestMid, t);
      const k = Math.hypot(t.x * this.sx, t.y * this.sy);
      if (bestLen * k < 60) continue;
      const isFull = this.edgeFree[e.id] === 1;
      (isFull ? full : partial).push({
        id: e.id,
        x: p.x * this.sx,
        y: p.y * this.sy,
        u: isFull ? e.length * 0.5 : bestMid,
        group: isFull ? comp.get(e.id) ?? -1 : -2,
      });
    }

    // Prefer whole strands from the biggest connected groups, so no spider
    // is dropped on an island it could never leave. On narrow layouts where
    // text covers most of the web, fall back to the free stretches of
    // partly-covered strands (the spider then works that stretch and turns
    // back at its ends).
    let pool: Cand[];
    if (full.length >= 6) {
      const sizes = new Map<number, number>();
      full.forEach((c) => sizes.set(c.group, (sizes.get(c.group) ?? 0) + 1));
      const ranked = Array.from(sizes.entries()).sort((a, b) => b[1] - a[1]);
      const keep = new Set(ranked.filter(([, n], i) => i === 0 || n >= 6).map(([k]) => k));
      pool = full.filter((c) => keep.has(c.group));
      if (pool.length < this.sims.length * 2) pool = pool.concat(partial);
    } else {
      pool = full.concat(partial);
    }
    this.anchors = [];
    if (pool.length === 0) return;

    const rng = mulberry32(2024);
    const chosen: Cand[] = [];
    // first spider: roughly the upper strands
    chosen.push(pool.reduce((best, c) => (c.y < best.y ? c : best), pool[0]));
    while (chosen.length < this.sims.length) {
      let best: Cand | null = null;
      let bestScore = -1;
      for (const c of pool) {
        if (chosen.includes(c)) continue;
        let dmin = Infinity;
        for (const o of chosen) dmin = Math.min(dmin, Math.hypot(c.x - o.x, c.y - o.y));
        const score = dmin * (0.85 + rng() * 0.3);
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      }
      if (!best) break;
      chosen.push(best);
    }
    this.anchors = chosen.map((c) => ({
      edge: c.id,
      u: c.u,
      dir: (rng() < 0.5 ? 1 : -1) as 1 | -1,
    }));
  }

  // connected groups of fully usable edges (id -> group)
  private freeComponents(): Map<number, number> {
    const { nodes, edges } = this.g;
    const group = new Map<number, number>();
    let next = 0;
    for (const e of edges) {
      if (!this.edgeFree[e.id] || group.has(e.id)) continue;
      const stack = [e.id];
      group.set(e.id, next);
      while (stack.length) {
        const cur = edges[stack.pop() as number];
        for (const nid of [cur.a, cur.b]) {
          for (const eid of nodes[nid].edges) {
            if (this.edgeFree[eid] && !group.has(eid)) {
              group.set(eid, next);
              stack.push(eid);
            }
          }
        }
      }
      next++;
    }
    return group;
  }

  private placeOne(s: Sim) {
    const a = this.anchors[s.index % Math.max(1, this.anchors.length)];
    if (!a) {
      s.on = false;
      return;
    }
    s.edge = a.edge;
    s.u = a.u;
    s.dir = a.dir;
    s.placed = true;
    s.mode = PAUSE;
    s.next = { edge: a.edge, dir: a.dir, u: a.u };
    s.startDelay = 1.9 + s.index * 0.75 + s.rng() * 1.1;
    s.pause = s.startDelay;
    s.speed = 0;
    s.shown = 0;
    this.headingFromEdge(s);
    this.render(s, 0);
  }

  private headingFromEdge(s: Sim) {
    const e = this.g.edges[s.edge];
    edgeTangent(this.g, e, s.u, this.T);
    s.heading = Math.atan2(this.T.y * this.sy * s.dir, this.T.x * this.sx * s.dir) * RAD + 90;
  }

  /* ---- loop -------------------------------------------------------------- */

  start() {
    if (this.running || this.reduced) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  dispose() {
    this.stop();
    // hide everything: a rebuilt engine (e.g. reduced-motion flipped) starts clean
    this.sims.forEach((s) => {
      s.h.root.style.display = "none";
      s.h.root.setAttribute("opacity", "0");
      s.h.silk.setAttribute("opacity", "0");
    });
  }

  /** Reduced motion: settle every spider on its perch with legs at rest. */
  renderStatic() {
    this.readLayers();
    this.sims.forEach((s) => {
      if (!s.on) return;
      s.shown = 1;
      s.amp = 0;
      this.render(s, 0);
    });
  }

  private tick = (now: number) => {
    this.raf = 0;
    if (!this.running) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.25) dt = 1 / 60; // tab was throttled: don't leap
    dt = Math.min(dt, 0.05);
    this.clock += dt;
    this.frame++;
    this.monitor(dt);

    if (now - this.lastLayout > 700) {
      this.lastLayout = now;
      this.layout();
    }

    if (this.getScroll() < 0.97) {
      this.readLayers();
      const pointer = this.getPointer();
      const pp = pointer ? { x: pointer.x * this.sx, y: pointer.y * this.sy } : null;
      for (const s of this.sims) {
        if (!s.on && s.shown <= 0) continue;
        this.step(s, dt, pp);
      }
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  private monitor(dt: number) {
    this.ema += (dt * 1000 - this.ema) * 0.05;
    if (this.clock < 2) return;
    if (this.ema > 30) {
      this.slowFor += dt;
      this.fastFor = 0;
    } else {
      this.slowFor = 0;
      this.fastFor += dt;
    }
    if (this.slowFor > 2.2 && this.quality < 2) {
      this.quality++;
      this.slowFor = 0;
      if (this.quality === 2 && this.count > 3) this.setCount(3);
    }
  }

  /** True once the loop has run smoothly long enough to add a fifth spider. */
  get isSmooth(): boolean {
    return this.clock > 4 && this.quality === 0 && this.ema < 20 && this.fastFor > 3;
  }

  get currentCount() {
    return this.count;
  }

  /* ---- web-layer offsets (parallax + idle sway) ------------------------- */

  private readLayers() {
    (["background", "structural", "midground", "foreground"] as WebDepth[]).forEach((depth) => {
      let l = this.layers.get(depth);
      if (!l || !l.outer?.isConnected) {
        l = {
          outer: this.svg.querySelector(`[data-web-layer="${depth}"]`),
          sway: this.svg.querySelector(`[data-web-sway="${depth}"]`),
        };
        this.layers.set(depth, l);
      }
      const o = this.offsets.get(depth) ?? { x: 0, y: 0 };
      const a = translateOf(l.outer);
      const b = translateOf(l.sway);
      o.x = a[0] + b[0];
      o.y = a[1] + b[1];
      this.offsets.set(depth, o);
    });
  }

  /* ---- per-spider update ------------------------------------------------ */

  private step(s: Sim, dt: number, pointer: Pt | null) {
    const g = this.g;
    if (!s.on) {
      // fading out after the count dropped (responsive change)
      s.shown = Math.max(0, s.shown - dt / 1.2);
      if (s.shown <= 0) s.h.root.style.display = "none";
      this.render(s, dt);
      return;
    }
    s.shown = Math.min(1, s.shown + dt / 1.5);

    const e = g.edges[s.edge];
    const st = g.strands[e.strand];
    const sAbs = e.s0 + s.u;
    strandPoint(st, sAbs, this.P);
    strandTangent(st, sAbs, this.T);
    const k = Math.hypot(this.T.x * this.sx, this.T.y * this.sy) || 1; // px per canvas unit
    const tvx = this.T.x * this.sx * s.dir;
    const tvy = this.T.y * this.sy * s.dir;
    const tl = Math.hypot(tvx, tvy) || 1;
    const fx = tvx / tl;
    const fy = tvy / tl;

    let targetHeading = Math.atan2(tvy, tvx) * RAD + 90;
    let target = 0;

    if (s.mode === PAUSE) {
      s.waited += dt;
      s.pause -= dt;
      if (s.next) {
        const ne = g.edges[s.next.edge];
        edgeTangent(g, ne, s.next.u, this.Q);
        targetHeading =
          Math.atan2(this.Q.y * this.sy * s.next.dir, this.Q.x * this.sx * s.next.dir) * RAD + 90;
      }
      // small, bounded fidgets while it hesitates
      s.twitchT -= dt;
      if (s.twitchT <= 0 && s.speed < 4) {
        const leg = s.rng() < 0.6 ? Math.floor(s.rng() * 2) : Math.floor(s.rng() * 8);
        s.twitch[leg] += (s.rng() < 0.5 ? -1 : 1) * (6 + s.rng() * 6);
        s.twitchT = 0.5 + s.rng() * 1.1;
      }
      const err = Math.abs(wrap180(targetHeading - s.heading));
      if (s.pause <= 0 && (err < 26 || s.waited > 1.6)) {
        if (s.next) this.depart(s, s.next);
      }
    } else {
      target = s.base * (1 + 0.13 * Math.sin(this.clock * 0.9 + s.index * 2.1));

      // occasional unprompted stop in mid-strand, like a real spider
      if (s.hold > 0) {
        s.hold -= dt;
        target = 0;
      } else {
        s.holdCool -= dt;
        if (s.holdCool <= 0) {
          s.hold = 0.4 + s.rng() * 0.9;
          s.holdCool = 5 + s.rng() * 8 * (1.2 - s.restless);
        }
      }

      const remaining = s.dir > 0 ? e.length - s.u : s.u;
      const remPx = remaining * k;
      target *= s.pauseAtNext ? clamp(remPx / 40, 0.12, 1) : clamp(remPx / 18, 0.6, 1);

      // keep a respectful distance from the others
      let spacing = 1;
      for (const o of this.sims) {
        if (o === s || !o.on || !o.placed) continue;
        const dx = o.px - s.px;
        const dy = o.py - s.py;
        const d = Math.hypot(dx, dy);
        if (d < 84) {
          const ahead = dx * fx + dy * fy > 0;
          // the one in front of another yields more; side/behind only ease off
          spacing = Math.min(spacing, ahead ? clamp((d - 34) / 50, 0, 1) : clamp((d - 30) / 20, 0.25, 1));
        }
      }
      target *= spacing;
      s.crowded = spacing < 0.2 ? s.crowded + dt : Math.max(0, s.crowded - dt);

      // pointer awareness (subtle): slow down, and never walk into it
      s.pointerCool -= dt;
      if (pointer) {
        const dx = pointer.x - s.px;
        const dy = pointer.y - s.py;
        const d = Math.hypot(dx, dy);
        if (d < 100) {
          target *= 0.3 + 0.7 * (d / 100);
          if (d < 72 && dx * fx + dy * fy > 0 && s.pointerCool <= 0) {
            s.pointerCool = 4.5;
            this.turnAround(s, 0.35 + s.rng() * 0.4);
          }
        }
      }

      // never walk onto text / the portrait / out of the hero
      const look = (14 + s.speed * 0.35) / k;
      const here = edgeBlockedAt(g, e, s.u);
      if (here) {
        if (!s.escape) {
          s.escape = true;
          s.dir = this.dirToFree(e, s.u);
        }
      } else {
        s.escape = false;
        if (edgeBlockedAt(g, e, clamp(s.u + s.dir * look, 0, e.length))) {
          this.turnAround(s, 0.5 + s.rng() * 0.6);
        }
      }

      if (s.crowded > 2.4) {
        s.crowded = 0;
        this.turnAround(s, 0.4);
      }
    }

    // smooth acceleration / deceleration
    const accel = target > s.speed ? 55 : 110;
    s.speed += clamp(target - s.speed, -accel * dt, accel * dt);
    if (s.speed < 0.05) s.speed = 0;

    const ds = s.speed * dt;
    if (ds > 0) {
      s.u += (s.dir * ds) / k;
      s.phase += (ds / 15) * Math.PI * 2;
    }
    if (s.mode === CRAWL) {
      if (s.dir > 0 && s.u >= e.length) {
        s.u = e.length;
        this.arrive(s, e, e.b);
      } else if (s.dir < 0 && s.u <= 0) {
        s.u = 0;
        this.arrive(s, e, e.a);
      }
    } else {
      s.u = clamp(s.u, 0, e.length);
    }

    // orientation: eased, rate-limited, never a snap
    const diff = wrap180(targetHeading - s.heading);
    const rate = s.mode === PAUSE ? 5 : 8.5;
    const maxStep = (s.mode === PAUSE ? 150 : 230) * dt;
    const stepA = clamp(diff * (1 - Math.exp(-dt * rate)), -maxStep, maxStep);
    s.heading += stepA;
    const turnRate = dt > 0 ? stepA / dt : 0;
    const abdTarget = clamp(-turnRate * 0.05, -9, 9);
    s.abdomen += (abdTarget - s.abdomen) * (1 - Math.exp(-dt * 9));

    // gait amplitude follows actual movement; settling kicks in on stopping
    const moving = s.speed > 2.5;
    const goal = moving ? 1 : 0;
    const wasAmp = s.amp;
    s.amp += (goal - s.amp) * (1 - Math.exp(-dt * (moving ? 9 : 7)));
    if (wasAmp > 0.5 && s.amp <= 0.5 && !moving) s.settle = 1;
    s.settle *= Math.exp(-dt * 4);

    // twitches decay
    const decay = Math.exp(-dt * 6);
    for (let i = 0; i < 8; i++) s.twitch[i] *= decay;
    s.palp += dt * (s.mode === PAUSE ? 3.4 : 5.5);

    this.render(s, dt);
  }

  private turnAround(s: Sim, pause: number) {
    if (s.mode === PAUSE) return;
    s.mode = PAUSE;
    s.pause = pause;
    s.waited = 0;
    s.next = { edge: s.edge, dir: (s.dir * -1) as 1 | -1, u: s.u };
    s.pauseAtNext = s.rng() < 0.6;
  }

  private dirToFree(e: RouteEdge, u: number): 1 | -1 {
    const step = this.g.strands[e.strand].step;
    for (let d = step; d <= e.length; d += step) {
      const fwd = u + d <= e.length && !edgeBlockedAt(this.g, e, u + d);
      const back = u - d >= 0 && !edgeBlockedAt(this.g, e, u - d);
      if (fwd && back) return u / e.length > 0.5 ? -1 : 1;
      if (fwd) return 1;
      if (back) return -1;
    }
    return u > e.length / 2 ? 1 : -1;
  }

  private arrive(s: Sim, e: RouteEdge, nodeId: number) {
    const choice = this.choose(s, e, nodeId);
    s.recent.push(e.id);
    if (s.recent.length > 8) s.recent.shift();
    s.visits.set(choice.edge, (s.visits.get(choice.edge) ?? 0) + 1);

    // how sharply it must swing to take the next strand
    const ne = this.g.edges[choice.edge];
    edgeTangent(this.g, e, s.dir > 0 ? e.length : 0, this.T);
    edgeTangent(this.g, ne, choice.u, this.Q);
    const a0 = Math.atan2(this.T.y * this.sy * s.dir, this.T.x * this.sx * s.dir) * RAD;
    const a1 = Math.atan2(this.Q.y * this.sy * choice.dir, this.Q.x * this.sx * choice.dir) * RAD;
    const turn = Math.abs(wrap180(a1 - a0));
    const deadEnd = choice.edge === e.id;

    const wantsPause = deadEnd || turn > 55 || s.rng() < 0.62;
    if (wantsPause) {
      s.mode = PAUSE;
      s.waited = 0;
      s.next = choice;
      const base = 0.45 + s.rng() * 2.1;
      s.pause = clamp(base * s.dwell + (deadEnd ? 0.5 : 0), 0.35, 3.4);
      s.settle = 1;
    } else {
      this.depart(s, choice);
    }
  }

  private depart(s: Sim, d: Departure) {
    const g = this.g;
    const oldEdge = g.edges[s.edge];
    edgePoint(g, oldEdge, s.u, this.P);
    const ox = this.P.x;
    const oy = this.P.y;
    // leaving along the same strand (a U-turn) continues from where it stands
    if (d.edge !== s.edge) s.u = d.u;
    s.edge = d.edge;
    s.dir = d.dir;
    edgePoint(g, g.edges[s.edge], s.u, this.P);
    // the two strands cross within a few units of the shared node; glide the
    // difference away instead of letting the body pop
    s.slideX += ox - this.P.x;
    s.slideY += oy - this.P.y;
    s.mode = CRAWL;
    s.next = null;
    s.waited = 0;
    s.pauseAtNext = s.rng() < 0.55 + 0.25 * (1 - s.restless);
    s.hold = 0;
  }

  /** Weighted pick among the strands that really leave this junction. */
  private choose(s: Sim, arrived: RouteEdge, nodeId: number): Departure {
    const g = this.g;
    const node = g.nodes[nodeId];
    const nodeX = node.x * this.sx;
    const nodeY = node.y * this.sy;
    const pointer = this.getPointer();
    const pp = pointer ? { x: pointer.x * this.sx, y: pointer.y * this.sy } : null;

    // heading with which the spider arrives (screen space)
    edgeTangent(g, arrived, s.dir > 0 ? arrived.length : 0, this.T);
    const ax = this.T.x * this.sx * s.dir;
    const ay = this.T.y * this.sy * s.dir;
    const al = Math.hypot(ax, ay) || 1;

    const options: Array<Departure & { w: number }> = [];
    for (const eid of node.edges) {
      const ed = g.edges[eid];
      const dir: 1 | -1 = ed.a === nodeId ? 1 : -1;
      const u = dir > 0 ? 0 : ed.length;
      if (ed.a === ed.b) continue;
      const probe = clamp(u + dir * 4, 0, ed.length);
      if (edgeBlockedAt(g, ed, probe)) continue;

      // how far it can walk before text / portrait / bounds
      let reach = ed.length;
      const stp = g.strands[ed.strand].step;
      for (let d = stp; d <= ed.length; d += stp) {
        if (edgeBlockedAt(g, ed, u + dir * d)) {
          reach = d;
          break;
        }
      }

      const depth = g.strands[ed.strand].depth;
      let w = depth === "foreground" ? 1.4 : depth === "midground" ? 1.3 : depth === "structural" ? 1 : 0.7;

      edgeTangent(g, ed, u, this.Q);
      const bx = this.Q.x * this.sx * dir;
      const by = this.Q.y * this.sy * dir;
      const cos = (bx * ax + by * ay) / ((Math.hypot(bx, by) || 1) * al);
      w *= 0.65 + 0.35 * cos; // mild preference for carrying on

      const back = eid === arrived.id;
      if (back) w *= 0.05;
      if (s.recent.includes(eid)) w *= 0.55;
      w /= 1 + 0.45 * (s.visits.get(eid) ?? 0);
      if (reach < 20 && reach < ed.length) w *= 0.15;
      else if (reach < ed.length * 0.5) w *= 0.55;

      // keep apart from the others and from the pointer
      const far = g.nodes[dir > 0 ? ed.b : ed.a];
      const fx = far.x * this.sx;
      const fy = far.y * this.sy;
      for (const o of this.sims) {
        if (o === s || !o.on || !o.placed) continue;
        const d = Math.hypot(o.px - fx, o.py - fy);
        if (d < 140) w *= 0.3 + 0.7 * (d / 140);
        if (o.edge === eid) w *= 0.2;
        const dn = Math.hypot(o.px - nodeX, o.py - nodeY);
        if (dn < 90 && d < dn) w *= 0.6;
      }
      if (pp) {
        const d = Math.hypot(pp.x - fx, pp.y - fy);
        if (d < 150) w *= 0.3 + 0.7 * (d / 150);
      }
      options.push({ edge: eid, dir, u, w: Math.max(w, 0.0001) });
    }

    if (options.length === 0) return { edge: arrived.id, dir: (s.dir * -1) as 1 | -1, u: s.dir > 0 ? arrived.length : 0 };

    // now and then it simply doubles back to revisit where it has been
    const reverse = options.find((o) => o.edge === arrived.id);
    if (reverse && options.length > 1 && s.rng() < 0.07) return reverse;

    const sum = options.reduce((acc, o) => acc + o.w, 0);
    let r = s.rng() * sum;
    for (const o of options) {
      r -= o.w;
      if (r <= 0) return o;
    }
    return options[options.length - 1];
  }

  /* ---- drawing ----------------------------------------------------------- */

  private render(s: Sim, dt: number) {
    const g = this.g;
    const e = g.edges[s.edge];
    const st = g.strands[e.strand];
    const sAbs = e.s0 + s.u;
    strandPoint(st, sAbs, this.P);
    strandTangent(st, sAbs, this.T);
    const k = Math.hypot(this.T.x * this.sx, this.T.y * this.sy) || 1;

    // follow the depth layer's parallax / idle sway; ease over layer changes
    const off = this.offsets.get(st.depth);
    const tx = off ? off.x : 0;
    const ty = off ? off.y : 0;
    const follow = dt > 0 ? 1 - Math.exp(-dt * 12) : 1;
    s.offX += (tx - s.offX) * follow;
    s.offY += (ty - s.offY) * follow;
    const slideDecay = dt > 0 ? Math.exp(-dt * 5) : 1;
    s.slideX *= slideDecay;
    s.slideY *= slideDecay;

    const cx = this.P.x + s.slideX + s.offX;
    const cy = this.P.y + s.slideY + s.offY;
    s.vx = cx * this.sx - s.px;
    s.vy = cy * this.sy - s.py;
    s.px = cx * this.sx;
    s.py = cy * this.sy;

    const h = s.h;
    h.root.setAttribute(
      "transform",
      `translate(${cx.toFixed(2)} ${cy.toFixed(2)}) scale(${(1 / this.sx).toFixed(4)} ${(1 / this.sy).toFixed(4)})`
    );
    h.root.setAttribute("opacity", s.shown.toFixed(3));

    // gentle bob + roll that follow the gait
    const roll = Math.sin(s.phase) * 1.7 * s.amp;
    const sway = Math.sin(s.phase * 0.5) * 0.35 * s.amp;
    const bob = 1 + 0.012 * Math.sin(s.phase * 2) * s.amp - 0.02 * s.settle;
    const scale = s.scale * bob;
    const rot = s.heading + roll;
    h.body.setAttribute("transform", `rotate(${rot.toFixed(1)}) translate(${sway.toFixed(2)} 0) scale(${scale.toFixed(3)})`);
    h.shadow.setAttribute(
      "transform",
      `rotate(${(-rot).toFixed(1)}) translate(1.6 2.8) rotate(${rot.toFixed(1)})`
    );
    h.abdomen.setAttribute("transform", `rotate(${s.abdomen.toFixed(1)} 0 -1.2)`);
    const palp = Math.sin(s.palp) * (4 + 7 * (1 - s.amp));
    h.palpL.setAttribute("transform", `rotate(${palp.toFixed(1)} -1.9 -9)`);
    h.palpR.setAttribute("transform", `rotate(${(-palp * 0.8).toFixed(1)} 1.9 -9)`);

    const stride = this.quality >= 1 || this.coarse ? 2 : 1;
    if (stride === 1 || (this.frame + s.index) % stride === 0 || dt === 0) {
      poseLegs(h, {
        phase: s.phase,
        amp: s.amp,
        twitch: s.twitch,
        spread: 1 + 0.05 * s.settle,
        detail: this.quality === 0 && !this.coarse,
      });
    }

    // the strand beneath catches a little light
    if (this.quality < 2 && s.shown > 0) {
      const w = 15 / k;
      const lox = off ? off.x : 0;
      const loy = off ? off.y : 0;
      let d = "";
      for (let j = -3; j <= 3; j++) {
        strandPoint(st, sAbs + (j * w) / 3, this.Q);
        d += `${j === -3 ? "M" : "L"}${(this.Q.x + lox).toFixed(1)} ${(this.Q.y + loy).toFixed(1)}`;
      }
      h.silk.setAttribute("d", d);
      h.silk.setAttribute("opacity", (s.shown * (0.55 + 0.45 * s.amp)).toFixed(3));
    } else {
      h.silk.setAttribute("opacity", "0");
    }
  }
}

// framer-motion writes SVG transforms as CSS-style strings; read the
// translation back so the spiders ride the same parallax / sway as the strands.
const NUM = "(-?\\d*\\.?\\d+(?:e[-+]?\\d+)?)";
const RE_TX = new RegExp(`translateX\\(${NUM}(?:px)?\\)`);
const RE_TY = new RegExp(`translateY\\(${NUM}(?:px)?\\)`);
const RE_T2 = new RegExp(`translate\\(${NUM}(?:px)?[ ,]+${NUM}(?:px)?\\)`);
const RE_MAT = new RegExp(`matrix\\(${NUM}[ ,]+${NUM}[ ,]+${NUM}[ ,]+${NUM}[ ,]+${NUM}[ ,]+${NUM}\\)`);

function translateOf(el: Element | null): [number, number] {
  if (!el) return [0, 0];
  const raw = (el as SVGElement).style?.transform || el.getAttribute("transform");
  if (!raw) return [0, 0];
  const m = RE_MAT.exec(raw);
  if (m) return [parseFloat(m[5]), parseFloat(m[6])];
  const t2 = RE_T2.exec(raw);
  if (t2) return [parseFloat(t2[1]), parseFloat(t2[2])];
  const x = RE_TX.exec(raw);
  const y = RE_TY.exec(raw);
  return [x ? parseFloat(x[1]) : 0, y ? parseFloat(y[1]) : 0];
}
