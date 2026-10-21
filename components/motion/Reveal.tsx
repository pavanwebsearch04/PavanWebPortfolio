"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DUR, EASE_OUT, REVEAL_RISE } from "@/lib/motion";

// Fade + rise, once, when the element enters the viewport. `data-reveal` lets
// the <noscript> fallback in the layout keep the content visible without JS.
export default function Reveal({
  children,
  delay = 0,
  y = REVEAL_RISE,
  as = "div",
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  as?: "div" | "span" | "p" | "li" | "section";
  className?: string;
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      data-reveal
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: DUR.reveal, delay, ease: EASE_OUT }}
    >
      {children}
    </Tag>
  );
}
