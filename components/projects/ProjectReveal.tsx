"use client";

import { motion } from "framer-motion";

type Direction = "up" | "left" | "right" | "mask";

// Reusable in-view reveal wrapper so each project doesn't share the exact
// same fade-up motion — direction varies per caller.
export default function ProjectReveal({
  children,
  direction = "up",
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
}) {
  const variants = {
    up: { initial: { opacity: 0, y: 34, filter: "blur(6px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" } },
    left: { initial: { opacity: 0, x: -30, filter: "blur(6px)" }, animate: { opacity: 1, x: 0, filter: "blur(0px)" } },
    right: { initial: { opacity: 0, x: 30, filter: "blur(6px)" }, animate: { opacity: 1, x: 0, filter: "blur(0px)" } },
    mask: {
      initial: { clipPath: "inset(0 0 100% 0)", opacity: 0.4 },
      animate: { clipPath: "inset(0 0 0% 0)", opacity: 1 },
    },
  } as const;

  const v = variants[direction];

  return (
    <motion.div
      initial={v.initial}
      whileInView={v.animate}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
