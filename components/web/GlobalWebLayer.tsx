"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion, MotionValue, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useWebInteraction } from "@/hooks/useWebInteraction";
import { mulberry32, rangeFrom } from "@/lib/seededRandom";
import { WEB_COLORS, WEB_CONFIG } from "@/lib/webConfig";
import { buildPageModel, hashString, PageModel, PageNode, PageStrand, strandD, StrandWeight } from "@/lib/webGeometry";
import { bentStrandD, nearestStrand, sampleStrands } from "@/lib/webTug";
import WebSpider from "./WebSpider";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const STROKE_WIDTH = WEB_CONFIG.layer.strandWidth;
const OPACITY: Record<"corner" | "rail" | "chain" | "spur", Record<StrandWeight, number>> = {
  corner: { thin: 0.09, mid: 0.14, strong: 0.18 },
  rail: { thin: 0.13, mid: 0.19, strong: 0.24 },
  chain: { thin: 0.15, mid: 0.22, strong: 0.28 },
  spur: { thin: 0.12, mid: 0.16, strong: 0.2 },
};

// 0..1: how close a boundary (or corner web) is to the middle of the
// viewport. Drives how visible / drawn-in each part of the web is as the
// reader scrolls through, so strands appear ahead of you and fade behind.
function useProximity(y: number, scrollY: MotionValue<number>, reduced: boolean) {
  const yRef = useRef(y);
  yRef.current = y;
  return useTransform(scrollY, (sy) => {
    if (reduced || typeof window === "undefined") return 1;
    const vh = window.innerHeight;
    return 1 - clamp(Math.abs(yRef.current - (sy + vh / 2)) / (vh * 0.95), 0, 1);
  });
}

/* ---------- cursor tug ---------- */

// How far (px) from a strand the spider starts to pull it, and how far the
// strand is allowed to bow.
const TUG_RADIUS = 64;
const TUG_MAX = 16;

interface Tug {
  id: MotionValue<string>;
  t: MotionValue<number>;
  dx: MotionValue<number>;
  dy: MotionValue<number>;
}

// Strands near the pointer bow towards it and spring back (slightly
// underdamped, so they settle with a small twang). One shared set of
// MotionValues; only the strand that is currently tugged reads them.
function useCursorTug(model: PageModel | null, enabled: boolean): Tug {
  const { pointerX, pointerY, scrollY } = useWebInteraction();
  const id = useMotionValue("");
  const t = useMotionValue(0.5);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const dx = useSpring(rawX, { stiffness: 170, damping: 12, mass: 1 });
  const dy = useSpring(rawY, { stiffness: 170, damping: 12, mass: 1 });
  const samples = useMemo(() => (model ? sampleStrands(model) : []), [model]);

  useEffect(() => {
    if (!enabled || samples.length === 0) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      if (pointerX.get() < 0) {
        rawX.set(0);
        rawY.set(0);
        return;
      }
      const cx = pointerX.get();
      const cy = pointerY.get() + scrollY.get();
      const hit = nearestStrand(samples, cx, cy, TUG_RADIUS);
      if (!hit) {
        rawX.set(0);
        rawY.set(0);
        return;
      }
      if (id.get() !== hit.id) id.set(hit.id);
      t.set(hit.t);
      const fall = Math.sqrt(1 - hit.dist / TUG_RADIUS);
      let vx = (cx - hit.px) * 0.55 * fall;
      let vy = (cy - hit.py) * 0.55 * fall;
      const len = Math.hypot(vx, vy);
      if (len > TUG_MAX) {
        vx = (vx / len) * TUG_MAX;
        vy = (vy / len) * TUG_MAX;
      }
      rawX.set(vx);
      rawY.set(vy);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const offX = pointerX.on("change", schedule);
    const offY = pointerY.on("change", schedule);
    const offS = scrollY.on("change", schedule);
    return () => {
      offX();
      offY();
      offS();
      if (raf) cancelAnimationFrame(raf);
      rawX.set(0);
      rawY.set(0);
    };
  }, [enabled, samples, pointerX, pointerY, scrollY, id, t, rawX, rawY]);

  return useMemo(() => ({ id, t, dx, dy }), [id, t, dx, dy]);
}

// d for a strand, bowed towards the cursor only while it is the tugged one
function useTuggedD(strand: PageStrand, nodes: Record<string, PageNode>, tug: Tug, stretch?: MotionValue<number>) {
  const inputs = stretch ? [stretch, tug.id, tug.t, tug.dx, tug.dy] : [tug.id, tug.t, tug.dx, tug.dy];
  return useTransform(inputs as MotionValue<number | string>[], (latest) => {
    const [st, tid, tt, dx, dy] = (stretch ? latest : [0, ...latest]) as [number, string, number, number, number];
    if (tid !== strand.id || (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05)) return strandD(strand, nodes, st);
    return bentStrandD(strand, nodes, st, tt, dx, dy);
  });
}

/* ---------- static layers (rendered once per layout) ---------- */

function RailStrand({ strand, nodes, tug }: { strand: PageStrand; nodes: Record<string, PageNode>; tug: Tug }) {
  const d = useTuggedD(strand, nodes, tug);
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={WEB_COLORS.paper}
      strokeWidth={STROKE_WIDTH[strand.weight]}
      strokeOpacity={OPACITY.rail[strand.weight]}
      strokeLinecap="round"
    />
  );
}

const StaticWeb = memo(function StaticWeb({ model, tug }: { model: PageModel; tug: Tug }) {
  const rails = model.strands.filter((s) => s.kind === "rail");
  const railGlyphs = useMemo(
    () =>
      Object.values(model.nodes)
        .filter((n) => (n.id.startsWith("L") || n.id.startsWith("R")) && n.glyph)
        .map((n) => glyphD(n, 0))
        .join(" "),
    [model]
  );
  return (
    <g>
      {rails.map((s) => (
        <RailStrand key={s.id} strand={s} nodes={model.nodes} tug={tug} />
      ))}
      <path d={railGlyphs} fill="none" stroke={WEB_COLORS.paper} strokeOpacity={0.3} strokeWidth={0.9} strokeLinecap="round" />
    </g>
  );
});

function glyphD(node: PageNode, stretch: number): string {
  const rng = mulberry32(hashString(node.id));
  const base = rng() * Math.PI * 2;
  const y = node.y + node.k * stretch;
  let d = "";
  for (let i = 0; i < 3; i++) {
    const a = base + i * 2.09 + rangeFrom(rng, -0.45, 0.45);
    const l = 3.6 * rangeFrom(rng, 0.55, 1.1);
    d += `M ${node.x.toFixed(1)} ${y.toFixed(1)} l ${(Math.cos(a) * l).toFixed(1)} ${(Math.sin(a) * l).toFixed(1)} `;
  }
  return d;
}

/* ---------- corner webs (layer A) ---------- */

function CornerGroup({
  model,
  group,
  scrollY,
  reduced,
}: {
  model: PageModel;
  group: number;
  scrollY: MotionValue<number>;
  reduced: boolean;
}) {
  const prox = useProximity(model.groupY[group] ?? 0, scrollY, reduced);
  const opacity = useTransform(prox, [0, 1], [0.5, 1]);
  const strands = model.corners.filter((c) => c.group === group);
  return (
    <motion.g style={{ opacity }}>
      {strands.map((c) => (
        <path
          key={c.id}
          d={c.d}
          fill="none"
          stroke={WEB_COLORS.paper}
          strokeWidth={STROKE_WIDTH[c.weight]}
          strokeOpacity={OPACITY.corner[c.weight]}
          strokeLinecap="round"
        />
      ))}
    </motion.g>
  );
}

/* ---------- boundary bridges (layer B) ---------- */

function BridgeStrand({
  strand,
  nodes,
  stretch,
  prox,
  tug,
}: {
  strand: PageStrand;
  nodes: Record<string, PageNode>;
  stretch: MotionValue<number>;
  prox: MotionValue<number>;
  tug: Tug;
}) {
  const d = useTuggedD(strand, nodes, tug, stretch);
  // strands extend a little further as the boundary comes into view
  const pathLength = useTransform(prox, [0, 1], [0.6, 1]);
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={WEB_COLORS.paper}
      strokeWidth={STROKE_WIDTH[strand.weight]}
      strokeOpacity={OPACITY[strand.kind === "spur" ? "spur" : "chain"][strand.weight]}
      strokeLinecap="round"
      style={{ pathLength }}
    />
  );
}

function BridgeGlyphs({ nodes, stretch }: { nodes: PageNode[]; stretch: MotionValue<number> }) {
  const d = useTransform(stretch, (st) => nodes.map((n) => glyphD(n, st)).join(" "));
  return (
    <motion.path d={d} fill="none" stroke={WEB_COLORS.paper} strokeOpacity={0.34} strokeWidth={0.9} strokeLinecap="round" />
  );
}

function BridgeGroup({
  model,
  group,
  scrollY,
  tension,
  registry,
  reduced,
  tug,
}: {
  model: PageModel;
  group: number;
  scrollY: MotionValue<number>;
  tension: MotionValue<number>;
  registry: Map<number, MotionValue<number>>;
  reduced: boolean;
  tug: Tug;
}) {
  const prox = useProximity(model.groupY[group], scrollY, reduced);
  // scroll tension pulls this boundary's hubs, but only while it is near view
  const stretch = useTransform([tension, prox], (latest) => {
    const [t, p] = latest as number[];
    return reduced ? 0 : t * p * WEB_CONFIG.scroll.maxStretchPx;
  });
  const opacity = useTransform(prox, [0, 1], [0.4, 1]);

  useEffect(() => {
    registry.set(group, stretch);
    return () => {
      registry.delete(group);
    };
  }, [registry, group, stretch]);

  const strands = useMemo(() => model.strands.filter((s) => s.group === group), [model, group]);
  const glyphNodes = useMemo(
    () => Object.values(model.nodes).filter((n) => n.group === group && n.glyph && (n.id.startsWith("H") || n.id.startsWith("T"))),
    [model, group]
  );

  return (
    <motion.g style={{ opacity }}>
      {strands.map((s) => (
        <BridgeStrand key={s.id} strand={s} nodes={model.nodes} stretch={stretch} prox={prox} tug={tug} />
      ))}
      <BridgeGlyphs nodes={glyphNodes} stretch={stretch} />
    </motion.g>
  );
}

/* ---------- the layer ---------- */

interface Layout {
  w: number;
  h: number;
  tops: number[];
}

// One decorative SVG behind the whole page, from the header to the footer:
// corner webs on the edges (A), rails + boundary bridges that tie every
// section to the next (B), and a few spiders that live on it. It measures
// the real section positions, so the web follows the layout at any width.
export default function GlobalWebLayer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { reducedMotion, scrollY, tension, cursorActive } = useWebInteraction();
  const [layout, setLayout] = useState<Layout | null>(null);
  const registry = useRef(new Map<number, MotionValue<number>>()).current;

  useEffect(() => {
    const main = rootRef.current?.parentElement;
    if (!main) return;
    let timer = 0;
    const measure = () => {
      const w = Math.round(main.clientWidth);
      const h = Math.round(main.offsetHeight);
      const tops = Array.from(main.children)
        .filter((c): c is HTMLElement => c instanceof HTMLElement && c.tagName === "SECTION")
        .map((c) => Math.round(c.offsetTop));
      setLayout((prev) =>
        prev &&
        prev.w === w &&
        Math.abs(prev.h - h) < 2 &&
        prev.tops.length === tops.length &&
        prev.tops.every((t, i) => Math.abs(t - tops[i]) < 2)
          ? prev
          : { w, h, tops }
      );
    };
    // wait for layout to settle (expanding cards, font swaps) before rebuilding
    const debounced = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 140);
    };
    measure();
    const ro = new ResizeObserver(debounced);
    ro.observe(main);
    window.addEventListener("load", debounced);
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener("load", debounced);
    };
  }, []);

  const mobile = (layout?.w ?? 1024) < WEB_CONFIG.layer.mobileBreakpoint;
  const model = useMemo(
    () => (layout && layout.tops.length > 0 ? buildPageModel(layout.w, layout.h, layout.tops, mobile) : null),
    [layout, mobile]
  );

  const tug = useCursorTug(model, cursorActive && !reducedMotion);

  const lastGroup = model ? model.groupY.length - 1 : 0;
  const spiderCount = mobile ? WEB_CONFIG.spiders.mobile : WEB_CONFIG.spiders.desktop;

  return (
    <motion.div
      ref={rootRef}
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.6, delay: 0.3 }}
      className="pointer-events-none absolute inset-0 z-[1] select-none overflow-hidden"
    >
      {model && (
        <svg
          width={model.width}
          height={model.height}
          viewBox={`0 0 ${model.width} ${model.height}`}
          className="absolute left-0 top-0 block"
          focusable="false"
        >
          {Array.from({ length: lastGroup + 1 }).map((_, g) => (
            <CornerGroup key={`c${g}`} model={model} group={g} scrollY={scrollY} reduced={reducedMotion} />
          ))}
          <StaticWeb model={model} tug={tug} />
          {Array.from({ length: Math.max(0, lastGroup - 1) }).map((_, i) => (
            <BridgeGroup
              key={`b${i + 1}`}
              model={model}
              group={i + 1}
              scrollY={scrollY}
              tension={tension}
              registry={registry}
              reduced={reducedMotion}
              tug={tug}
            />
          ))}
          {Array.from({ length: spiderCount }).map((_, i) => (
            <WebSpider
              key={`sp${i}`}
              model={model}
              index={i}
              total={spiderCount}
              registry={registry}
              scrollY={scrollY}
              reduced={reducedMotion}
            />
          ))}
        </svg>
      )}
    </motion.div>
  );
}
