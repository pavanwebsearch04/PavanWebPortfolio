"use client";

import { useMemo, useRef } from "react";
import { useOnScreen } from "@/hooks/useOnScreen";
import { motion } from "framer-motion";
import { generateConnectedWeb, WEB_CANVAS } from "@/lib/webData";
import { projects } from "@/data/projects";

export interface WebAnchorInput {
  id: string;
  x: number;
  y: number;
}

export default function ProjectWeb({
  activeSlug,
  interactive,
  anchors: anchorsProp,
}: {
  activeSlug: string | null;
  interactive: boolean;
  /** Node positions in the web canvas; defaults to the personal projects. */
  anchors?: WebAnchorInput[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const onScreen = useOnScreen(svgRef);
  const idle = interactive && onScreen;
  const geometry = useMemo(() => {
    const anchors = anchorsProp ?? projects.map((p) => ({ id: p.slug, x: p.webPosition.x, y: p.webPosition.y }));
    return generateConnectedWeb(4242, WEB_CANVAS, anchors);
  }, [anchorsProp]);

  const activeThreadIds = activeSlug ? new Set(geometry.threadsByAnchor[activeSlug] ?? []) : null;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WEB_CANVAS.width} ${WEB_CANVAS.height}`}
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full overflow-visible"
      aria-hidden
    >
      <motion.g
        animate={
          idle ? { x: [0, 4, -3, 0], y: [0, -3, 2, 0] } : undefined
        }
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      >
        {geometry.rings.map((ring) => (
          <motion.path
            key={ring.id}
            d={ring.d}
            fill="none"
            stroke="#EDEAE3"
            strokeWidth={0.5}
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.06 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}

        {geometry.threads.map((thread, i) => {
          const isActive = activeThreadIds?.has(thread.id);
          return (
            <motion.path
              key={thread.id}
              d={thread.d}
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{
                pathLength: 1,
                opacity: thread.depth === "ambient" ? 0.08 : 0.16,
              }}
              animate={
                isActive
                  ? { opacity: 0.55, stroke: "#D4483B", strokeWidth: 1.1 }
                  : { opacity: thread.depth === "ambient" ? 0.08 : 0.16, stroke: "#EDEAE3", strokeWidth: 0.6 }
              }
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}
      </motion.g>

      {geometry.nodes.map((node) => {
        const isActive = node.id === activeSlug;
        return (
          <g key={node.id}>
            {isActive && (
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.size * 3}
                fill="#D4483B"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.22 }}
                transition={{ duration: 0.4 }}
              />
            )}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              animate={{ fill: isActive ? "#D4483B" : "#EDEAE3" }}
              transition={{ duration: 0.5 }}
              fillOpacity={isActive ? 0.9 : 0.4}
            />
          </g>
        );
      })}
    </svg>
  );
}
