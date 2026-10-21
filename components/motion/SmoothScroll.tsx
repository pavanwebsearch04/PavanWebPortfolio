"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setLenis } from "@/lib/lenisRef";

// Lenis smooth scroll driven by GSAP's ticker so ScrollTrigger stays in sync.
// Skipped for reduced motion and touch / coarse-pointer devices, which keep
// native scrolling. Existing framer-motion scroll hooks keep working because
// Lenis scrolls the real window.
export default function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    gsap.registerPlugin(ScrollTrigger);
    if (reduce || touch) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      anchors: { offset: -88 }, // matches section[id] scroll-margin-top for the fixed header
    });

    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      setLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
