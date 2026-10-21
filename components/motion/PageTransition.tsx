"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { EASE_IN_OUT } from "@/lib/motion";

// Route transition: a crimson panel (with a faint web pattern) wipes up over
// the page (500ms), the route changes underneath it, then it wipes away
// (500ms). Internal link clicks are intercepted at the document and handed to
// the Next router once the panel has covered the page. Skipped for reduced
// motion, modified clicks, new-tab links, hash-only links and same-page links.
// The new page's own rise-in lives in app/template.tsx.
const WEB = [
  "M0 500 L1000 500", "M500 0 L500 1000", "M0 0 L1000 1000", "M1000 0 L0 1000",
  "M0 250 L1000 750", "M0 750 L1000 250", "M250 0 L750 1000", "M750 0 L250 1000",
];

export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const y = useMotionValue(100); // percent: 100 = below the screen, 0 = covering, -100 = above
  const translateY = useTransform(y, (v) => `${v}%`);
  const busy = useRef(false);
  const waiting = useRef(false);
  const lastPath = useRef(pathname);

  const reveal = () => {
    waiting.current = false;
    animate(y, -100, { duration: 0.5, ease: EASE_IN_OUT }).then(() => {
      y.set(100);
      busy.current = false;
    });
  };

  // the route actually changed: show the new page by wiping the panel away
  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    if (!waiting.current) return;
    window.scrollTo(0, 0);
    const id = window.setTimeout(reveal, 80);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || busy.current) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      e.preventDefault();
      e.stopPropagation();
      busy.current = true;
      y.set(100);
      animate(y, 0, { duration: 0.5, ease: EASE_IN_OUT }).then(() => {
        waiting.current = true;
        (window as unknown as { __pvNav?: boolean }).__pvNav = true; // lets the next page animate in
        router.push(url.pathname + url.search + url.hash);
        // never leave the panel up if the navigation stalls
        window.setTimeout(() => {
          if (waiting.current) reveal();
        }, 4000);
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, y]);

  return (
    <motion.div
      aria-hidden
      style={{ y: translateY }}
      className="pointer-events-none fixed inset-0 z-[80] overflow-hidden bg-[#7d2a21]"
    >
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <g fill="none" stroke="#F2EFE8" strokeOpacity="0.14" strokeWidth="1.2" strokeLinecap="round">
          {WEB.map((d) => (
            <path key={d} d={d} />
          ))}
          {[120, 230, 340, 450].map((r) => (
            <circle key={r} cx="500" cy="500" r={r} />
          ))}
        </g>
      </svg>
    </motion.div>
  );
}
