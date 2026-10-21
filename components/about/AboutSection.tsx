"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useMotionValue, useScroll, useSpring } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsCoarsePointer } from "@/hooks/useIsCoarsePointer";
import AboutIntro from "./AboutIntro";
import AboutMeta from "./AboutMeta";
import AboutWeb from "./AboutWeb";
import AboutPhilosophy from "./AboutPhilosophy";
import { SectionCta } from "@/components/ui/PageContext";

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const webBoxRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const isCoarse = useIsCoarsePointer();
  const interactive = !reducedMotion && !isCoarse;

  const [activeId, setActiveId] = useState<string | null>(null);

  const pointerXRaw = useMotionValue(-1000);
  const pointerYRaw = useMotionValue(-1000);
  const pointerX = useSpring(pointerXRaw, { stiffness: 500, damping: 50 });
  const pointerY = useSpring(pointerYRaw, { stiffness: 500, damping: 50 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!webBoxRef.current) return;
      const rect = webBoxRef.current.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;
      pointerXRaw.set(relX * 800);
      pointerYRaw.set(relY * 800);
    },
    [pointerXRaw, pointerYRaw]
  );

  const handlePointerLeave = useCallback(() => {
    pointerXRaw.set(-1000);
    pointerYRaw.set(-1000);
  }, [pointerXRaw, pointerYRaw]);

  return (
    <section
      id="about"
      ref={sectionRef}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerLeave={interactive ? handlePointerLeave : undefined}
      className="surface surface-graphite relative w-full overflow-x-clip px-6 py-24 md:px-14 md:py-32 lg:px-20"
    >
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:grid-rows-[auto_auto] lg:gap-x-12 lg:gap-y-10">
          <div className="lg:col-start-1 lg:row-start-1">
            <AboutIntro />
          </div>
          <div ref={webBoxRef} className="flex items-center justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <AboutWeb
              pointerX={pointerX}
              pointerY={pointerY}
              scrollYProgress={scrollYProgress}
              interactive={interactive}
              activeId={activeId}
              onActivate={setActiveId}
            />
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-start-1 lg:row-start-2"
          >
            <AboutMeta />
          </motion.div>
        </div>

        <AboutPhilosophy />

        <SectionCta href="/about" label="LEARN MORE ABOUT ME" />
      </div>
    </section>
  );
}
