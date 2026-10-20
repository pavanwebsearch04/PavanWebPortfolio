import { coreSkillIds, skillCategories, skillLinks, skills, type SkillCategoryId } from "@/data/skills";
import { mulberry32, rangeFrom } from "@/lib/seededRandom";

// Geometry for the large Skills web. Everything is deterministic (seeded) and
// computed once. The web is an orb web: a centre, 16 radial spokes, 6 rings of
// sagging strands and an outer frame. Skills sit on spoke/ring junctions, and
// a relationship between two skills is a shortest route over the web's own
// strands, so a highlighted connection always runs along real silk.

export const WEB_W = 1280;
export const WEB_H = 900;
const CX = WEB_W / 2;
const CY = WEB_H / 2;
const SPOKES = 18;
const START_DEG = 150;
const STEP = 360 / SPOKES;
const SX = 1.1; // the web is an ellipse: wider than tall
const SY = 0.82;
const RING_R = [120, 205, 285, 360, 430, 495]; // ring 0 is a small inner ring, ring 1 holds the category hubs
const FRAME_R = 540;
const MAX_SHIFT = 90; // how far relaxation may move a node from its junction

export type Pt = { x: number; y: number };

export interface LayoutNode {
  id: string;
  kind: "skill" | "hub";
  category: SkillCategoryId;
  label: string;
  x: number;
  y: number;
  core: boolean;
  junction: string;
  /** nodes the highlight can travel to */
  neighbors: string[];
}

export type StrandKind = "spoke" | "ring" | "frame";

export interface Strand {
  id: string;
  kind: StrandKind;
  a: string;
  b: string;
  ax: number;
  ay: number;
  cx: number;
  cy: number;
  bx: number;
  by: number;
  len: number;
}

export interface Route {
  from: string;
  to: string;
  /** path d, oriented from `from` to `to`, and the reverse */
  d: string;
  dReverse: string;
  length: number;
  strands: string[];
}

export interface DecorStrand {
  id: string;
  d: string;
  weight: number;
}

export interface SkillsWebLayout {
  nodes: LayoutNode[];
  nodeById: Record<string, LayoutNode>;
  strands: Strand[];
  decor: DecorStrand[];
  center: Pt;
  /** route between two directly related node ids (key from routeKey) */
  routes: Record<string, Route>;
  junctions: Record<string, Pt>;
}

export const hubIdOf = (category: SkillCategoryId) => `hub-${category}`;
export const routeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

// Skills sit on rings 2-5. Neighbouring spokes alternate between rings
// {2,4} and {3,5}, so labels never sit side by side, and related skills are
// kept close together. Each category owns a run of spokes.
const SEATS: Array<{ spoke: number; ring: number; name: string }> = [
  // frontend (spokes 0-3)
  { spoke: 0, ring: 2, name: "Bootstrap" },
  { spoke: 0, ring: 4, name: "Tailwind CSS" },
  { spoke: 1, ring: 3, name: "Responsive Web Design" },
  { spoke: 1, ring: 5, name: "React" },
  { spoke: 2, ring: 2, name: "CSS" },
  { spoke: 2, ring: 4, name: "JavaScript" },
  { spoke: 3, ring: 3, name: "HTML" },
  // wordpress (spokes 4-8)
  { spoke: 4, ring: 2, name: "Theme Customization" },
  { spoke: 4, ring: 4, name: "Custom Post Types" },
  { spoke: 5, ring: 3, name: "Dynamic Content Management" },
  { spoke: 5, ring: 5, name: "Advanced Custom Fields (ACF)" },
  { spoke: 6, ring: 2, name: "WordPress" },
  { spoke: 6, ring: 4, name: "WordPress REST API" },
  { spoke: 7, ring: 3, name: "Elementor" },
  { spoke: 7, ring: 5, name: "Gutenberg" },
  { spoke: 8, ring: 2, name: "WooCommerce" },
  { spoke: 8, ring: 4, name: "Plugin Integration" },
  // backend (spokes 9-10) and data (spoke 11)
  { spoke: 9, ring: 3, name: "PHP" },
  { spoke: 10, ring: 2, name: "Node.js" },
  { spoke: 10, ring: 4, name: "Express.js" },
  { spoke: 11, ring: 3, name: "MySQL" },
  { spoke: 11, ring: 5, name: "MongoDB" },
  // tools (spokes 12-13)
  { spoke: 12, ring: 2, name: "Git" },
  { spoke: 12, ring: 4, name: "GitHub" },
  { spoke: 13, ring: 3, name: "Visual Studio Code" },
  // professional (spokes 15-17)
  { spoke: 15, ring: 3, name: "Problem Solving" },
  { spoke: 15, ring: 5, name: "Time Management" },
  { spoke: 16, ring: 2, name: "Attention to Detail" },
  { spoke: 16, ring: 4, name: "Adaptability" },
  { spoke: 17, ring: 3, name: "Communication" },
  { spoke: 17, ring: 5, name: "Teamwork" },
];

// category hub -> junction it sits on. Rings 0 and 1 hold no skills; a hub on
// an even spoke uses ring 0 so it stays clear of that spoke's ring-2 label.
const HUB_SEAT: Record<SkillCategoryId, { spoke: number; ring: number }> = {
  frontend: { spoke: 1, ring: 1 },
  wordpress: { spoke: 5, ring: 1 },
  backend: { spoke: 9, ring: 1 },
  database: { spoke: 11, ring: 1 },
  tools: { spoke: 13, ring: 1 },
  professional: { spoke: 16, ring: 0 },
};

const f = (n: number) => n.toFixed(1);
const junctionId = (s: number, k: number) => `s${s}k${k}`;
const frameId = (s: number) => `f${s}`;

// Chip footprint, used only to keep labels from overlapping. Mirrors the CSS:
// 13.5rem max width (216px), 64px of padding + glyph, greedy word wrapping.
function estimateSize(label: string, kind: "skill" | "hub", core: boolean) {
  if (kind === "hub") return { w: 48 + label.length * 9.6, h: 42 };
  const charW = core ? 10.6 : 10;
  const maxText = 216 - 64;
  let lines = 1;
  let cur = 0;
  let widest = 0;
  label.split(" ").forEach((word) => {
    const w = word.length * charW;
    const next = cur === 0 ? w : cur + charW + w;
    if (next > maxText && cur > 0) {
      widest = Math.max(widest, cur);
      lines += 1;
      cur = w;
    } else cur = next;
  });
  widest = Math.max(widest, cur);
  return { w: 64 + widest, h: 46 + (lines - 1) * 24 };
}

export function buildSkillsWeb(): SkillsWebLayout {
  const rng = mulberry32(20260711);
  const angleOf = (s: number) => ((START_DEG + s * STEP) * Math.PI) / 180;
  const polar = (a: number, r: number): Pt => ({ x: CX + Math.cos(a) * r * SX, y: CY + Math.sin(a) * r * SY });

  /* ---- junctions ------------------------------------------------- */
  const junctions: Record<string, Pt> = { c: { x: CX, y: CY } };
  const spokeAngle: number[] = [];
  for (let s = 0; s < SPOKES; s++) {
    spokeAngle[s] = angleOf(s) + rangeFrom(rng, -0.03, 0.03);
    for (let k = 0; k <= 5; k++) {
      const r = RING_R[k] * (1 + rangeFrom(rng, -0.03, 0.03));
      const a = spokeAngle[s] + (k === 0 ? 0 : rangeFrom(rng, -0.015, 0.015));
      junctions[junctionId(s, k)] = polar(a, r);
    }
    junctions[frameId(s)] = polar(spokeAngle[s] + rangeFrom(rng, -0.02, 0.02), FRAME_R * (1 + rangeFrom(rng, -0.06, 0.07)));
  }

  /* ---- nodes ----------------------------------------------------- */
  const byName = new Map(skills.map((s) => [s.name, s]));
  const nodes: LayoutNode[] = [];
  SEATS.forEach(({ spoke, ring, name }) => {
    const skill = byName.get(name);
    if (!skill) throw new Error(`skillsWebLayout: unknown skill "${name}"`);
    const j = junctionId(spoke, ring);
    nodes.push({
      id: skill.id,
      kind: "skill",
      category: skill.category,
      label: skill.name,
      x: junctions[j].x,
      y: junctions[j].y,
      core: coreSkillIds.has(skill.id),
      junction: j,
      neighbors: [],
    });
  });
  skillCategories.forEach((c) => {
    const j = junctionId(HUB_SEAT[c.id].spoke, HUB_SEAT[c.id].ring);
    nodes.push({
      id: hubIdOf(c.id),
      kind: "hub",
      category: c.id,
      label: c.shortLabel,
      x: junctions[j].x,
      y: junctions[j].y,
      core: false,
      junction: j,
      neighbors: [],
    });
  });
  if (nodes.length !== skills.length + skillCategories.length) {
    throw new Error("skillsWebLayout: every skill needs exactly one seat");
  }
  const nodeById: Record<string, LayoutNode> = Object.fromEntries(nodes.map((n) => [n.id, n]));

  /* ---- neighbours: data relationships plus category membership ---- */
  const addEdge = (a: string, b: string) => {
    if (!nodeById[a].neighbors.includes(b)) nodeById[a].neighbors.push(b);
    if (!nodeById[b].neighbors.includes(a)) nodeById[b].neighbors.push(a);
  };
  skillLinks.forEach(([a, b]) => addEdge(a, b));
  skills.forEach((s) => addEdge(s.id, hubIdOf(s.category)));

  /* ---- relaxation: nudge overlapping labels apart ----------------- */
  const home = new Map(nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
  const sizes = new Map(nodes.map((n) => [n.id, estimateSize(n.label, n.kind, n.core)]));
  const GAP = 24;
  for (let pass = 0; pass < 260; pass++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const A = nodes[i];
        const B = nodes[j];
        const sa = sizes.get(A.id)!;
        const sb = sizes.get(B.id)!;
        const ox = (sa.w + sb.w) / 2 + GAP - Math.abs(A.x - B.x);
        const oy = (sa.h + sb.h) / 2 + GAP - Math.abs(A.y - B.y);
        if (ox <= 0 || oy <= 0) continue;
        if (ox < oy) {
          const d = (A.x <= B.x ? 1 : -1) * ox * 0.5;
          A.x -= d;
          B.x += d;
        } else {
          const d = (A.y <= B.y ? 1 : -1) * oy * 0.5;
          A.y -= d;
          B.y += d;
        }
      }
    }
    nodes.forEach((n) => {
      const h = home.get(n.id)!;
      n.x += (h.x - n.x) * 0.015;
      n.y += (h.y - n.y) * 0.015;
      const dx = n.x - h.x;
      const dy = n.y - h.y;
      const d = Math.hypot(dx, dy);
      if (d > MAX_SHIFT) {
        n.x = h.x + (dx / d) * MAX_SHIFT;
        n.y = h.y + (dy / d) * MAX_SHIFT;
      }
    });
  }
  // Round once so the server and the browser agree to the last digit
  // (1-ulp differences in float maths would otherwise cause hydration warnings).
  const r1 = (v: number) => Math.round(v * 10) / 10;
  nodes.forEach((n) => {
    n.x = r1(n.x);
    n.y = r1(n.y);
    junctions[n.junction] = { x: n.x, y: n.y };
  });
  Object.values(junctions).forEach((p) => {
    p.x = r1(p.x);
    p.y = r1(p.y);
  });

  /* ---- strands --------------------------------------------------- */
  const strands: Strand[] = [];
  const centre = junctions.c;
  const push = (id: string, kind: StrandKind, a: string, b: string, c: Pt) => {
    const A = junctions[a];
    const B = junctions[b];
    strands.push({
      id,
      kind,
      a,
      b,
      ax: A.x,
      ay: A.y,
      cx: c.x,
      cy: c.y,
      bx: B.x,
      by: B.y,
      len: Math.hypot(B.x - A.x, B.y - A.y),
    });
  };
  const kinked = (a: Pt, b: Pt, amount: number): Pt => {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: mx + (-dy / len) * amount, y: my + (dx / len) * amount };
  };

  for (let s = 0; s < SPOKES; s++) {
    const chain = ["c", ...Array.from({ length: 6 }, (_, k) => junctionId(s, k)), frameId(s)];
    for (let i = 0; i < chain.length - 1; i++) {
      const A = junctions[chain[i]];
      const B = junctions[chain[i + 1]];
      push(`sp-${s}-${i}`, "spoke", chain[i], chain[i + 1], kinked(A, B, rangeFrom(rng, -3, 3)));
    }
  }
  for (let k = 0; k <= 5; k++) {
    for (let s = 0; s < SPOKES; s++) {
      const n = (s + 1) % SPOKES;
      const A = junctions[junctionId(s, k)];
      const B = junctions[junctionId(n, k)];
      const m = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      // real orb-web rings sag towards the hub
      const sag = 0.1 + rangeFrom(rng, -0.025, 0.04);
      const c = { x: m.x + (centre.x - m.x) * sag, y: m.y + (centre.y - m.y) * sag };
      push(`rg-${k}-${s}`, "ring", junctionId(s, k), junctionId(n, k), c);
    }
  }
  for (let s = 0; s < SPOKES; s++) {
    const n = (s + 1) % SPOKES;
    const A = junctions[frameId(s)];
    const B = junctions[frameId(n)];
    const m = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
    const sag = 0.05 + rangeFrom(rng, 0, 0.05);
    push(`fr-${s}`, "frame", frameId(s), frameId(n), {
      x: m.x + (centre.x - m.x) * sag,
      y: m.y + (centre.y - m.y) * sag,
    });
  }

  /* ---- decorative strands: guy lines and secondary spokes --------- */
  const decor: DecorStrand[] = [];
  for (let s = 0; s < SPOKES; s++) {
    const A = junctions[frameId(s)];
    const away = { x: A.x - centre.x, y: A.y - centre.y };
    const len = Math.hypot(away.x, away.y) || 1;
    const reach = s % 2 === 0 ? rangeFrom(rng, 110, 190) : rangeFrom(rng, 60, 110);
    const end = { x: A.x + (away.x / len) * reach, y: A.y + (away.y / len) * reach * 0.9 };
    decor.push({ id: `guy-${s}`, d: `M ${f(A.x)} ${f(A.y)} L ${f(end.x)} ${f(end.y)}`, weight: 0.5 });
  }
  for (let s = 0; s < SPOKES; s++) {
    const n = (s + 1) % SPOKES;
    // a short secondary radius between two spokes, from ring 3 out to the frame
    const a = (spokeAngle[s] + (spokeAngle[n] + (n === 0 ? Math.PI * 2 : 0) - spokeAngle[s]) / 2 + Math.PI * 2) % (Math.PI * 2);
    const from = polar(a, RING_R[3] * rangeFrom(rng, 0.97, 1.03));
    const to = polar(a, FRAME_R * rangeFrom(rng, 0.95, 1.04));
    decor.push({ id: `sec-${s}`, d: `M ${f(from.x)} ${f(from.y)} L ${f(to.x)} ${f(to.y)}`, weight: 0.4 });
  }

  /* ---- routing over the web ------------------------------------- */
  const adjacency = new Map<string, Array<{ to: string; strand: Strand }>>();
  const link = (a: string, b: string, strand: Strand) => {
    if (!adjacency.has(a)) adjacency.set(a, []);
    adjacency.get(a)!.push({ to: b, strand });
  };
  strands.forEach((st) => {
    link(st.a, st.b, st);
    link(st.b, st.a, st);
  });
  const occupied = new Set(nodes.map((n) => n.junction));

  const dijkstra = (from: string, to: string): Array<{ node: string; strand: Strand | null }> => {
    const dist = new Map<string, number>([[from, 0]]);
    const prev = new Map<string, { node: string; strand: Strand }>();
    const open = new Set<string>([from]);
    while (open.size) {
      let cur = "";
      let best = Infinity;
      open.forEach((id) => {
        const d = dist.get(id)!;
        if (d < best) {
          best = d;
          cur = id;
        }
      });
      open.delete(cur);
      if (cur === to) break;
      for (const { to: nxt, strand } of adjacency.get(cur) ?? []) {
        // passing behind another label is allowed but discouraged
        const penalty = occupied.has(nxt) && nxt !== to ? 160 : 0;
        const nd = best + strand.len + penalty;
        if (nd < (dist.get(nxt) ?? Infinity)) {
          dist.set(nxt, nd);
          prev.set(nxt, { node: cur, strand });
          open.add(nxt);
        }
      }
    }
    const path: Array<{ node: string; strand: Strand | null }> = [];
    let at = to;
    while (at !== from) {
      const p = prev.get(at);
      if (!p) return [];
      path.unshift({ node: at, strand: p.strand });
      at = p.node;
    }
    path.unshift({ node: from, strand: null });
    return path;
  };

  const orient = (path: ReturnType<typeof dijkstra>): string => {
    let d = "";
    for (let i = 1; i < path.length; i++) {
      const st = path[i].strand!;
      const forward = st.a === path[i - 1].node;
      const A = forward ? { x: st.ax, y: st.ay } : { x: st.bx, y: st.by };
      const B = forward ? { x: st.bx, y: st.by } : { x: st.ax, y: st.ay };
      if (i === 1) d += `M ${f(A.x)} ${f(A.y)} `;
      d += `Q ${f(st.cx)} ${f(st.cy)} ${f(B.x)} ${f(B.y)} `;
    }
    return d.trim();
  };

  const routes: Record<string, Route> = {};
  const pairs = new Set<string>();
  nodes.forEach((n) => n.neighbors.forEach((m) => pairs.add(routeKey(n.id, m))));
  pairs.forEach((key) => {
    const [a, b] = key.split("|");
    const path = dijkstra(nodeById[a].junction, nodeById[b].junction);
    if (path.length < 2) return;
    const reversed = [...path].reverse().map((p, i) => ({
      node: p.node,
      // strand that was used to reach the previous node in the forward walk
      strand: i === 0 ? null : path[path.length - i].strand,
    }));
    routes[key] = {
      from: a,
      to: b,
      d: orient(path),
      dReverse: orient(reversed),
      length: path.slice(1).reduce((sum, p) => sum + p.strand!.len, 0),
      strands: path.slice(1).map((p) => p.strand!.id),
    };
  });

  return { nodes, nodeById, strands, decor, center: centre, routes, junctions };
}

export function strandD(s: Pick<Strand, "ax" | "ay" | "cx" | "cy" | "bx" | "by">, ox = 0, oy = 0) {
  return `M ${f(s.ax)} ${f(s.ay)} Q ${f(s.cx + ox)} ${f(s.cy + oy)} ${f(s.bx)} ${f(s.by)}`;
}

/** Path for a route, oriented so it starts at `fromId`. */
export function routeFrom(route: Route, fromId: string): string {
  return route.from === fromId ? route.d : route.dReverse;
}
