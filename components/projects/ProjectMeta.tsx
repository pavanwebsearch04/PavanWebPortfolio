"use client";

import { motion } from "framer-motion";

// Editorial tech-stack list: uppercase, thin separators, no pill badges.
export default function ProjectMeta({
  technologies,
  reveal = false,
}: {
  technologies: string[];
  reveal?: boolean;
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-label tracking-[0.1em] text-paper-muted">
      {technologies.map((tech, i) => (
        <li key={tech} className="flex items-center gap-3">
          {i > 0 && <span className="h-px w-2 bg-paper-dim/60" aria-hidden />}
          {reveal ? (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              {tech.toUpperCase()}
            </motion.span>
          ) : (
            <span>{tech.toUpperCase()}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
