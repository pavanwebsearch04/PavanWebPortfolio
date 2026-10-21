"use client";

import { useRef } from "react";
import { motion, MotionValue, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return <motion.span style={{ opacity }}>{word}</motion.span>;
}

// Words fill from 20% to 100% opacity as the paragraph scrolls through the
// viewport (scroll-scrubbed, so it reverses when scrolling back up). Reduced
// motion renders the plain paragraph.
export default function ScrubText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 88%", "end 58%"] });
  const words = text.split(" ");

  if (reduced) return <p className={className}>{text}</p>;

  return (
    <p ref={ref} data-reveal className={className} aria-label={text}>
      {words.map((w, i) => {
        const start = i / words.length;
        const end = Math.min(1, start + 1.6 / words.length);
        return (
          <span key={i} aria-hidden>
            <Word word={w} progress={scrollYProgress} range={[start, end]} />
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </p>
  );
}
