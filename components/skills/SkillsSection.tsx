"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsCoarsePointer } from "@/hooks/useIsCoarsePointer";
import SkillsConstellation from "./SkillsConstellation";
import { PrimaryHeading, SectionCta } from "@/components/ui/PageContext";

export default function SkillsSection() {
  const reducedMotion = useReducedMotion();
  const isCoarse = useIsCoarsePointer();
  const interactive = !reducedMotion && !isCoarse;

  return (
    <section id="skills" className="surface surface-ink relative w-full overflow-x-clip px-6 py-24 md:px-14 md:py-32 lg:px-20">
      <div className="relative z-10 mx-auto max-w-6xl">
        {/* section intro */}
        <div className="mb-16 flex flex-col gap-6 md:mb-24">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-crimson-bright" />
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="font-mono text-label tracking-[0.14em] text-paper-muted"
            >
              03 / SKILLS
            </motion.p>
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="border border-paper/15 px-2 py-0.5 font-mono text-label tracking-[0.1em] text-paper-dim"
            >
              THE STACK
            </motion.span>
          </div>

          <PrimaryHeading className="font-display text-section font-medium text-paper">
            {["TOOLS I USE TO", "MAKE IDEAS REAL."].map((line, i) => (
              <motion.span
                key={line}
                className="block"
                initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.85, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                {line}
              </motion.span>
            ))}
          </PrimaryHeading>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-xl text-body text-paper-body"
          >
            A practical mix of WordPress development, frontend engineering,
            backend fundamentals, and creative problem-solving.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center gap-2.5 pt-2"
          >
            <motion.span
              animate={interactive ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.7 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="h-1.5 w-1.5 rounded-full bg-crimson-bright"
              aria-hidden
            />
            <p className="font-mono text-label tracking-[0.14em] text-paper-dim">
              ALWAYS LEARNING. ALWAYS BUILDING.
            </p>
          </motion.div>
        </div>

        <SkillsConstellation />

        <SectionCta href="/skills" label="DISCOVER MY SKILLS" />
      </div>
    </section>
  );
}
