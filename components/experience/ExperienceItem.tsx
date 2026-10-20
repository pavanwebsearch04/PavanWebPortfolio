"use client";

import { useId, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExperienceEntry } from "@/data/experience";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { mulberry32, rangeFrom } from "@/lib/seededRandom";
import { curvedThread } from "@/lib/webData";
import WebCorner from "@/components/web/WebCorner";

function hashSeed(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return h;
}

// A small irregular, asymmetric web-anchor glyph — deliberately not a
// circle. Each item gets a slightly different shape from a seeded jitter.
function NodeGlyph({ id, active }: { id: string; active: boolean }) {
  const arms = useMemo(() => {
    const rng = mulberry32(hashSeed(id));
    const count = 4 + Math.floor(rangeFrom(rng, 0, 2));
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + rangeFrom(rng, -0.4, 0.4);
      const len = rangeFrom(rng, 4, 8);
      return { x2: +(Math.cos(angle) * len).toFixed(2), y2: +(Math.sin(angle) * len).toFixed(2) };
    });
  }, [id]);

  return (
    <svg width="20" height="20" viewBox="-10 -10 20 20" className="overflow-visible">
      {arms.map((a, i) => (
        <motion.line
          key={i}
          x1={0}
          y1={0}
          x2={a.x2}
          y2={a.y2}
          strokeLinecap="round"
          animate={{ stroke: active ? "#D4483B" : "#EDEAE3", strokeWidth: active ? 1 : 0.7 }}
          transition={{ duration: 0.3 }}
          opacity={active ? 0.9 : 0.5}
        />
      ))}
      <motion.circle
        r={1.6}
        animate={{ fill: active ? "#D4483B" : "#EDEAE3" }}
        transition={{ duration: 0.3 }}
        fillOpacity={active ? 1 : 0.7}
      />
    </svg>
  );
}

export default function ExperienceItem({
  entry,
  side,
  expanded,
  onToggle,
}: {
  entry: ExperienceEntry;
  side: "left" | "right";
  expanded: boolean;
  onToggle: (id: string, anchor: HTMLElement) => void;
}) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const uid = useId();
  const panelId = `${uid}-details`;
  const headingId = `${uid}-company`;
  // hover previews the connection; an open card keeps it
  const active = hovered || expanded;

  const stubThread = useMemo(() => {
    const bow = side === "left" ? -6 : 6;
    const targetX = side === "left" ? -26 : 26;
    return curvedThread(0, 0, targetX, 2, bow).d;
  }, [side]);

  const left = side === "left";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex gap-5 md:contents"
    >
      {/* spine marker column */}
      <div className="relative flex w-6 shrink-0 justify-center md:col-start-2 md:w-auto">
        {/* soft glow behind the node; lives in the marker column so it tracks
            the card as it grows and shrinks */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-7 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-500"
          style={{
            opacity: expanded ? 1 : 0,
            background: "radial-gradient(closest-side, rgba(212,72,59,0.11), rgba(212,72,59,0))",
          }}
        />
        <div className="relative z-10 mt-7">
          <NodeGlyph id={entry.id} active={active} />
        </div>
        {/* short stub thread toward the card, desktop only */}
        <svg
          className="pointer-events-none absolute left-1/2 top-7 hidden overflow-visible md:block"
          width="1"
          height="1"
        >
          <motion.path
            d={stubThread}
            fill="none"
            animate={{
              stroke: active ? "#D4483B" : "#EDEAE3",
              opacity: expanded ? 0.8 : active ? 0.5 : 0.18,
              strokeWidth: expanded ? 1.1 : 0.8,
            }}
            transition={{ duration: 0.3 }}
          />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, x: left ? -24 : 24, y: 16 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        data-expanded={expanded}
        className={`panel experience-card relative mb-8 min-w-0 flex-1 p-5 md:mb-12 md:p-7 ${
          left ? "md:col-start-1 md:row-start-auto md:text-right" : "md:col-start-3"
        }`}
      >
        <div className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 ${left ? "md:flex-row-reverse" : ""}`}>
          <h3 id={headingId} className="font-display text-card font-medium text-paper">
            {entry.company}
          </h3>
          {entry.current && (
            <span className="font-mono text-label tracking-[0.12em] text-crimson-text">CURRENT ROLE</span>
          )}
        </div>

        <p className="mt-2 text-support font-medium text-paper-body">{entry.role}</p>
        <p className="mt-1 font-mono text-label tracking-[0.08em] text-paper-dim">
          {entry.duration.toUpperCase()}
          {entry.location ? ` · ${entry.location.toUpperCase()}` : ""}
        </p>

        <p className="mt-3 text-support text-paper-muted">{entry.summary}</p>

        <button
          type="button"
          onClick={(e) => onToggle(entry.id, e.currentTarget)}
          aria-expanded={expanded}
          aria-controls={expanded ? panelId : undefined}
          className={`mt-5 inline-flex min-h-[44px] items-center gap-2 border px-3.5 py-2 font-mono text-label tracking-[0.1em] transition-colors ${
            expanded
              ? "border-crimson-bright/60 bg-crimson/10 text-paper hover:border-crimson-text"
              : "border-paper/30 bg-paper/[0.04] text-paper-body hover:border-paper/60 hover:text-paper"
          }`}
        >
          <span aria-hidden="true" className="inline-block w-3 text-center text-[1.05em] leading-none">
            {expanded ? "−" : "+"}
          </span>
          <span aria-hidden="true">{expanded ? "HIDE DETAILS" : "VIEW DETAILS"}</span>
          <span className="sr-only">
            {expanded ? "Hide" : "View"} details: {entry.role}, {entry.company}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              id={panelId}
              role="region"
              aria-labelledby={headingId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden text-left"
            >
              <ul className="mt-5 flex flex-col gap-2.5 border-t border-paper/15 pt-5 text-support text-paper-body">
                {entry.responsibilities.map((item, i) => (
                  <li
                    key={i}
                    className="relative pl-5 before:absolute before:left-0 before:top-[0.8em] before:h-px before:w-3 before:bg-crimson-bright/80"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <WebCorner
          corner={left ? "tl" : "tr"}
          size={54}
          seed={hashSeed(entry.id)}
          className={left ? "!-left-2 !-top-2" : "!-right-2 !-top-2"}
        />
      </motion.div>
    </div>
  );
}
