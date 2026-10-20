"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { mulberry32, rangeFrom } from "@/lib/seededRandom";
import { WEB_COLORS } from "@/lib/webConfig";

/* ------------------------------------------------------------------ */
/* Crawling hero spider. Authored in "art units" (≈ 1 CSS px at scale   */
/* 1) with the pedicel at the origin, facing up (-y). Eight legs of     */
/* three tapered, curved segments are re-posed every frame by           */
/* `poseSpider` — nothing here re-renders.                              */
/* ------------------------------------------------------------------ */

export const SPIDER_GRADIENT_IDS = {
  abdomen: "hero-spider-abdomen",
  head: "hero-spider-head",
} as const;

const INK = "#0b0b0e";
const LEG_CORE = "#1c1c22";
const RIM = WEB_COLORS.paper;
const DEG = Math.PI / 180;

interface LegDef {
  side: 1 | -1;
  hx: number;
  hy: number;
  /** segment directions in degrees, 0 = straight out sideways, negative = forward */
  a: [number, number, number];
  l: [number, number, number];
  swing: number;
  /** alternate-tetrapod gait group (0 / 1) */
  group: 0 | 1;
}

const BASE_LEGS: Array<Pick<LegDef, "hx" | "hy" | "a" | "l" | "swing">> = [
  { hx: 1.7, hy: -8.0, a: [-34, -62, -84], l: [7.4, 9.6, 6.4], swing: 13 },
  { hx: 2.2, hy: -6.3, a: [-10, -32, -50], l: [8.4, 10.4, 6.8], swing: 10 },
  { hx: 2.3, hy: -4.6, a: [14, 38, 58], l: [8.6, 10.6, 7.0], swing: 10 },
  { hx: 1.9, hy: -3.0, a: [32, 62, 84], l: [8.2, 10.0, 7.2], swing: 13 },
];

// leg width per segment (femur -> tarsus); the rim is drawn slightly wider
const WIDTHS = [1.9, 1.35, 0.85] as const;
const RIM_EXTRA = 0.8;

/** A per-spider leg set: same anatomy, small deliberate asymmetries. */
export function makeLegs(seed: number): LegDef[] {
  const rng = mulberry32(seed * 7919 + 13);
  const legs: LegDef[] = [];
  for (let i = 0; i < 4; i++) {
    for (const side of [1, -1] as const) {
      const b = BASE_LEGS[i];
      const da = rangeFrom(rng, -4.5, 4.5);
      const dl = rangeFrom(rng, 0.94, 1.07);
      legs.push({
        side,
        hx: b.hx,
        hy: b.hy + rangeFrom(rng, -0.25, 0.25),
        a: [b.a[0] + da, b.a[1] + da * 0.8, b.a[2] + da * 0.6],
        l: [b.l[0] * dl, b.l[1] * dl, b.l[2] * dl],
        swing: b.swing * rangeFrom(rng, 0.9, 1.1),
        // R1 L2 R3 L4 move together, L1 R2 L3 R4 in antiphase
        group: ((i + (side === 1 ? 0 : 1)) % 2) as 0 | 1,
      });
    }
  }
  return legs;
}

export interface SpiderHandle {
  /** highlight on the strand under the spider (canvas coordinates) */
  silk: SVGPathElement;
  /** screen-space frame: translate + stretch compensation */
  root: SVGGElement;
  shadow: SVGGElement;
  body: SVGGElement;
  abdomen: SVGGElement;
  palpL: SVGGElement;
  palpR: SVGGElement;
  rim: SVGPathElement[];
  core: SVGPathElement[];
  legs: LegDef[];
}

export interface SpiderPose {
  /** gait phase in radians (advances with distance travelled) */
  phase: number;
  /** 0 = standing still, 1 = full stride */
  amp: number;
  /** per-leg angle offset in degrees (twitches / settling) */
  twitch: ArrayLike<number>;
  /** 1 = legs at rest length; > 1 = slightly spread */
  spread: number;
  /** false = skip re-posing the knee joints (cheaper pose for small screens) */
  detail: boolean;
}

const f = (n: number) => n.toFixed(2);

/** Re-pose the eight legs. Writes four path strings (one per tier + knees). */
export function poseLegs(h: SpiderHandle, pose: SpiderPose) {
  const tiers = ["", "", ""];
  let knees = "";
  const { phase, amp, twitch, spread } = pose;
  for (let i = 0; i < h.legs.length; i++) {
    const leg = h.legs[i];
    const phi = phase + (leg.group === 1 ? Math.PI : 0);
    const sw = Math.sin(phi);
    const lift = Math.max(0, Math.cos(phi));
    const dA = amp * leg.swing * sw + twitch[i];
    const reach = spread * (1 - amp * 0.1 * lift);
    const hx = leg.side * leg.hx;
    let x = hx;
    let y = leg.hy;
    for (let k = 0; k < 3; k++) {
      const ang = (leg.a[k] + dA * (1 - k * 0.28)) * DEG;
      const len = leg.l[k] * reach;
      const dx = leg.side * Math.cos(ang) * len;
      const dy = Math.sin(ang) * len;
      const nx = x + dx;
      const ny = y + dy;
      // gentle arc: the bow follows the way the leg bends into its next segment
      const next = (leg.a[Math.min(2, k + 1)] - leg.a[k]) * leg.side;
      const bow = (k === 2 ? 0.1 : Math.max(-0.2, Math.min(0.2, next * 0.012))) * len;
      const nlen = Math.hypot(dx, dy) || 1;
      const cx = (x + nx) / 2 + (-dy / nlen) * bow;
      const cy = (y + ny) / 2 + (dx / nlen) * bow;
      tiers[k] += `M${f(x)} ${f(y)}Q${f(cx)} ${f(cy)} ${f(nx)} ${f(ny)}`;
      if (k < 2) knees += `M${f(nx)} ${f(ny)}h0.01`;
      x = nx;
      y = ny;
    }
  }
  for (let k = 0; k < 3; k++) {
    h.core[k].setAttribute("d", tiers[k]);
    h.rim[k].setAttribute("d", tiers[k]);
  }
  if (pose.detail) {
    h.core[3].setAttribute("d", knees);
    h.rim[3].setAttribute("d", knees);
  }
}

interface HeroSpiderArtProps {
  seed: number;
}

// One spider. The group is created hidden; the simulation shows it.
const HeroSpiderArt = forwardRef<SpiderHandle, HeroSpiderArtProps>(function HeroSpiderArt(
  { seed },
  ref
) {
  const silkRef = useRef<SVGPathElement>(null);
  const rootRef = useRef<SVGGElement>(null);
  const shadowRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const abdomenRef = useRef<SVGGElement>(null);
  const palpLRef = useRef<SVGGElement>(null);
  const palpRRef = useRef<SVGGElement>(null);
  const rimRefs = useRef<SVGPathElement[]>([]);
  const coreRefs = useRef<SVGPathElement[]>([]);
  const legs = useMemo(() => makeLegs(seed), [seed]);

  useImperativeHandle(
    ref,
    () => ({
      silk: silkRef.current as SVGPathElement,
      root: rootRef.current as SVGGElement,
      shadow: shadowRef.current as SVGGElement,
      body: bodyRef.current as SVGGElement,
      abdomen: abdomenRef.current as SVGGElement,
      palpL: palpLRef.current as SVGGElement,
      palpR: palpRRef.current as SVGGElement,
      rim: rimRefs.current,
      core: coreRefs.current,
      legs,
    }),
    [legs]
  );

  const tierWidths = [...WIDTHS, 2.1];

  return (
    <g aria-hidden="true">
      {/* the strand under the spider catches a little more light */}
      <path
        ref={silkRef}
        d="M0 0"
        fill="none"
        stroke={RIM}
        strokeOpacity={0.4}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0}
      />

      <g ref={rootRef} opacity={0} style={{ display: "none" }}>
        {/* contact shadow */}
        <g ref={shadowRef}>
          <ellipse cx={0} cy={4} rx={9.5} ry={13} fill={INK} opacity={0.32} />
        </g>

        <g ref={bodyRef}>
          {/* legs: faint off-white rim first, graphite core on top */}
          {tierWidths.map((w, k) => (
            <path
              key={`rim-${k}`}
              ref={(el) => {
                if (el) rimRefs.current[k] = el;
              }}
              d="M0 0"
              fill="none"
              stroke={RIM}
              strokeOpacity={0.42}
              strokeWidth={w + RIM_EXTRA}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {tierWidths.map((w, k) => (
            <path
              key={`core-${k}`}
              ref={(el) => {
                if (el) coreRefs.current[k] = el;
              }}
              d="M0 0"
              fill="none"
              stroke={LEG_CORE}
              strokeWidth={w}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* abdomen — rotates a little about the pedicel as the spider turns */}
          <g ref={abdomenRef}>
            <path
              d="M0 -1.4 C4.4 -1.4 6.2 3.6 5.2 8.6 C4.4 12.4 1.6 14.8 0 15.6 C-1.6 14.8 -4.4 12.4 -5.2 8.6 C-6.2 3.6 -4.4 -1.4 0 -1.4 Z"
              fill={`url(#${SPIDER_GRADIENT_IDS.abdomen})`}
              stroke={RIM}
              strokeOpacity={0.5}
              strokeWidth={0.6}
              strokeLinejoin="round"
            />
            {/* dorsal markings */}
            <path d="M0 1.8 C1.6 3 1.8 5 0 6.4 C-1.8 5 -1.6 3 0 1.8 Z" fill="#26262d" opacity={0.9} />
            <path d="M-3.1 8.4 Q0 6.8 3.1 8.4 M-2.6 11 Q0 9.6 2.6 11" fill="none" stroke="#2c2c34" strokeWidth={0.7} strokeLinecap="round" />
            <path d="M0 7.2 L1.35 9.7 L0 12.4 L-1.35 9.7 Z" fill={WEB_COLORS.crimson} opacity={0.72} />
            {/* specular edge highlights */}
            <path d="M-3.6 2.4 Q-4.7 7.4 -2.8 12" fill="none" stroke={RIM} strokeOpacity={0.34} strokeWidth={0.55} strokeLinecap="round" />
            <path d="M2.9 2.6 Q3.9 6 2.8 9.4" fill="none" stroke={RIM} strokeOpacity={0.16} strokeWidth={0.5} strokeLinecap="round" />
          </g>

          {/* pedipalps — tiny, they wave a little while the spider hesitates */}
          <g ref={palpLRef}>
            <path d="M-1.9 -9 L-3.1 -11.4 L-2.3 -13.2" fill="none" stroke={LEG_CORE} strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M-1.9 -9 L-3.1 -11.4 L-2.3 -13.2" fill="none" stroke={RIM} strokeOpacity={0.4} strokeWidth={0.4} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g ref={palpRRef}>
            <path d="M1.9 -9 L3.1 -11.4 L2.3 -13.2" fill="none" stroke={LEG_CORE} strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1.9 -9 L3.1 -11.4 L2.3 -13.2" fill="none" stroke={RIM} strokeOpacity={0.4} strokeWidth={0.4} strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* cephalothorax */}
          <path
            d="M0 -9.4 C2.6 -9.4 4 -7.2 3.8 -4.6 C3.6 -2 2.2 -0.2 0 -0.2 C-2.2 -0.2 -3.6 -2 -3.8 -4.6 C-4 -7.2 -2.6 -9.4 0 -9.4 Z"
            fill={`url(#${SPIDER_GRADIENT_IDS.head})`}
            stroke={RIM}
            strokeOpacity={0.62}
            strokeWidth={0.65}
            strokeLinejoin="round"
          />
          <path d="M-1.9 -6 Q0 -7.3 1.9 -6" fill="none" stroke={RIM} strokeOpacity={0.3} strokeWidth={0.5} strokeLinecap="round" />
          {/* fangs */}
          <path d="M-0.9 -9.2 Q-1.4 -8 -0.8 -6.8 M0.9 -9.2 Q1.4 -8 0.8 -6.8" fill="none" stroke={RIM} strokeOpacity={0.55} strokeWidth={0.5} strokeLinecap="round" />
          {/* a restrained cluster of eyes — small glints, not a face */}
          <circle cx={-1.15} cy={-7.1} r={0.42} fill={RIM} fillOpacity={0.75} />
          <circle cx={1.15} cy={-7.1} r={0.42} fill={RIM} fillOpacity={0.75} />
          <circle cx={-0.5} cy={-7.9} r={0.28} fill={RIM} fillOpacity={0.55} />
          <circle cx={0.5} cy={-7.9} r={0.28} fill={RIM} fillOpacity={0.55} />
        </g>
      </g>
    </g>
  );
});

export default HeroSpiderArt;

/** Gradient defs shared by every spider; render once inside the layer. */
export function SpiderDefs() {
  return (
    <defs>
      <radialGradient id={SPIDER_GRADIENT_IDS.abdomen} cx="0.36" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#3b3b44" />
        <stop offset="0.45" stopColor="#1b1b20" />
        <stop offset="1" stopColor="#0c0c0f" />
      </radialGradient>
      <radialGradient id={SPIDER_GRADIENT_IDS.head} cx="0.4" cy="0.3" r="0.85">
        <stop offset="0" stopColor="#40404a" />
        <stop offset="0.55" stopColor="#202026" />
        <stop offset="1" stopColor="#0f0f12" />
      </radialGradient>
    </defs>
  );
}
