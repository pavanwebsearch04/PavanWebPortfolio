"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { experience, type ExperienceEntry } from "@/data/experience";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PrimaryHeading } from "@/components/ui/PageContext";

// The dedicated /experience page: an editorial career archive. It shares the
// site's palette, strands and cursor with the Home overview but is a different
// structure: a left rail of dates and nodes with one wide reading column.

const EASE = [0.16, 1, 0.3, 1] as const;
const HOLD_MS = 520;

const META = [
  ["Professional focus", "Web Development & WordPress"],
  ["Location", "Udaipur, Rajasthan, India"],
  ["Career history", "Based on verified employment records"],
] as const;

// "Full Stack Web Development Intern — Virtual" -> title + employment type
function splitRole(role: string) {
  const [title, type] = role.split(" — ");
  return { title, type };
}

/* ---- hero web: a fan of strands from the start node ---------------- */
function HeroWeb() {
  const O = { x: 34, y: 300 };
  const spokes = [-78, -60, -42, -26, -10, 6].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return { x: O.x + Math.cos(a) * 430, y: O.y + Math.sin(a) * 430 };
  });
  const rings = [90, 170, 250, 330, 410];
  const pt = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180;
    return [O.x + Math.cos(a) * r, O.y + Math.sin(a) * r] as const;
  };
  const degs = [-78, -60, -42, -26, -10, 6];
  return (
    <svg viewBox="0 0 480 340" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
      {spokes.map((s, i) => (
        <path key={i} d={`M ${O.x} ${O.y} L ${s.x.toFixed(1)} ${s.y.toFixed(1)}`} stroke="#F2EFE8" strokeOpacity={0.14} strokeWidth={0.8} />
      ))}
      {rings.map((r) =>
        degs.slice(0, -1).map((d, i) => {
          const [x0, y0] = pt(d, r);
          const [x1, y1] = pt(degs[i + 1], r);
          const [mx, my] = pt((d + degs[i + 1]) / 2, r * 0.93);
          return (
            <path key={`${r}-${i}`} d={`M ${x0.toFixed(1)} ${y0.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`} fill="none" stroke="#F2EFE8" strokeOpacity={0.1} strokeWidth={0.7} />
          );
        })
      )}
      {/* the one accented strand */}
      <path d={`M ${O.x} ${O.y} L ${spokes[3].x.toFixed(1)} ${spokes[3].y.toFixed(1)}`} stroke="#EE6C5C" strokeOpacity={0.6} strokeWidth={1.1} />
    </svg>
  );
}

/* ---- keep a clicked entry still while another one collapses -------- */
function useHoldPosition() {
  const release = useRef<(() => void) | null>(null);
  useEffect(() => () => release.current?.(), []);
  return useCallback((anchor: HTMLElement) => {
    release.current?.();
    const startTop = anchor.getBoundingClientRect().top;
    const t0 = performance.now();
    let raf = 0;
    const cancel = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", cancel);
      release.current = null;
    };
    const tick = (now: number) => {
      if (!anchor.isConnected) return cancel();
      const dy = anchor.getBoundingClientRect().top - startTop;
      if (Math.abs(dy) > 0.5) window.scrollBy({ top: dy, behavior: "instant" as ScrollBehavior });
      if (now - t0 < HOLD_MS) raf = requestAnimationFrame(tick);
      else cancel();
    };
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", cancel);
    release.current = cancel;
    raf = requestAnimationFrame(tick);
  }, []);
}

function Entry({
  entry,
  index,
  last,
  expanded,
  onToggle,
  reduced,
}: {
  entry: ExperienceEntry;
  index: number;
  last: boolean;
  expanded: boolean;
  onToggle: (id: string, el: HTMLElement) => void;
  reduced: boolean;
}) {
  const uid = useId();
  const [hovered, setHovered] = useState(false);
  const lit = expanded || hovered;
  const { title, type } = splitRole(entry.role);
  const meta = [entry.location, type].filter(Boolean).join(" · ");
  const panelId = `${uid}-panel`;
  const headingId = `${uid}-title`;

  return (
    <li
      className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-4 md:grid-cols-[9rem_2rem_minmax(0,1fr)] md:gap-x-6"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* dates, desktop */}
      <div className="hidden pt-1.5 text-right md:block">
        <p className="font-mono text-label tracking-[0.08em] text-paper-body">{entry.duration.toUpperCase()}</p>
        {entry.current && <p className="mt-1 font-mono text-label tracking-[0.12em] text-crimson-text">CURRENT ROLE</p>}
      </div>

      {/* rail: strand + node */}
      <div className="relative">
        <span
          aria-hidden="true"
          className={`absolute left-1/2 top-3 w-px -translate-x-1/2 transition-colors duration-500 ${
            last ? "bottom-8 bg-gradient-to-b from-paper/25 to-transparent" : "-bottom-0 bg-paper/20"
          } ${lit && !last ? "!bg-crimson-bright/70" : ""}`}
        />
        <span
          aria-hidden="true"
          className={`absolute left-1/2 top-[0.55rem] h-3 w-3 -translate-x-1/2 rotate-45 border transition-colors duration-300 ${
            expanded
              ? "border-crimson-text bg-crimson-bright"
              : hovered
                ? "border-crimson-text bg-ink"
                : "border-paper/60 bg-ink"
          }`}
        />
      </div>

      <div className="min-w-0 pb-14 md:pb-16">
        <p className="mb-1 font-mono text-label tracking-[0.08em] text-paper-body md:hidden">
          {entry.duration.toUpperCase()}
          {entry.current ? " · CURRENT ROLE" : ""}
        </p>
        <h3 id={headingId} className="font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.1rem)] font-medium leading-tight text-paper">
          {title}
        </h3>
        <p className="mt-1 text-body text-paper-body">{entry.company}</p>
        {meta && <p className="mt-1 font-mono text-label tracking-[0.08em] text-paper-dim">{meta.toUpperCase()}</p>}
        <p className="mt-3 max-w-[60ch] text-support text-paper-muted">{entry.summary}</p>

        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={expanded ? panelId : undefined}
          onClick={(e) => onToggle(entry.id, e.currentTarget)}
          className={`mt-5 inline-flex min-h-[44px] items-center gap-2 border px-3.5 py-2 font-mono text-label tracking-[0.1em] transition-colors ${
            expanded
              ? "border-crimson-bright/60 bg-crimson/10 text-paper"
              : "border-paper/30 text-paper-body hover:border-paper/60 hover:text-paper"
          }`}
        >
          <span aria-hidden="true" className="inline-block w-3 text-center">
            {expanded ? "−" : "+"}
          </span>
          <span aria-hidden="true">{expanded ? "HIDE DETAILS" : "VIEW DETAILS"}</span>
          <span className="sr-only">
            {expanded ? "Hide" : "View"} details: {title}, {entry.company}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              id={panelId}
              role="region"
              aria-labelledby={headingId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.4, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="mt-6 flex max-w-[64ch] flex-col gap-7 border-l border-crimson-bright/40 pl-5 md:pl-7">
                <section aria-label="Overview">
                  <h4 className="font-mono text-label tracking-[0.14em] text-crimson-text">OVERVIEW</h4>
                  <p className="mt-2 text-[1.0625rem] leading-[1.65] text-paper-body">{entry.overview}</p>
                </section>
                <section aria-label="Responsibilities">
                  <h4 className="font-mono text-label tracking-[0.14em] text-crimson-text">RESPONSIBILITIES</h4>
                  <ul className="mt-3 flex flex-col gap-3">
                    {entry.responsibilities.map((r) => (
                      <li key={r} className="relative pl-5 text-[1.0625rem] leading-[1.65] text-paper-body before:absolute before:left-0 before:top-[0.85em] before:h-px before:w-3 before:bg-crimson-bright/80">
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
                {entry.technologies.length > 0 && (
                  <section aria-label="Technologies">
                    <h4 className="font-mono text-label tracking-[0.14em] text-crimson-text">TECHNOLOGIES</h4>
                    <p className="mt-2 text-[1.0625rem] leading-[1.65] text-paper-body">
                      {entry.technologies.join(" · ")}
                    </p>
                  </section>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <span className="sr-only">Entry {index + 1} of {experience.length}</span>
    </li>
  );
}

function PathWeb() {
  const N = {
    design: { x: 70, y: 60, l: "DESIGN" },
    frontend: { x: 330, y: 50, l: "FRONTEND" },
    wordpress: { x: 90, y: 230, l: "WORDPRESS" },
    development: { x: 320, y: 220, l: "DEVELOPMENT" },
  } as const;
  const keys = Object.keys(N) as Array<keyof typeof N>;
  const edges: Array<[keyof typeof N, keyof typeof N, number]> = [
    ["design", "frontend", -10],
    ["design", "wordpress", 12],
    ["frontend", "development", 14],
    ["wordpress", "development", -12],
    ["design", "development", 0],
    ["frontend", "wordpress", 0],
  ];
  return (
    <svg viewBox="0 0 420 290" className="h-auto w-full max-w-md" role="img" aria-label="Design, frontend, WordPress and development, shown as a connected set of interests.">
      {edges.map(([a, b, bow], i) => {
        const A = N[a];
        const B = N[b];
        const mx = (A.x + B.x) / 2 + bow;
        const my = (A.y + B.y) / 2 + bow;
        return <path key={i} d={`M ${A.x} ${A.y} Q ${mx} ${my} ${B.x} ${B.y}`} fill="none" stroke="#F2EFE8" strokeOpacity={0.3} strokeWidth={1} />;
      })}
      {keys.map((k) => {
        const n = N[k];
        const right = n.x > 200;
        return (
          <g key={k}>
            <rect x={n.x - 5} y={n.y - 5} width={10} height={10} transform={`rotate(45 ${n.x} ${n.y})`} fill="#0a0a0c" stroke="#F2EFE8" strokeWidth={1.2} />
            <text x={n.x} y={n.y + (n.y < 120 ? -18 : 28)} textAnchor={right ? "end" : "start"} fontSize={13} fill="#F2EFE8" className="font-mono" style={{ letterSpacing: "0.12em" }}>
              {n.l}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function CareerArchive() {
  const reduced = useReducedMotion();
  // Collapsed on every load: null start, never persisted, never set by scroll.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const hold = useHoldPosition();

  const toggle = useCallback(
    (id: string, el: HTMLElement) => {
      setExpandedId((cur) => (cur === id ? null : id));
      hold(el);
    },
    [hold]
  );

  return (
    <>
      {/* hero */}
      <section id="career-archive" className="surface surface-ink relative w-full overflow-x-clip px-6 pb-10 md:px-14 lg:px-20">
        <div className="relative z-10 mx-auto grid max-w-6xl gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-crimson-bright" />
              <p className="font-mono text-label tracking-[0.14em] text-paper-muted">CAREER ARCHIVE / PROFESSIONAL JOURNEY</p>
            </div>
            <PrimaryHeading className="font-display text-section font-medium text-paper">
              <span className="block">THE PATH THAT</span>
              <span className="block">BUILT MY CRAFT.</span>
            </PrimaryHeading>
            <p className="max-w-xl text-body text-paper-body">
              Every role has shaped how I approach the web — from designing responsive interfaces to developing
              WordPress solutions and building practical digital experiences. Explore the work, responsibilities, and
              technologies behind my journey.
            </p>
            <dl className="mt-2 grid gap-x-8 gap-y-3 border-t border-paper/15 pt-5 sm:grid-cols-3">
              {META.map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-label tracking-[0.12em] text-paper-dim">{k.toUpperCase()}</dt>
                  <dd className="mt-1 text-support text-paper-body">{v}</dd>
                </div>
              ))}
            </dl>
            <a
              href="#career-path"
              className="mt-1 inline-flex w-fit items-center gap-2 font-mono text-label tracking-[0.12em] text-crimson-text underline-offset-4 hover:underline"
            >
              <span aria-hidden="true">↓</span> BEGIN THE PATH
            </a>
          </div>
          <div className="relative hidden min-h-[320px] md:block" aria-hidden="true">
            <HeroWeb />
          </div>
        </div>
      </section>

      {/* timeline */}
      <section id="career-path" aria-labelledby="career-path-title" className="relative w-full overflow-x-clip px-6 py-10 md:px-14 lg:px-20">
        <div className="relative z-10 mx-auto max-w-5xl">
          <h2 id="career-path-title" className="sr-only">
            Career timeline, most recent role first
          </h2>
          <p className="mb-8 font-mono text-label tracking-[0.12em] text-paper-dim md:pl-[11.5rem]">
            MOST RECENT FIRST · {experience.length} ROLES
          </p>
          <ol className="m-0 list-none p-0">
            {experience.map((entry, i) => (
              <Entry
                key={entry.id}
                entry={entry}
                index={i}
                last={i === experience.length - 1}
                expanded={expandedId === entry.id}
                onToggle={toggle}
                reduced={reduced}
              />
            ))}
          </ol>
        </div>
      </section>

      {/* direction */}
      <section className="surface surface-graphite relative w-full overflow-x-clip px-6 py-20 md:px-14 lg:px-20">
        <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-5">
            <h2 className="font-display text-[clamp(1.9rem,1.4rem+2vw,3rem)] font-medium leading-tight text-paper">
              FROM DESIGN TO DEVELOPMENT.
            </h2>
            <p className="max-w-lg text-body text-paper-body">
              My journey brings together visual design, responsive frontend work, and WordPress development. Each
              experience contributes to a practical approach to building websites that are useful, maintainable, and
              thoughtfully presented.
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <PathWeb />
          </div>
        </div>
      </section>
    </>
  );
}
