"use client";

import { useMemo } from "react";
import { cornerWeb } from "@/lib/webGeometry";
import { useWebInteraction } from "@/hooks/useWebInteraction";
import WebStrand from "./WebStrand";

type Corner = "tl" | "tr" | "bl" | "br";

const FLIP: Record<Corner, string> = {
  tl: "",
  tr: "scale-x-[-1]",
  bl: "scale-y-[-1]",
  br: "scale-x-[-1] scale-y-[-1]",
};
const POS: Record<Corner, string> = {
  tl: "left-0 top-0",
  tr: "right-0 top-0",
  bl: "left-0 bottom-0",
  br: "right-0 bottom-0",
};

// Layer D: a small web fragment tucked into a card or heading corner. It is
// purely decorative (aria-hidden, no pointer events) and draws itself in once
// when it scrolls into view. Keep it to corners that have no text in them.
export default function WebCorner({
  corner = "tr",
  size = 64,
  seed = 1,
  opacity = 0.26,
  className = "",
}: {
  corner?: Corner;
  size?: number;
  seed?: number;
  opacity?: number;
  className?: string;
}) {
  const { reducedMotion } = useWebInteraction();
  const strands = useMemo(
    () =>
      cornerWeb({
        anchor: { x: 0.5, y: 0.5 },
        dir: 45,
        spread: 78,
        size: size - 2,
        spokes: 5,
        rings: 3,
        seed,
        group: 0,
        idPrefix: "wc",
      }),
    [size, seed]
  );

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`pointer-events-none absolute ${POS[corner]} ${FLIP[corner]} overflow-visible ${className}`}
    >
      {strands.map((s, i) => (
        <WebStrand key={s.id} d={s.d} weight={s.weight} opacity={opacity} delay={0.15 + i * 0.04} reduced={reducedMotion} />
      ))}
    </svg>
  );
}
