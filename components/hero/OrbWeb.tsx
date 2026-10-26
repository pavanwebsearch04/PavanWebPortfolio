"use client";

import { useMemo } from "react";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport";
import { WEB_CANVAS } from "@/lib/webData";

// A real orb web: anchored frame threads, uneven radial spokes, one spiral
// capture thread whose spacing grows with distance, sagging segments and dew.
const HUB = { x: 700, y: 300 };
const SPOKES = 16;
const TURNS = 7;
const CRIMSON = "#D4483B";
const PAPER = "#EDEAE3";

function rng(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);

function build() {
  const rand = rng(2026);
  const angles = Array.from(
    { length: SPOKES },
    (_, i) => (i * Math.PI * 2) / SPOKES + (rand() - 0.5) * 0.24
  );
  const xs = 1.55;
  const pt = (a: number, r: number) => ({
    x: HUB.x + Math.cos(a) * r * xs,
    y: HUB.y + Math.sin(a) * r * 0.85,
  });
  const reach = 520;

  const frame = [0, 4, 8, 12].map((i) => {
    const e = pt(angles[i], reach * 1.6);
    return `M${f(HUB.x)} ${f(HUB.y)}L${f(e.x)} ${f(e.y)}`;
  });
  const spokes = angles.map((a) => {
    const e = pt(a, reach);
    return `M${f(HUB.x)} ${f(HUB.y)}L${f(e.x)} ${f(e.y)}`;
  });

  // spiral: walk spoke to spoke, radius rising faster further out
  const spiral: string[] = [];
  const dew: { x: number; y: number; r: number }[] = [];
  const steps = SPOKES * TURNS;
  const radiusAt = (k: number) => 24 + Math.pow(k / steps, 1.35) * (reach - 40);
  let prev = pt(angles[0], radiusAt(0));
  for (let k = 1; k <= steps; k++) {
    const a = angles[k % SPOKES] + (k >= SPOKES * 0 && k % SPOKES === 0 ? Math.PI * 2 : 0);
    const cur = pt(a, radiusAt(k));
    const mx = (prev.x + cur.x) / 2;
    const my = (prev.y + cur.y) / 2;
    const sag = 0.08;
    const cx = mx + (HUB.x - mx) * sag;
    const cy = my + (HUB.y - my) * sag;
    spiral.push(`M${f(prev.x)} ${f(prev.y)}Q${f(cx)} ${f(cy)} ${f(cur.x)} ${f(cur.y)}`);
    if (k % 4 === 0) dew.push({ x: cur.x, y: cur.y, r: 1.5 + rand() });
    prev = cur;
  }
  return { frame, spokes, spiral: spiral.join(""), dew };
}

export default function OrbWeb() {
  const isMobile = useIsMobileViewport();
  const web = useMemo(build, []);
  const mask = isMobile
    ? "linear-gradient(to right, rgba(0,0,0,0.25), #000)"
    : "linear-gradient(to right, transparent 0%, transparent 30%, #000 50%)";

  return (
    <svg
      viewBox={`0 0 ${WEB_CANVAS.width} ${WEB_CANVAS.height}`}
      preserveAspectRatio={isMobile ? "xMidYMid slice" : "none"}
      className="orb-web pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      aria-hidden
    >
      <g className="orb-web-sway">
        {web.frame.map((d, i) => (
          <path key={`f${i}`} d={d} className="orb-draw" pathLength={1} fill="none" stroke={PAPER} strokeOpacity={0.3} strokeWidth={1.5} style={{ animationDelay: "0ms", animationDuration: "600ms" }} />
        ))}
        {web.spokes.map((d, i) => (
          <path key={`s${i}`} d={d} className="orb-draw" pathLength={1} fill="none" stroke={PAPER} strokeOpacity={0.2} strokeWidth={1} style={{ animationDelay: `${150 + i * 30}ms`, animationDuration: "800ms" }} />
        ))}
        <path d={web.spiral} className="orb-draw" pathLength={1} fill="none" stroke={CRIMSON} strokeOpacity={0.4} strokeWidth={0.6} style={{ animationDelay: "300ms", animationDuration: "1200ms" }} />
        {web.dew.map((d, i) => (
          <g key={`d${i}`} className="orb-dew" style={{ animationDelay: `${1300 + i * 8}ms` }}>
            <circle cx={d.x} cy={d.y} r={d.r} fill={PAPER} fillOpacity={0.45} />
            <circle cx={d.x - d.r * 0.3} cy={d.y - d.r * 0.3} r={d.r * 0.35} fill="#fff" fillOpacity={0.8} />
          </g>
        ))}
      </g>
    </svg>
  );
}
