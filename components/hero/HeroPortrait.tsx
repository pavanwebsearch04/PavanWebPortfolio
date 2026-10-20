"use client";

import { useState } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";
import Image from "next/image";
import { heroImages } from "@/data/images";
import { useBorderThreads } from "@/hooks/useBorderThreads";

const FALLBACK_SRC = "/portrait-placeholder.svg";

// deterministic particle field (no Math.random, so SSR and client match)
const PARTICLES = [
  { x: 6, y: 78, s: 3, t: 9, d: 0, dx: 10, dy: -90, z: 40, o: 0.9 },
  { x: 18, y: 92, s: 2, t: 11, d: 2.2, dx: -8, dy: -110, z: 20, o: 0.7 },
  { x: 34, y: 98, s: 2, t: 8, d: 4.1, dx: 12, dy: -80, z: 60, o: 0.8 },
  { x: 52, y: 100, s: 3, t: 12, d: 1.3, dx: -6, dy: -120, z: 30, o: 0.7 },
  { x: 70, y: 96, s: 2, t: 10, d: 5.2, dx: 9, dy: -100, z: 50, o: 0.8 },
  { x: 88, y: 84, s: 3, t: 9.5, d: 3.3, dx: -12, dy: -95, z: 20, o: 0.9 },
  { x: 95, y: 60, s: 2, t: 13, d: 6.4, dx: -6, dy: -70, z: 70, o: 0.6 },
  { x: -4, y: 40, s: 2, t: 12, d: 7.1, dx: 8, dy: -60, z: 50, o: 0.6 },
];

// larger, blurred foreground particles for a sense of distance (desktop only)
const BOKEH = [
  { x: -10, y: 70, s: 16, t: 14, d: 0, dx: 14, dy: -70, z: 140, o: 0.35 },
  { x: 104, y: 30, s: 22, t: 16, d: 4, dx: -16, dy: -60, z: 160, o: 0.3 },
  { x: 90, y: 104, s: 12, t: 13, d: 8, dx: -10, dy: -90, z: 120, o: 0.4 },
];

type Particle = (typeof PARTICLES)[number];

function particleStyle(p: Particle): React.CSSProperties {
  return {
    left: `${p.x}%`,
    top: `${p.y}%`,
    width: p.s,
    height: p.s,
    // depth via the separate `translate` property so the drift animation (transform) keeps it
    translate: `0 0 ${p.z}px`,
    opacity: p.o,
    ["--p-t" as string]: `${p.t}s`,
    ["--p-d" as string]: `${p.d}s`,
    ["--p-dx" as string]: `${p.dx}px`,
    ["--p-dy" as string]: `${p.dy}px`,
    ["--p-o" as string]: p.o,
  };
}

export default function HeroPortrait({
  scrollYProgress,
  parallaxX,
  parallaxY,
  nearPortrait,
  interactive,
}: {
  scrollYProgress: MotionValue<number>;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
  nearPortrait: MotionValue<number>;
  interactive: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const scrollY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const scrollScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.35]);

  const px = useTransform(parallaxX, (v) => v * 20);
  const py = useTransform(parallaxY, (v) => v * 18);

  // resting 3D pose, plus a smooth tilt toward the pointer on desktop. parallaxX/Y
  // are already spring-smoothed -1..1 values, so no extra listeners are needed
  const rotateY = useTransform(parallaxX, (v) => -9 + (interactive ? v * 9 : 0));
  const rotateX = useTransform(parallaxY, (v) => 3 + (interactive ? v * -7 : 0));

  const behindThreads = useBorderThreads(71, 4);
  const frontThreads = useBorderThreads(203, 5);

  const tensionOpacity = useTransform(nearPortrait, [0, 1], [0.28, 0.85]);
  const tensionStroke = useTransform(nearPortrait, [0, 1], ["#EDEAE3", "#D4483B"]);

  return (
    // opacity / filter / clip-path flatten 3D, so they live on wrappers and the
    // face — never on the preserve-3d stage itself
    <motion.div
      initial={{ opacity: 0, scale: 1.06 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
      style={{ y: scrollY, scale: scrollScale, x: px, translateY: py }}
      data-hero-avoid="22"
      className="relative mx-auto aspect-[4/5] w-[62%] max-w-[360px] md:w-[70%]"
    >
      <motion.div style={{ opacity: scrollOpacity }} className="hero3d-scene h-full w-full">
        <motion.div
          style={{ rotateX, rotateY }}
          className="hero3d-stage hero3d-float relative h-full w-full"
        >
          {/* soft red ambient light behind everything */}
          <div
            className="absolute -inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(212,72,59,0.42),transparent_65%)] blur-2xl"
            style={{ transform: "translateZ(-140px)" }}
            aria-hidden
          />

          {/* floating translucent tech panels behind the portrait */}
          <div
            className="hero3d-panel border border-crimson-bright/25 bg-gradient-to-br from-paper/[0.05] to-transparent"
            style={{ transform: "translate3d(-11%, 7%, -90px) scale(0.96)" }}
            aria-hidden
          >
            <div className="absolute left-4 top-4 flex gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-crimson-bright/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-paper/30" />
              <span className="h-1.5 w-1.5 rounded-full bg-paper/30" />
            </div>
            <div className="absolute bottom-5 left-5 right-1/3 h-px bg-gradient-to-r from-crimson-bright/50 to-transparent" />
            <div className="absolute bottom-9 left-5 right-1/2 h-px bg-gradient-to-r from-paper/25 to-transparent" />
          </div>
          <div
            className="hero3d-panel border border-paper/10 bg-gradient-to-tr from-crimson-bright/[0.07] to-transparent"
            style={{ transform: "translate3d(9%, -5%, -50px) scale(0.98)" }}
            aria-hidden
          />

          {/* web threads BEHIND the image — wraps into the frame from outside */}
          <svg
            viewBox="-30 -30 160 185"
            className="pointer-events-none absolute -inset-[24%] h-[148%] w-[148%] overflow-visible"
            style={{ transform: "translateZ(-30px)" }}
            aria-hidden
          >
            {behindThreads.map((d, i) => (
              <motion.path
                key={i}
                d={d}
                fill="none"
                stroke="#EDEAE3"
                strokeWidth={0.6}
                strokeOpacity={0.22}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.3 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </svg>

          {/* glass edge thickness */}
          <div
            className="hero3d-panel rounded-[3px] border border-crimson-bright/40 bg-ink/60"
            style={{ transform: "translateZ(-10px)" }}
            aria-hidden
          />

          {/* the portrait panel */}
          <motion.div
            initial={{ clipPath: "inset(38% 30% 38% 30% round 4px)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0% round 4px)" }}
            transition={{ duration: 1.1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="hero3d-panel overflow-hidden rounded-[3px] border border-crimson-bright/80 shadow-[0_0_0_1px_rgba(212,72,59,0.25),0_0_22px_rgba(212,72,59,0.45),0_30px_60px_-20px_rgba(0,0,0,0.85)]"
          >
            <Image
              src={imageFailed ? FALLBACK_SRC : heroImages.portrait.src}
              alt={heroImages.portrait.alt}
              fill
              priority
              unoptimized={imageFailed}
              onError={() => setImageFailed(true)}
              sizes="(max-width: 768px) 70vw, 360px"
              className="object-cover object-top contrast-[1.08] saturate-[0.9]"
            />
            {/* vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(10,10,12,0.55)_100%)]" />
            {/* glass reflection + red rim light */}
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_28%,transparent_45%)]" />
            <div className="absolute inset-0 shadow-[inset_0_0_36px_rgba(212,72,59,0.35)]" />
            {/* grain */}
            <div className="film-grain" />
            <div className="absolute inset-0 bg-ink/10 mix-blend-multiply" />
          </motion.div>

          {/* animated light trails */}
          <div
            className="pointer-events-none absolute -left-[12%] top-[22%] h-px w-[124%] overflow-hidden"
            style={{ transform: "translateZ(24px) rotate(-8deg)" }}
            aria-hidden
          >
            <div className="hero3d-trail h-full w-1/2 bg-gradient-to-r from-transparent via-crimson-bright to-transparent" />
          </div>
          <div
            className="pointer-events-none absolute -left-[12%] top-[71%] hidden h-px w-[124%] overflow-hidden md:block"
            style={{ transform: "translateZ(36px) rotate(6deg)", ["--p-d" as string]: "3s" }}
            aria-hidden
          >
            <div className="hero3d-trail h-full w-1/3 bg-gradient-to-r from-transparent via-crimson-text to-transparent" />
          </div>

          {/* web threads IN FRONT of the image — cross the border, react to cursor proximity */}
          <svg
            viewBox="-30 -30 160 185"
            className="pointer-events-none absolute -inset-[24%] h-[148%] w-[148%] overflow-visible"
            style={{ transform: "translateZ(30px)" }}
            aria-hidden
          >
            {frontThreads.map((d, i) => (
              <motion.path
                key={i}
                d={d}
                fill="none"
                strokeWidth={interactive ? 0.8 : 0.7}
                strokeLinecap="round"
                style={interactive ? { stroke: tensionStroke, strokeOpacity: tensionOpacity } : undefined}
                stroke={interactive ? undefined : "#EDEAE3"}
                strokeOpacity={interactive ? undefined : 0.3}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, delay: 0.5 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </svg>

          {/* glowing red particles */}
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className={`hero3d-particle pointer-events-none absolute rounded-full bg-crimson-text shadow-[0_0_8px_2px_rgba(238,108,92,0.7)] ${
                i > 4 ? "hidden md:block" : ""
              }`}
              style={particleStyle(p)}
              aria-hidden
            />
          ))}
          {/* blurred foreground bokeh */}
          {BOKEH.map((p, i) => (
            <span
              key={`b${i}`}
              className="hero3d-particle pointer-events-none absolute hidden rounded-full bg-crimson-bright/60 blur-[6px] md:block"
              style={particleStyle(p)}
              aria-hidden
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
