"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsCoarsePointer } from "@/hooks/useIsCoarsePointer";
import { featuredWebsites, websites } from "@/data/websites";
import ProjectWeb from "./ProjectWeb";
import ProjectList from "./ProjectList";
import { PrimaryHeading, SectionCta } from "@/components/ui/PageContext";

// trailing space keeps the heading's text readable as one sentence
const HEADLINE = ["Websites Designed ", "to Make an Impression"];

// Editorial rhythm for the Home selection, in featured order (seven cards).
// Large features alternate sides with smaller supporting pieces; the last row
// is three compact cards.
//   lg (12 cols):  7+5 / 5+7 / 4+4+4
//   sm (2 cols):   full / 1+1 / full / 1+1 / 1+1
//   mobile:        one column
// `delay` staggers cards that enter the viewport together (seconds); `web` is
// the card's node in the section's shared web canvas (0-1000 x 0-560).
const LAYOUT: Array<{ variant: string; cell: string; delay: number; web: { x: number; y: number } }> = [
  { variant: "feature", cell: "sm:col-span-2 lg:col-span-7", delay: 0, web: { x: 290, y: 130 } },
  { variant: "standard", cell: "lg:col-span-5 lg:mt-24", delay: 0.12, web: { x: 800, y: 190 } },
  { variant: "standard", cell: "lg:col-span-5 lg:mt-16", delay: 0, web: { x: 210, y: 320 } },
  { variant: "feature", cell: "sm:col-span-2 lg:col-span-7", delay: 0.12, web: { x: 710, y: 350 } },
  { variant: "compact", cell: "lg:col-span-4", delay: 0, web: { x: 170, y: 480 } },
  { variant: "compact", cell: "lg:col-span-4 lg:mt-14", delay: 0.1, web: { x: 500, y: 505 } },
  { variant: "compact", cell: "lg:col-span-4 lg:mt-6", delay: 0.2, web: { x: 830, y: 480 } },
];

export default function SelectedWork() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const isCoarse = useIsCoarsePointer();
  const interactive = !reducedMotion && !isCoarse;

  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const anchors = useMemo(
    () => featuredWebsites.map((w, i) => ({ id: w.slug, ...LAYOUT[i].web })),
    []
  );

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const webOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.3]);

  return (
    <section
      id="work"
      ref={sectionRef}
      aria-labelledby="work-heading"
      className="surface surface-ink relative w-full overflow-x-clip px-6 py-24 md:px-14 md:py-32 lg:px-20"
    >
      <motion.div style={{ opacity: webOpacity }} className="absolute inset-0 z-0">
        <ProjectWeb activeSlug={activeSlug} interactive={interactive} anchors={anchors} />
      </motion.div>

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
              01 / SELECTED WORK · DIGITAL EXPERIENCES
            </motion.p>
          </div>

          <PrimaryHeading id="work-heading" className="font-display text-section font-medium uppercase text-paper">
            {HEADLINE.map((line, i) => (
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

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-xl text-body text-paper-body"
            >
              Explore a selection of digital experiences across business websites and WordPress
              development — each shaped around its purpose, audience, and identity.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="shrink-0 font-mono text-label uppercase tracking-[0.12em] text-paper-dim"
            >
              <span className="text-crimson-text">{String(featuredWebsites.length).padStart(2, "0")}</span> of{" "}
              {websites.length} live websites
              <span aria-hidden> · </span>
              <span className="block lg:inline">each opens in a new tab</span>
            </motion.p>
          </div>
        </div>

        {/* selected live websites — irregular editorial rhythm, not a uniform grid */}
        <ProjectList sites={featuredWebsites} onActivate={setActiveSlug} />

        <SectionCta href="/projects" label="EXPLORE ALL PROJECTS" />
      </div>
    </section>
  );
}
