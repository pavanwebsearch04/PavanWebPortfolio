"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { WebsiteProject } from "@/data/websites";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsCoarsePointer } from "@/hooks/useIsCoarsePointer";
import Reveal from "@/components/motion/Reveal";
import { EASE_OUT, STAGGER } from "@/lib/motion";

const PREVIEW_W = 340;
const PREVIEW_H = 212;

// Selected Work as an editorial list. Hovering a row floats that site's
// screenshot beside the cursor (spring lag, tilting with cursor velocity,
// clip-path reveal); the other rows dim. Every row still opens the live site in
// a new tab. On touch / reduced-motion the preview is skipped but the list,
// links and hover/focus styling remain.
export default function ProjectList({
  sites,
  onActivate,
}: {
  sites: WebsiteProject[];
  onActivate: (slug: string | null) => void;
}) {
  const reduced = useReducedMotion();
  const coarse = useIsCoarsePointer();
  const preview = !coarse;
  const [active, setActive] = useState<string | null>(null);
  const activeSite = sites.find((s) => s.slug === active) ?? null;

  // cursor position (viewport coords) -> springs give the floating lag
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: reduced ? 4000 : 170, damping: reduced ? 100 : 22, mass: 0.6 });
  const y = useSpring(my, { stiffness: reduced ? 4000 : 170, damping: reduced ? 100 : 22, mass: 0.6 });
  const tilt = useMotionValue(0);
  const rotate = useSpring(tilt, { stiffness: 140, damping: 16 });
  const last = useRef({ x: 0, t: 0 });

  const onMove = (e: React.PointerEvent, snap = false) => {
    // keep the preview inside the viewport
    const px = Math.min(e.clientX + 28, window.innerWidth - PREVIEW_W - 16);
    const py = Math.min(Math.max(e.clientY - PREVIEW_H / 2, 84), window.innerHeight - PREVIEW_H - 16);
    mx.set(px);
    my.set(py);
    if (snap) {
      x.jump(px);
      y.jump(py);
    }
    if (!reduced) {
      const now = performance.now();
      const dt = Math.max(16, now - last.current.t);
      const v = ((e.clientX - last.current.x) / dt) * 16; // px per frame
      last.current = { x: e.clientX, t: now };
      tilt.set(Math.max(-6, Math.min(6, v * 0.5)));
    }
  };

  useEffect(() => {
    // settle the tilt when the pointer rests
    if (!active) return;
    const id = window.setInterval(() => tilt.set(tilt.get() * 0.5), 120);
    return () => window.clearInterval(id);
  }, [active, tilt]);

  const set = (slug: string | null) => {
    setActive(slug);
    onActivate(slug);
  };

  return (
    <>
      <ul
        onPointerMove={preview ? onMove : undefined}
        onPointerLeave={() => set(null)}
        className="border-t border-paper/15"
      >
        {sites.map((site, i) => {
          const dim = active !== null && active !== site.slug;
          const on = active === site.slug;
          return (
            <li key={site.slug} className="border-b border-paper/15">
              <Reveal delay={i * STAGGER} y={24}>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${site.title} — ${site.category}. Opens ${site.host} in a new tab`}
                  onPointerEnter={(e) => {
                    if (preview) onMove(e, active === null); // jump to the entry point on first show
                    set(site.slug);
                  }}
                  onFocus={(e) => {
                    // keyboard focus: float the preview beside the row
                    const r = e.currentTarget.getBoundingClientRect();
                    mx.set(Math.min(r.right - PREVIEW_W - 24, window.innerWidth - PREVIEW_W - 16));
                    my.set(Math.min(Math.max(r.top + r.height / 2 - PREVIEW_H / 2, 84), window.innerHeight - PREVIEW_H - 16));
                    if (active === null) {
                      x.jump(mx.get());
                      y.jump(my.get());
                    }
                    set(site.slug);
                  }}
                  onBlur={() => set(null)}
                  data-cursor="view"
                  className={`group grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-1 py-6 transition-opacity duration-300 md:grid-cols-[5rem_1fr_16rem_auto] md:gap-x-8 md:py-8 ${
                    dim ? "opacity-40" : "opacity-100"
                  }`}
                >
                  <span
                    aria-hidden
                    className="font-display text-[clamp(1.75rem,1.2rem+2vw,3rem)] font-medium leading-none transition-colors duration-[400ms]"
                    style={{
                      color: on ? "var(--accent)" : "transparent",
                      WebkitTextStroke: on ? "1px var(--accent)" : "1px rgba(242,239,232,0.45)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <span
                    className="min-w-0 transition-[transform,color] duration-[400ms]"
                    style={{
                      transform: on ? "translateX(16px)" : "translateX(0)",
                      transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    <span
                      className={`block font-display text-[clamp(1.25rem,1rem+1.2vw,2.1rem)] font-medium leading-tight transition-colors duration-300 ${
                        on ? "text-crimson-text" : "text-paper"
                      }`}
                    >
                      {site.title}
                    </span>
                    <span className="mt-1.5 hidden max-w-xl text-support text-paper-body line-clamp-2 md:block">
                      {site.description}
                    </span>
                  </span>

                  <span className="hidden font-mono text-label uppercase tracking-[0.1em] text-paper-muted md:block">
                    {site.category}
                  </span>

                  <ArrowUpRight
                    size={22}
                    aria-hidden
                    className={`shrink-0 transition-[transform,opacity,color] duration-[400ms] ${
                      on ? "translate-x-0 text-crimson-text opacity-100" : "-translate-x-3 text-paper-dim opacity-0 md:opacity-0"
                    }`}
                  />
                  <span className="col-start-2 font-mono text-label uppercase tracking-[0.1em] text-paper-muted md:hidden">
                    {site.category}
                  </span>
                </a>
              </Reveal>
            </li>
          );
        })}
      </ul>

      {/* floating screenshot, rendered once and moved with the cursor */}
      {preview && (
        <div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[55] hidden md:block">
          <motion.div style={{ x, y, rotate: reduced ? 0 : rotate, width: PREVIEW_W, height: PREVIEW_H }}>
            <AnimatePresence mode="wait">
              {activeSite && activeSite.image && (
                <motion.div
                  key={activeSite.slug}
                  initial={{ clipPath: "inset(100% 0% 0% 0%)", scale: 0.9, opacity: 1 }}
                  animate={{ clipPath: "inset(0% 0% 0% 0%)", scale: 1 }}
                  exit={{ clipPath: "inset(0% 0% 100% 0%)", scale: 0.95, transition: { duration: 0.25, ease: EASE_OUT } }}
                  transition={{ duration: 0.45, ease: EASE_OUT }}
                  className="relative h-full w-full overflow-hidden border border-crimson-bright/60 bg-ink-graphite shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85),0_0_24px_rgba(212,72,59,0.22)]"
                >
                  <Image
                    src={activeSite.image.src}
                    alt=""
                    fill
                    sizes="340px"
                    style={{ objectPosition: activeSite.image.position }}
                    className="object-cover"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </>
  );
}
