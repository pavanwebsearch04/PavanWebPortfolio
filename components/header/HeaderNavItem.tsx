"use client";

import { motion } from "framer-motion";
import SiteLink from "@/components/ui/SiteLink";
import { EASE_OUT_CSS } from "@/lib/motion";

export interface NavItem {
  id: string;
  label: string;
  index: string;
  /** in-page hash on the home page, a real route elsewhere */
  href: string;
}

// Tiny asymmetric web-node marker (radiating lines, never a plain circle).
// One instance is shared by the whole nav through `layoutId`, so it glides to
// the hovered link and settles back on the current page's link.
export function NavDot() {
  const arms = [
    { x2: -5, y2: -3 },
    { x2: 5, y2: -4 },
    { x2: 4, y2: 4 },
    { x2: -4, y2: 5 },
  ];
  return (
    <motion.svg
      layoutId="nav-dot"
      aria-hidden
      width="14"
      height="14"
      viewBox="-7 -7 14 14"
      className="pointer-events-none absolute -left-4 top-1/2 -mt-[7px] overflow-visible"
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    >
      {arms.map((a, i) => (
        <line key={i} x1={0} y1={0} x2={a.x2} y2={a.y2} stroke="#D4483B" strokeWidth={1} strokeLinecap="round" />
      ))}
      <circle r={1.4} fill="#D4483B" />
    </motion.svg>
  );
}

export default function HeaderNavItem({
  item,
  active,
  showDot,
  onHover,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  showDot?: boolean;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}) {
  const roll = `transform 400ms ${EASE_OUT_CSS}`;

  return (
    <SiteLink
      href={item.href}
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onFocus={() => onHover?.(true)}
      onBlur={() => onHover?.(false)}
      aria-current={active ? "page" : undefined}
      className="group relative flex items-center rounded-sm px-0.5 py-2 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson-bright"
    >
      {showDot && <NavDot />}

      {/* text roll: the label slides up, a duplicate slides in from below */}
      <span className="relative block overflow-hidden">
        <span
          className={`block font-mono text-nav group-hover:-translate-y-full group-focus-visible:-translate-y-full ${
            active ? "text-paper" : "text-paper-body"
          }`}
          style={{ transition: roll }}
        >
          {item.label}
        </span>
        <span
          aria-hidden
          className="absolute inset-x-0 top-full block font-mono text-nav text-crimson-text group-hover:-translate-y-full group-focus-visible:-translate-y-full"
          style={{ transition: roll }}
        >
          {item.label}
        </span>
      </span>

      {/* underline draws left to right on enter and exits to the right on leave */}
      <span
        aria-hidden
        className="absolute inset-x-0.5 bottom-0.5 h-px origin-right scale-x-0 bg-crimson-bright group-hover:origin-left group-hover:scale-x-100 group-focus-visible:origin-left group-focus-visible:scale-x-100"
        style={{ transition: roll }}
      />
    </SiteLink>
  );
}
