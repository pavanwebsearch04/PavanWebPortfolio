"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import HeaderNavItem, { NavItem } from "./HeaderNavItem";

export default function HeaderNavigation({
  items,
  activeId,
}: {
  items: NavItem[];
  activeId: string;
}) {
  // the shared dot follows the hovered link and returns to the current page
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dotId = hoveredId ?? activeId;

  return (
    <nav aria-label="Primary" className="hidden items-center gap-5 pl-4 lg:flex xl:gap-8">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeaderNavItem
            item={item}
            active={activeId === item.id}
            showDot={dotId === item.id}
            onHover={(h) => setHoveredId(h ? item.id : null)}
          />
        </motion.div>
      ))}
    </nav>
  );
}
