"use client";

import { MotionValue, useSpring, useTransform } from "framer-motion";
import { WebNode } from "@/lib/webData";

const TENSION_RADIUS = 170;

export function useNodeTension(
  node: Pick<WebNode, "x" | "y" | "parallax">,
  pointerX: MotionValue<number>,
  pointerY: MotionValue<number>,
  interactive: boolean
) {
  const dist = useTransform([pointerX, pointerY], (latest) => {
    const [px, py] = latest as number[];
    return Math.hypot(px - node.x, py - node.y);
  });

  const dx = useTransform([pointerX, pointerY], (latest) => {
    if (!interactive) return 0;
    const [px, py] = latest as number[];
    const ddx = px - node.x;
    const d = Math.hypot(ddx, py - node.y);
    const falloff = Math.max(0, 1 - d / TENSION_RADIUS);
    return ddx * falloff * 0.22 * (0.6 + node.parallax * 0.4);
  });
  const dy = useTransform([pointerX, pointerY], (latest) => {
    if (!interactive) return 0;
    const [px, py] = latest as number[];
    const ddy = py - node.y;
    const d = Math.hypot(px - node.x, ddy);
    const falloff = Math.max(0, 1 - d / TENSION_RADIUS);
    return ddy * falloff * 0.22 * (0.6 + node.parallax * 0.4);
  });

  const springDx = useSpring(dx, { stiffness: 140, damping: 15, mass: 0.5 });
  const springDy = useSpring(dy, { stiffness: 140, damping: 15, mass: 0.5 });

  return { springDx, springDy, dist };
}
