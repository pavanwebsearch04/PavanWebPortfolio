"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Code2, Database, Gauge, Layers, MonitorSmartphone, PanelsTopLeft, ShoppingCart, Wrench } from "lucide-react";
import { mulberry32, rangeFrom } from "@/lib/seededRandom";
import { Service, ServiceIcon } from "@/data/services";
import WebCorner from "@/components/web/WebCorner";
import ServiceDetails from "./ServiceDetails";
import SiteLink from "@/components/ui/SiteLink";
import { useSiteLinks } from "@/hooks/useSiteLinks";

function hashSeed(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return h;
}

// Small irregular, asymmetric web-anchor glyph — consistent with the marker
// language used across Experience and Skills, never a circle.
function NodeGlyph({ id, active }: { id: string; active: boolean }) {
  const rng = mulberry32(hashSeed(id));
  const count = 5 + Math.floor(rangeFrom(rng, 0, 2));
  const arms = Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2 + rangeFrom(rng, -0.35, 0.35);
    const len = rangeFrom(rng, 6, 11);
    return { x2: +(Math.cos(angle) * len).toFixed(2), y2: +(Math.sin(angle) * len).toFixed(2) };
  });

  return (
    <svg width="26" height="26" viewBox="-13 -13 26 26" className="overflow-visible">
      {arms.map((a, i) => (
        <motion.line
          key={i}
          x1={0}
          y1={0}
          x2={a.x2}
          y2={a.y2}
          strokeLinecap="round"
          animate={{ stroke: active ? "#D4483B" : "#EDEAE3", strokeWidth: active ? 1.1 : 0.8 }}
          transition={{ duration: 0.3 }}
          opacity={active ? 0.95 : 0.55}
        />
      ))}
      <motion.circle
        r={1.8}
        animate={{ fill: active ? "#D4483B" : "#EDEAE3" }}
        transition={{ duration: 0.3 }}
        fillOpacity={active ? 1 : 0.7}
      />
    </svg>
  );
}

// React atom mark, drawn as an outline with the same stroke weight as the
// lucide icons so the set reads as one family.
function ReactMark() {
  return (
    <svg width="26" height="26" viewBox="-12 -12 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle r="1.8" fill="currentColor" stroke="none" />
      <ellipse rx="10.5" ry="4.2" />
      <ellipse rx="10.5" ry="4.2" transform="rotate(60)" />
      <ellipse rx="10.5" ry="4.2" transform="rotate(120)" />
    </svg>
  );
}

// WordPress has no lucide glyph; a CMS-style page-layout icon stands in
// rather than a hand-drawn imitation of the official logo.
function ServiceIconGlyph({ icon }: { icon: ServiceIcon }) {
  const p = { size: 26, strokeWidth: 1.5, "aria-hidden": true } as const;
  switch (icon) {
    case "wordpress":
      return <PanelsTopLeft {...p} />;
    case "responsive":
      return <MonitorSmartphone {...p} />;
    case "frontend":
      return <Code2 {...p} />;
    case "fullstack":
      return <Layers {...p} />;
    case "database":
      return <Database {...p} />;
    case "react":
      return <ReactMark />;
    case "ecommerce":
      return <ShoppingCart {...p} />;
    case "maintenance":
      return <Wrench {...p} />;
    case "performance":
      return <Gauge {...p} />;
  }
}

export default function ServiceNode({
  service,
  active,
  expanded,
  onActivate,
  onToggle,
  delay,
}: {
  service: Service;
  active: boolean;
  expanded: boolean;
  onActivate: (id: string | null) => void;
  onToggle: (id: string) => void;
  delay: number;
}) {
  const panelId = useId();
  const { section } = useSiteLinks();

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => onActivate(service.id)}
      onMouseLeave={() => onActivate(null)}
      onFocus={() => onActivate(service.id)}
      onBlur={() => onActivate(null)}
      data-web="card"
      data-web-id={service.id}
      className="panel relative p-6 md:p-7"
    >
      {/* crimson accent line, revealed on activation */}
      <motion.span
        initial={{ scaleX: 0 }}
        animate={{ scaleX: active ? 1 : 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-0 top-0 h-px w-full origin-left bg-crimson-bright"
        aria-hidden
      />

      <motion.div animate={{ x: active ? 4 : 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-nav text-crimson-text">{service.index}</span>
            <NodeGlyph id={service.id} active={active} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className={`shrink-0 transition-colors duration-300 ${active ? "text-crimson-text" : "text-paper-muted"}`}>
            <ServiceIconGlyph icon={service.icon} />
          </span>
          <h3 className="font-display text-card font-medium text-paper">{service.title}</h3>
        </div>
        <p className="mt-2 text-support text-paper-body">{service.description}</p>
        <p className="mt-3 text-support text-paper-muted">
          <span className="font-mono text-label tracking-[0.1em] text-crimson-text">FOR YOU </span>
          {service.benefit}
        </p>

        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
          {service.tech.map((t) => (
            <li key={t} className="border border-paper/20 px-2 py-0.5 font-mono text-label tracking-[0.06em] text-paper-muted">
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1">
        <button
          type="button"
          onClick={() => onToggle(service.id)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="inline-flex min-h-[44px] items-center gap-1.5 border border-paper/30 bg-paper/[0.04] px-3 py-2 font-mono text-label tracking-[0.1em] text-paper-body transition-colors hover:border-paper/60 hover:text-paper"
        >
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown size={13} />
          </motion.span>
          {expanded ? "HIDE CAPABILITIES" : "SHOW CAPABILITIES"}
        </button>
        <SiteLink
          href={section("contact")}
          className="inline-flex min-h-[44px] items-center gap-1.5 font-mono text-label tracking-[0.1em] text-crimson-text transition-colors hover:text-paper"
        >
          DISCUSS THIS SERVICE &rarr;
        </SiteLink>
        </div>

        <ServiceDetails id={panelId} expanded={expanded} capabilities={service.capabilities} />
      </motion.div>

      <WebCorner corner="tr" size={60} seed={hashSeed(service.id)} className="!-right-2 !-top-2" />
    </motion.div>
  );
}
