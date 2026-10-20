"use client";

import { useEffect, useMemo, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { mulberry32, rangeFrom } from "@/lib/seededRandom";
import { WEB_COLORS, WEB_CONFIG } from "@/lib/webConfig";
import { PageModel, PageNode, PageStrand, strandD } from "@/lib/webGeometry";

const cfg = WEB_CONFIG.spiders;

// How many spiders are mid-crawl right now, across the whole page. Keeps the
// scene sparse: at most `maxMoving` ever walk at the same time.
let movingNow = 0;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

interface Edge {
  strand: PageStrand;
  other: string;
  forward: boolean; // true when traversing a -> b
}

function buildAdjacency(model: PageModel): Map<string, Edge[]> {
  const adj = new Map<string, Edge[]>();
  const add = (id: string, e: Edge) => {
    const list = adj.get(id);
    if (list) list.push(e);
    else adj.set(id, [e]);
  };
  model.strands.forEach((s) => {
    add(s.a, { strand: s, other: s.b, forward: true });
    add(s.b, { strand: s, other: s.a, forward: false });
  });
  return adj;
}

// Eight thin legs, slightly asymmetric per spider. Drawn facing up (-y) with
// the origin at the body centre. Legs are split into two alternating gait
// groups so they skitter when the spider walks.
function spiderLegs(seed: number) {
  const rng = mulberry32(seed);
  const baseAngles = [-74, -30, 16, 56].map((a) => (a * Math.PI) / 180);
  const bends = [-1.15, -0.65, 0.65, 1.15];
  const groupA: string[] = [];
  const groupB: string[] = [];
  for (let i = 0; i < 4; i++) {
    for (const side of [1, -1]) {
      const ay = -3.6 + i * 1.5;
      const ax = side * 0.9;
      const theta = baseAngles[i] + rangeFrom(rng, -0.14, 0.14);
      const l1 = (6.0 + (i === 0 || i === 3 ? 1 : 0)) * rangeFrom(rng, 0.88, 1.12);
      const l2 = (7.2 + (i === 3 ? 1.2 : 0)) * rangeFrom(rng, 0.85, 1.12);
      const kx = ax + side * Math.cos(theta) * l1;
      const ky = ay + Math.sin(theta) * l1;
      const ex = kx + side * Math.cos(theta + bends[i]) * l2;
      const ey = ky + Math.sin(theta + bends[i]) * l2;
      const d = `M ${ax.toFixed(2)} ${ay.toFixed(2)} L ${kx.toFixed(2)} ${ky.toFixed(2)} L ${ex.toFixed(2)} ${ey.toFixed(2)}`;
      // alternate-tetrapod gait: R1 L2 R3 L4 vs L1 R2 L3 R4
      ((i + (side === 1 ? 0 : 1)) % 2 === 0 ? groupA : groupB).push(d);
    }
  }
  return { a: groupA.join(" "), b: groupB.join(" ") };
}

export default function WebSpider({
  model,
  index,
  total,
  registry,
  scrollY,
  reduced,
}: {
  model: PageModel;
  index: number;
  total: number;
  registry: Map<number, MotionValue<number>>;
  scrollY: MotionValue<number>;
  reduced: boolean;
}) {
  const rootRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const silkRef = useRef<SVGLineElement>(null);
  const measureRef = useRef<SVGPathElement>(null);
  const nodeIdRef = useRef<string | null>(null);

  const legs = useMemo(() => spiderLegs(311 + index * 97), [index]);
  const scale = useMemo(
    () => rangeFrom(mulberry32(41 + index * 13), cfg.scale.min, cfg.scale.max),
    [index]
  );
  const startNodeId = useMemo(() => {
    const ordered = Object.values(model.nodes)
      .filter((n) => !n.id.startsWith("T"))
      .sort((p, q) => p.y - q.y);
    if (ordered.length === 0) return null;
    const pick = Math.floor(((index + 0.5) / total) * ordered.length);
    return ordered[clamp(pick, 0, ordered.length - 1)].id;
  }, [model, index, total]);

  useEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    const silk = silkRef.current;
    const measure = measureRef.current;
    if (reduced || !root || !body || !silk || !measure || !startNodeId) return;

    const rng = mulberry32(7000 + index * 131 + Math.floor(model.width));
    const rand = (min: number, max: number) => rangeFrom(rng, min, max);
    const adj = buildAdjacency(model);
    const nodes = model.nodes;

    let cancelled = false;
    let rotation = 0;
    let lastEdgeId = "";

    const stretchOf = (group: number) => registry.get(group)?.get() ?? 0;
    const nodePos = (n: PageNode) => ({ x: n.x, y: n.y + n.k * stretchOf(n.group) });

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(resolve, ms);
        if (cancelled) window.clearTimeout(id);
      });

    const tween = (ms: number, step: (u: number) => void) =>
      new Promise<void>((resolve) => {
        const t0 = performance.now();
        const tick = (now: number) => {
          if (cancelled) return resolve();
          const u = clamp((now - t0) / ms, 0, 1);
          step(u);
          if (u >= 1) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });

    const setOpacity = (o: number) => root.setAttribute("opacity", o.toFixed(3));
    const setWalking = (on: boolean) => body.classList.toggle("spider-walking", on);

    const place = (x: number, y: number, rot: number) => {
      rotation = rot;
      root.setAttribute(
        "transform",
        `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${scale.toFixed(2)})`
      );
    };

    const turnTo = (target: number) => {
      let diff = ((((target - rotation + 180) % 360) + 360) % 360) - 180;
      diff = clamp(diff, -40, 40); // never snap
      return rotation + diff * 0.3;
    };

    const nearViewport = (y: number) => {
      const vh = window.innerHeight;
      const sy = scrollY.get();
      return y > sy - vh * WEB_CONFIG.layer.activeViewportRange && y < sy + vh * (WEB_CONFIG.layer.activeViewportRange + 0.8);
    };

    const whenAwake = async (y: number) => {
      while (!cancelled && (document.hidden || !nearViewport(y))) await sleep(1100);
    };

    const fade = (from: number, to: number, ms: number) =>
      tween(ms, (u) => setOpacity(from + (to - from) * u * u * (3 - 2 * u)));

    // crawl along one strand in stop-and-go bursts
    const crawl = async (edge: Edge) => {
      const s = edge.strand;
      const speed = rand(cfg.speed.min, cfg.speed.max);
      let lastD = "";
      const sample = (dist: number) => {
        const st = stretchOf(s.group);
        const d = strandD(s, nodes, st);
        if (d !== lastD) {
          measure.setAttribute("d", d);
          lastD = d;
        }
        const total = measure.getTotalLength();
        const at = edge.forward ? dist : total - dist;
        const p = measure.getPointAtLength(clamp(at, 0, total));
        const ahead = measure.getPointAtLength(clamp(at + (edge.forward ? 3 : -3), 0, total));
        const heading = (Math.atan2(ahead.y - p.y, ahead.x - p.x) * 180) / Math.PI + 90;
        place(p.x, p.y, turnTo(heading));
        return total;
      };

      const total = sample(0);
      let dist = 0;
      setWalking(true);
      while (dist < total && !cancelled) {
        const a = nodePos(nodes[edge.forward ? s.a : s.b]);
        await whenAwake(a.y);
        if (cancelled) break;
        const burst = Math.min(total - dist, rand(46, 130));
        const ms = (burst / speed) * 1000;
        const from = dist;
        await tween(ms, (u) => {
          sample(from + burst * u * u * (3 - 2 * u));
        });
        dist += burst;
        if (dist < total - 0.5) {
          setWalking(false);
          await sleep(rand(240, 880));
          setWalking(true);
        }
      }
      setWalking(false);
      const end = nodePos(nodes[edge.other]);
      const heading = rotation;
      place(end.x, end.y, heading);
    };

    // lower on a silk thread from a rail node, hang, then climb back
    const descend = async (n: PageNode) => {
      const next = model.groupY.find((gy) => gy > n.y + 60);
      const room = next === undefined ? 90 : next - n.y - 30;
      const drop = Math.min(rand(cfg.descentLength.min, cfg.descentLength.max), room);
      if (drop < 30) return;
      const origin = nodePos(n);
      silk.setAttribute("x1", origin.x.toFixed(1));
      silk.setAttribute("y1", origin.y.toFixed(1));
      silk.setAttribute("opacity", "0.55");
      const move = (y: number, rot: number) => {
        place(origin.x, y, rot);
        silk.setAttribute("x2", origin.x.toFixed(1));
        silk.setAttribute("y2", y.toFixed(1));
      };
      move(origin.y, 180);
      setWalking(true);
      await tween((drop / rand(20, 32)) * 1000, (u) => move(origin.y + drop * u * (2 - u), 180));
      setWalking(false);
      await sleep(rand(1400, 3600));
      if (cancelled) return;
      setWalking(true);
      await tween((drop / rand(16, 24)) * 1000, (u) => move(origin.y + drop * (1 - u * u * (3 - 2 * u)), 0));
      setWalking(false);
      silk.setAttribute("opacity", "0");
      place(origin.x, origin.y, 0);
    };

    const chooseEdge = (nodeId: string, seekHide: boolean): Edge | null => {
      const options = adj.get(nodeId) ?? [];
      if (options.length === 0) return null;
      const pool = options.length > 1 ? options.filter((e) => e.strand.id !== lastEdgeId) : options;
      const weight = (e: Edge) => {
        let w = e.strand.kind === "spur" ? 0.7 : e.strand.kind === "rail" ? 1.2 : 1;
        if (seekHide && nodes[e.other].hide) w *= 5;
        return w;
      };
      const sum = pool.reduce((acc, e) => acc + weight(e), 0);
      let r = rand(0, sum);
      for (const e of pool) {
        r -= weight(e);
        if (r <= 0) return e;
      }
      return pool[pool.length - 1];
    };

    const life = async () => {
      let nodeId: string = nodeIdRef.current && nodes[nodeIdRef.current] ? nodeIdRef.current : startNodeId;
      await sleep(1800 + index * 3200 + rand(0, 2500));

      while (!cancelled) {
        // appear at a junction
        let n = nodes[nodeId];
        let p = nodePos(n);
        place(p.x, p.y, rand(-30, 30));
        await whenAwake(p.y);
        if (cancelled) return;
        await fade(0, 0.92, 1600);

        const maxMoves = Math.round(rand(cfg.movesBeforeHide.min, cfg.movesBeforeHide.max));
        let moves = 0;
        let overtime = 0;
        while (!cancelled && (moves < maxMoves || (!n.hide && overtime < 10))) {
          await whenAwake(p.y);
          await sleep(rand(cfg.pause.min, cfg.pause.max) * 1000);
          if (cancelled) return;

          if (n.id.startsWith("L") || n.id.startsWith("R")) {
            if (rng() < cfg.descentChance && moves < maxMoves) {
              await descend(n);
              if (cancelled) return;
              continue;
            }
          }

          const edge = chooseEdge(n.id, moves >= maxMoves);
          if (!edge) break;
          // wait for a free "moving" slot
          while (!cancelled && movingNow >= cfg.maxMoving) await sleep(2200);
          if (cancelled) return;
          movingNow++;
          try {
            await crawl(edge);
          } finally {
            movingNow--;
          }
          lastEdgeId = edge.strand.id;
          nodeId = edge.other;
          nodeIdRef.current = nodeId;
          n = nodes[nodeId];
          p = nodePos(n);
          moves++;
          if (moves > maxMoves) overtime++;
        }
        if (cancelled) return;

        // slip out of sight, then reappear somewhere else much later
        await fade(0.92, 0, 1700);
        await sleep(rand(cfg.hidden.min, cfg.hidden.max) * 1000);
        const choices = Object.values(nodes).filter((c) => !c.id.startsWith("T") && c.id !== nodeId);
        nodeId = choices[Math.floor(rng() * choices.length)]?.id ?? nodeId;
        nodeIdRef.current = nodeId;
      }
    };

    setOpacity(0);
    silk.setAttribute("opacity", "0");
    void life();

    return () => {
      cancelled = true;
    };
  }, [model, index, scale, startNodeId, registry, scrollY, reduced]);

  // reduced motion: sit still on a junction, no movement at all
  const staticPos = useMemo(() => {
    if (!reduced || !startNodeId) return null;
    const n = model.nodes[startNodeId];
    return n ? { x: n.x, y: n.y } : null;
  }, [reduced, model, startNodeId]);

  return (
    <g aria-hidden="true">
      <line ref={silkRef} stroke={WEB_COLORS.paper} strokeWidth={0.6} strokeLinecap="round" opacity={0} />
      <path ref={measureRef} d="M0 0" fill="none" stroke="none" />
      <g
        ref={rootRef}
        opacity={reduced ? 0.55 : 0}
        transform={staticPos ? `translate(${staticPos.x} ${staticPos.y}) scale(${scale})` : undefined}
      >
        <g ref={bodyRef}>
          <g className="spider-gait-a">
            <path d={legs.a} fill="none" stroke={WEB_COLORS.paper} strokeOpacity={0.62} strokeWidth={0.65} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g className="spider-gait-b">
            <path d={legs.b} fill="none" stroke={WEB_COLORS.paper} strokeOpacity={0.62} strokeWidth={0.65} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <ellipse cx={0} cy={-2.3} rx={1.8} ry={1.9} fill="#26262c" stroke={WEB_COLORS.paper} strokeOpacity={0.7} strokeWidth={0.6} />
          <ellipse cx={0} cy={2.2} rx={2.6} ry={3.2} fill="#1d1d22" stroke={WEB_COLORS.paper} strokeOpacity={0.7} strokeWidth={0.6} />
          <path d="M0 0.9 L0.8 2.2 L0 3.5 L-0.8 2.2 Z" fill={WEB_COLORS.crimson} opacity={0.85} />
        </g>
      </g>
    </g>
  );
}
