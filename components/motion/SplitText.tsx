"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DUR, EASE_OUT, STAGGER } from "@/lib/motion";

// Mask-up text reveal: each unit slides up out of an overflow-hidden mask.
//  - mode="lines": pass `lines` (one string per visual line, no measuring)
//  - mode="words": pass `text`; it is split on spaces
// The full text is kept in `aria-label` and the units are aria-hidden so screen
// readers read it once.
export default function SplitText({
  text,
  lines,
  mode = "lines",
  as = "span",
  className,
  delay = 0,
  once = true,
}: {
  text?: string;
  lines?: string[];
  mode?: "lines" | "words";
  as?: "span" | "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  const reduced = useReducedMotion();
  const units = mode === "lines" && lines ? lines : (text ?? lines?.join(" ") ?? "").split(" ");
  const label = lines ? lines.join(" ") : (text ?? "");
  const Tag = motion[as];

  return (
    <Tag
      data-reveal
      aria-label={label}
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once, margin: "0px 0px -10% 0px" }}
      transition={{ staggerChildren: STAGGER, delayChildren: delay }}
    >
      {units.map((unit, i) => (
        <span
          key={i}
          aria-hidden
          className={mode === "lines" ? "block overflow-hidden" : "inline-block overflow-hidden align-bottom"}
        >
          <motion.span
            className="inline-block will-change-transform"
            variants={{
              hidden: reduced ? { y: 0 } : { y: "110%" },
              shown: { y: 0, transition: { duration: DUR.reveal, ease: EASE_OUT } },
            }}
          >
            {unit}
            {mode === "words" && i < units.length - 1 ? " " : null}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
