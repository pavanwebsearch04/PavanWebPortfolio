"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  categoryDescriptions,
  skillCategories,
  skillDescriptions,
  skillNeighbors,
  skillsByCategory,
  skills,
} from "@/data/skills";
import SkillCategory from "./SkillCategory";
import SkillsWeb from "./SkillsWeb";
import { hubIdOf } from "./skillsWebLayout";

// The Skills section. From 1360px up it is one large orb web with the
// skills seated on its junctions (SkillsWeb). Narrower screens keep the
// original category panels, which hold their own small connected webs.
// Hover/focus/tap state lives here, so both layouts share one selection.
export default function SkillsConstellation() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const itemsByCategory = useMemo(() => skillCategories.map((c) => skillsByCategory(c.id)), []);

  const activeId = hoveredId ?? selectedId;

  const info = useMemo(() => {
    if (!activeId) return null;
    const hub = skillCategories.find((c) => hubIdOf(c.id) === activeId);
    if (hub) {
      const members = skillsByCategory(hub.id);
      return {
        key: activeId,
        title: hub.label,
        category: "CATEGORY",
        description: categoryDescriptions[hub.id],
        connectedLabel: `${members.length} skills`,
        connected: members.map((m) => m.name),
      };
    }
    const skill = skills.find((s) => s.id === activeId);
    if (!skill) return null;
    const cat = skillCategories.find((c) => c.id === skill.category);
    return {
      key: activeId,
      title: skill.name,
      category: (cat?.label ?? "").toUpperCase(),
      description: skillDescriptions[skill.id],
      connectedLabel: "Connected",
      connected: (skillNeighbors[skill.id] ?? []).map((id) => skills.find((s) => s.id === id)?.name).filter(Boolean) as string[],
    };
  }, [activeId]);

  const select = (id: string) => setSelectedId((prev) => (prev === id ? null : id));

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {/* detail area: the node under the pointer/focus, or the selected one */}
      <div
        className="panel sticky top-[72px] z-30 flex min-h-[112px] items-center min-[1360px]:min-h-[104px] px-5 py-4 backdrop-blur-md md:px-7"
        role="status"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 w-0.5 bg-crimson-bright transition-opacity duration-300 ${
            info ? "opacity-100" : "opacity-0"
          }`}
        />
        <AnimatePresence mode="wait" initial={false}>
          {info ? (
            <motion.div
              key={info.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-1.5"
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-display text-card font-medium text-paper">{info.title}</span>
                <span className="font-mono text-nav text-crimson-text">{info.category}</span>
              </div>
              {info.description && <p className="line-clamp-2 max-w-3xl text-support text-paper-body min-[1360px]:line-clamp-1">{info.description}</p>}
              {info.connected.length > 0 && (
                <p className="line-clamp-1 text-support text-paper-muted">
                  <span className="text-paper-dim">{info.connectedLabel}: </span>
                  {info.connected.join(" · ")}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="text-support text-paper-muted"
            >
              Hover, focus or tap a node to follow its connections through the web, with a short note on what it is.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* large screens: one connected web */}
      <div className="hidden min-[1360px]:block">
        <SkillsWeb activeId={activeId} selectedId={selectedId} onHover={setHoveredId} onSelect={select} />
      </div>

      {/* tablet and mobile: the category panels */}
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-6 min-[1360px]:hidden">
        {skillCategories.map((meta, i) => (
          <SkillCategory
            key={meta.id}
            meta={meta}
            index={i}
            items={itemsByCategory[i]}
            activeId={activeId}
            selectedId={selectedId}
            onHover={setHoveredId}
            onSelect={select}
            delay={i * 0.07}
          />
        ))}
      </div>
    </div>
  );
}
