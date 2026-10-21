"use client";

import { RefObject, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { NavItem } from "./HeaderNavItem";
import MobileMenuNode from "./MobileMenuNode";
import SiteLink from "@/components/ui/SiteLink";
import { useSiteLinks } from "@/hooks/useSiteLinks";

// A few faint, static curved strands purely for atmosphere — no live cursor
// physics on a touch surface, so this stays intentionally simple and cheap.
const STATIC_STRANDS = [
  "M 20 60 Q 160 20, 320 90",
  "M 40 260 Q 200 200, 340 300",
  "M 10 420 Q 180 380, 300 460",
];

export default function MobileMenu({
  open,
  onClose,
  items,
  activeId,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  activeId: string;
  triggerRef: RefObject<HTMLButtonElement>;
}) {
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const { section } = useSiteLinks();
  // tracks whether the menu has actually been opened at least once, so the
  // "return focus to the trigger" branch doesn't fire on initial mount
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      document.body.classList.add("menu-open");
      firstLinkRef.current?.focus();
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
    document.body.classList.remove("menu-open");
    if (hasOpenedRef.current) triggerRef.current?.focus();
  }, [open, onClose, triggerRef]);

  // safety cleanup if the component unmounts while open
  useEffect(() => () => document.body.classList.remove("menu-open"), []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-40 flex flex-col bg-ink/[0.98] lg:hidden"
        >
          <svg
            viewBox="0 0 360 640"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
            aria-hidden
          >
            {STATIC_STRANDS.map((d, i) => (
              <motion.path
                key={i}
                d={d}
                fill="none"
                stroke="#EDEAE3"
                strokeWidth={0.7}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </svg>

          <div className="flex items-center justify-end px-6 pt-6">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex items-center gap-2 rounded-sm p-2 font-mono text-label tracking-[0.1em] text-paper-body focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson-bright"
            >
              CLOSE
              <svg width="16" height="16" viewBox="-8 -8 16 16">
                <line x1={-5} y1={-5} x2={5} y2={5} stroke="#EDEAE3" strokeWidth={1} strokeLinecap="round" />
                <line x1={5} y1={-5} x2={-5} y2={5} stroke="#EDEAE3" strokeWidth={1} strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <nav aria-label="Mobile primary" className="relative flex flex-1 flex-col justify-center gap-1 px-8">
            {items.map((item, i) => (
              <div key={item.id} className="overflow-hidden">
              <motion.div
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              >
                <SiteLink
                  ref={i === 0 ? firstLinkRef : undefined}
                  href={item.href}
                  onClick={onClose}
                  aria-current={activeId === item.id ? "page" : undefined}
                  className="flex items-center gap-4 py-3 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson-bright"
                >
                  <MobileMenuNode active={activeId === item.id} />
                  <span className="font-mono text-label text-crimson-text">{item.index}</span>
                  <span className="font-display text-[1.75rem] font-medium text-paper">{item.label}</span>
                </SiteLink>
              </motion.div>
              </div>
            ))}
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 + items.length * 0.07 + 0.08 }}
            className="px-8 pb-10"
          >
            <SiteLink
              href={section("contact")}
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 border border-paper/40 bg-paper/[0.06] px-6 py-4 font-mono text-support font-medium tracking-[0.08em] text-paper focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson-bright"
            >
              LET&rsquo;S TALK
              <ArrowRight size={15} />
            </SiteLink>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
