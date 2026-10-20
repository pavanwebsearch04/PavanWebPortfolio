"use client";

import { useMemo } from "react";
import { motion, MotionValue } from "framer-motion";
import { WebNode, curvedThread } from "@/lib/webData";
import { mulberry32, rangeFrom } from "@/lib/seededRandom";
import HeroWebReactiveThread from "@/components/hero/HeroWebReactiveThread";

export const HEADER_CANVAS = { width: 1600, height: 140 };
const LOGO_ANCHOR = { x: 30, y: 70 };
const CTA_ANCHOR = { x: 1570, y: 70 };

function buildNodes(): WebNode[] {
  const rng = mulberry32(3301);
  return Array.from({ length: 8 }).map((_, i) => {
    const x = 220 + i * 165 + rangeFrom(rng, -30, 30);
    const y = 70 + rangeFrom(rng, -22, 22);
    return {
      id: `hn${i}`,
      x,
      y,
      angle: 0,
      radius: 0,
      depth: "foreground",
      size: rangeFrom(rng, 1.6, 2.4),
      parallax: 1,
      delay: 0.05 + i * 0.04,
    };
  });
}

// Purely atmospheric web spanning the header bar — reuses the same
// cursor-tension engine as the Hero (useNodeTension via
// HeroWebReactiveThread) rather than a separate physics system. Extremely
// faint at rest; brightens only where the cursor gets close.
export default function HeaderWeb({
  pointerX,
  pointerY,
  interactive,
}: {
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  interactive: boolean;
}) {
  const nodes = useMemo(buildNodes, []);
  const baseline = useMemo(
    () => curvedThread(LOGO_ANCHOR.x, LOGO_ANCHOR.y, CTA_ANCHOR.x, CTA_ANCHOR.y, 10).d,
    []
  );

  return (
    <svg
      viewBox={`0 0 ${HEADER_CANVAS.width} ${HEADER_CANVAS.height}`}
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full overflow-visible"
      aria-hidden
    >
      <motion.path
        d={baseline}
        fill="none"
        stroke="#EDEAE3"
        strokeWidth={0.5}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.06 }}
        transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* dampened to stay "extremely subtle" in a chrome element that's
          present at every scroll position, unlike the large focal webs
          this thread component was originally tuned for */}
      <g opacity={0.45}>
        {nodes.map((node, i) => {
          const anchor = i < nodes.length / 2 ? LOGO_ANCHOR : CTA_ANCHOR;
          return (
            <HeroWebReactiveThread
              key={node.id}
              node={node}
              anchor={anchor}
              bow={i % 2 === 0 ? 12 : -12}
              pointerX={pointerX}
              pointerY={pointerY}
              interactive={interactive}
              delay={node.delay}
            />
          );
        })}
      </g>
    </svg>
  );
}
