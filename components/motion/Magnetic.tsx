"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsCoarsePointer } from "@/hooks/useIsCoarsePointer";

// Pulls its child a few pixels toward the pointer while hovered, then springs
// back. Transform only. Disabled for reduced motion and touch devices.
export default function Magnetic({
  children,
  strength = 0.3,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const coarse = useIsCoarsePointer();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });
  const off = reduced || coarse;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={off ? undefined : { x: sx, y: sy }}
      onPointerMove={
        off
          ? undefined
          : (e) => {
              const r = ref.current?.getBoundingClientRect();
              if (!r) return;
              x.set((e.clientX - (r.left + r.width / 2)) * strength);
              y.set((e.clientY - (r.top + r.height / 2)) * strength);
            }
      }
      onPointerLeave={
        off
          ? undefined
          : () => {
              x.set(0);
              y.set(0);
            }
      }
    >
      {children}
    </motion.div>
  );
}
