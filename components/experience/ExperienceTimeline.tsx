"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { experience } from "@/data/experience";
import ExperienceItem from "./ExperienceItem";
import ExperienceWeb from "./ExperienceWeb";

// How long the clicked card is pinned in the viewport while the previously
// open card collapses (slightly longer than the 0.35s height transition).
const HOLD_MS = 520;

export default function ExperienceTimeline({ interactive }: { interactive: boolean }) {
  // Single source of truth for disclosure. Deliberately plain state with a
  // null start: every card is collapsed on each fresh load, nothing is
  // persisted, and scrolling never touches it. One card is open at a time.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const releaseHold = useRef<(() => void) | null>(null);

  // When another card collapses above the one just clicked, the clicked card
  // would slide up the screen. Keep its button where the visitor's pointer
  // is until the transition settles. Manual input cancels the hold.
  const holdPosition = useCallback((anchor: HTMLElement) => {
    releaseHold.current?.();
    const startTop = anchor.getBoundingClientRect().top;
    const t0 = performance.now();
    let raf = 0;
    const cancel = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", cancel);
      releaseHold.current = null;
    };
    const tick = (now: number) => {
      if (!anchor.isConnected) return cancel();
      const dy = anchor.getBoundingClientRect().top - startTop;
      if (Math.abs(dy) > 0.5) window.scrollBy({ top: dy, behavior: "instant" as ScrollBehavior });
      if (now - t0 < HOLD_MS) raf = requestAnimationFrame(tick);
      else cancel();
    };
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", cancel);
    releaseHold.current = cancel;
    raf = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => releaseHold.current?.(), []);

  const toggle = useCallback(
    (id: string, anchor: HTMLElement) => {
      setExpandedId((current) => (current === id ? null : id));
      holdPosition(anchor);
    },
    [holdPosition]
  );

  return (
    <div className="relative" style={{ overflowAnchor: "none" }}>
      <ExperienceWeb interactive={interactive} />

      {/* the vertical spine */}
      <motion.div
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-3 top-2 bottom-16 w-px origin-top bg-gradient-to-b from-paper/25 via-paper/12 to-transparent md:left-1/2 md:-translate-x-1/2"
      />

      <div className="relative md:grid md:grid-cols-[1fr_auto_1fr] md:gap-x-10">
        {experience.map((entry, i) => (
          <ExperienceItem
            key={entry.id}
            entry={entry}
            side={i % 2 === 0 ? "left" : "right"}
            expanded={expandedId === entry.id}
            onToggle={toggle}
          />
        ))}
      </div>
    </div>
  );
}
