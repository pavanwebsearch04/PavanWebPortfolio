"use client";

import { motion } from "framer-motion";
import { PrimaryHeading } from "@/components/ui/PageContext";
import ScrubText from "@/components/motion/ScrubText";

export default function AboutIntro() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-crimson-bright" />
        <motion.p
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-mono text-label tracking-[0.14em] text-paper-muted"
        >
          05 / ABOUT
        </motion.p>
      </div>

      <PrimaryHeading className="font-display text-section font-medium text-paper">
        {["THE PERSON", "BEHIND THE WEB."].map((line, i) => (
          <motion.span
            key={line}
            className="block"
            initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.85, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            {line}
          </motion.span>
        ))}
      </PrimaryHeading>

      <div className="flex max-w-xl flex-col gap-4">
        {[
          "I\u2019m Pavan Vasita, a Web Developer from Udaipur, Rajasthan, with a focus on WordPress development, responsive interfaces, and practical digital experiences.",
          "I enjoy turning ideas into websites that are clear, functional, and thoughtfully built. My approach combines attention to detail, problem-solving, and a willingness to keep learning.",
        ].map((text, i) => (
          <ScrubText key={i} text={text} className="text-body text-paper-body" />
        ))}
      </div>
    </div>
  );
}
