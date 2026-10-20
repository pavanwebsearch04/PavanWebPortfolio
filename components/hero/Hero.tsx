"use client";

import { useCallback, useRef } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsCoarsePointer } from "@/hooks/useIsCoarsePointer";
import { WEB_CANVAS } from "@/lib/webData";
import HeroContent from "./HeroContent";
import HeroVisual from "./HeroVisual";
import HeroWeb from "./HeroWeb";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const isCoarse = useIsCoarsePointer();
  const interactive = !reducedMotion && !isCoarse;

  // normalized -1..1 position relative to the hero center, for parallax
  const parallaxXRaw = useMotionValue(0);
  const parallaxYRaw = useMotionValue(0);
  const parallaxX = useSpring(parallaxXRaw, { stiffness: 60, damping: 20 });
  const parallaxY = useSpring(parallaxYRaw, { stiffness: 60, damping: 20 });

  // pointer position mapped into the web's shared canvas space, spanning the
  // ENTIRE hero (not just the portrait side) so the web can react anywhere.
  const pointerXRaw = useMotionValue(-1000);
  const pointerYRaw = useMotionValue(-1000);
  const pointerX = useSpring(pointerXRaw, { stiffness: 500, damping: 50 });
  const pointerY = useSpring(pointerYRaw, { stiffness: 500, damping: 50 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;
      parallaxXRaw.set((relX - 0.5) * 2);
      parallaxYRaw.set((relY - 0.5) * 2);

      pointerXRaw.set(relX * WEB_CANVAS.width);
      pointerYRaw.set(relY * WEB_CANVAS.height);
    },
    [parallaxXRaw, parallaxYRaw, pointerXRaw, pointerYRaw]
  );

  const handlePointerLeave = useCallback(() => {
    pointerXRaw.set(-1000);
    pointerYRaw.set(-1000);
  }, [pointerXRaw, pointerYRaw]);

  const scrollThreadOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  // proximity from 0..1 to the portrait anchor, used to give the portrait's
  // border threads a stronger reaction when the cursor is nearby
  const nearPortrait = useTransform([pointerX, pointerY], (latest) => {
    const [px, py] = latest as number[];
    const d = Math.hypot(px - 700, py - 300);
    return Math.max(0, 1 - d / 260);
  });

  return (
    <section
      id="hero"
      ref={sectionRef}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerLeave={interactive ? handlePointerLeave : undefined}
      className="relative flex min-h-[100svh] w-full flex-col overflow-x-clip md:flex-row"
    >
      {/* the web spans the ENTIRE hero, behind both columns */}
      <div className="absolute inset-0 z-0">
        <HeroWeb
          pointerX={pointerX}
          pointerY={pointerY}
          scrollYProgress={scrollYProgress}
          interactive={interactive}
        />
      </div>

      <div className="relative z-10 flex w-full flex-col justify-center px-6 pb-10 pt-28 md:w-[45%] md:px-14 md:pb-16 md:pt-28 lg:px-20">
        <HeroContent scrollYProgress={scrollYProgress} parallaxX={parallaxX} parallaxY={parallaxY} />
      </div>

      <div className="relative z-10 w-full md:w-[55%]">
        <HeroVisual
          pointerX={pointerX}
          pointerY={pointerY}
          scrollYProgress={scrollYProgress}
          parallaxX={parallaxX}
          parallaxY={parallaxY}
          nearPortrait={nearPortrait}
          interactive={interactive}
        />
      </div>

      {/* scroll indicator */}
      <motion.div
        style={{ opacity: scrollThreadOpacity }}
        data-hero-avoid="12"
        className="pointer-events-none absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        <span className="font-mono text-label tracking-[0.2em] text-paper-dim">SCROLL</span>
        <motion.span
          className="h-10 w-px bg-gradient-to-b from-paper-muted/60 to-transparent"
          animate={interactive ? { scaleY: [1, 0.6, 1] } : undefined}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

    </section>
  );
}
