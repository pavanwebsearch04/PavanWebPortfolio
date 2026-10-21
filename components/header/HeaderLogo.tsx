"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SiteLink from "@/components/ui/SiteLink";
import { useSiteLinks } from "@/hooks/useSiteLinks";

// Small irregular web-junction glyph, consistent with the marker language
// used throughout the rest of the site.
function NodeGlyph({ active }: { active: boolean }) {
  const arms = [
    { x2: -6, y2: -4 },
    { x2: 6, y2: -3 },
    { x2: 5, y2: 5 },
    { x2: -4, y2: 6 },
  ];
  return (
    <svg width="16" height="16" viewBox="-8 -8 16 16" className="overflow-visible">
      {arms.map((a, i) => (
        <motion.line
          key={i}
          x1={0}
          y1={0}
          x2={a.x2}
          y2={a.y2}
          strokeLinecap="round"
          animate={{ stroke: active ? "#D4483B" : "#EDEAE3", strokeWidth: active ? 1 : 0.7 }}
          transition={{ duration: 0.25 }}
          opacity={active ? 0.9 : 0.45}
        />
      ))}
      <motion.circle
        r={1.4}
        animate={{ fill: active ? "#D4483B" : "#EDEAE3" }}
        transition={{ duration: 0.25 }}
        fillOpacity={active ? 1 : 0.6}
      />
    </svg>
  );
}

export default function HeaderLogo() {
  const [active, setActive] = useState(false);
  const { section } = useSiteLinks();

  return (
    <SiteLink
      href={section("hero")}
      onClick={() => window.dispatchEvent(new Event("pv:logo-click"))}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      aria-label="Pavan Vasita — back to top"
      className="group flex min-h-[44px] shrink-0 items-center gap-2.5 whitespace-nowrap rounded-sm focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson-bright"
    >
      <NodeGlyph active={active} />
      <motion.span
        animate={{ letterSpacing: active ? "0.03em" : "0em" }}
        transition={{ duration: 0.3 }}
        className="font-display text-base font-medium tracking-normal text-paper md:text-lg"
      >
        PAVAN VASITA
      </motion.span>
    </SiteLink>
  );
}
