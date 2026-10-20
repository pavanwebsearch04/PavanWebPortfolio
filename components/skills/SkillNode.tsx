"use client";

import { forwardRef, useMemo } from "react";
import { mulberry32, rangeFrom } from "@/lib/seededRandom";
import { Skill } from "@/data/skills";

function hashSeed(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return h;
}

// Small irregular, asymmetric web-anchor glyph — never a circle. Matches the
// node language used in the Experience timeline.
function NodeGlyph({ id, hot }: { id: string; hot: boolean }) {
  const arms = useMemo(() => {
    const rng = mulberry32(hashSeed(id));
    const count = 4 + Math.floor(rangeFrom(rng, 0, 2));
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + rangeFrom(rng, -0.4, 0.4);
      const len = rangeFrom(rng, 4, 7);
      return { x2: +(Math.cos(angle) * len).toFixed(2), y2: +(Math.sin(angle) * len).toFixed(2) };
    });
  }, [id]);

  return (
    <svg width="18" height="18" viewBox="-9 -9 18 18" className="shrink-0 overflow-visible" aria-hidden="true">
      {arms.map((a, i) => (
        <line
          key={i}
          x1={0}
          y1={0}
          x2={a.x2}
          y2={a.y2}
          strokeLinecap="round"
          stroke={hot ? "#EE6C5C" : "#D9D6CF"}
          strokeWidth={hot ? 1.3 : 1}
          opacity={hot ? 1 : 0.82}
          style={{ transition: "stroke 0.25s, opacity 0.25s" }}
        />
      ))}
      <circle r={1.5} fill={hot ? "#EE6C5C" : "#D9D6CF"} fillOpacity={hot ? 1 : 0.8} style={{ transition: "fill 0.25s" }} />
    </svg>
  );
}

export type SkillNodeState = "idle" | "related" | "active" | "selected";

interface SkillNodeProps {
  skill: Pick<Skill, "id" | "name">;
  state: SkillNodeState;
  shape: "a" | "b" | "c";
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  className?: string;
  /** "core" is slightly larger; "hub" is a category label on the web */
  variant?: "skill" | "core" | "hub";
  /** text shown instead of skill.name (category hubs show their short label) */
  label?: string;
  /** another node is active and this one is not part of its connections */
  dimmed?: boolean;
  /** sits on the web canvas: opts out of the per-element hover web */
  canvas?: boolean;
}

// A skill as a touch-friendly chip with an angular, web-cut outline. The
// chip has an opaque graphite fill, so the strands behind it can never run
// through the label.
const SkillNode = forwardRef<HTMLButtonElement, SkillNodeProps>(function SkillNode(
  { skill, state, shape, onHover, onSelect, className = "", variant = "skill", label, dimmed = false, canvas = false },
  ref
) {
  const hot = state === "active" || state === "selected";
  const hub = variant === "hub";
  return (
    <button
      ref={ref}
      type="button"
      data-shape={shape}
      data-state={state}
      data-core={variant === "core" ? "true" : undefined}
      data-hub={hub ? "true" : undefined}
      data-dim={dimmed ? "true" : undefined}
      data-web={canvas ? "off" : undefined}
      data-web-id={skill.id}
      onMouseEnter={() => onHover(skill.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(skill.id)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect(skill.id)}
      aria-pressed={state === "selected"}
      className={`skill-chip flex min-h-[48px] max-w-full items-center gap-2.5 px-[1.125rem] py-3 text-left text-paper focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson-text ${
        hub
          ? "font-mono text-[0.8125rem] font-normal uppercase leading-tight tracking-[0.14em]"
          : "font-body text-[clamp(1rem,0.95rem+0.25vw,1.1875rem)] font-medium leading-snug tracking-[0.005em]"
      } ${className}`}
    >
      <NodeGlyph id={skill.id} hot={hot} />
      <span>{label ?? skill.name}</span>
      {hub && <span className="sr-only"> category</span>}
    </button>
  );
});

export default SkillNode;
