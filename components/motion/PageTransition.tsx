"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import NameSpiders from "./NameSpiders";

// Route transition: a dark curtain with a crimson leading edge wipes up over
// the page, shows PAVAN VASITA with spiders, then wipes away once the new
// route is on screen. Internal link clicks are intercepted at the document.
// The curtain and the name animation are CSS transitions/animations, so they
// stay smooth while the browser renders the next page. The navigation starts
// as soon as the curtain is down; the curtain holds for HOLD_MS so the name
// can play, and never waits longer than MAX_WAIT_MS for a slow route.
// Skipped for reduced motion, modified clicks, new-tab links, hash-only links
// and same-page links. The new page's own rise-in lives in app/template.tsx.
const COVER_MS = 600;
const REVEAL_MS = 650;
const HOLD_MS = 1000; // name + spiders time, counted from the start of the cover
const MAX_WAIT_MS = 2200; // from the start of the cover; covers slow dev compiles

const WEB = [
  "M0 500 L1000 500", "M500 0 L500 1000", "M0 0 L1000 1000", "M1000 0 L0 1000",
  "M0 250 L1000 750", "M0 750 L1000 250", "M250 0 L750 1000", "M750 0 L250 1000",
];

type Phase = "idle" | "cover" | "reveal";

export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const [run, setRun] = useState(0); // remounts the name animation for each transition

  const s = useRef({ active: false, arrived: false, held: false, timers: [] as number[] });
  const startPath = useRef(pathname);
  const pathRef = useRef(pathname);

  const clearTimers = () => {
    s.current.timers.forEach((t) => window.clearTimeout(t));
    s.current.timers = [];
  };
  const later = (fn: () => void, ms: number) => {
    s.current.timers.push(window.setTimeout(fn, ms));
  };

  const reveal = () => {
    clearTimers();
    setPhase("reveal");
    // park the curtain below the screen again; this also frees the next click
    later(() => {
      setPhase("idle");
      s.current.active = false;
      s.current.arrived = false;
      s.current.held = false;
    }, REVEAL_MS + 120);
  };
  const maybeReveal = () => {
    if (s.current.active && s.current.arrived && s.current.held) reveal();
  };

  // the new route is on screen
  useEffect(() => {
    pathRef.current = pathname;
    if (!s.current.active || pathname === startPath.current) return;
    window.scrollTo(0, 0);
    s.current.arrived = true;
    maybeReveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || s.current.active) return;
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
      clearTimers();
      s.current.active = true;
      s.current.arrived = false;
      s.current.held = false;
      startPath.current = pathRef.current;
      (window as unknown as { __pvNav?: boolean }).__pvNav = true; // lets the next page animate in

      setRun((n) => n + 1);
      setPhase("cover");
      // start loading the next page once the curtain is (nearly) down
      later(() => router.push(url.pathname + url.search + url.hash), COVER_MS - 80);
      later(() => {
        s.current.held = true;
        maybeReveal();
      }, HOLD_MS);
      later(() => {
        s.current.arrived = true; // never keep the curtain up for a stalled route
        s.current.held = true;
        maybeReveal();
      }, MAX_WAIT_MS);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const transform = phase === "cover" ? "translateY(0%)" : phase === "reveal" ? "translateY(-100%)" : "translateY(100%)";
  const transition =
    phase === "cover"
      ? `transform ${COVER_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`
      : phase === "reveal"
        ? `transform ${REVEAL_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`
        : "none";

  return (
    <div
      aria-hidden
      style={{ transform, transition }}
      className="pointer-events-none fixed inset-0 z-[80] overflow-hidden bg-gradient-to-b from-[#1b0c0b] to-ink"
    >
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <g fill="none" stroke="#D4483B" strokeOpacity="0.16" strokeWidth="1" strokeLinecap="round">
          {WEB.map((d) => (
            <path key={d} d={d} />
          ))}
          {[120, 230, 340, 450].map((r) => (
            <circle key={r} cx="500" cy="500" r={r} />
          ))}
        </g>
      </svg>
      {/* the name, with spiders; replays on every transition */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <NameSpiders key={run} />
      </div>
      {/* crimson leading edge */}
      <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-crimson-bright to-transparent shadow-[0_0_24px_4px_rgba(212,72,59,0.55)]" />
    </div>
  );
}
