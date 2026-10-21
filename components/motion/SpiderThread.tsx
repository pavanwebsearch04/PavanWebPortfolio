"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// A thin crimson thread fixed to the right edge with a small spider hanging
// from its end. The thread lengthens with page scroll (spring smoothed), the
// spider sways, stretches a little on fast scrolls, and rides back up when the
// page scrolls to the top (for example from the back-to-top button).
// Desktop only; transform and opacity only.
const TOP = 24;

export default function SpiderThread() {
  const reduced = useReducedMotion();
  const { scrollYProgress, scrollY } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 85, damping: 22, mass: 0.5 });
  const [h, setH] = useState(560);

  useEffect(() => {
    const fit = () => setH(Math.round(window.innerHeight * 0.7));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // spider y in px, and the thread's scaleY so it always reaches the spider
  const p = reduced ? scrollYProgress : progress;
  const y = useTransform(p, (v) => TOP + v * h);
  const scaleY = useTransform(p, (v) => (TOP + v * h) / (TOP + h));

  // fast scrolling stretches the spider slightly
  const velocity = useVelocity(scrollY);
  const stretchRaw = useTransform(velocity, [-3500, 0, 3500], [1.22, 1, 1.22]);
  const stretch = useSpring(stretchRaw, { stiffness: 220, damping: 18 });

  return (
    <div aria-hidden className="pointer-events-none fixed right-3 top-0 z-[56] hidden w-6 md:block">
      <motion.span
        style={{ scaleY, height: TOP + h }}
        className="absolute left-1/2 top-0 block w-px origin-top bg-gradient-to-b from-crimson-bright/10 via-crimson-bright/50 to-crimson-bright/80"
      />
      <motion.div style={{ y }} className="absolute left-0 top-0 w-6">
        <motion.div style={{ scaleY: reduced ? 1 : stretch }} className="origin-top">
          <div className="spider-sway origin-top">
            <svg width="24" height="26" viewBox="0 0 24 26" fill="none" className="mx-auto block overflow-visible">
              <g stroke="#EDEAE3" strokeOpacity="0.8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11 L3 7 L1 10 M9 13 L2 13 L1 17 M9 15 L3 19 L3 24 M10 17 L7 22 L8 25" />
                <path d="M15 11 L21 7 L23 10 M15 13 L22 13 L23 17 M15 15 L21 19 L21 24 M14 17 L17 22 L16 25" />
              </g>
              <ellipse cx="12" cy="16" rx="4.2" ry="5.2" fill="#D4483B" />
              <ellipse cx="12" cy="10.2" rx="3" ry="3" fill="#A73A2F" />
              <circle cx="10.8" cy="9.6" r="0.7" fill="#EDEAE3" />
              <circle cx="13.2" cy="9.6" r="0.7" fill="#EDEAE3" />
            </svg>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
