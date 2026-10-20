// Route graph for the crawling hero spiders. It is derived from the real SVG
// path geometry of the hero web (rings, radials, chords): every strand is
// sampled once from its own `d` attribute, true crossings between strands
// become junction nodes, and the stretches between junctions become edges.
// Nothing here is invented — an edge is always a sub-range of an actual strand.
// No React, no per-frame work: the simulation only reads from these tables.

import type { WebDepth } from "@/lib/webData";

export interface Pt {
  x: number;
  y: number;
}

export interface Strand {
  id: string;
  depth: WebDepth;
  closed: boolean;
  /** total arc length in canvas units */
  length: number;
  /** canvas units between two samples (length / count) */
  step: number;
  /** number of sample intervals; xs / ys hold count + 1 entries */
  count: number;
  xs: Float32Array;
  ys: Float32Array;
  /** 1 where a sample lies outside the usable area (text, portrait, bounds) */
  blocked: Uint8Array;
}

export interface RouteNode extends Pt {
  id: number;
  /** ids of every edge that starts or ends here */
  edges: number[];
}

export interface RouteEdge {
  id: number;
  strand: number;
  a: number;
  b: number;
  /** arc-length range on the strand; s1 may exceed `length` on closed strands */
  s0: number;
  s1: number;
  length: number;
}

export interface RouteGraph {
  strands: Strand[];
  nodes: RouteNode[];
  edges: RouteEdge[];
}

const SVG_NS = "http://www.w3.org/2000/svg";

/** Sample a path's real geometry into a uniform polyline table. */
export function sampleSvgPath(
  host: SVGElement,
  id: string,
  depth: WebDepth,
  d: string,
  targetStep = 3
): Strand {
  const el = document.createElementNS(SVG_NS, "path");
  el.setAttribute("d", d);
  host.appendChild(el);
  const length = el.getTotalLength();
  const count = Math.max(4, Math.ceil(length / targetStep));
  const xs = new Float32Array(count + 1);
  const ys = new Float32Array(count + 1);
  for (let i = 0; i <= count; i++) {
    const p = el.getPointAtLength((i / count) * length);
    xs[i] = p.x;
    ys[i] = p.y;
  }
  host.removeChild(el);
  return {
    id,
    depth,
    closed: /z\s*$/i.test(d.trim()),
    length,
    step: length / count,
    count,
    xs,
    ys,
    blocked: new Uint8Array(count + 1),
  };
}

function wrapS(st: Strand, s: number): number {
  if (st.closed) return ((s % st.length) + st.length) % st.length;
  return s < 0 ? 0 : s > st.length ? st.length : s;
}

export function strandPoint(st: Strand, s: number, out: Pt): Pt {
  const t = wrapS(st, s);
  const f = t / st.step;
  let i = Math.floor(f);
  if (i >= st.count) i = st.count - 1;
  const r = f - i;
  out.x = st.xs[i] + (st.xs[i + 1] - st.xs[i]) * r;
  out.y = st.ys[i] + (st.ys[i + 1] - st.ys[i]) * r;
  return out;
}

const tmpA: Pt = { x: 0, y: 0 };
const tmpB: Pt = { x: 0, y: 0 };

/** Unit tangent (canvas space) in the direction of increasing arc length. */
export function strandTangent(st: Strand, s: number, out: Pt, span = 7): Pt {
  strandPoint(st, s + span, tmpA);
  strandPoint(st, s - span, tmpB);
  const dx = tmpA.x - tmpB.x;
  const dy = tmpA.y - tmpB.y;
  const len = Math.hypot(dx, dy) || 1;
  out.x = dx / len;
  out.y = dy / len;
  return out;
}

export function strandBlockedAt(st: Strand, s: number): boolean {
  return st.blocked[Math.round(wrapS(st, s) / st.step)] === 1;
}

/* ---- graph construction ------------------------------------------------- */

interface Junction {
  s: number;
  node: number;
}

function segmentCross(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, dx: number, dy: number
): { t: number; u: number } | null {
  const rx = bx - ax;
  const ry = by - ay;
  const sx = dx - cx;
  const sy = dy - cy;
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-9) return null;
  const qx = cx - ax;
  const qy = cy - ay;
  const t = (qx * sy - qy * sx) / den;
  const u = (qx * ry - qy * rx) / den;
  if (t < 0 || t >= 1 || u < 0 || u >= 1) return null;
  return { t, u };
}

const MERGE_RADIUS = 4; // canvas units — crossings closer than this are one junction
const MIN_EDGE = 6;

export function buildRouteGraph(strands: Strand[]): RouteGraph {
  const nodes: RouteNode[] = [];
  const nodeGrid = new Map<number, number[]>();
  const cellKey = (cx: number, cy: number) => (cx + 1000) * 4096 + (cy + 1000);

  const nodeAt = (x: number, y: number): number => {
    const cx = Math.floor(x / MERGE_RADIUS);
    const cy = Math.floor(y / MERGE_RADIUS);
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const list = nodeGrid.get(cellKey(cx + ox, cy + oy));
        if (!list) continue;
        for (const id of list) {
          const n = nodes[id];
          if (Math.hypot(n.x - x, n.y - y) <= MERGE_RADIUS) return id;
        }
      }
    }
    const id = nodes.length;
    nodes.push({ id, x, y, edges: [] });
    const key = cellKey(cx, cy);
    const list = nodeGrid.get(key);
    if (list) list.push(id);
    else nodeGrid.set(key, [id]);
    return id;
  };

  const junctions: Junction[][] = strands.map(() => []);

  // open strands always end in a node (a dead end or a shared anchor)
  strands.forEach((st, si) => {
    if (st.closed) return;
    junctions[si].push({ s: 0, node: nodeAt(st.xs[0], st.ys[0]) });
    junctions[si].push({ s: st.length, node: nodeAt(st.xs[st.count], st.ys[st.count]) });
  });

  // bucket every polyline segment, then test only segments that share a cell
  const CELL = 20;
  const segStrand: number[] = [];
  const segIndex: number[] = [];
  const grid = new Map<number, number[]>();
  strands.forEach((st, si) => {
    for (let i = 0; i < st.count; i++) {
      const gi = segStrand.length;
      segStrand.push(si);
      segIndex.push(i);
      const x0 = Math.min(st.xs[i], st.xs[i + 1]);
      const x1 = Math.max(st.xs[i], st.xs[i + 1]);
      const y0 = Math.min(st.ys[i], st.ys[i + 1]);
      const y1 = Math.max(st.ys[i], st.ys[i + 1]);
      for (let cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++) {
        for (let cy = Math.floor(y0 / CELL); cy <= Math.floor(y1 / CELL); cy++) {
          const key = cellKey(cx, cy);
          const list = grid.get(key);
          if (list) list.push(gi);
          else grid.set(key, [gi]);
        }
      }
    }
  });

  const tested = new Set<number>();
  grid.forEach((list) => {
    for (let p = 0; p < list.length; p++) {
      for (let q = p + 1; q < list.length; q++) {
        const ga = Math.min(list[p], list[q]);
        const gb = Math.max(list[p], list[q]);
        const sa = segStrand[ga];
        const sb = segStrand[gb];
        if (sa === sb) continue;
        const key = ga * 65536 + gb;
        if (tested.has(key)) continue;
        tested.add(key);
        const A = strands[sa];
        const B = strands[sb];
        const i = segIndex[ga];
        const j = segIndex[gb];
        const hit = segmentCross(
          A.xs[i], A.ys[i], A.xs[i + 1], A.ys[i + 1],
          B.xs[j], B.ys[j], B.xs[j + 1], B.ys[j + 1]
        );
        if (!hit) continue;
        const x = A.xs[i] + (A.xs[i + 1] - A.xs[i]) * hit.t;
        const y = A.ys[i] + (A.ys[i + 1] - A.ys[i]) * hit.t;
        const node = nodeAt(x, y);
        junctions[sa].push({ s: (i + hit.t) * A.step, node });
        junctions[sb].push({ s: (j + hit.u) * B.step, node });
      }
    }
  });

  const edges: RouteEdge[] = [];
  const addEdge = (strand: number, a: Junction, b: Junction, s1: number) => {
    const length = s1 - a.s;
    if (a.node === b.node || length < MIN_EDGE) return;
    const id = edges.length;
    edges.push({ id, strand, a: a.node, b: b.node, s0: a.s, s1, length });
    nodes[a.node].edges.push(id);
    nodes[b.node].edges.push(id);
  };

  strands.forEach((st, si) => {
    const list = junctions[si].sort((p, q) => p.s - q.s);
    // drop junctions that land on the same spot of the same strand
    const clean: Junction[] = [];
    for (const j of list) {
      const last = clean[clean.length - 1];
      if (last && (last.node === j.node || j.s - last.s < 2.5)) continue;
      clean.push(j);
    }
    if (clean.length < 2) return;
    for (let k = 0; k + 1 < clean.length; k++) addEdge(si, clean[k], clean[k + 1], clean[k + 1].s);
    if (st.closed) {
      const first = clean[0];
      const last = clean[clean.length - 1];
      addEdge(si, last, first, first.s + st.length);
    }
  });

  return { strands, nodes, edges };
}

/** Position on an edge, `u` canvas units from its `a` end. */
export function edgePoint(g: RouteGraph, e: RouteEdge, u: number, out: Pt): Pt {
  return strandPoint(g.strands[e.strand], e.s0 + u, out);
}

/** Unit tangent along the edge, in the a -> b direction. */
export function edgeTangent(g: RouteGraph, e: RouteEdge, u: number, out: Pt): Pt {
  return strandTangent(g.strands[e.strand], e.s0 + u, out);
}

export function edgeBlockedAt(g: RouteGraph, e: RouteEdge, u: number): boolean {
  return strandBlockedAt(g.strands[e.strand], e.s0 + u);
}
