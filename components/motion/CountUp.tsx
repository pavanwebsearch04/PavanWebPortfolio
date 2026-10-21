"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Counts from 0 to `to` once, when scrolled into view. Renders the final value
// on the server and with reduced motion, so the number is never wrong or empty.
export default function CountUp({
  to,
  pad = 2,
  duration = 1,
  className,
}: {
  to: number;
  pad?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduced) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = String(Math.round(v)).padStart(pad, "0");
      },
    });
    return () => controls.stop();
  }, [inView, reduced, to, duration, pad]);

  return (
    <span ref={ref} className={className}>
      {String(to).padStart(pad, "0")}
    </span>
  );
}
