"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { scrollToTop } from "@/lib/lenisRef";

// Huge outlined name. A crimson copy of the same text is revealed left to
// right (clip-path) as the footer scrolls into view. Decorative: the name is
// already in the footer as text, so this is aria-hidden.
export function FooterWordmark({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 95%", "end 70%"] });
  const right = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const clip = useMotionTemplate`inset(0 ${right}% 0 0)`;
  const size = "font-display text-[clamp(2.75rem,9.5vw,9.5rem)] font-medium leading-none tracking-[0.01em] whitespace-nowrap";

  return (
    <div ref={ref} aria-hidden className="relative select-none overflow-hidden py-2">
      <p className={`${size} text-transparent [-webkit-text-stroke:1px_rgba(242,239,232,0.35)]`}>{text}</p>
      <motion.p
        style={{ clipPath: reduced ? "inset(0 0% 0 0)" : clip }}
        className={`absolute inset-0 py-2 ${size} text-crimson-bright`}
      >
        {text}
      </motion.p>
    </div>
  );
}

// Back to top: the arrow shoots up while the page scrolls up (through Lenis).
export function BackToTop() {
  const [go, setGo] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        setGo(true);
        scrollToTop();
        window.setTimeout(() => setGo(false), 900);
      }}
      className="group inline-flex min-h-[44px] items-center gap-3 border border-paper/30 px-4 py-2 font-mono text-nav text-paper-body transition-colors hover:border-crimson-bright/70 hover:text-paper"
    >
      BACK TO TOP
      <span className="relative block h-4 w-4 overflow-hidden" aria-hidden>
        <ArrowUp
          size={16}
          className={`absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 ${
            go ? "-translate-y-6 !duration-500" : ""
          }`}
        />
        <ArrowUp
          size={16}
          className={`absolute inset-0 text-crimson-text transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            go ? "translate-y-0" : "translate-y-6"
          }`}
        />
      </span>
    </button>
  );
}

// Live Udaipur time (IST). Rendered after mount so server and client agree.
export function ISTClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p className="font-mono text-label tracking-[0.1em] text-paper-dim">
      UDAIPUR <span className="text-paper-body tabular-nums">{now ?? "--:--:--"}</span> IST
    </p>
  );
}
