import type { PageModel, PageNode, PageStrand, Pt } from "./webGeometry";

// Helpers for the cursor "tug": page strands near the spider bow slightly
// towards it, then spring back. Strands are sampled once per layout; the
// search itself is a cheap nearest-point scan over the few strands whose
// vertical extent is near the pointer.

const SAMPLES = 14;
const f = (n: number) => n.toFixed(1);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface SampledStrand {
  id: string;
  pts: Pt[];
  minY: number;
  maxY: number;
}

export interface TugHit {
  id: string;
  /** parameter along the strand (0..1) of the closest point */
  t: number;
  px: number;
  py: number;
  dist: number;
}

function controls(s: PageStrand, nodes: Record<string, PageNode>, stretch: number) {
  const a = nodes[s.a];
  const b = nodes[s.b];
  const ay = a.y + a.k * stretch;
  const by = b.y + b.k * stretch;
  const tighten = 1 - Math.min(0.5, Math.abs(stretch) * 0.012);
  return {
    a: { x: a.x, y: ay },
    c1: { x: a.x + s.o1.x, y: ay + s.o1.y * tighten },
    c2: { x: b.x + s.o2.x, y: by + s.o2.y * tighten },
    b: { x: b.x, y: by },
  };
}

export function sampleStrands(model: PageModel): SampledStrand[] {
  return model.strands.map((s) => {
    const { a, c1, c2, b } = controls(s, model.nodes, 0);
    const pts: Pt[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const t = i / SAMPLES;
      const u = 1 - t;
      pts.push({
        x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
        y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
      });
    }
    const ys = pts.map((p) => p.y);
    return { id: s.id, pts, minY: Math.min(...ys), maxY: Math.max(...ys) };
  });
}

export function nearestStrand(samples: SampledStrand[], x: number, y: number, radius: number): TugHit | null {
  let best: TugHit | null = null;
  for (const s of samples) {
    if (y < s.minY - radius || y > s.maxY + radius) continue;
    for (let i = 0; i < s.pts.length - 1; i++) {
      const p = s.pts[i];
      const q = s.pts[i + 1];
      const vx = q.x - p.x;
      const vy = q.y - p.y;
      const len2 = vx * vx + vy * vy || 1;
      const k = clamp(((x - p.x) * vx + (y - p.y) * vy) / len2, 0, 1);
      const px = p.x + vx * k;
      const py = p.y + vy * k;
      const dist = Math.hypot(x - px, y - py);
      if (dist < radius && (!best || dist < best.dist)) {
        best = { id: s.id, t: (i + k) / (s.pts.length - 1), px, py, dist };
      }
    }
  }
  return best;
}

/** The strand's cubic with both control points shifted so the curve at `t`
 *  moves by roughly (dx, dy). */
export function bentStrandD(
  s: PageStrand,
  nodes: Record<string, PageNode>,
  stretch: number,
  t: number,
  dx: number,
  dy: number
): string {
  const { a, c1, c2, b } = controls(s, nodes, stretch);
  const tt = clamp(t, 0.2, 0.8);
  const k = 1 / (3 * tt * (1 - tt));
  const ox = dx * k;
  const oy = dy * k;
  return (
    `M ${f(a.x)} ${f(a.y)} C ${f(c1.x + ox)} ${f(c1.y + oy)}, ` +
    `${f(c2.x + ox)} ${f(c2.y + oy)}, ${f(b.x)} ${f(b.y)}`
  );
}
