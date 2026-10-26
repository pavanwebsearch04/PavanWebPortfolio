"use client";

import { useEffect, useState } from "react";
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
  // safety net: never leave content blank if the observer is slow or skipped
  const [forced, setForced] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setForced(true), 1500 + delay * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  return (
    <Tag
      data-reveal
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      animate={forced ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: DUR.reveal, delay, ease: EASE_OUT }}
    >
      {children}
    </Tag>
  );
}
