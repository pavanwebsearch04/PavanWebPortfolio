"use client";

import { useMemo, useState } from "react";
import { skillCategories, skillsByCategory } from "@/data/skills";
import SkillCategory from "./SkillCategory";
import SkillsWeb from "./SkillsWeb";

// The Skills section. From 1360px up it is one large orb web with the
// skills seated on its junctions (SkillsWeb). Narrower screens keep the
// original category panels, which hold their own small connected webs.
// Hover/focus/tap state lives here, so both layouts share one selection.
export default function SkillsConstellation() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const itemsByCategory = useMemo(() => skillCategories.map((c) => skillsByCategory(c.id)), []);

  const activeId = hoveredId ?? selectedId;

  const select = (id: string) => setSelectedId((prev) => (prev === id ? null : id));

  return (
    <div className="flex flex-col gap-6">
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
