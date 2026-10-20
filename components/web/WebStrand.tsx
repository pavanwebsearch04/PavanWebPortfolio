"use client";

import { motion } from "framer-motion";
import { WEB_COLORS, WEB_CONFIG, WEB_EASE } from "@/lib/webConfig";
import type { StrandWeight } from "@/lib/webGeometry";

// A single drawn strand. Used by the small local web fragments; the big
// layers draw plain <path>s directly because there are too many of them to
// give each its own animation.
export default function WebStrand({
  d,
  weight = "thin",
  opacity = 0.16,
  accent = false,
  delay = 0,
  reduced = false,
}: {
  d: string;
  weight?: StrandWeight;
  opacity?: number;
  accent?: boolean;
  delay?: number;
  reduced?: boolean;
}) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={accent ? WEB_COLORS.crimsonText : WEB_COLORS.paper}
      strokeWidth={WEB_CONFIG.layer.strandWidth[weight]}
      strokeLinecap="round"
      initial={reduced ? { opacity } : { pathLength: 0, opacity: 0 }}
      whileInView={reduced ? undefined : { pathLength: 1, opacity }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.9, delay, ease: WEB_EASE }}
    />
  );
}
