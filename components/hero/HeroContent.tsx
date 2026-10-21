"use client";

import { motion, MotionValue, useTransform } from "framer-motion";
import Magnetic from "@/components/motion/Magnetic";
import SweepFill from "@/components/motion/SweepFill";
import LineFade from "@/components/motion/LineFade";
import Marquee from "@/components/motion/Marquee";

const HEADLINE_LINES = ["I BUILD", "DIGITAL", "EXPERIENCES", "THAT FEEL", "ALIVE."];

function ParallaxLayer({
  parallaxX,
  parallaxY,
  strength,
  children,
  className,
}: {
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
  strength: number;
  children: React.ReactNode;
  className?: string;
}) {
  const x = useTransform(parallaxX, (v) => v * strength);
  const y = useTransform(parallaxY, (v) => v * strength * 0.6);
  return (
    <motion.div style={{ x, y }} className={className}>
      {children}
    </motion.div>
  );
}

export default function HeroContent({
  scrollYProgress,
  parallaxX,
  parallaxY,
}: {
  scrollYProgress: MotionValue<number>;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
}) {
  // positive: the headline lags behind the page as it scrolls away
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 48]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 0.97]);

  return (
    <motion.div
      style={{ y: contentY, opacity: contentOpacity, scale: contentScale }}
      className="relative z-10 flex max-w-xl flex-col gap-5"
    >
      <ParallaxLayer parallaxX={parallaxX} parallaxY={parallaxY} strength={2.5}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          data-hero-avoid=""
          className="flex flex-col gap-1.5"
        >
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-crimson-bright" />
            <p className="font-mono text-label tracking-[0.14em] text-paper-muted">INTRODUCTION</p>
          </div>
          <p className="font-display text-support font-medium tracking-[0.08em] text-paper">
            PAVAN VASITA <span className="text-crimson-text">· WEB DEVELOPER</span>
          </p>
        </motion.div>
      </ParallaxLayer>

      <ParallaxLayer parallaxX={parallaxX} parallaxY={parallaxY} strength={4}>
        <h1 data-hero-avoid="" className="font-display font-medium leading-[0.92] text-paper text-[clamp(2.1rem,4.4vw,4rem)]">
          {HEADLINE_LINES.map((line, i) => (
            <span key={line} className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%", filter: "blur(10px)" }}
                animate={{ y: "0%", filter: "blur(0px)" }}
                transition={{ duration: 0.85, delay: 0.95 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                {i === HEADLINE_LINES.length - 1 ? (
                  <span className="relative inline-block">
                    {line}
                    {/* one crimson glow pulse once the word has landed */}
                    <motion.span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 text-crimson-bright blur-[8px]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.85, 0] }}
                      transition={{ duration: 1.6, delay: 0.95 + i * 0.08 + 0.85, ease: "easeInOut" }}
                    >
                      {line}
                    </motion.span>
                  </span>
                ) : (
                  line
                )}
              </motion.span>
            </span>
          ))}
        </h1>
      </ParallaxLayer>

      <ParallaxLayer parallaxX={parallaxX} parallaxY={parallaxY} strength={6}>
        <div data-hero-avoid="">
          <LineFade
            delay={1.5}
            text="I’m Pavan Vasita, a Web Developer specializing in PHP, MySQL, React, WordPress, and modern web technologies. I build responsive websites, clean interfaces, and practical digital solutions that bring ideas to life."
            className="max-w-xl text-pretty font-body text-body text-paper-body"
          />
        </div>
      </ParallaxLayer>

      <ParallaxLayer parallaxX={parallaxX} parallaxY={parallaxY} strength={8}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.65 }}
          data-hero-avoid=""
          className="flex flex-wrap items-center gap-4"
        >
          <Magnetic>
            <a
              href="/projects"
              className="relative block overflow-hidden rounded-none border border-crimson-bright/50 bg-crimson px-7 py-3.5 font-body text-support font-medium uppercase tracking-wide text-paper"
            >
              <SweepFill className="bg-[#7d2a21]" />
              <span className="relative">View my work</span>
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="/contact"
              className="relative block overflow-hidden rounded-none border border-paper/40 bg-paper/[0.04] px-7 py-3.5 font-body text-support font-medium uppercase tracking-wide text-paper transition-colors hover:border-crimson-bright/70"
            >
              <SweepFill className="bg-crimson-bright" />
              <span className="relative">Let&apos;s talk</span>
            </a>
          </Magnetic>
        </motion.div>
      </ParallaxLayer>

      <ParallaxLayer parallaxX={parallaxX} parallaxY={parallaxY} strength={10}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.85 }}
          data-hero-avoid=""
          className="flex flex-col gap-1.5 font-mono text-label tracking-[0.1em] text-paper-dim"
        >
          <Marquee
            ariaLabel="Core technologies"
            items={["NEXT.JS", "TYPESCRIPT", "REACT", "WORDPRESS", "PHP", "MYSQL", "SQL"]}
            speed={34}
            className="max-w-[26rem]"
          />
          <p className="flex items-center gap-2.5">
            <span aria-hidden className="relative flex h-2 w-2">
              <span className="avail-ping absolute inline-flex h-full w-full rounded-full bg-crimson-text opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-crimson-text" />
            </span>
            UDAIPUR, RAJASTHAN, INDIA
          </p>
        </motion.div>
      </ParallaxLayer>
    </motion.div>
  );
}
