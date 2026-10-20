"use client";

import { motion } from "framer-motion";

// Small irregular web-junction glyph used beside each item in the mobile
// menu — consistent with the marker language used across the site.
export default function MobileMenuNode({ active }: { active: boolean }) {
  const arms = [
    { x2: -7, y2: -3 },
    { x2: 7, y2: -4 },
    { x2: 6, y2: 5 },
    { x2: -5, y2: 6 },
  ];
  return (
    <svg width="18" height="18" viewBox="-9 -9 18 18" className="overflow-visible">
      {arms.map((a, i) => (
        <motion.line
          key={i}
          x1={0}
          y1={0}
          x2={a.x2}
          y2={a.y2}
          strokeLinecap="round"
          animate={{ stroke: active ? "#D4483B" : "#EDEAE3", strokeWidth: active ? 1.1 : 0.7 }}
          transition={{ duration: 0.25 }}
          opacity={active ? 0.95 : 0.5}
        />
      ))}
      <motion.circle
        r={1.6}
        animate={{ fill: active ? "#D4483B" : "#EDEAE3" }}
        transition={{ duration: 0.25 }}
        fillOpacity={active ? 1 : 0.65}
      />
    </svg>
  );
}
