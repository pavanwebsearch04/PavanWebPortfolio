"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsCoarsePointer } from "@/hooks/useIsCoarsePointer";
import { projectFilters, websites } from "@/data/websites";
import ProjectWeb from "./ProjectWeb";
import WebsiteCard from "./WebsiteCard";
import { PrimaryHeading } from "@/components/ui/PageContext";

// /projects: the complete collection. Unlike the Home selection (an irregular
// editorial rhythm of a few large cards) this is an archive — an even grid of
// cards that carry more metadata, with filters to narrow it.
//   lg: 3 columns · sm: 2 columns · mobile: 1 column
const COLUMN_X = [170, 500, 830];

export default function ProjectArchive() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const isCoarse = useIsCoarsePointer();
  const interactive = !reducedMotion && !isCoarse;

  const [filterId, setFilterId] = useState("all");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const filter = projectFilters.find((f) => f.id === filterId) ?? projectFilters[0];
  const visible = useMemo(() => websites.filter(filter.test), [filter]);

  // The web is ambient: nodes are seated on the full collection's grid and do
  // not move when a filter is applied, so the background stays calm.
  const anchors = useMemo(() => {
    const rows = Math.max(1, Math.ceil(websites.length / 3));
    return websites.map((w, i) => ({
      id: w.slug,
      x: COLUMN_X[i % 3],
      y: rows === 1 ? 300 : 190 + Math.floor(i / 3) * (320 / (rows - 1)),
    }));
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const webOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.3]);

  return (
    <section
      id="work"
      ref={sectionRef}
      aria-labelledby="archive-heading"
      className="surface surface-ink relative w-full overflow-x-clip px-6 py-24 md:px-14 md:py-32 lg:px-20"
    >
      <motion.div style={{ opacity: webOpacity }} className="absolute inset-0 z-0">
        <ProjectWeb activeSlug={activeSlug} interactive={interactive} anchors={anchors} />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* introduction */}
        <div className="mb-12 flex flex-col gap-6 md:mb-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-crimson-bright" />
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-mono text-label tracking-[0.14em] text-paper-muted"
            >
              SELECTED WORK / PROJECT ARCHIVE
            </motion.p>
          </div>

          <PrimaryHeading
            id="archive-heading"
            className="max-w-4xl font-display text-section font-medium uppercase text-paper"
          >
            {["A Closer Look ", "at What I Build."].map((line, i) => (
              <motion.span
                key={line}
                className="block"
                initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.85, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                {line}
              </motion.span>
            ))}
          </PrimaryHeading>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl text-body text-paper-body"
          >
            From business websites to WordPress solutions, explore the projects that represent my approach to
            thoughtful design and practical development.
          </motion.p>
        </div>

        {/* filters */}
        <div className="mb-14 flex flex-col gap-4 md:mb-20 md:flex-row md:items-center md:justify-between">
          <div role="group" aria-label="Filter projects by category" className="flex flex-wrap gap-2 sm:gap-2.5">
            {projectFilters.map((f) => {
              const active = f.id === filter.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilterId(f.id)}
                  className={`inline-flex items-center gap-2 border px-3 py-2 font-mono sm:px-3.5 sm:py-2.5 text-label uppercase tracking-[0.1em] transition-colors duration-300 ${
                    active
                      ? "border-crimson-bright bg-crimson-bright/15 text-paper"
                      : "border-paper/25 bg-paper/[0.03] text-paper-muted hover:border-paper/50 hover:text-paper"
                  }`}
                >
                  {f.label}
                  <span className={active ? "text-crimson-text" : "text-paper-dim"}>
                    {String(f.count).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>

          <p
            role="status"
            aria-live="polite"
            className="shrink-0 font-mono text-label uppercase tracking-[0.12em] text-paper-dim"
          >
            Showing <span className="text-crimson-text">{String(visible.length).padStart(2, "0")}</span> of{" "}
            {websites.length}
            <span aria-hidden> · </span>
            <span className="block md:inline">each opens in a new tab</span>
          </p>
        </div>

        {/* the collection */}
        <ul className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 md:gap-y-16 lg:grid-cols-3 lg:gap-x-8">
          {visible.map((site) => (
            <li key={site.slug}>
              <WebsiteCard
                site={site}
                // stable project number: the same in every filter
                number={websites.indexOf(site) + 1}
                variant="archive"
                eager={websites.indexOf(site) < 3}
                onActivate={setActiveSlug}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
