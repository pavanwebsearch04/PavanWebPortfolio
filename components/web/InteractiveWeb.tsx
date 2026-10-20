"use client";

import { useMemo } from "react";
import { motion, MotionValue, useTransform, Variants } from "framer-motion";
import { useWebInteraction } from "@/hooks/useWebInteraction";
import { WEB_COLORS, WEB_CONFIG, WEB_EASE } from "@/lib/webConfig";
import { buildTargetWeb } from "@/lib/webGeometry";
import type { WebInstance } from "./webContext";

const cfg = WEB_CONFIG.interactive;
const TOTAL_OUT = cfg.stretchDuration + cfg.retractDuration;

interface StrandCustom {
  i: number;
  o: number;
}

function makeVariants(reduced: boolean): { group: Variants; strand: Variants } {
  if (reduced) {
    return {
      group: {
        hidden: { opacity: 0 },
        in: { opacity: 1, transition: { duration: 0.15 } },
        out: { opacity: 0, transition: { duration: 0.15 } },
      },
      strand: {
        hidden: { opacity: 0, pathLength: 1 },
        in: (c: StrandCustom) => ({ opacity: c.o, pathLength: 1, transition: { duration: 0.15 } }),
        out: { opacity: 0, pathLength: 1, transition: { duration: 0.15 } },
      },
    };
  }
  return {
    group: {
      hidden: { opacity: 0, scale: 0.97 },
      in: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: WEB_EASE } },
      // the whole web stretches a touch away from the element, then lets go
      out: {
        opacity: [1, 1, 0],
        scale: [1, 1.07, 1.07],
        transition: {
          duration: TOTAL_OUT,
          times: [0, cfg.stretchDuration / TOTAL_OUT, 1],
          ease: "easeOut",
        },
      },
    },
    strand: {
      hidden: { pathLength: 0, opacity: 0 },
      in: (c: StrandCustom) => ({
        pathLength: 1,
        opacity: c.o,
        transition: {
          pathLength: { duration: cfg.drawDuration, delay: 0.035 * c.i, ease: WEB_EASE },
          opacity: { duration: 0.25, delay: 0.035 * c.i },
        },
      }),
      out: (c: StrandCustom) => ({
        pathLength: 0,
        opacity: 0,
        transition: { delay: cfg.stretchDuration + 0.012 * c.i, duration: cfg.retractDuration, ease: [0.5, 0, 0.75, 0] },
      }),
    },
  };
}

const VARIANTS = { full: makeVariants(false), reduced: makeVariants(true) };

function TargetWeb({
  inst,
  reduced,
  scrollY,
  cursorX,
  cursorY,
}: {
  inst: WebInstance;
  reduced: boolean;
  scrollY: MotionValue<number>;
  cursorX: MotionValue<number>;
  cursorY: MotionValue<number>;
}) {
  const { rect, scrollY0, inHeader, seed, pointer } = inst;
  const spec = useMemo(
    () => buildTargetWeb({ width: rect.width, height: rect.height }, seed),
    [rect.width, rect.height, seed]
  );

  // the anchor closest to where the pointer came in carries the crimson accent
  const accent = useMemo(() => {
    if (!pointer) return 0;
    const lx = pointer.x - rect.left;
    const ly = pointer.y - rect.top;
    let best = 0;
    let bestD = Infinity;
    spec.anchors.forEach((a, i) => {
      const d = Math.hypot(a.x - lx, a.y - ly);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }, [pointer, rect.left, rect.top, spec.anchors]);

  // follow the page as it scrolls underneath a stationary pointer/focus
  const y = useTransform(scrollY, (v) => rect.top + (inHeader ? 0 : scrollY0 - v));

  const hovering = inst.modes.includes("hover");
  const pointerD = useTransform([cursorX, cursorY, scrollY], (latest) => {
    const [cx, cy, sy] = latest as number[];
    const a = spec.anchors[accent];
    if (!a || !hovering) return "M 0 0";
    const ax = rect.left + a.x;
    const ay = rect.top + a.y + (inHeader ? 0 : scrollY0 - sy);
    const inside = cx > rect.left - 2 && cx < rect.left + rect.width + 2 && cy > ay - a.y - 2 && cy < ay - a.y + rect.height + 2;
    const dist = Math.hypot(cx - ax, cy - ay);
    if (inside || dist > 210 || dist < 8) return `M ${ax.toFixed(1)} ${ay.toFixed(1)}`;
    // stop short of the spider so the strand never pokes through the glyph
    const k = (dist - 17) / dist;
    const ex = ax + (cx - ax) * k;
    const ey = ay + (cy - ay) * k;
    const mx = (ax + ex) / 2 + (ey - ay) * 0.08;
    const my = (ay + ey) / 2 - (ex - ax) * 0.08;
    return `M ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  });

  const v = reduced ? VARIANTS.reduced : VARIANTS.full;
  const n = spec.frame.length;
  const prev = (accent - 1 + n) % n;
  const baseW = cfg.strandWidth;

  return (
    <motion.g variants={v.group} initial="hidden" animate={inst.leaving ? "out" : "in"}>
      <motion.g style={{ x: rect.left, y }}>
        {spec.ties.map((d, i) => (
          <motion.path
            key={`t${i}`}
            d={d}
            fill="none"
            stroke={WEB_COLORS.paper}
            strokeWidth={baseW * 0.8}
            strokeLinecap="round"
            custom={{ i: i + 2, o: 0.22 }}
            variants={v.strand}
          />
        ))}
        {spec.frame.map((d, i) => {
          const isAccent = i === accent || i === prev;
          return (
            <motion.path
              key={`f${i}`}
              d={d}
              fill="none"
              stroke={isAccent ? WEB_COLORS.crimsonText : WEB_COLORS.paper}
              strokeWidth={isAccent ? baseW * 1.25 : baseW}
              strokeLinecap="round"
              custom={{ i, o: isAccent ? cfg.accentOpacity : cfg.strandOpacity }}
              variants={v.strand}
            />
          );
        })}
        {spec.spokes.map((s, i) => {
          const isAccent = s.anchor === accent;
          return (
            <motion.path
              key={`s${i}`}
              d={s.d}
              fill="none"
              stroke={isAccent ? WEB_COLORS.crimsonText : WEB_COLORS.paper}
              strokeWidth={isAccent ? baseW * 1.25 : baseW * 0.9}
              strokeLinecap="round"
              custom={{ i: i + 1, o: isAccent ? cfg.accentOpacity : 0.36 }}
              variants={v.strand}
            />
          );
        })}
        <motion.path
          d={spec.glyphs}
          fill="none"
          stroke={WEB_COLORS.paper}
          strokeWidth={1}
          strokeLinecap="round"
          custom={{ i: 4, o: 0.6 }}
          variants={v.strand}
        />
      </motion.g>

      {hovering && (
        <motion.path
          d={pointerD}
          fill="none"
          stroke={WEB_COLORS.crimsonText}
          strokeWidth={1.1}
          strokeLinecap="round"
          custom={{ i: 6, o: cfg.accentOpacity }}
          variants={v.strand}
        />
      )}
    </motion.g>
  );
}

// Renders the strands that form around whichever interactive elements the
// WebInteractionProvider currently reports. "page" sits just behind the page
// content; "header" is mounted inside the (blurred, fixed) header so strands
// around nav links are drawn above its backdrop but still behind its text.
export default function InteractiveWeb({ scope = "page" }: { scope?: "page" | "header" }) {
  const { webs, reducedMotion, scrollY, cursorX, cursorY } = useWebInteraction();
  const list = webs.filter((w) => (scope === "header" ? w.inHeader : !w.inHeader));
  if (list.length === 0) return null;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={
        scope === "page"
          ? "pointer-events-none fixed inset-0 z-[1] h-full w-full overflow-visible"
          : "pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      }
    >
      {list.map((inst) => (
        <TargetWeb
          key={inst.key}
          inst={inst}
          reduced={reducedMotion}
          scrollY={scrollY}
          cursorX={cursorX}
          cursorY={cursorY}
        />
      ))}
    </svg>
  );
}
