"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import SiteLink from "@/components/ui/SiteLink";
import Magnetic from "@/components/motion/Magnetic";
import SweepFill from "@/components/motion/SweepFill";
import { useSiteLinks } from "@/hooks/useSiteLinks";

export default function HeaderCTA() {
  const [active, setActive] = useState(false);
  const { section } = useSiteLinks();

  return (
    <Magnetic className="hidden xl:block">
    <SiteLink
      href={section("contact")}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      className="group relative inline-flex items-center gap-2 overflow-visible border border-paper/40 bg-paper/[0.06] px-4 py-2 font-mono text-nav font-medium text-paper transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson-bright whitespace-nowrap"
      style={{ borderColor: active ? "rgba(238,108,92,0.7)" : undefined }}
    >
      <SweepFill />
      {/* asymmetric web-corner detail */}
      <svg width="16" height="16" viewBox="-1 -1 16 16" className="pointer-events-none absolute -right-[1px] -top-[1px] overflow-visible">
        <motion.path
          d="M15 0 L15 7 Q 8 2, 2 1"
          fill="none"
          stroke="#D4483B"
          strokeWidth={0.8}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: active ? 1 : 0, opacity: active ? 0.8 : 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.circle
          cx={15}
          cy={0}
          r={1.3}
          fill="#D4483B"
          animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        />
      </svg>

      <span className="relative">LET&rsquo;S TALK</span>
      <motion.span className="relative" animate={{ x: active ? 4 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
        <ArrowRight size={13} className={active ? "text-crimson-text" : ""} />
      </motion.span>
    </SiteLink>
    </Magnetic>
  );
}
