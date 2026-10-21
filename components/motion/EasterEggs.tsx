"use client";

import { useEffect, useMemo, useState } from "react";

// Two small surprises, plus the tab title:
//  - typing "spider" anywhere (outside form fields), or clicking the header
//    logo five times quickly, sends a few spiders crawling across the screen
//  - the tab title becomes "Come back" while the tab is in the background
// Skipped for reduced motion (the spiders), decorative and aria-hidden.
const SPIDER_PATH = (
  <>
    <g stroke="#EDEAE3" strokeOpacity="0.85" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M9 11 L3 7 L1 10 M9 13 L2 13 L1 17 M9 15 L3 19 L3 24 M10 17 L7 22 L8 25" />
      <path d="M15 11 L21 7 L23 10 M15 13 L22 13 L23 17 M15 15 L21 19 L21 24 M14 17 L17 22 L16 25" />
    </g>
    <ellipse cx="12" cy="16" rx="4.2" ry="5.2" fill="#D4483B" />
    <ellipse cx="12" cy="10.2" rx="3" ry="3" fill="#A73A2F" />
  </>
);

export default function EasterEggs() {
  const [swarm, setSwarm] = useState(0);

  // tab title
  useEffect(() => {
    let original = document.title;
    const onVis = () => {
      if (document.hidden) {
        original = document.title;
        document.title = "Come back";
      } else if (document.title === "Come back") {
        document.title = original;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // triggers
  useEffect(() => {
    const release = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setSwarm((n) => n + 1);
    };

    let buffer = "";
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select, [contenteditable='true']") || e.metaKey || e.ctrlKey || e.altKey)) return;
      if (e.key.length !== 1) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-6);
      if (buffer === "spider") {
        buffer = "";
        release();
      }
    };

    let clicks = 0;
    let timer = 0;
    const onLogo = () => {
      clicks += 1;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => (clicks = 0), 2500);
      if (clicks >= 5) {
        clicks = 0;
        release();
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pv:logo-click", onLogo);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pv:logo-click", onLogo);
      window.clearTimeout(timer);
    };
  }, []);

  // clear the swarm once it has crossed
  useEffect(() => {
    if (!swarm) return;
    const id = window.setTimeout(() => setSwarm(0), 9000);
    return () => window.clearTimeout(id);
  }, [swarm]);

  const crawlers = useMemo(
    () =>
      swarm
        ? Array.from({ length: 7 }).map((_, i) => ({
            id: `${swarm}-${i}`,
            top: 8 + Math.random() * 80,
            size: 22 + Math.random() * 16,
            delay: i * 0.35,
            dur: 4.2 + Math.random() * 2.6,
            rtl: Math.random() > 0.65,
          }))
        : [],
    [swarm]
  );

  if (!crawlers.length) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[75] overflow-hidden">
      {crawlers.map((c) => (
        <div
          key={c.id}
          className={`spider-run absolute left-0 ${c.rtl ? "spider-run-rtl" : ""}`}
          style={{ top: `${c.top}%`, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}
        >
          <svg
            width={c.size}
            height={c.size * 1.08}
            viewBox="0 0 24 26"
            className="spider-scuttle"
            style={{ transform: `rotate(${c.rtl ? -90 : 90}deg)` }}
          >
            {SPIDER_PATH}
          </svg>
        </div>
      ))}
    </div>
  );
}
