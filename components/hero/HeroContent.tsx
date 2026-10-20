"use client";

import { motion, MotionValue, useTransform } from "framer-motion";

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
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -36]);
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
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
      </ParallaxLayer>

      <ParallaxLayer parallaxX={parallaxX} parallaxY={parallaxY} strength={6}>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.5 }}
          data-hero-avoid=""
          className="max-w-md text-balance font-body text-body text-paper-body"
        >
          I&rsquo;m Pavan Vasita, a Web Developer specializing in WordPress and modern web
          technologies. I build responsive websites, thoughtful interfaces, and practical
          digital solutions that bring ideas to life.
        </motion.p>
      </ParallaxLayer>

      <ParallaxLayer parallaxX={parallaxX} parallaxY={parallaxY} strength={8}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.65 }}
          data-hero-avoid=""
          className="flex flex-wrap items-center gap-4"
        >
          <a
            href="/projects"
            className="rounded-none border border-crimson-bright/50 bg-crimson px-7 py-3.5 font-body text-support font-medium uppercase tracking-wide text-paper transition-colors hover:bg-[#b8402f]"
          >
            View my work
          </a>
          <a
            href="/contact"
            className="rounded-none border border-paper/40 bg-paper/[0.04] px-7 py-3.5 font-body text-support font-medium uppercase tracking-wide text-paper transition-colors hover:border-paper/70 hover:bg-paper/[0.1]"
          >
            Let&apos;s talk
          </a>
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
          <ul className="flex flex-wrap gap-x-2 gap-y-1" aria-label="Core technologies">
            {["NEXT.JS", "TYPESCRIPT", "REACT", "WORDPRESS"].map((t, i) => (
              <li key={t} className="whitespace-nowrap">
                {i > 0 && <span aria-hidden="true" className="mr-2">·</span>}
                {t}
              </li>
            ))}
          </ul>
          <p>UDAIPUR, RAJASTHAN, INDIA</p>
        </motion.div>
      </ParallaxLayer>
    </motion.div>
  );
}
