"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Infinite marquee. Speed follows scroll velocity, the direction follows the
// last scroll direction (down = forward, up = reverse), hovering slows it to
// ~20%, and it stops while off-screen. Transform only. With reduced motion it
// renders as a static wrapping list.
export default function Marquee({
  items,
  speed = 38,
  reverse = false,
  className,
  itemClassName = "",
  ariaLabel,
}: {
  items: string[];
  /** base speed in px per second */
  speed?: number;
  /** start in the opposite direction (e.g. the About marquee) */
  reverse?: boolean;
  className?: string;
  itemClassName?: string;
  ariaLabel?: string;
}) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    const track = trackRef.current;
    const set = setRef.current;
    if (!root || !track || !set) return;

    let visible = true;
    let hover = false;
    let x = 0;
    let dir = reverse ? 1 : -1; // -1 moves left
    let boost = 0; // smoothed scroll-velocity contribution, 0..~3
    let slow = 1; // smoothed hover factor
    let lastY = window.scrollY;
    let last = performance.now();
    let raf = 0;
    const base = reverse ? 1 : -1;

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "120px" });
    io.observe(root);
    const enter = () => (hover = true);
    const leave = () => (hover = false);
    root.addEventListener("pointerenter", enter);
    root.addEventListener("pointerleave", leave);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const y = window.scrollY;
      const v = dt > 0 ? (y - lastY) / dt : 0; // px/s, + = scrolling down
      lastY = y;
      if (!visible) return;

      if (Math.abs(v) > 30) dir = v > 0 ? base : -base; // follows scroll direction
      boost += (Math.min(Math.abs(v) / 900, 3) - boost) * 0.08;
      slow += ((hover ? 0.2 : 1) - slow) * 0.1;

      const w = set.offsetWidth;
      if (!w) return;
      x += dir * speed * (1 + boost) * slow * dt;
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      track.style.transform = `translate3d(${x}px,0,0)`;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointerleave", leave);
    };
  }, [reduced, reverse, speed]);

  const list = (hidden: boolean, ref?: React.Ref<HTMLUListElement>) => (
    <ul
      ref={ref}
      aria-hidden={hidden || undefined}
      aria-label={hidden ? undefined : ariaLabel}
      className="flex shrink-0 items-center"
    >
      {items.map((t, i) => (
        <li key={`${t}-${i}`} className={`flex items-center whitespace-nowrap ${itemClassName}`}>
          <span className="transition-colors duration-300 hover:text-crimson-text">{t}</span>
          <span aria-hidden className="px-4 opacity-50">
            ·
          </span>
        </li>
      ))}
    </ul>
  );

  if (reduced) {
    return (
      <div className={className}>
        <ul aria-label={ariaLabel} className="flex flex-wrap gap-x-4 gap-y-1">
          {items.map((t) => (
            <li key={t} className={`whitespace-nowrap ${itemClassName}`}>
              {t}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] ${className ?? ""}`}
    >
      <div ref={trackRef} className="flex w-max will-change-transform">
        {list(false, setRef)}
        {list(true)}
        {list(true)}
      </div>
    </div>
  );
}
