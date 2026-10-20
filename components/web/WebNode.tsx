"use client";

import { useMemo } from "react";
import { mulberry32 } from "@/lib/seededRandom";
import { anchorGlyph } from "@/lib/webGeometry";
import { WEB_COLORS } from "@/lib/webConfig";

// A tiny irregular web junction (three uneven arms) — the page's standard
// "anchor" mark, deliberately not a circle.
export default function WebNode({
  x,
  y,
  seed,
  size = 3.6,
  opacity = 0.35,
  accent = false,
}: {
  x: number;
  y: number;
  seed: number;
  size?: number;
  opacity?: number;
  accent?: boolean;
}) {
  const d = useMemo(() => anchorGlyph({ x, y }, mulberry32(seed), size), [x, y, seed, size]);
  return (
    <path
      d={d}
      fill="none"
      stroke={accent ? WEB_COLORS.crimsonText : WEB_COLORS.paper}
      strokeWidth={0.9}
      strokeLinecap="round"
      opacity={opacity}
    />
  );
}
