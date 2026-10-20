"use client";

import { forwardRef } from "react";
import { motion, type MotionValue } from "framer-motion";
import { WEB_COLORS } from "@/lib/webConfig";

/* ------------------------------------------------------------------ */
/* Shared spider artwork (cursor + Lab demo). Authored on a 40-unit     */
/* square with the body centre at (0,0) inside a translate(20 20)       */
/* group, facing up (-y). Legs are two alternating gait groups          */
/* (alternate-tetrapod), so they skitter while the spider walks, and    */
/* the whole leg set can spread.                                        */
/* ------------------------------------------------------------------ */
export const SPIDER_VIEW = 40;
const HALF = SPIDER_VIEW / 2;

// right-hand legs, front to back: attachment -> knee -> foot
const RIGHT_LEGS: Array<Array<[number, number]>> = [
  [[1.6, -5.4], [7.4, -12.6], [13.2, -14.8]],
  [[1.9, -4.0], [10.0, -8.8], [16.2, -8.0]],
  [[1.9, -2.4], [10.6, -0.8], [16.6, 4.4]],
  [[1.6, -0.9], [8.4, 6.4], [11.6, 14.8]],
];
// the left side is mirrored with small deliberate differences, so the
// spider isn't perfectly symmetric
const LEFT_NUDGE: Array<[number, number]> = [
  [0.4, 0.5],
  [-0.3, -0.4],
  [0.5, 0.3],
  [-0.4, -0.5],
];

const legPath = (pts: Array<[number, number]>) => `M ${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")}`;

const GAIT_A: string[] = [];
const GAIT_B: string[] = [];
RIGHT_LEGS.forEach((leg, i) => {
  const left = leg.map(([x, y], k) => [-x + (k > 0 ? LEFT_NUDGE[i][0] : 0), y + (k > 0 ? LEFT_NUDGE[i][1] : 0)] as [number, number]);
  // alternate-tetrapod gait: R1 L2 R3 L4 vs L1 R2 L3 R4
  (i % 2 === 0 ? GAIT_A : GAIT_B).push(legPath(leg));
  (i % 2 === 0 ? GAIT_B : GAIT_A).push(legPath(left));
});
const LEGS_A = GAIT_A.join(" ");
const LEGS_B = GAIT_B.join(" ");

const HALO = "#0a0a0c";
const BODY_DARK = "#1c1c21";
const BODY_MID = "#2c2c33";

const CRIMSON_MARK = "M 0 2.4 L 1.5 5.2 L 0 8.4 L -1.5 5.2 Z";

interface SpiderArtProps {
  /** scale applied to the legs only (hover spread / click draw-in) */
  legScale?: MotionValue<number>;
  /** scale applied to the body only */
  bodyScale?: MotionValue<number>;
  /** 0..1 extra crimson on the mark and eyes while the spider is reacting */
  accentOpacity?: MotionValue<number>;
}

// Add the `spider-walking` class to the forwarded <g> to start the gait.
const SpiderArt = forwardRef<SVGGElement, SpiderArtProps>(function SpiderArt({ legScale, bodyScale, accentOpacity }, ref) {
  return (
    <g transform={`translate(${HALF} ${HALF})`}>
      <g ref={ref} className="cursor-spider-body">
        <motion.g style={{ scale: legScale }}>
          {[
            { cls: "spider-gait-a", d: LEGS_A },
            { cls: "spider-gait-b", d: LEGS_B },
          ].map((g) => (
            <g key={g.cls} className={g.cls}>
              {/* dark halo keeps the thin legs readable over lighter content */}
              <path d={g.d} fill="none" stroke={HALO} strokeOpacity={0.6} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
              <path d={g.d} fill="none" stroke={WEB_COLORS.paper} strokeOpacity={0.92} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}
        </motion.g>

        <motion.g style={{ scale: bodyScale }}>
          {/* fangs / pedipalps */}
          <path d="M -0.9 -7 L -1.7 -9.2 M 0.9 -7 L 1.7 -9.2" stroke={WEB_COLORS.paper} strokeOpacity={0.85} strokeWidth={0.8} strokeLinecap="round" fill="none" />
          {/* abdomen */}
          <ellipse cx={0} cy={5.1} rx={5} ry={6.6} fill="none" stroke={HALO} strokeOpacity={0.6} strokeWidth={2.6} />
          <ellipse cx={0} cy={5.1} rx={4.6} ry={6.2} fill={BODY_DARK} stroke={WEB_COLORS.paper} strokeOpacity={0.85} strokeWidth={0.8} />
          {/* cephalothorax */}
          <ellipse cx={0} cy={-3.4} rx={3.6} ry={4.1} fill="none" stroke={HALO} strokeOpacity={0.6} strokeWidth={2.6} />
          <ellipse cx={0} cy={-3.4} rx={3.2} ry={3.7} fill={BODY_MID} stroke={WEB_COLORS.paper} strokeOpacity={0.9} strokeWidth={0.8} />
          {/* off-white highlights */}
          <path d="M -2.7 2.4 Q -3.3 6 -1.9 9.4" fill="none" stroke={WEB_COLORS.paper} strokeOpacity={0.5} strokeWidth={0.7} strokeLinecap="round" />
          <path d="M -1.6 -5.6 Q 0 -6.6 1.6 -5.6" fill="none" stroke={WEB_COLORS.paper} strokeOpacity={0.45} strokeWidth={0.6} strokeLinecap="round" />
          {/* crimson hourglass mark, brighter while the spider is reacting */}
          <path d={CRIMSON_MARK} fill={WEB_COLORS.crimson} opacity={0.7} />
          {accentOpacity && <motion.path d={CRIMSON_MARK} fill={WEB_COLORS.crimsonText} style={{ opacity: accentOpacity }} />}
          {/* eyes */}
          <circle cx={-1.1} cy={-5.5} r={0.6} fill={WEB_COLORS.paper} />
          <circle cx={1.1} cy={-5.5} r={0.6} fill={WEB_COLORS.paper} />
          {accentOpacity && (
            <motion.g style={{ opacity: accentOpacity }}>
              <circle cx={-1.1} cy={-5.5} r={0.7} fill={WEB_COLORS.crimsonText} />
              <circle cx={1.1} cy={-5.5} r={0.7} fill={WEB_COLORS.crimsonText} />
            </motion.g>
          )}
        </motion.g>
      </g>
    </g>
  );
});

export default SpiderArt;
