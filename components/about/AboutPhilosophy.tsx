"use client";

import { motion } from "framer-motion";

export default function AboutPhilosophy() {
  return (
    <div className="mt-24 flex flex-col items-start gap-3 border-t border-paper/20 pt-12 md:mt-32">
      <motion.h3
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="font-display text-[clamp(1.5rem,1.2rem+1.5vw,2.25rem)] font-medium leading-tight text-paper"
      >
        BUILD WITH PURPOSE.
        <br />
        DESIGN WITH INTENTION.
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
  );
}
