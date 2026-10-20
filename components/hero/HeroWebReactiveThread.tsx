"use client";

import { motion, MotionValue, useTransform } from "framer-motion";
import { WebNode, curvedThread } from "@/lib/webData";
import { useNodeTension } from "@/hooks/useNodeTension";

export default function HeroWebReactiveThread({
  node,
  anchor,
  bow,
  pointerX,
  pointerY,
  interactive,
  delay,
  active = false,
}: {
  node: WebNode;
  anchor: { x: number; y: number };
  bow: number;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  interactive: boolean;
  delay: number;
  active?: boolean;
}) {
  const { springDx, springDy } = useNodeTension(node, pointerX, pointerY, interactive);

  const d = useTransform([springDx, springDy], (latest) => {
    const [dx, dy] = latest as number[];
    return curvedThread(anchor.x, anchor.y, node.x + dx, node.y + dy, bow).d;
  });

  return (
    <motion.path
      d={d}
      fill="none"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{
        pathLength: 1,
        opacity: active ? 0.7 : 0.3,
        stroke: active ? "#D4483B" : "#EDEAE3",
        strokeWidth: active ? 1.3 : 0.9,
      }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}
