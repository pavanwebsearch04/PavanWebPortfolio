"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion, type MotionValue, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { buildRouteGraph, sampleSvgPath, type Strand } from "@/lib/heroSpiderGraph";
import { WEB_CANVAS, type WebGeometry } from "@/lib/webData";
import HeroSpiderArt, { SpiderDefs, type SpiderHandle } from "./HeroSpiderArt";
import { HeroSpiderEngine, MAX_SPIDERS } from "./heroSpiderEngine";

// How many spiders the hero's width can carry (three on tablet and desktop).
function baseCountFor(width: number) {
  if (width >= 768) return 3;
  if (width >= 420) return 2;
  return 1;
}

/**
 * Spiders that crawl the hero web's real strands. Rendered inside the web's
 * own <svg>, so they share its coordinate space and sit above the strands but
 * beneath the hero's text and portrait (which are separate, higher layers).
 */
export default function HeroSpiders({
  geometry,
  pointerX,
  pointerY,
  scrollYProgress,
  interactive,
  active,
}: {
  geometry: WebGeometry;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  scrollYProgress: MotionValue<number>;
  interactive: boolean;
  active: boolean;
}) {
  const reduced = useReducedMotion();
  const layerRef = useRef<SVGGElement>(null);
  const handles = useRef<Array<SpiderHandle | null>>([]);
  const engineRef = useRef<HeroSpiderEngine | null>(null);
  const activeRef = useRef(active);
  const interactiveRef = useRef(interactive);
  activeRef.current = active;
  interactiveRef.current = interactive;

  // spiders fade with the rest of the web as the hero scrolls away
  const opacity = useTransform(scrollYProgress, [0, 0.55, 0.9], [1, 0.45, 0]);

  // the strands spiders may walk: every ring, radial and chord that is drawn
  // with real weight. The near-invisible "ambient" sweeps are left out.
  const sources = useMemo(() => {
    const list: Array<{ id: string; depth: Strand["depth"]; d: string }> = [];
    geometry.rings.forEach((t) => list.push({ id: t.id, depth: t.depth, d: t.d }));
    geometry.radials.forEach((t) => list.push({ id: t.id, depth: t.depth, d: t.d }));
    geometry.chords.forEach((t) => list.push({ id: t.id, depth: t.depth, d: t.d }));
    return list.filter((t) => t.depth !== "ambient");
  }, [geometry]);

  useEffect(() => {
    const layer = layerRef.current;
    const svg = layer?.ownerSVGElement ?? null;
    const section = svg?.closest("section") ?? null;
    if (!layer || !svg || !section) return;
    const arts = handles.current.filter((h): h is SpiderHandle => Boolean(h));
    if (arts.length < MAX_SPIDERS) return;

    const strands = sources.map((s) => sampleSvgPath(layer, s.id, s.depth, s.d, 3));
    const graph = buildRouteGraph(strands);

    const engine = new HeroSpiderEngine({
      graph,
      handles: arts,
      svg,
      section: section as HTMLElement,
      canvas: WEB_CANVAS,
      getPointer: () =>
        interactiveRef.current ? { x: pointerX.get(), y: pointerY.get() } : null,
      getScroll: () => scrollYProgress.get(),
      seed: 1337 + (Date.now() % 9973),
    });
    engineRef.current = engine;
    engine.setReduced(reduced);
    engine.setCoarse(window.matchMedia("(pointer: coarse)").matches);

    const apply = () => {
      const w = section.getBoundingClientRect().width;
      let n = baseCountFor(w);
      if (reduced) n = Math.min(n, 3);
      engine.setCount(n);
    };

    const ready = () => {
      if (!engine.init()) return false;
      apply();
      if (reduced) engine.renderStatic();
      else if (activeRef.current) engine.start();
      return true;
    };

    let started = ready();
    let pending = 0;
    // strands finish drawing in over ~1.5s; the first measurement can race it
    if (!started) pending = window.setTimeout(() => (started = ready()), 400);

    const ro = new ResizeObserver(() => {
      if (!started) {
        started = ready();
        return;
      }
      engine.layout();
      apply();
      if (reduced) engine.renderStatic();
    });
    ro.observe(section);

    const onVisibility = () => {
      if (document.hidden) engine.stop();
      else if (activeRef.current && !reduced) engine.start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(pending);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
    // pointer / scroll values are stable MotionValues
  }, [sources, reduced, pointerX, pointerY, scrollYProgress]);

  // run only while the hero is actually near the viewport
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || reduced) return;
    if (active && !document.hidden) engine.start();
    else engine.stop();
  }, [active, reduced]);

  return (
    <motion.g ref={layerRef} style={{ opacity }} aria-hidden="true">
      <SpiderDefs />
      {Array.from({ length: MAX_SPIDERS }).map((_, i) => (
        <HeroSpiderArt
          key={i}
          seed={i + 1}
          ref={(h) => {
            handles.current[i] = h;
          }}
        />
      ))}
    </motion.g>
  );
}
