"use client";

import { useMemo, useRef, useState } from "react";
import { useOnScreen } from "@/hooks/useOnScreen";
import { motion } from "framer-motion";
import { generateConnectedWeb } from "@/lib/webData";
import { services } from "@/data/services";
import ServiceNode from "./ServiceNode";

const CANVAS = { width: 1200, height: 650 };


export default function ServicesNetwork({ interactive: interactiveProp }: { interactive: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const onScreen = useOnScreen(svgRef, 160);
  const interactive = interactiveProp && onScreen;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const geometry = useMemo(() => {
    // loosely scattered ambient anchors — purely atmospheric, not tied to
    // the actual (dynamically-sized, expandable) service cards below
    const anchors = Array.from({ length: 8 }).map((_, i) => ({
      id: `a${i}`,
      x: 80 + ((i * 173) % (CANVAS.width - 160)),
      y: 60 + ((i * 251) % (CANVAS.height - 120)),
    }));
    return generateConnectedWeb(5577, CANVAS, anchors);
  }, []);

  // approximate which ambient node sits nearest each service, purely for a
  // soft glow cue — decorative, not a precise structural connection
  const nearestAnchorFor = useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach((s, i) => {
      map[s.id] = geometry.nodes[i % geometry.nodes.length]?.id ?? "";
    });
    return map;
  }, [geometry]);

  const activeThreadIds = activeId
    ? new Set(geometry.threadsByAnchor[nearestAnchorFor[activeId]] ?? [])
    : null;

  return (
    <div className="relative">
      {/* ambient web — visually continues from the Skills section above */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 -top-16 h-[calc(100%+4rem)] w-full overflow-visible"
        aria-hidden
      >
        <motion.g
          animate={interactive ? { x: [0, 3, -3, 0], y: [0, -2, 2, 0] } : undefined}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        >
          {geometry.rings.map((ring) => (
            <motion.path
              key={ring.id}
              d={ring.d}
              fill="none"
              stroke="#EDEAE3"
              strokeWidth={0.5}
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.05 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.3 }}
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
                strokeDasharray={isActive && interactive ? "3 7" : undefined}
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: thread.depth === "ambient" ? 0.06 : 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                animate={
                  isActive
                    ? {
                        opacity: 0.4,
                        stroke: "#D4483B",
                        strokeWidth: 0.9,
                        strokeDashoffset: interactive ? [0, -20] : 0,
                      }
                    : {
                        opacity: thread.depth === "ambient" ? 0.06 : 0.1,
                        stroke: "#EDEAE3",
                        strokeWidth: 0.5,
                        strokeDashoffset: 0,
                      }
                }
                transition={
                  isActive && interactive
                    ? { strokeDashoffset: { duration: 1.1, repeat: Infinity, ease: "linear" }, default: { duration: 0.4 } }
                    : { duration: 0.5, delay: i * 0.03 }
                }
              />
            );
          })}
        </motion.g>
      </svg>

      <div className="relative grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, i) => (
          <div key={service.id}>
            <ServiceNode
              service={service}
              active={activeId === service.id}
              expanded={expandedId === service.id}
              onActivate={setActiveId}
              onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
              delay={i * 0.07}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
