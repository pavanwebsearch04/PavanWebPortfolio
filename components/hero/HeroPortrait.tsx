"use client";

import { useState } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";
import Image from "next/image";
import { heroImages } from "@/data/images";
import { useBorderThreads } from "@/hooks/useBorderThreads";

const FALLBACK_SRC = "/portrait-placeholder.svg";

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

  const behindThreads = useBorderThreads(71, 4);
  const frontThreads = useBorderThreads(203, 5);

  const tensionOpacity = useTransform(nearPortrait, [0, 1], [0.28, 0.85]);
  const tensionStroke = useTransform(nearPortrait, [0, 1], ["#EDEAE3", "#D4483B"]);

  return (
    <motion.div
      initial={{ clipPath: "inset(38% 30% 38% 30% round 4px)", filter: "blur(14px)", scale: 1.08 }}
      animate={{ clipPath: "inset(0% 0% 0% 0% round 4px)", filter: "blur(0px)", scale: 1 }}
      transition={{ duration: 1.1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
      style={{ y: scrollY, scale: scrollScale, opacity: scrollOpacity, x: px, translateY: py }}
      data-hero-avoid="22"
      className="relative mx-auto aspect-[4/5] w-[62%] max-w-[360px] md:w-[70%]"
    >
      {/* soft crimson bloom behind the frame */}
      <div className="absolute -inset-6 -z-10 rounded-[2px] bg-crimson/25 blur-3xl opacity-40" />

      {/* web threads BEHIND the image — wraps into the frame from outside */}
      <svg
        viewBox="-30 -30 160 185"
        className="pointer-events-none absolute -inset-[24%] overflow-visible"
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

      {/* thin offset frame lines — editorial, not a card */}
      <div className="pointer-events-none absolute -inset-3 border border-paper/15" />
      <div className="pointer-events-none absolute -inset-3 translate-x-1.5 translate-y-1.5 border border-crimson/25" />

      <div className="relative h-full w-full overflow-hidden">
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
        {/* grain */}
        <div className="film-grain" />
        {/* base darken for contrast with content */}
        <div className="absolute inset-0 bg-ink/10 mix-blend-multiply" />
      </div>

      {/* web threads IN FRONT of the image — cross the border, react to cursor proximity */}
      <svg
        viewBox="-30 -30 160 185"
        className="pointer-events-none absolute -inset-[24%] overflow-visible"
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
    </motion.div>
  );
}
