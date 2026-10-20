"use client";

import { useMemo, useRef } from "react";
import { useOnScreen } from "@/hooks/useOnScreen";
import { motion, MotionValue, useTransform } from "framer-motion";
import { WebNode, curvedThread } from "@/lib/webData";
import { mulberry32, rangeFrom } from "@/lib/seededRandom";
import { SocialLink } from "@/data/contact";
import HeroWebReactiveThread from "@/components/hero/HeroWebReactiveThread";
import ContactNode from "./ContactNode";
import ContactCTA from "./ContactCTA";

const CANVAS = { width: 800, height: 800 };
const CENTER = { x: 400, y: 400 };

function buildNodes(links: SocialLink[]): WebNode[] {
  const rng = mulberry32(6217);
  return links.map((link, i) => {
    const angle = (i / links.length) * Math.PI * 2 - Math.PI / 2 + rangeFrom(rng, -0.1, 0.1);
    const radius = 290 + rangeFrom(rng, -14, 14);
    return {
      id: link.id,
      x: CENTER.x + Math.cos(angle) * radius,
      y: CENTER.y + Math.sin(angle) * radius,
      angle,
      radius,
      depth: "foreground",
      size: rangeFrom(rng, 2.4, 3.4),
      parallax: 1,
      delay: 0.3 + i * 0.1,
    };
  });
}

export default function ContactWeb({
  socialLinks,
  email,
  pointerX,
  pointerY,
  scrollYProgress,
  interactive,
  activeId,
  onActivate,
  formActive,
}: {
  socialLinks: SocialLink[];
  email: string;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  scrollYProgress: MotionValue<number>;
  interactive: boolean;
  activeId: string | null;
  onActivate: (id: string | null) => void;
  formActive: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const onScreen = useOnScreen(svgRef, 160);
  const idle = interactive && onScreen;
  const nodes = useMemo(() => buildNodes(socialLinks), [socialLinks]);

  // faint cross-links between neighboring satellites, purely decorative
  const rings = useMemo(() => {
    const rng = mulberry32(52);
    return nodes.map((node, i) => {
      const next = nodes[(i + 1) % nodes.length];
      const bow = rangeFrom(rng, -22, 22);
      return curvedThread(node.x, node.y, next.x, next.y, bow).d;
    });
  }, [nodes]);

  const scrollY = useTransform(scrollYProgress, [0, 1], [0, -26]);
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.65]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]">
      <motion.svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
        className="absolute inset-0 h-full w-full overflow-visible"
        style={{ y: scrollY, opacity: scrollOpacity }}
        aria-hidden
      >
        <motion.g
          animate={idle ? { x: [0, 3, -2, 0], y: [0, -2, 2, 0] } : undefined}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
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
              transition={{ duration: 1.1, delay: 0.4 + i * 0.05 }}
            />
          ))}

          {nodes.map((node, i) => (
            <HeroWebReactiveThread
              key={node.id}
              node={node}
              anchor={CENTER}
              bow={i % 2 === 0 ? 16 : -16}
              pointerX={pointerX}
              pointerY={pointerY}
              interactive={interactive}
              delay={0.3 + i * 0.07}
              active={activeId === node.id || activeId === "cta" || formActive}
            />
          ))}
        </motion.g>
      </motion.svg>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <ContactCTA
          email={email}
          active={activeId === "cta"}
          onActivate={onActivate}
          interactive={interactive}
        />
      </div>

      {nodes.map((node, i) => {
        const link = socialLinks[i];
        return (
          <ContactNode
            key={node.id}
            node={node}
            label={link.label}
            href={link.href}
            active={activeId === node.id}
            onActivate={onActivate}
            pointerX={pointerX}
            pointerY={pointerY}
            interactive={interactive}
            delay={node.delay}
            canvas={CANVAS}
          />
        );
      })}
    </div>
  );
}
