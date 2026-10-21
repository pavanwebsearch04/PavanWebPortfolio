"use client";

import { useRef } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";
import { useOnScreen } from "@/hooks/useOnScreen";

// Technology labels hung from thin threads in the foreground layer of the hero
// visual. Each swings gently, out of phase with the others; the whole layer
// drifts with the pointer (deepest layer, ~35px). Decorative, so aria-hidden.
const LABELS = [
  { text: "REACT", left: "3%", drop: 112, dur: 5.4, delay: 0, amp: 3.2 },
  { text: "PHP", left: "13%", drop: 196, dur: 6.6, delay: -2.1, amp: 2.6 },
  { text: "WORDPRESS", left: "2%", drop: 286, dur: 7.2, delay: -4.4, amp: 2.2 },
  { text: "NEXT.JS", left: "84%", drop: 136, dur: 6.1, delay: -1.2, amp: 3 },
  { text: "MYSQL", left: "88%", drop: 228, dur: 5.8, delay: -3.3, amp: 2.8 },
  { text: "TYPESCRIPT", left: "76%", drop: 326, dur: 7.6, delay: -5.2, amp: 2.2 },
];

// small dewdrops caught on the threads
const DEW = [
  { left: "6%", top: 150, delay: 0 },
  { left: "16%", top: 262, delay: 1.6 },
  { left: "87%", top: 190, delay: 0.8 },
  { left: "91%", top: 300, delay: 2.4 },
];

export default function HeroLabels({
  parallaxX,
  parallaxY,
}: {
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(ref, 80);
  const x = useTransform(parallaxX, (v) => v * 35);
  const y = useTransform(parallaxY, (v) => v * 21);

  return (
    <motion.div
      ref={ref}
      aria-hidden
      style={{ x, y }}
      data-paused={onScreen ? "false" : "true"}
      className="hero-labels pointer-events-none absolute inset-0 hidden md:block"
    >
      {LABELS.map((l) => (
        <div
          key={l.text}
          className="hero-label absolute top-0 flex origin-top flex-col items-center"
          style={
            {
              left: l.left,
              "--sway-d": `${l.dur}s`,
              "--sway-o": `${l.delay}s`,
              "--sway-a": `${l.amp}deg`,
            } as React.CSSProperties
          }
        >
          <span className="block w-px bg-gradient-to-b from-paper/0 via-paper/30 to-paper/45" style={{ height: l.drop }} />
          <span className="border border-crimson-bright/40 bg-ink/80 px-2.5 py-1 font-mono text-[0.68rem] tracking-[0.12em] text-paper-body shadow-[0_0_14px_rgba(212,72,59,0.22)]">
            {l.text}
          </span>
        </div>
      ))}
      {DEW.map((d, i) => (
        <span
          key={i}
          className="hero-dew absolute h-1.5 w-1.5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff,rgba(238,108,92,0.55)_60%,transparent)]"
          style={{ left: d.left, top: d.top, animationDelay: `${d.delay}s` }}
        />
      ))}
    </motion.div>
  );
}
