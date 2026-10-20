"use client";

import { motion, MotionValue } from "framer-motion";
import { mulberry32, rangeFrom } from "@/lib/seededRandom";
import { useNodeTension } from "@/hooks/useNodeTension";
import { WebNode } from "@/lib/webData";

function hashSeed(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return h;
}

// Small irregular, asymmetric web-junction glyph — same visual language as
// the node markers in Experience, Skills, and Services. Never a circle.
function NodeGlyph({ id, active }: { id: string; active: boolean }) {
  const rng = mulberry32(hashSeed(id));
  const count = 5 + Math.floor(rangeFrom(rng, 0, 2));
  const arms = Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2 + rangeFrom(rng, -0.35, 0.35);
    const len = rangeFrom(rng, 5, 9);
    return { x2: +(Math.cos(angle) * len).toFixed(2), y2: +(Math.sin(angle) * len).toFixed(2) };
  });

  return (
    <svg width="22" height="22" viewBox="-11 -11 22 22" className="overflow-visible">
      {arms.map((a, i) => (
        <motion.line
          key={i}
          x1={0}
          y1={0}
          x2={a.x2}
          y2={a.y2}
          strokeLinecap="round"
          animate={{ stroke: active ? "#D4483B" : "#EDEAE3", strokeWidth: active ? 1.1 : 0.75 }}
          transition={{ duration: 0.3 }}
          opacity={active ? 0.95 : 0.55}
        />
      ))}
      <motion.circle
        r={1.6}
        animate={{ fill: active ? "#D4483B" : "#EDEAE3" }}
        transition={{ duration: 0.3 }}
        fillOpacity={active ? 1 : 0.7}
      />
    </svg>
  );
}

export default function AboutNode({
  node,
  label,
  active,
  onActivate,
  pointerX,
  pointerY,
  interactive,
  delay,
}: {
  node: WebNode;
  label: string;
  active: boolean;
  onActivate: (id: string | null) => void;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  interactive: boolean;
  delay: number;
}) {
  const { springDx, springDy } = useNodeTension(node, pointerX, pointerY, interactive);

  return (
    <motion.button
      type="button"
      onMouseEnter={() => onActivate(node.id)}
      onMouseLeave={() => onActivate(null)}
      onFocus={() => onActivate(node.id)}
      onBlur={() => onActivate(null)}
      aria-label={`${label} — part of the personal web`}
      aria-pressed={active}
      style={{
        left: `${(node.x / 800) * 100}%`,
        top: `${(node.y / 800) * 100}%`,
        x: springDx,
        y: springDy,
      }}
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="absolute hidden min-[480px]:flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 rounded-sm focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson-bright"
    >
      <NodeGlyph id={node.id} active={active} />
      <motion.span
        animate={{ opacity: 1, color: active ? "#F2EFE8" : "#D9D6CF" }}
        transition={{ duration: 0.25 }}
        className="max-w-[7.5rem] text-center font-mono text-nav leading-tight"
      >
        {label}
      </motion.span>
    </motion.button>
  );
}
