import { mulberry32, rangeFrom } from "./seededRandom";
import { WEB_CONFIG } from "./webConfig";

// Pure geometry for the living web. Everything here is deterministic (seeded)
// so server and client agree, and so the same element always grows the same
// web.

export interface Pt {
  x: number;
  y: number;
}

export type StrandWeight = "thin" | "mid" | "strong";

const f = (n: number) => n.toFixed(1);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Gently bowed quadratic between two points; `bow` pushes the control
 *  point sideways so strands are never ruler-straight. */
export function bowed(a: Pt, b: Pt, bow: number): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bow;
  const cy = my + (dx / len) * bow;
  return `M ${f(a.x)} ${f(a.y)} Q ${f(cx)} ${f(cy)} ${f(b.x)} ${f(b.y)}`;
}

/** Tiny asymmetric three-arm tick used as a web anchor — never a circle. */
export function anchorGlyph(p: Pt, rng: () => number, size = 3.4): string {
  const base = rng() * Math.PI * 2;
  let d = "";
  for (let i = 0; i < 3; i++) {
    const a = base + i * ((Math.PI * 2) / 3) + rangeFrom(rng, -0.45, 0.45);
    const l = size * rangeFrom(rng, 0.55, 1.1);
    d += `M ${f(p.x)} ${f(p.y)} l ${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)} `;
  }
  return d.trim();
}

/* ------------------------------------------------------------------ */
/* Interactive web grown around a single element                       */
/* ------------------------------------------------------------------ */

export interface TargetBox {
  width: number;
  height: number;
}

export interface TargetWebSpec {
  anchors: Pt[];
  /** strands between neighbouring anchors, same index order as `anchors` */
  frame: string[];
  /** radial strands from some anchors out to far nodes */
  spokes: Array<{ d: string; anchor: number }>;
  /** strands tying neighbouring far nodes together */
  ties: string[];
  glyphs: string; // all anchor + node ticks in one path
}

/**
 * Anchors sit just outside the element's edges (four corner anchors plus a
 * few along the long sides) so strands never cross the element's own text.
 * Coordinates are local to the element's top-left corner.
 */
export function buildTargetWeb(box: TargetBox, seed: number): TargetWebSpec {
  const rng = mulberry32(seed || 1);
  const { width: w, height: h } = box;
  const off = () => rangeFrom(rng, 4, 11);

  // perimeter walk, clockwise from the top-left corner anchor
  const anchors: Pt[] = [];
  const outward: Pt[] = []; // unit-ish outward direction for each anchor

  const push = (p: Pt, o: Pt) => {
    anchors.push(p);
    outward.push(o);
  };

  const topCount = clamp(Math.round(w / 120), 1, 3);
  const sideCount = clamp(Math.round(h / 120), 0, 2);

  push({ x: -off(), y: -off() }, { x: -0.7, y: -0.7 });
  for (let i = 1; i <= topCount; i++) {
    const t = (i + rangeFrom(rng, -0.25, 0.25)) / (topCount + 1);
    push({ x: w * t, y: -off() }, { x: 0, y: -1 });
  }
  push({ x: w + off(), y: -off() }, { x: 0.7, y: -0.7 });
  for (let i = 1; i <= sideCount; i++) {
    const t = (i + rangeFrom(rng, -0.2, 0.2)) / (sideCount + 1);
    push({ x: w + off(), y: h * t }, { x: 1, y: 0 });
  }
  push({ x: w + off(), y: h + off() }, { x: 0.7, y: 0.7 });
  for (let i = topCount; i >= 1; i--) {
    const t = (i + rangeFrom(rng, -0.25, 0.25)) / (topCount + 1);
    push({ x: w * t, y: h + off() }, { x: 0, y: 1 });
  }
  push({ x: -off(), y: h + off() }, { x: -0.7, y: 0.7 });
  for (let i = sideCount; i >= 1; i--) {
    const t = (i + rangeFrom(rng, -0.2, 0.2)) / (sideCount + 1);
    push({ x: -off(), y: h * t }, { x: -1, y: 0 });
  }

  const n = anchors.length;
  const frame = anchors.map((a, i) => {
    const b = anchors[(i + 1) % n];
    // push the sag outward so the frame strand never dips back over the element
    const o = outward[i];
    const mx = (a.x + b.x) / 2 + o.x * rangeFrom(rng, 1.5, 5);
    const my = (a.y + b.y) / 2 + o.y * rangeFrom(rng, 1.5, 5);
    return `M ${f(a.x)} ${f(a.y)} Q ${f(mx)} ${f(my)} ${f(b.x)} ${f(b.y)}`;
  });

  const reach = clamp(Math.min(w, h) * 0.9, 28, 74);
  const farNodes: Array<{ p: Pt; anchor: number }> = [];
  const spokes: Array<{ d: string; anchor: number }> = [];
  anchors.forEach((a, i) => {
    // not every anchor sends a strand outward — keeps the web irregular
    if (i % 2 === 1 && rng() < 0.35) return;
    const o = outward[i];
    const len = reach * rangeFrom(rng, 0.7, 1.35);
    const swing = rangeFrom(rng, -0.35, 0.35);
    const ang = Math.atan2(o.y, o.x) + swing;
    const far = { x: a.x + Math.cos(ang) * len, y: a.y + Math.sin(ang) * len };
    farNodes.push({ p: far, anchor: i });
    spokes.push({ d: bowed(a, far, rangeFrom(rng, -7, 7)), anchor: i });
  });

  const ties: string[] = [];
  for (let i = 0; i < farNodes.length; i++) {
    if (rng() < 0.42) continue;
    const a = farNodes[i].p;
    const b = farNodes[(i + 1) % farNodes.length].p;
    if (a === b) continue;
    ties.push(bowed(a, b, rangeFrom(rng, -9, 9)));
  }

  let glyphs = anchors.map((a) => anchorGlyph(a, rng, 3.6)).join(" ");
  glyphs += " " + farNodes.map((n2) => anchorGlyph(n2.p, rng, 2.8)).join(" ");

  return { anchors, frame, spokes, ties, glyphs };
}

/* ------------------------------------------------------------------ */
/* Page-wide web                                                       */
/* ------------------------------------------------------------------ */

export interface PageNode {
  id: string;
  x: number;
  y: number;
  /** how far this node is pulled by scroll tension (px per unit stretch) */
  k: number;
  group: number;
  /** a spider can slip out of sight here */
  hide?: boolean;
  /** draws a small anchor glyph */
  glyph?: boolean;
}

export interface PageStrand {
  id: string;
  a: string;
  b: string;
  o1: Pt;
  o2: Pt;
  weight: StrandWeight;
  group: number; // -1 = rail (always present)
  kind: "rail" | "chain" | "spur";
}

export interface CornerStrand {
  id: string;
  d: string;
  weight: StrandWeight;
  group: number;
}

export interface PageModel {
  width: number;
  height: number;
  groupY: number[];
  nodes: Record<string, PageNode>;
  strands: PageStrand[];
  corners: CornerStrand[];
  railX: { left: number; right: number };
}

export function strandD(s: PageStrand, nodes: Record<string, PageNode>, stretch: number): string {
  const a = nodes[s.a];
  const b = nodes[s.b];
  const ay = a.y + a.k * stretch;
  const by = b.y + b.k * stretch;
  // control offsets also breathe a little with stretch so a pulled strand
  // visibly tightens rather than just translating
  const tighten = 1 - Math.min(0.5, Math.abs(stretch) * 0.012);
  return (
    `M ${f(a.x)} ${f(ay)} C ${f(a.x + s.o1.x)} ${f(ay + s.o1.y * tighten)}, ` +
    `${f(b.x + s.o2.x)} ${f(by + s.o2.y * tighten)}, ${f(b.x)} ${f(by)}`
  );
}

export interface CornerWebOptions {
  anchor: Pt;
  /** direction the web fans toward, degrees (0 = right, 90 = down) */
  dir: number;
  spread: number;
  size: number;
  spokes: number;
  rings: number;
  seed: number;
  group: number;
  idPrefix: string;
}

/** A classic irregular corner orb-web: uneven radial spokes plus sagging
 *  capture arcs between them. */
export function cornerWeb(o: CornerWebOptions): CornerStrand[] {
  const rng = mulberry32(o.seed);
  const out: CornerStrand[] = [];
  const spokeAngles: number[] = [];
  const spokeLens: number[] = [];
  for (let i = 0; i < o.spokes; i++) {
    const t = o.spokes === 1 ? 0.5 : i / (o.spokes - 1);
    const ang = ((o.dir - o.spread / 2 + t * o.spread + rangeFrom(rng, -5, 5)) * Math.PI) / 180;
    const len = o.size * rangeFrom(rng, 0.72, 1.08);
    spokeAngles.push(ang);
    spokeLens.push(len);
    const end = { x: o.anchor.x + Math.cos(ang) * len, y: o.anchor.y + Math.sin(ang) * len };
    out.push({
      id: `${o.idPrefix}-s${i}`,
      d: bowed(o.anchor, end, rangeFrom(rng, -len * 0.03, len * 0.03)),
      weight: i % 3 === 0 ? "mid" : "thin",
      group: o.group,
    });
  }
  for (let r = 0; r < o.rings; r++) {
    const frac = (r + 1) / (o.rings + 0.6);
    const pts: Pt[] = spokeAngles.map((ang, i) => {
      const rad = spokeLens[i] * frac * rangeFrom(rng, 0.9, 1.1);
      return { x: o.anchor.x + Math.cos(ang) * rad, y: o.anchor.y + Math.sin(ang) * rad };
    });
    for (let i = 0; i < pts.length - 1; i++) {
      // a few gaps keep the web from looking mechanically complete
      if (rng() < 0.12) continue;
      const a = pts[i];
      const b = pts[i + 1];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const pull = rangeFrom(rng, 0.08, 0.2);
      const cx = mx + (o.anchor.x - mx) * pull;
      const cy = my + (o.anchor.y - my) * pull;
      out.push({
        id: `${o.idPrefix}-r${r}-${i}`,
        d: `M ${f(a.x)} ${f(a.y)} Q ${f(cx)} ${f(cy)} ${f(b.x)} ${f(b.y)}`,
        weight: "thin",
        group: o.group,
      });
    }
  }
  return out;
}

/**
 * Lays one connected web over the entire document. `tops` are the offsetTop
 * of each section; the web is made of
 *   - rails running down both page edges (header -> footer),
 *   - a hub chain strung across every section boundary (the bridge),
 *   - spur strands that reach past each boundary,
 *   - irregular corner webs at the page edges.
 */
export function buildPageModel(width: number, height: number, tops: number[], mobile: boolean): PageModel {
  const rng = mulberry32(90817 + tops.length * 31);
  const scale = mobile ? WEB_CONFIG.layer.mobileScale : 1;
  const railL = clamp(width * 0.03, 11, 44);
  const railR = width - railL;
  const railSway = Math.min(railL - 3, mobile ? 8 : 20);
  const pad = mobile ? 84 : 112; // empty vertical padding at the top of every section

  const nodes: Record<string, PageNode> = {};
  const strands: PageStrand[] = [];
  const corners: CornerStrand[] = [];

  // boundaries: header zone, each section top, page bottom
  const ys = [Math.min(110, height * 0.05), ...tops.slice(1), height - 24];
  const groupY = [...ys];
  const last = ys.length - 1;

  ys.forEach((y, g) => {
    const jitterL = rangeFrom(rng, -6, 6);
    const jitterR = rangeFrom(rng, -6, 6);
    nodes[`L${g}`] = { id: `L${g}`, x: railL + jitterL * 0.4, y, k: 0, group: g, glyph: true, hide: g === 0 || g === last };
    nodes[`R${g}`] = { id: `R${g}`, x: railR + jitterR * 0.4, y: y + rangeFrom(rng, -14, 14), k: 0, group: g, glyph: true, hide: g === 0 || g === last };
  });

  // rails: one smooth (Catmull-Rom) strand down each page edge, split into
  // ~400px segments by small waypoints so spiders get regular junctions
  (["L", "R"] as const).forEach((side) => {
    const baseX = side === "L" ? railL : railR;
    const seq: PageNode[] = [];
    for (let g = 0; g <= last; g++) {
      seq.push(nodes[`${side}${g}`]);
      if (g === last) break;
      const len = ys[g + 1] - ys[g];
      const mids = Math.max(0, Math.round(len / 400) - 1);
      for (let k = 1; k <= mids; k++) {
        const id = `${side}${g}.${k}`;
        nodes[id] = {
          id,
          x: baseX + rangeFrom(rng, -railSway, railSway),
          y: ys[g] + (len * k) / (mids + 1) + rangeFrom(rng, -26, 26),
          k: 0,
          group: g,
        };
        seq.push(nodes[id]);
      }
    }
    for (let i = 0; i < seq.length - 1; i++) {
      const p0 = seq[Math.max(i - 1, 0)];
      const p1 = seq[i];
      const p2 = seq[i + 1];
      const p3 = seq[Math.min(i + 2, seq.length - 1)];
      strands.push({
        id: `rail-${side}${i}`,
        a: p1.id,
        b: p2.id,
        o1: { x: (p2.x - p0.x) / 6, y: (p2.y - p0.y) / 6 },
        o2: { x: -(p3.x - p1.x) / 6, y: -(p3.y - p1.y) / 6 },
        weight: i % 3 === 0 ? "mid" : "thin",
        group: -1,
        kind: "rail",
      });
    }
  });

  // boundary bridges: hub chain across the empty gap between sections
  for (let g = 1; g < last; g++) {
    const hubCount = mobile ? 2 : g % 2 === 0 ? 3 : 4;
    const baseY = ys[g];
    const hubIds: string[] = [];
    for (let h = 0; h < hubCount; h++) {
      const t = (h + 1) / (hubCount + 1);
      const id = `H${g}-${h}`;
      const hubY = baseY + rangeFrom(rng, 22, 50);
      nodes[id] = {
        id,
        x: clamp(width * (0.14 + t * 0.72 + rangeFrom(rng, -0.05, 0.05)), railL + 30, railR - 30),
        y: hubY,
        k: rangeFrom(rng, 0.5, 1.2) * (h % 2 === 0 ? 1 : 0.6),
        group: g,
        glyph: true,
      };
      hubIds.push(id);
    }
    const chain = [`L${g}`, ...hubIds, `R${g}`];
    for (let i = 0; i < chain.length - 1; i++) {
      const a = nodes[chain[i]];
      const b = nodes[chain[i + 1]];
      const span = Math.abs(b.x - a.x);
      const sag = rangeFrom(rng, 10, 26) * (mobile ? 0.7 : 1);
      strands.push({
        id: `chain-${g}-${i}`,
        a: chain[i],
        b: chain[i + 1],
        o1: { x: span * 0.3, y: sag },
        o2: { x: -span * 0.3, y: sag * rangeFrom(rng, 0.6, 1.2) },
        weight: i % 2 === 0 ? "mid" : "thin",
        group: g,
        kind: "chain",
      });
    }

    // spurs: reach past the boundary in both directions and end in free tips
    const spurCount = mobile ? 2 : 3;
    for (let s = 0; s < spurCount; s++) {
      const from = nodes[hubIds[(s * 2 + g) % hubIds.length]];
      const up = s % 2 === 0;
      const tipId = `T${g}-${s}`;
      const reachY = up ? rangeFrom(rng, 38, pad - 14) : rangeFrom(rng, 14, 36);
      const tipY = up ? baseY - reachY : Math.min(from.y + reachY, baseY + pad - 10);
      const tipX = clamp(from.x + rangeFrom(rng, -110, 110) * scale, railL + 24, railR - 24);
      nodes[tipId] = { id: tipId, x: tipX, y: tipY, k: up ? -rangeFrom(rng, 0.6, 1.1) : rangeFrom(rng, 0.5, 1), group: g, glyph: true, hide: true };
      strands.push({
        id: `spur-${g}-${s}`,
        a: from.id,
        b: tipId,
        o1: { x: (tipX - from.x) * 0.2, y: (tipY - from.y) * 0.5 },
        o2: { x: -(tipX - from.x) * 0.1, y: -(tipY - from.y) * 0.3 },
        weight: "thin",
        group: g,
        kind: "spur",
      });
    }
  }

  // large irregular corner webs on the page edges (layer A)
  const big = (mobile ? 150 : 300) * 1;
  const small = (mobile ? 110 : 210) * 1;
  const addCorner = (anchor: Pt, dir: number, size: number, group: number, id: string, seed: number) => {
    corners.push(
      ...cornerWeb({
        anchor,
        dir,
        spread: 84,
        size,
        spokes: mobile ? 5 : 7,
        rings: mobile ? 3 : 4,
        seed,
        group,
        idPrefix: id,
      })
    );
  };

  addCorner({ x: width + 6, y: -6 }, 135, big, 0, "cTR", 11);
  addCorner({ x: -6, y: ys[0] + 30 }, 38, small * 0.9, 0, "cTL", 17);
  for (let g = 1; g < last; g++) {
    const left = g % 2 === 1;
    const yAnchor = ys[g] + rangeFrom(rng, 4, 20);
    addCorner(
      { x: left ? -6 : width + 6, y: yAnchor },
      left ? 24 : 156,
      g % 3 === 0 ? big * 0.85 : small,
      g,
      `cE${g}`,
      100 + g * 13
    );
  }
  addCorner({ x: -6, y: height + 6 }, -38, big * 0.8, last, "cBL", 71);
  addCorner({ x: width + 6, y: height + 6 }, -142, small, last, "cBR", 83);

  return { width, height, groupY, nodes, strands, corners, railX: { left: railL, right: railR } };
}
