"use client";

import { useMemo, useRef, useState } from "react";
import { useOnScreen } from "@/hooks/useOnScreen";
import { motion, MotionValue, useTransform } from "framer-motion";
import Image from "next/image";
import { WebNode, curvedThread } from "@/lib/webData";
import { mulberry32, rangeFrom } from "@/lib/seededRandom";
import { useBorderThreads } from "@/hooks/useBorderThreads";
import { heroImages } from "@/data/images";
import HeroWebReactiveThread from "@/components/hero/HeroWebReactiveThread";
import AboutNode from "./AboutNode";

const CANVAS = { width: 800, height: 800 };
const CENTER = { x: 400, y: 400 };

const CONCEPTS: Array<{ id: string; label: string }> = [
  { id: "code", label: "CODE" },
  { id: "design", label: "DESIGN" },
  { id: "wordpress", label: "WORDPRESS" },
  { id: "react", label: "REACT" },
  { id: "creativity", label: "CREATIVITY" },
  { id: "problem-solving", label: "PROBLEM SOLVING" },
];

function buildNodes(): WebNode[] {
  const rng = mulberry32(4171);
  return CONCEPTS.map((c, i) => {
    const angle = (i / CONCEPTS.length) * Math.PI * 2 - Math.PI / 2 + rangeFrom(rng, -0.12, 0.12);
    const radius = 292 + rangeFrom(rng, -14, 14);
    return {
      id: c.id,
      x: CENTER.x + Math.cos(angle) * radius,
      y: CENTER.y + Math.sin(angle) * radius,
      angle,
      radius,
      depth: "foreground",
      size: rangeFrom(rng, 2.4, 3.4),
      parallax: 1,
      delay: 0.3 + i * 0.09,
    };
  });
}

export default function AboutWeb({
  pointerX,
  pointerY,
  scrollYProgress,
  interactive,
  activeId,
  onActivate,
}: {
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  scrollYProgress: MotionValue<number>;
  interactive: boolean;
  activeId: string | null;
  onActivate: (id: string | null) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const onScreen = useOnScreen(svgRef, 160);
  const idle = interactive && onScreen;
  const nodes = useMemo(buildNodes, []);
  const [imageFailed, setImageFailed] = useState(false);

  // faint satellite-to-satellite cross-links, purely decorative
  const rings = useMemo(() => {
    const rng = mulberry32(88);
    return nodes.map((node, i) => {
      const next = nodes[(i + 1) % nodes.length];
      const bow = rangeFrom(rng, -20, 20);
      return curvedThread(node.x, node.y, next.x, next.y, bow).d;
    });
  }, [nodes]);

  const behindThreads = useBorderThreads(613, 4);
  const frontThreads = useBorderThreads(347, 4);

  const scrollY = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.6]);

  return (
    <div className="flex w-full flex-col items-center gap-6">
    <div className="relative mx-auto aspect-square w-full max-w-[620px]">
      <motion.svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
        className="absolute inset-0 h-full w-full overflow-visible"
        style={{ y: scrollY, opacity: scrollOpacity }}
        aria-hidden
      >
        <motion.g
          animate={idle ? { x: [0, 3, -2, 0], y: [0, -2, 2, 0] } : undefined}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        >
          {rings.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              fill="none"
              stroke="#EDEAE3"
              strokeWidth={0.5}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.08 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.5 + i * 0.05 }}
            />
          ))}

          {nodes.map((node, i) => (
            <HeroWebReactiveThread
              key={node.id}
              node={node}
              anchor={CENTER}
              bow={i % 2 === 0 ? 14 : -14}
              pointerX={pointerX}
              pointerY={pointerY}
              interactive={interactive}
              delay={0.35 + i * 0.06}
              active={activeId === node.id}
            />
          ))}

          {/* floating particles — extremely subtle, sparse, slow drift */}
          {idle &&
            [0, 1, 2, 3].map((i) => {
              const angle = (i / 4) * Math.PI * 2 + 0.6;
              const r = 340;
              const px = CENTER.x + Math.cos(angle) * r;
              const py = CENTER.y + Math.sin(angle) * r;
              return (
                <motion.circle
                  key={i}
                  cx={px}
                  cy={py}
                  r={1.1}
                  fill="#EDEAE3"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 0.3, 0],
                    x: [0, rangeFrom(mulberry32(i + 1), -14, 14), 0],
                    y: [0, rangeFrom(mulberry32(i + 2), -14, 14), 0],
                  }}
                  transition={{ duration: 9 + i * 2, repeat: Infinity, ease: "easeInOut", delay: i * 1.4 }}
                />
              );
            })}
        </motion.g>
      </motion.svg>

      {/* center portrait */}
      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3"
        style={{ left: "50%", top: "50%" }}
      >
        <div className="relative h-28 w-28 md:h-32 md:w-32">
          <svg viewBox="-30 -30 160 185" className="pointer-events-none absolute -inset-[30%] overflow-visible" aria-hidden>
            {behindThreads.map((d, i) => (
              <motion.path
                key={i}
                d={d}
                fill="none"
                stroke="#EDEAE3"
                strokeWidth={0.6}
                strokeOpacity={0.2}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.15 + i * 0.06 }}
              />
            ))}
          </svg>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-full w-full overflow-hidden border border-paper/15"
          >
            <Image
              src={imageFailed ? "/portrait-placeholder.svg" : heroImages.portrait.src}
              alt={heroImages.portrait.alt}
              fill
              unoptimized={imageFailed}
              onError={() => setImageFailed(true)}
              sizes="256px"
              className="object-cover object-top contrast-[1.05] saturate-[0.9]"
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(10,10,12,0.5)_100%)]" />
            <div className="film-grain" />
          </motion.div>

          <svg viewBox="-30 -30 160 185" className="pointer-events-none absolute -inset-[30%] overflow-visible" aria-hidden>
            {frontThreads.map((d, i) => (
              <motion.path
                key={i}
                d={d}
                fill="none"
                stroke="#EDEAE3"
                strokeWidth={0.7}
                strokeOpacity={0.26}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.3 + i * 0.05 }}
              />
            ))}
          </svg>
        </div>

        <motion.span
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="font-mono text-nav tracking-[0.16em] text-paper-body"
        >
          PAVAN
        </motion.span>
      </div>

      {nodes.map((node, i) => (
        <AboutNode
          key={node.id}
          node={node}
          label={CONCEPTS[i].label}
          active={activeId === node.id}
          onActivate={onActivate}
          pointerX={pointerX}
          pointerY={pointerY}
          interactive={interactive}
          delay={node.delay}
        />
      ))}
    </div>

      {/* narrow screens: the ring has no room for readable labels, so the same
          concepts are offered as touch-friendly pills below it */}
      <ul className="flex flex-wrap justify-center gap-2.5 min-[480px]:hidden">
        {CONCEPTS.map((c) => {
          const on = activeId === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onActivate(on ? null : c.id)}
                className={`min-h-[44px] border px-3.5 py-2 font-mono text-nav transition-colors ${
                  on ? "border-crimson-text bg-ink-panel text-paper" : "border-paper/30 bg-ink-graphite text-paper-body"
                }`}
              >
                {c.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
