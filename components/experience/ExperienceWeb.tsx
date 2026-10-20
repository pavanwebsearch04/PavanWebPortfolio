"use client";

import { useMemo, useRef } from "react";
import { useOnScreen } from "@/hooks/useOnScreen";
import { motion } from "framer-motion";
import { generateConnectedWeb } from "@/lib/webData";

// Ambient decorative web spanning the whole timeline — reuses the same
// connected-web engine as Selected Work, but purely atmospheric here (it
// isn't wired to exact card positions, since card heights change as
// responsibilities expand/collapse). Per-item nodes, their connecting stub
// threads and the glow behind an open card live in ExperienceItem, where
// they follow the card's real position.
const CANVAS = { width: 480, height: 1400 };

export default function ExperienceWeb({ interactive }: { interactive: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const onScreen = useOnScreen(svgRef);
  const idle = interactive && onScreen;
  const geometry = useMemo(() => {
    const anchors = Array.from({ length: 7 }).map((_, i) => ({
      id: `a${i}`,
      x: 60 + ((i * 137) % 380),
      y: (i / 6) * CANVAS.height,
    }));
    return generateConnectedWeb(9911, CANVAS, anchors);
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      aria-hidden
    >
      <motion.g
        animate={idle ? { x: [0, 3, -2, 0], y: [0, -3, 2, 0] } : undefined}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      >
        {geometry.rings.map((ring) => (
          <motion.path
            key={ring.id}
            d={ring.d}
            fill="none"
            stroke="#EDEAE3"
            strokeWidth={0.5}
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.05 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
        {geometry.threads.map((thread, i) => (
          <motion.path
            key={thread.id}
            d={thread.d}
            fill="none"
            stroke="#EDEAE3"
            strokeWidth={thread.depth === "ambient" ? 0.4 : 0.55}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: thread.depth === "ambient" ? 0.05 : 0.09 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </motion.g>
    </svg>
  );
}
