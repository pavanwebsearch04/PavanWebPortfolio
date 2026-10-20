import { mulberry32, rangeFrom } from "./seededRandom";

// "ambient" = the very faint strands that reach into the left content area
// and toward the viewport edges — they never get cursor physics.
export type WebDepth = "ambient" | "background" | "structural" | "midground" | "foreground";

export interface WebNode {
  id: string;
  x: number;
  y: number;
  angle: number;
  radius: number;
  depth: WebDepth;
  size: number; // visual dot radius
  parallax: number; // 0..1 strength multiplier for this node's layer
  delay: number; // stagger delay for entrance
}

export interface WebThread {
  id: string;
  d: string;
  depth: WebDepth;
  isChord?: boolean;
  length: number; // approx, used for stroke-dash entrance timing
}

export const DEPTH_PARALLAX: Record<WebDepth, number> = {
  ambient: 0.1,
  background: 0.25,
  structural: 0.45,
  midground: 0.7,
  foreground: 1,
};

// Canvas the whole geometry is authored against. HeroWeb stretches this
// (viewBox, preserveAspectRatio="none") to fill the entire Hero section, so
// coordinates here are proportional, not pixels.
export const WEB_CANVAS = { width: 1000, height: 560 };

// Smooth a closed loop of points into an SVG path using a Catmull-Rom -> cubic
// bezier conversion, so rings read as organic curves rather than polygons.
function smoothClosedPath(points: Array<{ x: number; y: number }>) {
  const n = points.length;
  if (n < 3) return "";
  const p = (i: number) => points[((i % n) + n) % n];
  let d = `M ${p(0).x.toFixed(2)} ${p(0).y.toFixed(2)} `;
  for (let i = 0; i < n; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
  }
  return d + "Z";
}

function ringPath(
  rng: () => number,
  cx: number,
  cy: number,
  baseRadius: number,
  pointCount: number,
  jitter: number,
  xScale: number
) {
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2;
    const r = baseRadius + rangeFrom(rng, -jitter, jitter);
    const ox = rangeFrom(rng, -baseRadius * 0.04, baseRadius * 0.04);
    const oy = rangeFrom(rng, -baseRadius * 0.04, baseRadius * 0.04);
    pts.push({
      x: cx + ox + Math.cos(angle) * r * xScale,
      y: cy + oy + Math.sin(angle) * r * 0.8,
    });
  }
  return smoothClosedPath(pts);
}

// Gentle curved connector between two points (never a straight line). The
// bow scales with distance so long reaches (e.g. web -> left content) arc
// well clear of a straight diagonal instead of slicing through it.
export function curvedThread(x1: number, y1: number, x2: number, y2: number, bow: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const scaledBow = Math.sign(bow || 1) * Math.min(Math.abs(bow) + len * 0.16, len * 0.55);
  const cx = mx + nx * scaledBow;
  const cy = my + ny * scaledBow;
  return {
    d: `M ${x1.toFixed(2)} ${y1.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)}, ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    length: len,
  };
}

export interface WebAnchor {
  id: string;
  x: number;
  y: number;
}

export interface ConnectedWebGeometry {
  nodes: WebNode[];
  threads: WebThread[];
  rings: WebThread[];
  nodeById: Record<string, WebNode>;
  threadsByAnchor: Record<string, string[]>; // anchor id -> connected thread ids
}

// Generic reusable engine for any section that wants project/content nodes
// wired into the same organic-web visual language as the Hero, without
// duplicating the Hero's single-anchor radial-cluster logic. Give it a list
// of anchor points (e.g. one per project) and it nearest-neighbor-connects
// them with organic curved threads, adds a light atmospheric layer, and
// hands back a lookup so callers can highlight "this anchor's threads" on
// hover/activation.
export function generateConnectedWeb(
  seed: number,
  canvas: { width: number; height: number },
  anchors: WebAnchor[]
): ConnectedWebGeometry {
  const rng = mulberry32(seed);
  const nodes: WebNode[] = anchors.map((a, i) => ({
    id: a.id,
    x: a.x,
    y: a.y,
    angle: 0,
    radius: 0,
    depth: "foreground",
    size: rangeFrom(rng, 2.6, 3.6),
    parallax: 1,
    delay: 0.15 + i * 0.08,
  }));
  const nodeById: Record<string, WebNode> = {};
  nodes.forEach((n) => (nodeById[n.id] = n));

  // nearest-neighbor backbone: each anchor connects to its 1-2 closest
  // neighbors, de-duplicated, so the whole set reads as one structure
  const threads: WebThread[] = [];
  const threadsByAnchor: Record<string, string[]> = {};
  anchors.forEach((a) => (threadsByAnchor[a.id] = []));
  const seenPairs = new Set<string>();

  anchors.forEach((a) => {
    const others = anchors
      .filter((b) => b.id !== a.id)
      .map((b) => ({ b, d: Math.hypot(a.x - b.x, a.y - b.y) }))
      .sort((p, q) => p.d - q.d)
      .slice(0, 2);
    others.forEach(({ b }) => {
      const key = [a.id, b.id].sort().join("|");
      if (seenPairs.has(key)) return;
      seenPairs.add(key);
      const bow = rangeFrom(rng, -1, 1);
      const { d, length } = curvedThread(a.x, a.y, b.x, b.y, bow * 10);
      const id = `link-${key}`;
      threads.push({ id, d, depth: "structural", length });
      threadsByAnchor[a.id].push(id);
      threadsByAnchor[b.id].push(id);
    });
  });

  // a few faint ambient sweeps from anchors out toward the canvas edges,
  // matching the Hero's "the web is bigger than the section" language
  const edgeSpots: Array<[number, number]> = [
    [-20, canvas.height * 0.2],
    [canvas.width + 20, canvas.height * 0.35],
    [canvas.width * 0.15, -20],
    [canvas.width * 0.8, canvas.height + 20],
  ];
  edgeSpots.forEach(([ex, ey], i) => {
    const target = anchors[i % anchors.length];
    if (!target) return;
    const bow = rangeFrom(rng, -30, 30);
    const { d, length } = curvedThread(ex, ey, target.x, target.y, bow);
    const id = `ambient-${i}`;
    threads.push({ id, d, depth: "ambient", length });
    threadsByAnchor[target.id].push(id);
  });

  // one faint atmospheric ring behind the whole cluster
  const cx = anchors.reduce((s, a) => s + a.x, 0) / anchors.length;
  const cy = anchors.reduce((s, a) => s + a.y, 0) / anchors.length;
  const spread =
    Math.max(...anchors.map((a) => Math.hypot(a.x - cx, a.y - cy))) + 90;
  const rings: WebThread[] = [
    {
      id: "project-ring-0",
      d: ringPath(rng, cx, cy, spread, 24, spread * 0.12, 1),
      depth: "background",
      length: 2 * Math.PI * spread,
    },
  ];

  return { nodes, threads, rings, nodeById, threadsByAnchor };
}

export interface WebGeometry {
  nodes: WebNode[];
  rings: WebThread[];
  radials: WebThread[];
  chords: WebThread[];
  ambientThreads: WebThread[];
  anchor: { x: number; y: number };
}

// Anchor = roughly where the portrait sits, in the shared 1000x560 canvas.
const ANCHOR = { x: 700, y: 300 };

export function generateWebGeometry(seed: number, nodeCount = 22): WebGeometry {
  const rng = mulberry32(seed);
  const { x: cx, y: cy } = ANCHOR;
  const xScale = 1.55; // spreads the cluster wide enough to reach the left column

  const depths: WebDepth[] = ["background", "structural", "midground", "foreground"];
  const nodes: WebNode[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const depth = depths[i % depths.length];
    const angle = (i / nodeCount) * Math.PI * 2 + rangeFrom(rng, -0.2, 0.2);
    const baseRadius = 90 + (i % 6) * 46 + rangeFrom(rng, -18, 18);
    const x = cx + Math.cos(angle) * baseRadius * xScale;
    const y = cy + Math.sin(angle) * baseRadius * 0.85;
    nodes.push({
      id: `n${i}`,
      x,
      y,
      angle,
      radius: baseRadius,
      depth,
      size: depth === "foreground" ? rangeFrom(rng, 2.6, 4.2) : rangeFrom(rng, 1.6, 3.2),
      parallax: DEPTH_PARALLAX[depth],
      delay: 0.5 + i * 0.03,
    });
  }

  // --- fixed ambient nodes: reach into the left content column and toward
  // the viewport edges, some slightly past the canvas bounds so their
  // threads read as continuing off-screen ---
  const ambientSpots: Array<[number, number, number]> = [
    [120, 90, 1.1],
    [80, 260, 1.3],
    [150, 470, 1],
    [340, 40, 0.9],
    [-30, 340, 1],
    [520, 30, 0.9],
    [980, 90, 1.1],
    [1030, 380, 1.2],
    [640, 540, 1],
    [880, 545, 1.3],
  ];
  ambientSpots.forEach(([x, y, size], i) => {
    nodes.push({
      id: `amb${i}`,
      x,
      y,
      angle: Math.atan2(y - cy, x - cx),
      radius: Math.hypot(x - cx, y - cy),
      depth: "ambient",
      size,
      parallax: DEPTH_PARALLAX.ambient,
      delay: 0.4 + i * 0.05,
    });
  });

  // --- irregular concentric rings around the portrait anchor ---
  const ringRadii: Array<[WebDepth, number, number, number]> = [
    ["background", 230, 22, 26],
    ["structural", 165, 16, 22],
    ["midground", 115, 12, 20],
    ["foreground", 72, 8, 16],
  ];
  const rings: WebThread[] = ringRadii.map(([depth, r, jitter, pts], i) => ({
    id: `ring-${i}`,
    d: ringPath(rng, cx, cy, r, pts, jitter, xScale * 0.9),
    depth,
    length: 2 * Math.PI * r,
  }));

  // --- structural "spider-leg" radials from the anchor to outer nodes ---
  const mainNodes = nodes.filter((n) => n.depth !== "ambient");
  const radials: WebThread[] = mainNodes
    .filter((_, i) => i % 2 === 0)
    .map((node, i) => {
      const bow = rangeFrom(rng, -20, 20);
      const { d, length } = curvedThread(cx, cy, node.x, node.y, bow);
      return { id: `radial-${i}`, d, depth: node.depth, length };
    });

  // --- chord threads connecting neighboring nodes (the classic web "weave") ---
  const sorted = [...mainNodes].sort((a, b) => a.angle - b.angle);
  const chords: WebThread[] = sorted.map((node, i) => {
    const next = sorted[(i + 1) % sorted.length];
    const bow = rangeFrom(rng, -12, 12);
    const { d, length } = curvedThread(node.x, node.y, next.x, next.y, bow);
    return { id: `chord-${i}`, d, depth: node.depth, isChord: true, length };
  });

  // --- ambient threads: long, faint sweeps connecting the outer/left/edge
  // nodes back toward the main cluster, so the web reads as one structure
  // spanning the whole Hero rather than a blob behind the portrait ---
  const ambientNodes = nodes.filter((n) => n.depth === "ambient");
  const outerMain = [...mainNodes].sort((a, b) => b.radius - a.radius).slice(0, 8);
  const ambientThreads: WebThread[] = ambientNodes.map((node, i) => {
    const target = outerMain[i % outerMain.length];
    const bow = rangeFrom(rng, -40, 40);
    const { d, length } = curvedThread(node.x, node.y, target.x, target.y, bow);
    return { id: `ambient-${i}`, d, depth: "ambient", length };
  });

  return { nodes, rings, radials, chords, ambientThreads, anchor: ANCHOR };
}
