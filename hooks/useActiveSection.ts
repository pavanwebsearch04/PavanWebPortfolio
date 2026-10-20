"use client";

import { useEffect, useState } from "react";

// Lightweight scrollspy: watches each section by id and reports whichever
// one is currently crossing a detection line just below the fixed header.
// When several are simultaneously "intersecting" (tall sections, fast
// scroll), the last one in document order wins, which matches how people
// read "what am I looking at right now" while scrolling downward.
export function useActiveSection(ids: string[]): string {
  const [activeId, setActiveId] = useState(ids[0] ?? "");

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        const activeInOrder = ids.filter((id) => visible.has(id));
        if (activeInOrder.length > 0) {
          setActiveId(activeInOrder[activeInOrder.length - 1]);
        }
      },
      { rootMargin: "-88px 0px -70% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}
