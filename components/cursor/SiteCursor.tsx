"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationFrame, useMotionValue, useSpring, useTransform } from "framer-motion";
import { rangeFrom } from "@/lib/seededRandom";
import { WEB_COLORS, WEB_CONFIG } from "@/lib/webConfig";
import { useWebInteraction } from "@/hooks/useWebInteraction";
import SpiderArt, { SPIDER_VIEW } from "@/components/web/SpiderArt";

const POOL = 8;

let strandSeed = 7;
function rand() {
  // cheap non-seeded jitter is fine here — these are ephemeral, one-shot visuals
  strandSeed = (strandSeed * 16807) % 2147483647;
  return strandSeed / 2147483647;
}

const SPIDER_CLASS = "cursor-spider";

// The site-wide custom cursor: a small graphite spider. Position comes from
// the shared WebInteractionProvider springs, so nothing re-renders on pointer
// move — heading, gait, trail and hover posture are all driven by
// MotionValues or imperative DOM updates inside one animation-frame loop.
export default function SiteCursor() {
  const { cursorX, cursorY, pointerX, pointerY, engage, cursorActive, reducedMotion } = useWebInteraction();
  const { size } = WEB_CONFIG.cursor;
  const spiderRef = useRef<SVGSVGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const poolIndex = useRef(0);
  const lastSpawnAt = useRef(0);
  const motionState = useRef({ x: 0, y: 0, speed: 0, angle: 0, walking: false, primed: false });

  // reduced motion: follow the raw pointer 1:1, no springs
  const posX = reducedMotion ? pointerX : cursorX;
  const posY = reducedMotion ? pointerY : cursorY;

  useEffect(() => {
    if (!cursorActive) return;
    document.body.classList.add("custom-cursor-active");
    return () => document.body.classList.remove("custom-cursor-active");
  }, [cursorActive]);

  // over text fields the native text caret cursor is restored (see
  // globals.css) and the spider steps aside so it never sits on the text
  // what the pointer is over: links/buttons make the spider grow, project
  // cards (data-cursor="view") grow it further and show a VIEW label
  const [mode, setMode] = useState<"default" | "link" | "view">("default");
  const modeScale = useMotionValue(1);
  useEffect(() => {
    modeScale.set(mode === "view" ? 1.8 : mode === "link" ? 1.45 : 1);
  }, [mode, modeScale]);

  useEffect(() => {
    if (!cursorActive) return;
    const onOver = (e: PointerEvent) => {
      const t = e.target;
      const next =
        t instanceof Element
          ? t.closest("[data-cursor='view']")
            ? "view"
            : t.closest("a, button, [role='button'], summary, label[for]")
              ? "link"
              : "default"
          : "default";
      setMode((m) => (m === next ? m : next));
    };
    document.addEventListener("pointerover", onOver, { passive: true });
    return () => document.removeEventListener("pointerover", onOver);
  }, [cursorActive]);

  useEffect(() => {
    if (!cursorActive) return;
    const onOver = (e: PointerEvent) => {
      const el = spiderRef.current;
      if (!el) return;
      const t = e.target;
      const onField =
        t instanceof Element &&
        Boolean(t.closest('textarea, select, input:not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), [contenteditable="true"]'));
      el.style.opacity = onField ? "0" : "1";
    };
    document.addEventListener("pointerover", onOver, { passive: true });
    return () => document.removeEventListener("pointerover", onOver);
  }, [cursorActive]);

  // heading: unwrapped degrees, smoothed so turns are never a snap
  const headingTarget = useMotionValue(0);
  const heading = useSpring(headingTarget, { stiffness: 110, damping: 15, mass: 0.7 });

  // hover: legs spread (a springy overshoot reads as a quick "reaction");
  // press: legs briefly draw in
  const spreadTarget = useTransform(engage, [0, 1], [1, 1.2]);
  const spread = useSpring(spreadTarget, { stiffness: 360, damping: 13 });
  const press = useMotionValue(0);
  const pressSpring = useSpring(press, { stiffness: 520, damping: 24 });
  const legScale = useTransform([spread, pressSpring], (latest) => {
    const [s, p] = latest as number[];
    return s * (1 - 0.16 * p);
  });
  const bodyScale = useTransform(engage, [0, 1], [1, 1.07]);
  // whole-cursor size: grows over links / project cards, squeezes to 0.8 on click
  const cursorScale = useSpring(
    useTransform([modeScale, pressSpring], (latest) => {
      const [m, p] = latest as number[];
      return m * (1 - 0.2 * p);
    }),
    { stiffness: 320, damping: 20 }
  );
  const accentOpacity = useTransform(engage, [0, 1], [0, 1]);

  useEffect(() => {
    if (!cursorActive) return;
    const down = () => press.set(1);
    const up = () => press.set(0);
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("blur", up);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("blur", up);
    };
  }, [cursorActive, press]);

  // one loop: heading from travel direction, gait on/off, rare trail strands
  useAnimationFrame((time, delta) => {
    if (!cursorActive || reducedMotion || delta <= 0) return;
    const st = motionState.current;
    const x = cursorX.get();
    const y = cursorY.get();
    if (!st.primed) {
      st.x = x;
      st.y = y;
      st.primed = true;
      return;
    }
    const dx = x - st.x;
    const dy = y - st.y;
    st.x = x;
    st.y = y;
    const inst = Math.hypot(dx, dy) / (delta / 1000);
    st.speed += (inst - st.speed) * 0.2;

    if (st.speed > 90) {
      const raw = (Math.atan2(dy, dx) * 180) / Math.PI + 90; // spider faces up at 0deg
      const diff = ((((raw - st.angle) % 360) + 540) % 360) - 180;
      st.angle += diff;
      headingTarget.set(st.angle);
    }

    const walking = st.speed > 55;
    if (walking !== st.walking) {
      st.walking = walking;
      bodyRef.current?.classList.toggle("spider-walking", walking);
    }

    // a very faint silk strand, only on fast flicks, never more than ~6/s
    if (st.speed > 1150 && time - lastSpawnAt.current > 160) {
      lastSpawnAt.current = time;
      const back = (st.angle * Math.PI) / 180 + Math.PI / 2 + Math.PI; // opposite to travel
      const count = st.speed > 1900 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const el = pathRefs.current[poolIndex.current % POOL];
        poolIndex.current++;
        if (!el) continue;
        const a = back + rangeFrom(rand, -0.35, 0.35);
        const sx = x + Math.cos(back) * 9;
        const sy = y + Math.sin(back) * 9;
        const len = rangeFrom(rand, 28, Math.min(70, 28 + st.speed / 40));
        const tx = sx + Math.cos(a) * len;
        const ty = sy + Math.sin(a) * len;
        const bow = rangeFrom(rand, -12, 12);
        const mx = (sx + tx) / 2 + Math.cos(a + Math.PI / 2) * bow;
        const my = (sy + ty) / 2 + Math.sin(a + Math.PI / 2) * bow;
        el.setAttribute("d", `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)}, ${tx.toFixed(1)} ${ty.toFixed(1)}`);
        const total = el.getTotalLength();
        el.style.strokeDasharray = `${total}`;
        el.getAnimations().forEach((anim) => anim.cancel());
        el.animate(
          [
            { strokeDashoffset: total, opacity: 0.55 },
            { strokeDashoffset: 0, opacity: 0.4, offset: 0.4 },
            { strokeDashoffset: 0, opacity: 0 },
          ],
          { duration: rangeFrom(rand, 380, 520), easing: "ease-out", fill: "forwards" }
        );
      }
    }
  });

  if (!cursorActive) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true">
      {!reducedMotion && (
        <svg className="absolute inset-0 h-full w-full overflow-visible">
          {Array.from({ length: POOL }).map((_, i) => (
            <path
              key={i}
              ref={(el) => {
                pathRefs.current[i] = el;
              }}
              d="M 0 0"
              fill="none"
              stroke={WEB_COLORS.paper}
              strokeWidth={0.8}
              strokeLinecap="round"
              opacity={0}
            />
          ))}
        </svg>
      )}

      {/* The pointer: the spider's body centre sits exactly on the real
          pointer position, and it rotates around that point. */}
      <motion.svg
        ref={spiderRef}
        width={size}
        height={size}
        viewBox={`0 0 ${SPIDER_VIEW} ${SPIDER_VIEW}`}
        style={{
          x: posX,
          y: posY,
          rotate: reducedMotion ? 0 : heading,
          scale: reducedMotion ? 1 : cursorScale,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          transformOrigin: `${size / 2}px ${size / 2}px`,
          transition: "opacity 0.18s ease",
        }}
        className={`${SPIDER_CLASS} absolute left-0 top-0 overflow-visible`}
      >
        <SpiderArt ref={bodyRef} legScale={legScale} bodyScale={bodyScale} accentOpacity={accentOpacity} />
      </motion.svg>

      {/* VIEW label beside the spider while over a project card */}
      <motion.div style={{ x: posX, y: posY }} className="absolute left-0 top-0">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full border border-crimson-bright/70 bg-crimson-bright/15 font-mono text-[0.6rem] tracking-[0.12em] text-paper"
          style={{
            marginLeft: 26,
            marginTop: 26,
            opacity: mode === "view" ? 1 : 0,
            transform: `scale(${mode === "view" ? 1 : 0.4})`,
            transition: "opacity 0.25s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          VIEW
        </div>
      </motion.div>
    </div>
  );
}
