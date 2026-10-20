"use client";

import { useMemo } from "react";
import { mulberry32, rangeFrom } from "@/lib/seededRandom";
import { curvedThread } from "@/lib/webData";

// Generates organic threads that wrap a framed rectangle's border — used by
// any "image embedded in the web" treatment (Hero portrait, project
// previews). Local box is authored in percentage-ish units (0-100 wide,
// 0-125 tall) with margin so threads can run past the frame edges.
export function useBorderThreads(seed: number, count: number) {
  return useMemo(() => {
    const rng = mulberry32(seed);
    const anchors = [
      { x: -18, y: -14 },
      { x: 118, y: -10 },
      { x: -14, y: 138 },
      { x: 122, y: 132 },
      { x: 50, y: -20 },
      { x: -22, y: 62 },
      { x: 124, y: 70 },
      { x: 50, y: 145 },
    ];
    const frameTargets = [
      { x: 4, y: 6 },
      { x: 96, y: 4 },
      { x: 6, y: 118 },
      { x: 94, y: 120 },
      { x: 40, y: 2 },
      { x: 2, y: 55 },
      { x: 98, y: 62 },
      { x: 58, y: 122 },
    ];
    return Array.from({ length: count }).map((_, i) => {
      const a = anchors[i % anchors.length];
      const t = frameTargets[i % frameTargets.length];
      const bow = rangeFrom(rng, -14, 14);
      return curvedThread(a.x, a.y, t.x, t.y, bow).d;
    });
  }, [seed, count]);
}
