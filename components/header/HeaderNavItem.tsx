"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SiteLink from "@/components/ui/SiteLink";

export interface NavItem {
  id: string;
  label: string;
  index: string;
  /** in-page hash on the home page, a real route elsewhere */
  href: string;
}

// Tiny asymmetric active-page indicator — the same radiating-line web-node
// glyph used site-wide, so it reads as unmistakably not a circle even at
// small size. The "gentle pulse" is a breathing opacity, not a ring.
function ActiveNode() {
  const arms = [
    { x2: -5, y2: -3 },
    { x2: 5, y2: -4 },
    { x2: 4, y2: 4 },
    { x2: -4, y2: 5 },
  ];
  return (
    <motion.svg
      width="14"
      height="14"
      viewBox="-7 -7 14 14"
      className="overflow-visible"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: [0.75, 1, 0.75] }}
      transition={{
        scale: { duration: 0.3 },
        opacity: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {arms.map((a, i) => (
        <line key={i} x1={0} y1={0} x2={a.x2} y2={a.y2} stroke="#D4483B" strokeWidth={1} strokeLinecap="round" />
      ))}
      <circle r={1.2} fill="#D4483B" />
    </motion.svg>
  );
}

export default function HeaderNavItem({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <SiteLink
      href={item.href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-current={active ? "page" : undefined}
      className="group relative flex items-center gap-1.5 rounded-sm px-0.5 py-2 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson-bright"
    >
      {active && <ActiveNode />}

      <span className="relative flex items-center gap-1.5 overflow-hidden pr-1">
        <AnimatePresence initial={false}>
          {hovered && (
            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="whitespace-nowrap font-mono text-[0.75rem] text-crimson-text"
            >
              {item.index} /
            </motion.span>
          )}
        </AnimatePresence>

        <motion.span
          animate={{ x: hovered ? 3 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className={`font-mono text-nav transition-colors ${
            active || hovered ? "text-paper" : "text-paper-body"
          }`}
        >
          {item.label}
        </motion.span>
      </span>

      {/* thin connecting strand that briefly forms on hover */}
      <svg width="28" height="8" viewBox="0 0 28 8" className="absolute -bottom-0.5 left-0 overflow-visible">
        <motion.path
          d="M0 1 Q 14 7, 28 2"
          fill="none"
          stroke="#D4483B"
          strokeWidth={0.8}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: hovered ? 1 : 0, opacity: hovered ? 0.7 : 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </SiteLink>
  );
}
