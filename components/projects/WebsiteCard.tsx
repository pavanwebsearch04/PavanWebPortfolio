"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { WebsiteProject } from "@/data/websites";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import { hashString } from "@/lib/webGeometry";
import WebCorner from "@/components/web/WebCorner";

export type WebsiteCardVariant = "feature" | "standard" | "compact" | "archive";

const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";

const VARIANT = {
  feature: {
    sizes: "(min-width: 1280px) 680px, (min-width: 1024px) 58vw, (min-width: 640px) 90vw, 92vw",
    title: "text-[clamp(1.5rem,1.15rem+1.35vw,2.25rem)]",
    description: "text-body max-w-xl",
    cornerSize: 70,
  },
  standard: {
    sizes: "(min-width: 1280px) 480px, (min-width: 1024px) 42vw, (min-width: 640px) 45vw, 92vw",
    title: "text-card",
    description: "text-support max-w-md",
    cornerSize: 58,
  },
  compact: {
    sizes: "(min-width: 1280px) 360px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw",
    title: "text-[clamp(1.125rem,1rem+0.5vw,1.375rem)]",
    description: "text-support max-w-sm",
    cornerSize: 52,
  },
  // /projects archive: uniform cells, a little more metadata per card
  archive: {
    sizes: "(min-width: 1280px) 360px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw",
    title: "text-[clamp(1.125rem,1rem+0.5vw,1.375rem)]",
    description: "text-support max-w-md",
    cornerSize: 52,
  },
} as const;

// One live website: a single link around the whole card (so there are no
// nested interactives), a faux address bar that tells the visitor this is a
// real site, the genuine homepage capture, and an always-visible
// "Explore Website" affordance — hover effects only enhance it.
export default function WebsiteCard({
  site,
  number: rank,
  variant,
  delay = 0,
  eager = false,
  onActivate,
}: {
  site: WebsiteProject;
  /** 1-based position in the listing this card is shown in */
  number: number;
  variant: WebsiteCardVariant;
  /** entrance stagger, seconds */
  delay?: number;
  /** load the screenshot immediately (it is already in view on page load) */
  eager?: boolean;
  onActivate: (slug: string | null) => void;
}) {
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;
  const noteId = `${uid}-note`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const shown = useInViewOnce(wrapRef);
  const [imageFailed, setImageFailed] = useState(false);
  const tiltRef = useRef<HTMLDivElement>(null);
  const v = VARIANT[variant];

  // 3D tilt toward the cursor (max 8deg) plus a glare that follows it. Fine
  // pointers only; the CSS vars are written straight to the node, no re-render.
  const onTilt = (e: React.PointerEvent) => {
    const el = tiltRef.current;
    if (!el || e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${((px - 0.5) * 16).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${((0.5 - py) * 16).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
  };
  const resetTilt = () => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  };
  const number = String(rank).padStart(2, "0");
  const image = site.image;
  const showDetails = variant === "archive";

  return (
    // the outer node stays unclipped so the in-view observer can see it; the
    // inner one carries the clip-path reveal
    <div ref={wrapRef} data-shown={shown} className="group/reveal">
    <div
      style={{ transitionDelay: `${delay}s` }}
      className={`[clip-path:inset(100%_-24px_-24px_-24px)] transition-[clip-path] duration-[900ms] ${EASE} group-data-[shown=true]/reveal:[clip-path:inset(-24px)] motion-reduce:[clip-path:inset(-24px)] motion-reduce:transition-none`}
    >
      <a
        href={site.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-labelledby={`${titleId} ${noteId}`}
        aria-describedby={descId}
        onMouseEnter={() => onActivate(site.slug)}
        onMouseLeave={() => onActivate(null)}
        onFocus={() => onActivate(site.slug)}
        onBlur={() => onActivate(null)}
        onPointerMove={onTilt}
        onPointerLeave={resetTilt}
        data-cursor="view"
        className="group relative block"
      >
        {/* browser frame */}
        <div
          ref={tiltRef}
          className="relative [transform:perspective(1000px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none"
        >
          {/* ghost frame: slides out diagonally on hover/focus for a layered feel */}
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-0 border border-crimson-bright/0 transition-[transform,border-color] duration-500 ${EASE} group-hover:translate-x-2 group-hover:translate-y-2 group-hover:border-crimson-bright/35 group-focus-visible:translate-x-2 group-focus-visible:translate-y-2 group-focus-visible:border-crimson-bright/35 motion-reduce:transition-none`}
          />

          <div className="panel relative p-2.5 transition-colors duration-500 group-hover:border-paper/30 group-focus-visible:border-paper/30 motion-reduce:transition-none sm:p-3">
            {/* address bar */}
            <div className="mb-2.5 flex items-center gap-3 px-1">
              <span className="flex shrink-0 gap-1.5" aria-hidden>
                <i className="h-1.5 w-1.5 rounded-full bg-crimson-bright/70" />
                <i className="h-1.5 w-1.5 rounded-full bg-paper/25" />
                <i className="h-1.5 w-1.5 rounded-full bg-paper/25" />
              </span>
              <span
                aria-hidden
                className="min-w-0 flex-1 truncate font-mono text-label tracking-[0.03em] text-paper-dim transition-colors duration-300 group-hover:text-paper-body group-focus-visible:text-paper-body"
              >
                {site.host.replace("/websites/", "/…/")}
              </span>
              <ArrowUpRight
                size={14}
                aria-hidden
                className="shrink-0 text-paper-dim transition-colors duration-300 group-hover:text-crimson-text group-focus-visible:text-crimson-text"
              />
            </div>

            {/* screenshot — 16:10 reserves the space before the image loads */}
            <div className="relative aspect-[16/10] w-full overflow-hidden border border-paper/15 bg-ink-graphite">
              {image && !imageFailed ? (
                // scale 1.3 -> 1 as the card is revealed on scroll
                <div
                  className={`absolute inset-0 scale-[1.3] transition-transform duration-[1200ms] ${EASE} group-data-[shown=true]/reveal:scale-100 motion-reduce:scale-100 motion-reduce:transition-none`}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes={v.sizes}
                    priority={eager}
                    loading={eager ? undefined : "lazy"}
                    onError={() => setImageFailed(true)}
                    style={{ objectPosition: image.position }}
                    className={`object-cover transition-transform duration-[600ms] ${EASE} will-change-transform group-hover:scale-[1.06] group-focus-visible:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100`}
                  />
                </div>
              ) : (
                // no capture available: an honest typographic stand-in, never a stock photo
                <div
                  role="img"
                  aria-label={`Preview image for ${site.title} is not available yet`}
                  className="flex h-full w-full flex-col items-center justify-center gap-3 bg-ink-graphite px-6 text-center"
                >
                  <span className="font-display text-card font-medium text-paper">{site.host}</span>
                  <span className="font-mono text-label uppercase tracking-[0.14em] text-paper-dim">
                    Live website · preview unavailable
                  </span>
                </div>
              )}

              {/* resting tone: just enough to seat bright sites on the dark page; clears on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-ink/10 transition-opacity duration-500 group-hover:opacity-0 group-focus-visible:opacity-0 motion-reduce:transition-none"
              />
              {/* hover only: grounds the launch glyph */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/55 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
              />

              {/* crimson thread sweeps along the top edge (same motif as the home cards) */}
              <span
                aria-hidden
                className={`pointer-events-none absolute left-0 top-0 h-px w-full origin-left scale-x-0 bg-crimson-bright transition-transform duration-500 ${EASE} group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none`}
              />

              {/* glare that follows the cursor */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
                style={{
                  background:
                    "radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,0.22), transparent 55%)",
                }}
              />
              {/* category tag slides up from the bottom edge */}
              <span
                aria-hidden
                className={`pointer-events-none absolute bottom-3 left-3 max-w-[70%] translate-y-[160%] truncate border border-crimson-bright/50 bg-ink/85 px-2.5 py-1 font-mono text-label uppercase tracking-[0.1em] text-paper transition-transform duration-500 ${EASE} group-hover:translate-y-0 group-focus-visible:translate-y-0 motion-reduce:translate-y-0 motion-reduce:transition-none`}
              >
                {site.category}
              </span>

              {/* launch glyph */}
              <span
                aria-hidden
                className={`pointer-events-none absolute bottom-3 right-3 flex h-11 w-11 scale-75 items-center justify-center rounded-full border border-paper/50 bg-ink/80 text-paper opacity-0 transition-[opacity,transform] duration-500 ${EASE} group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 motion-reduce:transition-none`}
              >
                <ArrowUpRight size={18} />
              </span>
            </div>
          </div>

          {/* crimson web-strand border drawn around the frame on hover */}
          <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            <rect
              x="0.5"
              y="0.5"
              width="99.9%"
              height="99.9%"
              pathLength={1}
              fill="none"
              stroke="#D4483B"
              strokeWidth="1.2"
              strokeLinejoin="round"
              className="card-strand"
            />
          </svg>

          <WebCorner
            corner="tr"
            size={v.cornerSize}
            seed={hashString(site.slug)}
            className="!-right-3 !-top-3"
          />
        </div>

        {/* editorial caption */}
        <div className="px-1 pt-5">
          <div className="flex items-center gap-3">
            <span
              className={`font-mono text-nav text-crimson-text transition-transform duration-500 ${EASE} group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none`}
            >
              {number}
            </span>
            <span
              aria-hidden
              className="h-px w-8 shrink-0 bg-paper/25 transition-[width,background-color] duration-500 group-hover:w-14 group-hover:bg-crimson-bright/70 group-focus-visible:w-14 group-focus-visible:bg-crimson-bright/70 motion-reduce:transition-none"
            />
            <span className="min-w-0 font-mono text-label uppercase tracking-[0.1em] text-paper-muted">
              {site.category}
            </span>
          </div>

          <h3 id={titleId} className={`mt-3 font-display font-medium leading-tight text-paper ${v.title}`}>
            {site.title}
          </h3>
          <p id={descId} className={`mt-2.5 text-paper-body ${v.description}`}>
            {site.description}
          </p>

          {showDetails && (site.technologies?.length || site.contribution) ? (
            <dl className="mt-4 space-y-1.5 font-mono text-label tracking-[0.04em]">
              {site.technologies?.length ? (
                <div className="flex gap-2">
                  <dt className="shrink-0 uppercase tracking-[0.12em] text-paper-dim">Stack</dt>
                  <dd className="text-paper-body">{site.technologies.join(" · ")}</dd>
                </div>
              ) : null}
              {site.contribution ? (
                <div className="flex gap-2">
                  <dt className="shrink-0 uppercase tracking-[0.12em] text-paper-dim">Role</dt>
                  <dd className="text-paper-body">{site.contribution}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          <p className="mt-4 inline-flex items-center gap-2 font-mono text-label uppercase tracking-[0.12em] text-paper">
            <span className="relative">
              View Project
              <span
                aria-hidden
                className={`absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-crimson-bright transition-transform duration-500 ${EASE} group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none`}
              />
            </span>
            <ArrowUpRight
              size={15}
              aria-hidden
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-focus-visible:-translate-y-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transition-none"
            />
          </p>
          <span id={noteId} className="sr-only">
            — opens {site.host} in a new tab
          </span>
        </div>
      </a>
    </div>
    </div>
  );
}
