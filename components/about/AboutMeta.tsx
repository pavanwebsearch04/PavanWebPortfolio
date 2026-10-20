"use client";

import { motion } from "framer-motion";

const ROWS: Array<{ label: string; lines: string[] }> = [
  { label: "BASED IN", lines: ["UDAIPUR, RAJASTHAN, INDIA"] },
  { label: "FOCUS", lines: ["WEB DEVELOPMENT", "WORDPRESS", "DIGITAL EXPERIENCES"] },
];

export default function AboutMeta() {
  return (
    <div className="flex flex-col gap-5">
      {ROWS.map((row, i) => (
        <motion.div
          key={row.label}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
          className="flex flex-col gap-1 border-l border-paper/25 pl-4"
        >
          <span className="font-mono text-label tracking-[0.12em] text-crimson-text">
            {row.label}
          </span>
          {row.lines.map((line) => (
            <span key={line} className="font-mono text-nav text-paper-body">
              {line}
            </span>
          ))}
        </motion.div>
      ))}
    </div>
  );
}
