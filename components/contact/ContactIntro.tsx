"use client";

import { motion } from "framer-motion";
import { contact } from "@/data/contact";
import { PrimaryHeading } from "@/components/ui/PageContext";

export function ContactIntro() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-crimson-bright" />
        <motion.p
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-mono text-label tracking-[0.14em] text-paper-muted"
        >
          07 / CONTACT
        </motion.p>
      </div>

      <PrimaryHeading className="font-display text-section font-medium text-paper">
        {["LET'S CONNECT", "AND BUILD SOMETHING."].map((line, i) => (
          <span key={line} className="block overflow-hidden pb-[0.08em]">
            <motion.span
              className="block"
              initial={{ y: "110%" }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.85, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </PrimaryHeading>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-xl text-body text-paper-body"
      >
        Have a website idea, a WordPress project, or a development challenge?
        Share a few details and let&rsquo;s discuss how I can help.
      </motion.p>
    </div>
  );
}

export function ContactAvailability() {
  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-2 border-l border-paper/25 pl-4"
      >
        <span className="font-mono text-label tracking-[0.12em] text-crimson-text">
          AVAILABLE FOR
        </span>
        {contact.availability.map((item, i) => (
          <motion.span
            key={item}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
            className="font-mono text-nav text-paper-body"
          >
            {item}
          </motion.span>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col gap-1 border-l border-paper/25 pl-4"
      >
        <span className="font-mono text-label tracking-[0.12em] text-crimson-text">
          BASED IN
        </span>
        <span className="font-mono text-nav text-paper-body">
          {contact.location.toUpperCase()}
        </span>
      </motion.div>
    </div>
  );
}
