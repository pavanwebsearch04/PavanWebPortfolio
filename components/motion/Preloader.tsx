"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import NameSpiders from "./NameSpiders";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Site preloader. Uses the same curtain as the inner-page transition (see
// PageTransition): dark gradient, cobweb, PAVAN VASITA with spiders and the
// crimson leading edge. It starts covering the page on the first visit of the
// session, holds while the name plays, then wipes up and away.
// Skipped for reduced motion.
const HOLD_MS = 1000;
const REVEAL_MS = 650;

const WEB = [
  "M0 500 L1000 500", "M500 0 L500 1000", "M0 0 L1000 1000", "M1000 0 L0 1000",
  "M0 250 L1000 750", "M0 750 L1000 250", "M250 0 L750 1000", "M750 0 L250 1000",
];

type Phase = "off" | "cover" | "reveal";

// The curtain is part of the server HTML, so the page is covered from the very
// first paint (no flash of the hero before hydration). This script runs before
// paint and hides it right away when it should not play (already shown this
// session, or reduced motion).
const GUARD = `try{if(sessionStorage.getItem("pv-preloaded")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.setAttribute("data-pv-skip","")}catch(e){document.documentElement.setAttribute("data-pv-skip","")}`;
const GUARD_CSS = "[data-pv-skip] #pv-preloader{display:none!important}";

export default function Preloader() {
  const [phase, setPhase] = useState<Phase>("cover");
  const decided = useRef(false); // survives the dev-only effect double run

  useIso(() => {
    if (decided.current) return;
    decided.current = true;
    try {
      if (!sessionStorage.getItem("pv-preloaded") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        sessionStorage.setItem("pv-preloaded", "1");
        document.documentElement.style.overflow = "hidden";
        return;
      }
    } catch {
      /* storage blocked: skip the preloader */
    }
    setPhase("off");
  }, []);

  useEffect(() => {
    if (phase !== "cover") return;
    const t1 = window.setTimeout(() => setPhase("reveal"), HOLD_MS);
    return () => window.clearTimeout(t1);
  }, [phase]);

  useEffect(() => {
    if (phase !== "reveal") return;
    const t = window.setTimeout(() => {
      setPhase("off");
      document.documentElement.style.overflow = "";
    }, REVEAL_MS + 50);
    return () => {
      window.clearTimeout(t);
      document.documentElement.style.overflow = "";
    };
  }, [phase]);

  if (phase === "off") return null;

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: GUARD_CSS }} />
    <script dangerouslySetInnerHTML={{ __html: GUARD }} />
    <div
      id="pv-preloader"
      suppressHydrationWarning
      aria-hidden
      style={{
        transform: phase === "reveal" ? "translateY(-100%)" : "translateY(0%)",
        transition: phase === "reveal" ? `transform ${REVEAL_MS}ms cubic-bezier(0.65, 0, 0.35, 1)` : "none",
      }}
      className="pointer-events-none fixed inset-0 z-[95] overflow-hidden bg-gradient-to-b from-[#1b0c0b] to-ink"
    >
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <g fill="none" stroke="#D4483B" strokeOpacity="0.16" strokeWidth="1" strokeLinecap="round">
          {WEB.map((d) => (
            <path key={d} d={d} />
          ))}
          {[120, 230, 340, 450].map((r) => (
            <circle key={r} cx="500" cy="500" r={r} />
          ))}
        </g>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <NameSpiders />
      </div>
      <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-crimson-bright to-transparent shadow-[0_0_24px_4px_rgba(212,72,59,0.55)]" />
    </div>
    </>
  );
}
