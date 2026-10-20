"use client";

import { motion, MotionValue, useTransform } from "framer-motion";
import { WebNode } from "@/lib/webData";
import { useNodeTension } from "@/hooks/useNodeTension";

export default function HeroWebNode({
  node,
  pointerX,
  pointerY,
  scrollYProgress,
  interactive,
}: {
  node: WebNode;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  scrollYProgress: MotionValue<number>;
  interactive: boolean;
}) {
  const { springDx, springDy, dist } = useNodeTension(node, pointerX, pointerY, interactive);

  const scrollDx = useTransform(scrollYProgress, [0, 1], [0, Math.cos(node.angle) * 60]);
  const scrollDy = useTransform(scrollYProgress, [0, 1], [0, Math.sin(node.angle) * 60]);
  const scrollOpacity = useTransform(
    scrollYProgress,
    [0, 1],
    [1, node.depth === "foreground" ? 0.5 : 0.05]
  );

  const x = useTransform([springDx, scrollDx], (latest) => (latest as number[])[0] + (latest as number[])[1]);
  const y = useTransform([springDy, scrollDy], (latest) => (latest as number[])[0] + (latest as number[])[1]);

  const glowOpacity = useTransform(dist, [0, 120], [0.9, 0]);

  return (
    <motion.g
      style={{ x, y, opacity: scrollOpacity }}
      initial={{ scale: 0.2 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.6, delay: node.delay, ease: "easeOut" }}
    >
      <circle cx={node.x} cy={node.y} r={node.size} fill="#EDEAE3" fillOpacity={0.55} />
      {interactive && (
        <motion.circle cx={node.x} cy={node.y} r={node.size * 2.6} fill="#D4483B" style={{ opacity: glowOpacity }} />
      )}
    </motion.g>
  );
}
