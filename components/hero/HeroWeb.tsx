"use client";

import { useMemo, useRef, useState } from "react";
import { useOnScreen } from "@/hooks/useOnScreen";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport";
import {
  motion,
  MotionValue,
  useTransform,
  useVelocity,
  useMotionValueEvent,
} from "framer-motion";
import { generateWebGeometry, WebDepth, WEB_CANVAS } from "@/lib/webData";
import HeroWebNode from "./HeroWebNode";
import HeroWebReactiveThread from "./HeroWebReactiveThread";
import HeroSpiders from "./HeroSpiders";

const DEPTH_ORDER: WebDepth[] = ["ambient", "background", "structural", "midground", "foreground"];
const DEPTH_STROKE_OPACITY: Record<WebDepth, number> = {
  ambient: 0.035,
  background: 0.07,
  structural: 0.13,
  midground: 0.22,
  foreground: 0.34,
};
const DEPTH_STROKE_WIDTH: Record<WebDepth, number> = {
  ambient: 0.4,
  background: 0.5,
  structural: 0.65,
  midground: 0.85,
  foreground: 1,
};
const DEPTH_PARALLAX_PX: Record<WebDepth, number> = {
  ambient: 3,
  background: 6,
  structural: 12,
  midground: 16,
  foreground: 26,
};
const DEPTH_DRAW_DELAY: Record<WebDepth, number> = {
  ambient: 0.02,
  background: 0.08,
  structural: 0.18,
  midground: 0.28,
  foreground: 0.38,
};
// idle "still alive" sway — only on the non-reactive layers so it never
// fights the cursor-tension physics on midground/foreground
const DEPTH_IDLE_SWAY: Partial<Record<WebDepth, number>> = {
  ambient: 14,
  background: 10,
  structural: 12,
};

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export default function HeroWeb({
  pointerX,
  pointerY,
  scrollYProgress,
  interactive,
}: {
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  scrollYProgress: MotionValue<number>;
  interactive: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  // idle sway only runs while the hero is actually near the viewport
  const onScreen = useOnScreen(svgRef, 120);
  const isMobile = useIsMobileViewport();
  const idle = interactive && onScreen;
  const geometry = useMemo(() => generateWebGeometry(1337, 22), []);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleId = useRef(0);
  const lastRippleAt = useRef(0);

  const vx = useVelocity(pointerX);
  const vy = useVelocity(pointerY);
  const speed = useTransform([vx, vy], (latest) => {
    const [a, b] = latest as number[];
    return Math.hypot(a, b);
  });

  const reactiveNodes = useMemo(
    () => geometry.nodes.filter((n) => n.depth === "midground" || n.depth === "foreground"),
    [geometry]
  );

  useMotionValueEvent(speed, "change", (v) => {
    if (!interactive) return;
    const now = performance.now();
    if (v > 900 && now - lastRippleAt.current > 450) {
      lastRippleAt.current = now;
      const px = pointerX.get();
      const py = pointerY.get();
      let nearest = reactiveNodes[0];
      let best = Infinity;
      for (const n of reactiveNodes) {
        const d = Math.hypot(n.x - px, n.y - py);
        if (d < best) {
          best = d;
          nearest = n;
        }
      }
      if (nearest && best < 220) {
        const id = rippleId.current++;
        setRipples((prev) => [...prev.slice(-3), { id, x: nearest.x, y: nearest.y }]);
      }
    }
  });

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WEB_CANVAS.width} ${WEB_CANVAS.height}`}
      // desktop stretches the wide canvas to the hero; on the tall mobile hero that
      // would squash rings into tangled ellipses, so keep proportions and crop instead
      preserveAspectRatio={isMobile ? "xMidYMid slice" : "none"}
      className="absolute inset-0 h-full w-full overflow-visible"
      aria-hidden
    >
      {DEPTH_ORDER.map((depth) => (
        <DepthGroup
          key={depth}
          depth={depth}
          geometry={geometry}
          pointerX={pointerX}
          pointerY={pointerY}
          scrollYProgress={scrollYProgress}
          interactive={interactive}
          idle={idle}
        />
      ))}

      {/* spiders crawling the strands drawn above */}
      <HeroSpiders
        geometry={geometry}
        pointerX={pointerX}
        pointerY={pointerY}
        scrollYProgress={scrollYProgress}
        interactive={interactive}
        active={onScreen}
      />

      {/* ripple / vibration pulses */}
      {ripples.map((r) => (
        <motion.circle
          key={r.id}
          cx={r.x}
          cy={r.y}
          fill="none"
          stroke="#D4483B"
          strokeWidth={1}
          initial={{ r: 4, opacity: 0.5 }}
          animate={{ r: 60, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          onAnimationComplete={() => setRipples((prev) => prev.filter((p) => p.id !== r.id))}
        />
      ))}
    </svg>
  );
}

function DepthGroup({
  depth,
  geometry,
  pointerX,
  pointerY,
  scrollYProgress,
  interactive,
  idle,
}: {
  depth: WebDepth;
  geometry: ReturnType<typeof generateWebGeometry>;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  scrollYProgress: MotionValue<number>;
  interactive: boolean;
  idle: boolean;
}) {
  const strength = DEPTH_PARALLAX_PX[depth];
  const layerX = useTransform(pointerX, [0, WEB_CANVAS.width], [strength / 2, -strength / 2]);
  const layerY = useTransform(pointerY, [0, WEB_CANVAS.height], [strength / 2, -strength / 2]);

  const rings = geometry.rings.filter((r) => r.depth === depth);
  const radials = geometry.radials.filter((r) => r.depth === depth);
  const chords = geometry.chords.filter((r) => r.depth === depth);
  const ambientThreads = depth === "ambient" ? geometry.ambientThreads : [];
  const nodes = geometry.nodes.filter((n) => n.depth === depth);
  const isReactive = depth === "midground" || depth === "foreground";

  const scrollOpacity = useTransform(
    scrollYProgress,
    [0, 1],
    [1, depth === "ambient" || depth === "background" ? 0.6 : depth === "structural" ? 0.35 : 0.08]
  );

  const idleAmplitude = DEPTH_IDLE_SWAY[depth];

  const content = (
    <>
      {ambientThreads.map((thread) => (
        <motion.path
          key={thread.id}
          d={thread.d}
          fill="none"
          stroke="#EDEAE3"
          strokeWidth={DEPTH_STROKE_WIDTH.ambient}
          strokeOpacity={DEPTH_STROKE_OPACITY.ambient}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: DEPTH_DRAW_DELAY.ambient, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
      {rings.map((ring) => (
        <motion.path
          key={ring.id}
          d={ring.d}
          fill="none"
          stroke="#EDEAE3"
          strokeWidth={DEPTH_STROKE_WIDTH[depth]}
          strokeOpacity={DEPTH_STROKE_OPACITY[depth]}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: DEPTH_DRAW_DELAY[depth], ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
      {radials.map((thread) => (
        <motion.path
          key={thread.id}
          d={thread.d}
          fill="none"
          stroke="#EDEAE3"
          strokeWidth={DEPTH_STROKE_WIDTH[depth]}
          strokeOpacity={DEPTH_STROKE_OPACITY[depth]}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: DEPTH_DRAW_DELAY[depth] + 0.1, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
      {chords.map((thread) => (
        <motion.path
          key={thread.id}
          d={thread.d}
          fill="none"
          stroke="#EDEAE3"
          strokeWidth={DEPTH_STROKE_WIDTH[depth] * 0.85}
          strokeOpacity={DEPTH_STROKE_OPACITY[depth] * 0.8}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, delay: DEPTH_DRAW_DELAY[depth] + 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}

      {isReactive
        ? nodes.map((node) => (
            <HeroWebNode
              key={node.id}
              node={node}
              pointerX={pointerX}
              pointerY={pointerY}
              scrollYProgress={scrollYProgress}
              interactive={interactive}
            />
          ))
        : nodes.map((node) => (
            <motion.circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill="#EDEAE3"
              fillOpacity={depth === "ambient" ? 0.2 : 0.32}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: node.delay }}
            />
          ))}

      {depth === "foreground" &&
        nodes.slice(0, 4).map((node, i) => (
          <HeroWebReactiveThread
            key={`reactive-${node.id}`}
            node={node}
            anchor={geometry.anchor}
            bow={i % 2 === 0 ? 16 : -16}
            pointerX={pointerX}
            pointerY={pointerY}
            interactive={interactive}
            delay={0.6 + i * 0.05}
          />
        ))}
    </>
  );

  return (
    <motion.g style={{ x: layerX, y: layerY, opacity: scrollOpacity }} data-web-layer={depth}>
      {idleAmplitude && idle ? (
        <motion.g
          data-web-sway={depth}
          animate={{
            x: [0, idleAmplitude * 0.3, -idleAmplitude * 0.2, 0],
            y: [0, -idleAmplitude * 0.2, idleAmplitude * 0.15, 0],
          }}
          transition={{ duration: 12 + idleAmplitude, repeat: Infinity, ease: "easeInOut" }}
        >
          {content}
        </motion.g>
      ) : (
        content
      )}
    </motion.g>
  );
}
