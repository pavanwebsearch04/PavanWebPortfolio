"use client";

import { motion, MotionValue, useTransform } from "framer-motion";
import HeroPortrait from "./HeroPortrait";
import { WEB_CANVAS } from "@/lib/webData";

export default function HeroVisual({
  pointerX,
  pointerY,
  scrollYProgress,
  parallaxX,
  parallaxY,
  nearPortrait,
  interactive,
}: {
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  scrollYProgress: MotionValue<number>;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
  nearPortrait: MotionValue<number>;
  interactive: boolean;
}) {
  // this column occupies the right 55% of the shared web canvas
  const lightLeft = useTransform(pointerX, [WEB_CANVAS.width * 0.45, WEB_CANVAS.width], [0, 100]);
  const lightTop = useTransform(pointerY, [0, WEB_CANVAS.height], [0, 100]);

  const bgX = useTransform(parallaxX, (v) => v * 5);
  const bgY = useTransform(parallaxY, (v) => v * 4);

  return (
    <div className="relative h-[46vh] w-full overflow-hidden md:h-full">
      {/* base + atmospheric layers */}
      <motion.div style={{ x: bgX, y: bgY }} className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(167,58,47,0.12),transparent_55%)]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(237,234,227,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(237,234,227,0.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </motion.div>

      {/* pointer light */}
      {interactive && (
        <motion.div
          className="pointer-events-none absolute h-[420px] w-[420px] rounded-full opacity-[0.08]"
          style={{
            left: lightLeft,
            top: lightTop,
            translateX: "-50%",
            translateY: "-50%",
            background: "radial-gradient(circle, rgba(237,234,227,0.5) 0%, transparent 70%)",
          }}
        />
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <HeroPortrait
          scrollYProgress={scrollYProgress}
          parallaxX={parallaxX}
          parallaxY={parallaxY}
          nearPortrait={nearPortrait}
          interactive={interactive}
        />
      </div>

      <div className="film-grain opacity-[0.03]" />
    </div>
  );
}
