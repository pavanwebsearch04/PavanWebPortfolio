"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { categoryDescriptions, skillCategories, skillDescriptions } from "@/data/skills";
import { useIsCoarsePointer } from "@/hooks/useIsCoarsePointer";
import { useOnScreen } from "@/hooks/useOnScreen";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { hashString } from "@/lib/webGeometry";
import SkillNode, { type SkillNodeState } from "./SkillNode";
import {
  buildSkillsWeb,
  routeFrom,
  routeKey,
  strandD,
  WEB_H,
  WEB_W,
  type LayoutNode,
  type Strand,
} from "./skillsWebLayout";

// Deterministic and cheap, so it is built once at module load.
const LAYOUT = buildSkillsWeb();
const SHAPES: Array<"a" | "b" | "c"> = ["a", "b", "c"];

// DOM order = reading/focus order: each category's hub, then its skills.
const ORDERED: LayoutNode[] = skillCategories.flatMap((c) => {
  const members = LAYOUT.nodes.filter((n) => n.category === c.id);
  return [...members.filter((n) => n.kind === "hub"), ...members.filter((n) => n.kind === "skill")];
});

const BENDABLE = LAYOUT.strands.filter((s) => s.kind === "ring" || s.kind === "frame");
const BEND_INDEX = new Map(BENDABLE.map((s, i) => [s.id, i]));
const ROUTE_LIST = Object.values(LAYOUT.routes).filter((r) => r.length < 520);
const BEND_RADIUS = 150;
const BEND_MAX = 15;

const STRAND_STYLE: Record<Strand["kind"], { opacity: number; width: number }> = {
  spoke: { opacity: 0.22, width: 0.85 },
  ring: { opacity: 0.2, width: 0.75 },
  frame: { opacity: 0.26, width: 0.95 },
};

interface SkillsWebProps {
  activeId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

// The Skills section's primary visual: one large orb web with every skill
// seated on a junction. Chips are real buttons positioned over the SVG; the
// SVG is decorative and never takes pointer events.
export default function SkillsWeb({ activeId, selectedId, onHover, onSelect }: SkillsWebProps) {
  const reduced = useReducedMotion();
  const coarse = useIsCoarsePointer();
  const rootRef = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(rootRef, 120);
  const ambientOk = onScreen && !reduced;
  // entry: nodes spread out from the centre and the strands draw in, once
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (onScreen) setEntered(true);
  }, [onScreen]);
  const bendOk = ambientOk && !coarse;

  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const offsets = useRef<Float32Array>(new Float32Array(BENDABLE.length * 2));
  const raf = useRef(0);
  const [ambientTick, setAmbientTick] = useState(0);

  /* ---- pointer reaction: nearby rings and frame strands lean in --- */
  useEffect(() => {
    if (!bendOk) return;
    const root = rootRef.current;
    if (!root) return;
    let rect = root.getBoundingClientRect();
    let running = false;
    const offs = offsets.current;
    const els = pathRefs.current;

    const frame = () => {
      raf.current = 0;
      const p = pointer.current;
      let moving = false;
      for (let i = 0; i < BENDABLE.length; i++) {
        const s = BENDABLE[i];
        let tx = 0;
        let ty = 0;
        if (p) {
          const mx = 0.25 * s.ax + 0.5 * s.cx + 0.25 * s.bx;
          const my = 0.25 * s.ay + 0.5 * s.cy + 0.25 * s.by;
          const dx = p.x - mx;
          const dy = p.y - my;
          const d = Math.hypot(dx, dy);
          if (d < BEND_RADIUS && d > 0.5) {
            const k = (1 - d / BEND_RADIUS) ** 2 * BEND_MAX;
            tx = (dx / d) * k;
            ty = (dy / d) * k;
          }
        }
        const ox = offs[i * 2];
        const oy = offs[i * 2 + 1];
        if (ox === 0 && oy === 0 && tx === 0 && ty === 0) continue;
        let nx = ox + (tx - ox) * 0.14;
        let ny = oy + (ty - oy) * 0.14;
        const settling = tx === 0 && ty === 0;
        if (settling && Math.abs(nx) < 0.06 && Math.abs(ny) < 0.06) {
          // close enough: land exactly on the rest shape
          nx = 0;
          ny = 0;
        } else {
          moving = true;
        }
        offs[i * 2] = nx;
        offs[i * 2 + 1] = ny;
        els[i]?.setAttribute("d", strandD(s, nx, ny));
      }
      // the loop ends once every strand has settled back to rest
      if (moving || pointer.current) raf.current = requestAnimationFrame(frame);
      else running = false;
    };

    const kick = () => {
      if (!running) {
        running = true;
        raf.current = requestAnimationFrame(frame);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      rect = root.getBoundingClientRect();
      pointer.current = {
        x: ((e.clientX - rect.left) / rect.width) * WEB_W,
        y: ((e.clientY - rect.top) / rect.height) * WEB_H,
      };
      kick();
    };
    const onLeave = () => {
      pointer.current = null;
      kick();
    };
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf.current);
      pointer.current = null;
      // return strands to rest so a re-enable starts clean
      offs.fill(0);
      BENDABLE.forEach((s, i) => els[i]?.setAttribute("d", strandD(s)));
    };
  }, [bendOk]);

  /* ---- ambient: an occasional light travelling along one route ---- */
  useEffect(() => {
    if (!ambientOk || activeId) return;
    const id = window.setInterval(() => setAmbientTick((t) => t + 1), 6500);
    return () => window.clearInterval(id);
  }, [ambientOk, activeId]);

  const ambientRoute = useMemo(() => {
    if (ambientTick === 0) return null;
    return ROUTE_LIST[(ambientTick * 7 + hashString("skills")) % ROUTE_LIST.length] ?? null;
  }, [ambientTick]);

  /* ---- active connections ---------------------------------------- */
  const active = activeId ? LAYOUT.nodeById[activeId] ?? null : null;
  const neighborIds = active ? active.neighbors : [];
  const activeRoutes = useMemo(() => {
    if (!active) return [];
    return active.neighbors
      .map((n) => {
        const r = LAYOUT.routes[routeKey(active.id, n)];
        return r ? { id: n, d: routeFrom(r, active.id), length: r.length } : null;
      })
      .filter((r): r is { id: string; d: string; length: number } => r !== null)
      .sort((a, b) => a.length - b.length);
  }, [active]);

  const stateOf = (id: string): SkillNodeState => {
    if (selectedId === id) return "selected";
    if (activeId === id) return "active";
    if (neighborIds.includes(id)) return "related";
    return "idle";
  };

  const junctionDots = useMemo(() => {
    const seated = new Set(LAYOUT.nodes.map((n) => n.junction));
    return Object.entries(LAYOUT.junctions).filter(([id]) => /^s\d+k[1-5]$/.test(id) && !seated.has(id));
  }, []);

  return (
    <div
      ref={rootRef}
      className="skills-web relative left-1/2 w-[min(1320px,calc(100vw-3rem))] -translate-x-1/2"
      style={{ aspectRatio: `${WEB_W} / ${WEB_H}` }}
      data-reveal
      data-entered={entered ? "true" : "false"}
      data-active={active ? "true" : "false"}
      data-ambient={ambientOk ? "true" : "false"}
    >
      <svg
        viewBox={`0 0 ${WEB_W} ${WEB_H}`}
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
        focusable="false"
      >
        <g className="sw-sway">
          <g className="sw-decor">
            {LAYOUT.decor.map((d) => (
              <path key={d.id} d={d.d} fill="none" stroke="#F2EFE8" strokeOpacity={0.09} strokeWidth={d.weight} strokeLinecap="round" />
            ))}
          </g>

          {LAYOUT.strands.map((s) => {
            const st = STRAND_STYLE[s.kind];
            const bendIndex = BEND_INDEX.get(s.id) ?? -1;
            return (
              <path
                key={s.id}
                ref={bendIndex >= 0 ? (el) => void (pathRefs.current[bendIndex] = el) : undefined}
                className="sw-strand sw-draw"
                pathLength={1}
                style={{ animationDelay: `${(bendIndex >= 0 ? bendIndex : 0) * 0.012}s` }}
                d={strandD(s)}
                fill="none"
                stroke="#F2EFE8"
                strokeOpacity={st.opacity}
                strokeWidth={st.width}
                strokeLinecap="round"
              />
            );
          })}

          <g className="sw-strand">
            {junctionDots.map(([id, p]) => (
              <circle key={id} cx={p.x} cy={p.y} r={1.5} fill="#F2EFE8" fillOpacity={0.34} />
            ))}
            <circle cx={LAYOUT.center.x} cy={LAYOUT.center.y} r={3} fill="#F2EFE8" fillOpacity={0.55} />
            <circle cx={LAYOUT.center.x} cy={LAYOUT.center.y} r={9} fill="none" stroke="#F2EFE8" strokeOpacity={0.2} strokeWidth={0.7} />
          </g>
        </g>

        {/* the selected node's real connections, drawn outward from it */}
        {activeRoutes.map((r, i) => (
          <g key={`${activeId}-${r.id}`}>
            <path
              d={r.d}
              pathLength={1}
              fill="none"
              stroke="#EE6C5C"
              strokeOpacity={0.7}
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="sw-route"
              style={{ animationDelay: `${Math.min(i * 0.025, 0.25)}s` }}
            />
            <path
              d={r.d}
              pathLength={1}
              fill="none"
              stroke="#FFD2C9"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="sw-signal"
              style={{ animationDelay: `${0.55 + (i % 4) * 0.35}s` }}
            />
          </g>
        ))}

        {!active && ambientRoute && (
          <path
            key={`amb-${ambientTick}`}
            d={ambientRoute.d}
            pathLength={1}
            fill="none"
            stroke="#F2EFE8"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sw-ambient"
          />
        )}
      </svg>

      <ul className="m-0 list-none p-0">
        {ORDERED.map((n, i) => {
          const state = stateOf(n.id);
          const related = n.id === activeId || neighborIds.includes(n.id);
          return (
            <li
              key={n.id}
              className={`sw-node absolute -translate-x-1/2 -translate-y-1/2 ${entered ? "sw-in" : "sw-pre"}`}
              style={
                {
                  left: `${((n.x / WEB_W) * 100).toFixed(2)}%`,
                  top: `${((n.y / WEB_H) * 100).toFixed(2)}%`,
                  zIndex: state === "idle" ? 10 : 20,
                  maxWidth: "13.5rem",
                  "--fx": `${(((LAYOUT.center.x - n.x) / WEB_W) * 100).toFixed(2)}cqw`,
                  "--fy": `${(((LAYOUT.center.y - n.y) / WEB_W) * 100).toFixed(2)}cqw`,
                  "--ed": `${(i * 0.035).toFixed(3)}s`,
                  // idle drift: a slow, small, per-node sine wander
                  "--dd": `${7 + (i % 5) * 1.3}s`,
                  "--do": `${-(i % 7) * 1.1}s`,
                  "--dx": `${(i % 2 ? 1 : -1) * (2 + (i % 3))}px`,
                  "--dy": `${(i % 3 ? -1 : 1) * (2 + (i % 4))}px`,
                } as React.CSSProperties
              }
            >
              <SkillNode
                skill={{ id: n.id, name: n.label }}
                label={n.label}
                state={state}
                shape={SHAPES[i % SHAPES.length]}
                variant={n.kind === "hub" ? "hub" : n.core ? "core" : "skill"}
                dimmed={active !== null && !related}
                canvas
                className={n.kind === "hub" ? "" : n.core ? "!text-[1.1875rem]" : "!text-[1.0625rem]"}
                onHover={onHover}
                onSelect={onSelect}
              />
            </li>
          );
        })}
      </ul>

      {/* tooltip card that follows the active node */}
      <AnimatePresence>
        {active && (
          <motion.div
            key={active.id}
            aria-hidden
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              left: `${((active.x / WEB_W) * 100).toFixed(2)}%`,
              top: `calc(${((active.y / WEB_H) * 100).toFixed(2)}% + 2.6rem)`,
              translateX: "-50%",
            }}
            className="pointer-events-none absolute z-30 w-60 border border-crimson-bright/50 bg-ink/95 px-3.5 py-2.5 text-support text-paper-body shadow-[0_18px_40px_-16px_rgba(0,0,0,0.9)]"
          >
            <span className="line-clamp-3">
              {active.kind === "hub"
                ? categoryDescriptions[active.category]
                : skillDescriptions[active.id] ?? active.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
