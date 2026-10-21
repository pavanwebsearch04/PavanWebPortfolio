"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsCoarsePointer } from "@/hooks/useIsCoarsePointer";
import HeaderLogo from "./HeaderLogo";
import HeaderNavigation from "./HeaderNavigation";
import HeaderCTA from "./HeaderCTA";
import HeaderWeb, { HEADER_CANVAS } from "./HeaderWeb";
import MobileMenu from "./MobileMenu";
import InteractiveWeb from "@/components/web/InteractiveWeb";
import { NavItem } from "./HeaderNavItem";
import { useSiteLinks } from "@/hooks/useSiteLinks";

// Every item is a real page (see ROUTES in hooks/useSiteLinks).
const SECTION_NAV = [
  { id: "hero", label: "HOME", index: "01" },
  { id: "work", label: "WORK", index: "02" },
  { id: "experience", label: "EXPERIENCE", index: "03" },
  { id: "skills", label: "SKILLS", index: "04" },
  { id: "services", label: "SERVICES", index: "05" },
  { id: "about", label: "ABOUT", index: "06" },
];

// Three short irregular strands that straighten into a close (X) icon —
// never a generic three-equal-bars hamburger.
function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="-10 -10 20 20" className="overflow-visible">
      <motion.line
        stroke="#EDEAE3"
        strokeWidth={1}
        strokeLinecap="round"
        initial={{ x1: -7, y1: -6, x2: 6, y2: -7 }}
        animate={open ? { x1: -6, y1: -6, x2: 6, y2: 6 } : { x1: -7, y1: -6, x2: 6, y2: -7 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.line
        stroke="#EDEAE3"
        strokeWidth={1}
        strokeLinecap="round"
        initial={{ x1: -8, y1: 0, x2: 8, y2: 1 }}
        animate={open ? { opacity: 0 } : { opacity: 1, x1: -8, y1: 0, x2: 8, y2: 1 }}
        transition={{ duration: 0.25 }}
      />
      <motion.line
        stroke="#EDEAE3"
        strokeWidth={1}
        strokeLinecap="round"
        initial={{ x1: -6, y1: 6, x2: 5, y2: 5 }}
        animate={open ? { x1: -6, y1: 6, x2: 6, y2: -6 } : { x1: -6, y1: 6, x2: 5, y2: 5 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

export default function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const isCoarse = useIsCoarsePointer();
  const interactive = !reducedMotion && !isCoarse;

  const [mobileOpen, setMobileOpen] = useState(false);
  const { section, activeId } = useSiteLinks();

  const NAV_ITEMS: NavItem[] = [
    ...SECTION_NAV.map((i) => ({ ...i, href: section(i.id) })),
    { id: "lab", label: "LAB", index: "07", href: section("lab") },
    { id: "contact", label: "CONTACT", index: "08", href: section("contact") },
  ];

  const pointerXRaw = useMotionValue(-1000);
  const pointerYRaw = useMotionValue(-1000);
  const pointerX = useSpring(pointerXRaw, { stiffness: 500, damping: 50 });
  const pointerY = useSpring(pointerYRaw, { stiffness: 500, damping: 50 });

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!headerRef.current) return;
      const rect = headerRef.current.getBoundingClientRect();
      pointerXRaw.set(((e.clientX - rect.left) / rect.width) * HEADER_CANVAS.width);
      pointerYRaw.set(((e.clientY - rect.top) / rect.height) * HEADER_CANVAS.height);
    },
    [pointerXRaw, pointerYRaw]
  );
  const handlePointerLeave = useCallback(() => {
    pointerXRaw.set(-1000);
    pointerYRaw.set(-1000);
  }, [pointerXRaw, pointerYRaw]);

  // scroll-driven compact transition — a spacious transparent bar at the
  // top that quietly firms up as the page scrolls
  const { scrollY } = useScroll();

  // hides on scroll down, returns on scroll up (400ms). Stays put near the top,
  // while the mobile menu is open, for keyboard focus, and for reduced motion.
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  useMotionValueEvent(scrollY, "change", (y) => {
    const d = y - lastY.current;
    if (Math.abs(d) < 6) return;
    lastY.current = y;
    setHidden(d > 0 && y > 160 && !mobileOpen && !reducedMotion);
  });
  const paddingY = useTransform(scrollY, [0, 80], [22, 12]);
  const bgAlpha = useTransform(scrollY, [0, 80], [0, 0.82]);
  const borderAlpha = useTransform(scrollY, [0, 80], [0, 0.12]);
  const blurPx = useTransform(scrollY, [0, 80], [0, 10]);
  const backgroundColor = useMotionTemplate`rgba(10, 10, 12, ${bgAlpha})`;
  const borderColor = useMotionTemplate`rgba(237, 234, 227, ${borderAlpha})`;
  const backdropFilter = useMotionTemplate`blur(${blurPx}px)`;

  return (
    <>
      <motion.header
        ref={headerRef}
        onPointerMove={interactive ? handlePointerMove : undefined}
        onPointerLeave={interactive ? handlePointerLeave : undefined}
        style={{
          paddingTop: paddingY,
          paddingBottom: paddingY,
          backgroundColor,
          borderBottomColor: borderColor,
          backdropFilter,
          WebkitBackdropFilter: backdropFilter,
        }}
        onFocusCapture={() => setHidden(false)}
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: hidden ? "-110%" : 0, opacity: 1 }}
        transition={{ y: { duration: 0.4, ease: EASE_OUT }, opacity: { duration: 0.9, ease: EASE_OUT } }}
        className="fixed inset-x-0 top-0 z-50 border-b border-transparent"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <HeaderWeb pointerX={pointerX} pointerY={pointerY} interactive={interactive} />
        </div>
        {/* strands that form around nav links / CTA: above the blurred bar, below its text */}
        <InteractiveWeb scope="header" />

        <div className="relative mx-auto flex max-w-[1800px] items-center justify-between px-6 md:px-10 xl:px-20">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <HeaderLogo />
          </motion.div>

          <HeaderNavigation items={NAV_ITEMS} activeId={activeId} />

          <div className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <HeaderCTA />
            </motion.div>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="flex h-11 w-11 items-center justify-center rounded-sm focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson-bright lg:hidden"
            >
              <MenuIcon open={mobileOpen} />
            </button>
          </div>
        </div>
      </motion.header>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        items={NAV_ITEMS}
        activeId={activeId}
        triggerRef={menuButtonRef}
      />
    </>
  );
}
