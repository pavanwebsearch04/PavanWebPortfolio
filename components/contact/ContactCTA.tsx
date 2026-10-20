"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function ContactCTA({
  email,
  active,
  onActivate,
  interactive,
}: {
  email: string;
  active: boolean;
  onActivate: (id: string | null) => void;
  interactive: boolean;
}) {
  return (
    <motion.a
      href={`mailto:${email}`}
      onMouseEnter={() => onActivate("cta")}
      onMouseLeave={() => onActivate(null)}
      onFocus={() => onActivate("cta")}
      onBlur={() => onActivate(null)}
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      animate={interactive ? { scale: [1, 1.015, 1] } : undefined}
      transition={interactive ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : undefined}
      whileHover={{ scale: 1.04, transition: { type: "spring", stiffness: 260, damping: 20 } }}
      whileFocus={{ scale: 1.04, transition: { type: "spring", stiffness: 260, damping: 20 } }}
      className="group relative flex w-[128px] flex-col items-center gap-2 rounded-sm border border-paper/35 bg-ink-graphite/90 px-3 py-4 text-center sm:w-auto sm:px-8 sm:py-7 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson-bright"
    >
      <motion.span
        animate={{ opacity: active ? 0.16 : 0 }}
        transition={{ duration: 0.4 }}
        className="pointer-events-none absolute -inset-4 rounded-sm bg-crimson blur-2xl"
        aria-hidden
      />
      <span className="relative font-display text-lg font-medium tracking-tight text-paper sm:text-xl md:text-2xl">
        LET&rsquo;S TALK
      </span>
      <span className="relative flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 font-mono text-label tracking-[0.06em] text-paper-body sm:tracking-[0.1em]">
        START A CONVERSATION
        <motion.span animate={{ x: active ? 4 : 0 }} transition={{ duration: 0.3 }}>
          <ArrowRight size={13} className={active ? "text-crimson-text" : ""} />
        </motion.span>
      </span>
    </motion.a>
  );
}
