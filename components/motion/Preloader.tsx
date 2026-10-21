"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion } from "framer-motion";
import { EASE_IN_OUT, EASE_OUT } from "@/lib/motion";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// First visit of the session only (sessionStorage), never for reduced motion.
// Timeline: ~380ms of intro (strands and orbit rings draw in, PAVAN VASITA
// rises letter by letter, a progress line fills) and then the panel splits
// open in ~300ms, about 0.7s in total. It leaves as soon as the page is ready
// (fonts loaded; images keep loading behind it) after that minimum, and never waits
// longer than a short cap, so it never hides content that is already usable.
const MIN_MS = 380;
const CAP_MS = 600;
const NAME = "PAVAN VASITA".split("");

const SPOKES = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return `M 0 0 L ${(Math.cos(a) * 190).toFixed(1)} ${(Math.sin(a) * 190).toFixed(1)}`;
});

function pageReady(): Promise<void> {
  const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready ?? Promise.resolve();
  return fonts.then(() => undefined);
}

export default function Preloader() {
  const [show, setShow] = useState(false);
  const [split, setSplit] = useState(false);
  const pctRef = useRef<HTMLSpanElement>(null);

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
    const t0 = performance.now();
    let done = false;
    const timers: number[] = [];

    const counter = animate(0, 100, {
      duration: MIN_MS / 1000,
      ease: EASE_OUT,
      onUpdate: (v) => {
        if (pctRef.current) pctRef.current.textContent = String(Math.round(v)).padStart(3, "0");
      },
    });

    const open = () => {
      if (done) return;
      done = true;
      const wait = Math.max(0, MIN_MS - (performance.now() - t0));
      timers.push(
        window.setTimeout(() => {
          setSplit(true);
          timers.push(
            window.setTimeout(() => {
              setShow(false);
              document.documentElement.style.overflow = "";
            }, 300)
          );
        }, wait)
      );
    };

    pageReady().then(open);
    timers.push(window.setTimeout(open, CAP_MS)); // never hold the page hostage

    return () => {
      counter.stop();
      timers.forEach((t) => window.clearTimeout(t));
      document.documentElement.style.overflow = "";
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[95]">
          {/* the two halves of the curtain */}
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: split ? "-100%" : 0 }}
            transition={{ duration: 0.3, ease: EASE_IN_OUT }}
            className="absolute inset-x-0 top-0 h-1/2 bg-ink"
          />
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: split ? "100%" : 0 }}
            transition={{ duration: 0.3, ease: EASE_IN_OUT }}
            className="absolute inset-x-0 bottom-0 h-1/2 bg-ink"
          />

          {/* crimson light behind everything */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: split ? 0 : 1, scale: 1 }}
            transition={{ duration: split ? 0.2 : 0.5, ease: EASE_OUT }}
            className="absolute inset-0 m-auto h-[70vmin] w-[70vmin] rounded-full bg-[radial-gradient(circle,rgba(212,72,59,0.34),transparent_62%)] blur-2xl"
          />

          {/* seam: a hairline that the curtain opens along */}
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: split ? 1 : 1, opacity: split ? 0 : 1 }}
            transition={{ scaleX: { duration: 0.4, ease: EASE_OUT }, opacity: { duration: 0.15 } }}
            className="absolute left-0 top-1/2 h-px w-full origin-center bg-gradient-to-r from-transparent via-crimson-bright/70 to-transparent"
          />

          <motion.div
            animate={{ opacity: split ? 0 : 1, scale: split ? 1.04 : 1 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6"
          >
            {/* web orbit: tilted rings and spokes give the mark some depth */}
            <div className="absolute" style={{ perspective: 700 }}>
              <motion.svg
                viewBox="-200 -200 400 400"
                className="h-[72vmin] w-[72vmin] max-w-[760px] overflow-visible"
                initial={{ rotateX: 62, rotateZ: -14 }}
                animate={{ rotateX: 62, rotateZ: 10 }}
                transition={{ duration: 0.9, ease: EASE_OUT }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {SPOKES.map((d, i) => (
                  <motion.path
                    key={d}
                    d={d}
                    fill="none"
                    stroke="#EDEAE3"
                    strokeOpacity={0.28}
                    strokeWidth={0.8}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.42, delay: i * 0.012, ease: EASE_OUT }}
                  />
                ))}
                {[45, 90, 135, 180].map((r, i) => (
                  <motion.circle
                    key={r}
                    r={r}
                    fill="none"
                    stroke="#D4483B"
                    strokeOpacity={0.7 - i * 0.12}
                    strokeWidth={1}
                    style={{ filter: "drop-shadow(0 0 4px rgba(212,72,59,0.7))" }}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.45, delay: 0.05 + i * 0.05, ease: EASE_OUT }}
                  />
                ))}
              </motion.svg>
            </div>

            {/* the name: letters rise out of a mask, then a light passes across */}
            <h2 className="relative flex font-display text-[clamp(1.9rem,6.2vw,4.4rem)] font-medium leading-none tracking-[0.14em] text-paper">
              <span className="sr-only">Pavan Vasita</span>
              {NAME.map((ch, i) => (
                <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em]">
                  <motion.span
                    className="inline-block"
                    initial={{ y: "115%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.08 + i * 0.022, ease: EASE_OUT }}
                  >
                    {ch === " " ? " " : ch}
                  </motion.span>
                </span>
              ))}
            </h2>

            {/* progress: a hairline that fills while the counter ticks to 100 */}
            <div className="relative flex w-[min(280px,60vw)] flex-col items-center gap-2">
              <div className="h-px w-full overflow-hidden bg-paper/15">
                <motion.div
                  className="h-full w-full origin-left bg-crimson-bright"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: MIN_MS / 1000, ease: EASE_OUT }}
                />
              </div>
              <span ref={pctRef} className="font-mono text-label tracking-[0.2em] text-paper-dim tabular-nums">
                000
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
