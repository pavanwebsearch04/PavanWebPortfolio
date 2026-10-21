"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_IN_OUT, EASE_OUT } from "@/lib/motion";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// First visit of the session only (sessionStorage), and never for reduced
// motion. Web strands draw outward from the centre, "PV" fades in, then the
// dark panel splits open to reveal the page. About 1.7s in total.
const STRANDS = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
  const r = (deg * Math.PI) / 180;
  return `M 0 0 L ${(Math.cos(r) * 160).toFixed(1)} ${(Math.sin(r) * 160).toFixed(1)}`;
});

export default function Preloader() {
  const [show, setShow] = useState(false);
  const [split, setSplit] = useState(false);

  useIso(() => {
    try {
      if (sessionStorage.getItem("pv-preloaded")) return;
      sessionStorage.setItem("pv-preloaded", "1");
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      document.documentElement.style.overflow = "hidden";
      setShow(true);
    } catch {
      /* storage blocked: skip the preloader */
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    const t1 = window.setTimeout(() => setSplit(true), 1050);
    const t2 = window.setTimeout(() => {
      setShow(false);
      document.documentElement.style.overflow = "";
    }, 1700);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      document.documentElement.style.overflow = "";
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[95]">
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: split ? "-100%" : 0 }}
            transition={{ duration: 0.6, ease: EASE_IN_OUT }}
            className="absolute inset-x-0 top-0 h-1/2 bg-ink"
          />
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: split ? "100%" : 0 }}
            transition={{ duration: 0.6, ease: EASE_IN_OUT }}
            className="absolute inset-x-0 bottom-0 h-1/2 bg-ink"
          />
          <motion.div
            animate={{ opacity: split ? 0 : 1 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg viewBox="-200 -200 400 400" className="absolute h-[70vmin] w-[70vmin] overflow-visible">
              {STRANDS.map((d, i) => (
                <motion.path
                  key={d}
                  d={d}
                  fill="none"
                  stroke="#EDEAE3"
                  strokeOpacity={0.35}
                  strokeWidth={1}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: i * 0.04, ease: EASE_OUT }}
                />
              ))}
              {[50, 95, 140].map((r, i) => (
                <motion.circle
                  key={r}
                  r={r}
                  fill="none"
                  stroke="#D4483B"
                  strokeOpacity={0.45}
                  strokeWidth={0.8}
                  initial={{ pathLength: 0, rotate: -90 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, delay: 0.2 + i * 0.12, ease: EASE_OUT }}
                />
              ))}
            </svg>
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.45, ease: EASE_OUT }}
              className="relative font-display text-5xl font-medium tracking-[0.12em] text-paper"
            >
              PV
            </motion.span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
