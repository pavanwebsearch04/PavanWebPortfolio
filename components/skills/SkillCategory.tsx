"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Skill, SkillCategoryMeta, skillLinks, skillNeighbors } from "@/data/skills";
import { bowed, hashString } from "@/lib/webGeometry";
import WebCorner from "@/components/web/WebCorner";
import SkillNode, { SkillNodeState } from "./SkillNode";
import CountUp from "@/components/motion/CountUp";

const SHAPES: Array<"a" | "b" | "c"> = ["a", "b", "c"];
// small, irregular horizontal nudges so rows read as a web, not a grid
const NUDGES = ["", "sm:ml-3", "", "sm:ml-1.5", "sm:ml-4", ""];

interface Link {
  id: string;
  a: string;
  b: string;
  d: string;
  /** a real relationship from data/skills.ts (false = layout tie only) */
  real: boolean;
}

// Strands are the real relationships between this panel's skills, drawn
// between the chips' measured positions. A chip with no relationship inside
// the panel is tied to its nearest neighbour so the panel still reads as one
// web; those ties are decorative and never highlight.
function buildLinks(centers: Record<string, { x: number; y: number }>, ids: string[]): Link[] {
  const inPanel = new Set(ids);
  const links: Link[] = [];
  const touched = new Set<string>();
  skillLinks.forEach(([a, b], i) => {
    if (!inPanel.has(a) || !inPanel.has(b) || !centers[a] || !centers[b]) return;
    touched.add(a);
    touched.add(b);
    const bow = (i % 2 === 0 ? 1 : -1) * (7 + ((i * 5) % 9));
    links.push({ id: [a, b].sort().join("|"), a, b, d: bowed(centers[a], centers[b], bow), real: true });
  });
  ids.forEach((id, i) => {
    if (touched.has(id) || !centers[id]) return;
    const c = centers[id];
    const nearest = ids
      .filter((o) => o !== id && centers[o])
      .map((o) => ({ o, score: Math.hypot(centers[o].x - c.x, (centers[o].y - c.y) * 1.35) }))
      .sort((p, q) => p.score - q.score)[0];
    if (!nearest) return;
    const bow = (i % 2 === 0 ? 1 : -1) * (8 + ((i * 3) % 7));
    links.push({ id: `tie|${id}`, a: id, b: nearest.o, d: bowed(c, centers[nearest.o], bow), real: false });
  });
  return links;
}

export default function SkillCategory({
  meta,
  index,
  items,
  activeId,
  selectedId,
  onHover,
  onSelect,
  delay,
}: {
  meta: SkillCategoryMeta;
  index: number;
  items: Skill[];
  activeId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  delay: number;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [links, setLinks] = useState<Link[]>([]);
  // hovering the category header lights up all of its skills
  const [rowHot, setRowHot] = useState(false);
  const ids = useMemo(() => items.map((s) => s.id), [items]);

  const measure = useCallback(() => {
    const body = bodyRef.current;
    if (!body) return;
    const box = body.getBoundingClientRect();
    const centers: Record<string, { x: number; y: number }> = {};
    ids.forEach((id) => {
      const el = chipRefs.current[id];
      if (!el) return;
      // offsetLeft/Top are layout values, unaffected by reveal transforms
      centers[id] = { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 };
    });
    const w = Math.round(box.width);
    const h = Math.round(body.offsetHeight);
    setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    const next = buildLinks(centers, ids);
    setLinks((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [ids]);

  useLayoutEffect(() => {
    measure();
    const body = bodyRef.current;
    if (!body) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(body);
    return () => ro.disconnect();
  }, [measure]);

  // fonts can change chip widths after first paint
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    let live = true;
    document.fonts.ready.then(() => live && measure());
    return () => {
      live = false;
    };
  }, [measure]);

  // when something in this category is active, strands that don't touch it
  // step back so the highlighted connections read clearly
  const categoryActive = activeId !== null && ids.includes(activeId);

  // relationships come from data, so a skill in another panel that is
  // connected to the active one lights up here too
  const stateOf = (id: string): SkillNodeState => {
    if (selectedId === id) return "selected";
    if (activeId === id) return "active";
    if (activeId && skillNeighbors[activeId]?.includes(id)) return "related";
    if (rowHot && !activeId) return "related";
    return "idle";
  };

  return (
    <motion.section
      aria-labelledby={`skill-cat-${meta.id}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="panel relative flex flex-col gap-6 p-5 md:p-7"
    >
      <div
        onMouseEnter={() => setRowHot(true)}
        onMouseLeave={() => setRowHot(false)}
        className="relative flex items-baseline gap-3 border-b border-paper/20 pb-5"
      >
        <span className="font-mono text-nav text-crimson-text">{String(index + 1).padStart(2, "0")}</span>
        <h3
          id={`skill-cat-${meta.id}`}
          className="font-display text-[clamp(1.25rem,1.1rem+0.55vw,1.5rem)] font-medium leading-tight tracking-[0.005em] text-paper"
        >
          {meta.label}
        </h3>
        <span className="ml-auto shrink-0 pr-5 font-mono text-label tracking-[0.08em] text-paper-dim">
          <CountUp to={items.length} />
        </span>
        <span aria-hidden="true" className="absolute -bottom-px left-0 h-px w-12 bg-crimson-bright/80" />
      </div>

      <div ref={bodyRef} className="relative">
        {size.w > 0 && (
          <svg
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            className="pointer-events-none absolute left-0 top-0 overflow-visible"
            aria-hidden="true"
            focusable="false"
          >
            {links.map((l, i) => {
              const hot = l.real && activeId !== null && (l.a === activeId || l.b === activeId);
              const dimmed = categoryActive && !hot;
              return (
                <motion.path
                  key={l.id}
                  d={l.d}
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: 0.2 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    stroke: hot ? "#EE6C5C" : "#F2EFE8",
                    strokeOpacity: hot ? 0.95 : dimmed ? 0.16 : 0.34,
                    strokeWidth: hot ? 1.6 : 0.95,
                    transition: "stroke 0.25s, stroke-opacity 0.25s, stroke-width 0.25s",
                  }}
                />
              );
            })}
          </svg>
        )}

        <ul className="relative z-10 flex flex-wrap gap-x-3.5 gap-y-[1.125rem]">
          {items.map((skill, i) => (
            <motion.li
              key={skill.id}
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.2 + i * 0.04 }}
              className={`max-w-full ${NUDGES[i % NUDGES.length]}`}
            >
              <SkillNode
                ref={(el) => {
                  chipRefs.current[skill.id] = el;
                }}
                skill={skill}
                state={stateOf(skill.id)}
                shape={SHAPES[(i + index) % SHAPES.length]}
                onHover={onHover}
                onSelect={onSelect}
              />
            </motion.li>
          ))}
        </ul>
      </div>

      <WebCorner corner="tr" size={56} seed={hashString(meta.id)} opacity={0.24} className="!-right-1 !-top-1" />
    </motion.section>
  );
}
