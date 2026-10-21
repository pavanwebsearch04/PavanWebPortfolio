"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import Marquee from "@/components/motion/Marquee";
import { DUR, EASE_OUT, STAGGER } from "@/lib/motion";

// each line: [text before, key words, text after]. The key words get a crimson
// underline that draws once the line has landed.
const LINES: Array<[string, string, string]> = [
  ["BUILD WITH ", "PURPOSE", "."],
  ["DESIGN WITH ", "INTENTION", "."],
];

export default function AboutPhilosophy() {
  const reduced = useReducedMotion();

  return (
    <>
      {/* outlined-text marquee, moving the opposite way to the hero ticker */}
      <Marquee
        reverse
        speed={46}
        ariaLabel="What I bring"
        items={["CODE", "DESIGN", "WORDPRESS", "REACT", "CREATIVITY", "PROBLEM SOLVING"]}
        itemClassName="font-display text-[clamp(2.75rem,2rem+5vw,6rem)] font-medium leading-none text-transparent [-webkit-text-stroke:1px_rgba(242,239,232,0.4)]"
        className="mt-16 md:mt-20"
      />

      <div className="mt-16 flex flex-col items-start gap-3 border-t border-paper/20 pt-12 md:mt-20">
        <motion.h3
          data-reveal
          aria-label="BUILD WITH PURPOSE. DESIGN WITH INTENTION."
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ staggerChildren: STAGGER * 2 }}
          className="font-display text-[clamp(1.5rem,1.2rem+1.5vw,2.25rem)] font-medium leading-tight text-paper"
        >
          {LINES.map(([a, key, b], i) => (
            <span key={i} aria-hidden className="block overflow-hidden pb-1">
              <motion.span
                className="block"
                variants={{
                  hidden: reduced ? { y: 0 } : { y: "110%" },
                  shown: { y: 0, transition: { duration: DUR.reveal, ease: EASE_OUT } },
                }}
              >
                {a}
                <span className="relative inline-block">
                  {key}
                  <motion.span
                    className="absolute -bottom-0.5 left-0 h-[3px] w-full origin-left bg-crimson-bright"
                    variants={{
                      hidden: { scaleX: reduced ? 1 : 0 },
                      shown: { scaleX: 1, transition: { duration: 0.7, delay: 0.55 + i * 0.15, ease: EASE_OUT } },
                    }}
                  />
                </span>
                {b}
              </motion.span>
            </span>
          ))}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-mono text-nav text-paper-muted"
        >
          EVERY LINE OF CODE IS PART OF A LARGER EXPERIENCE.
        </motion.p>
      </div>
    </>
  );
}
