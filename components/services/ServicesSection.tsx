"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsCoarsePointer } from "@/hooks/useIsCoarsePointer";
import ServicesNetwork from "./ServicesNetwork";
import { PrimaryHeading, SectionCta } from "@/components/ui/PageContext";

export default function ServicesSection() {
  const reducedMotion = useReducedMotion();
  const isCoarse = useIsCoarsePointer();
  const interactive = !reducedMotion && !isCoarse;

  return (
    <section id="services" className="surface surface-warm relative w-full overflow-x-clip px-6 py-24 md:px-14 md:py-32 lg:px-20">
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
              04 / SERVICES
            </motion.p>
          </div>

          <PrimaryHeading className="font-display text-section font-medium text-paper">
            {["WHAT I BUILD.", "HOW I HELP."].map((line, i) => (
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
            Turning ideas into responsive, functional, and carefully crafted
            digital experiences.
          </motion.p>
        </div>

        <ServicesNetwork interactive={interactive} />

        <SectionCta href="/services" label="SEE ALL SERVICES" />
      </div>
    </section>
  );
}
