"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Project } from "@/data/projects";
import { projectImages, PROJECT_IMAGE_FALLBACK } from "@/data/images";
import { useIsCoarsePointer } from "@/hooks/useIsCoarsePointer";
import { hashString } from "@/lib/webGeometry";
import WebCorner from "@/components/web/WebCorner";
import ProjectReveal from "./ProjectReveal";
import ProjectMeta from "./ProjectMeta";

type Direction = "up" | "left" | "right";

export default function ProjectCard({
  project,
  direction,
  delay,
  onActivate,
}: {
  project: Project;
  direction: Direction;
  delay: number;
  onActivate: (slug: string | null) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const isCoarse = useIsCoarsePointer();
  const image = projectImages[project.slug];
  // no hover on touch: always show the description there
  const open = hovered || focused || isCoarse;

  return (
    <ProjectReveal direction={direction} delay={delay}>
      <div
        data-web="card"
        data-web-id={project.slug}
        onMouseEnter={() => {
          setHovered(true);
          onActivate(project.slug);
        }}
        onMouseLeave={() => {
          setHovered(false);
          onActivate(null);
        }}
        onFocus={() => {
          setFocused(true);
          onActivate(project.slug);
        }}
        onBlur={() => {
          setFocused(false);
          onActivate(null);
        }}
        className="panel group relative flex flex-col gap-3 p-3"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden border border-paper/15">
          {/* crimson tension thread appears near the active edge on hover */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: open ? 1 : 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -top-px left-0 z-10 h-px w-full origin-left bg-crimson-bright"
          />
          <motion.div
            animate={{ scale: hovered ? 1.06 : 1, x: hovered ? -4 : 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={imageFailed ? PROJECT_IMAGE_FALLBACK : image.src}
              alt={image.alt}
              fill
              unoptimized={imageFailed}
              onError={() => setImageFailed(true)}
              sizes="(max-width: 768px) 100vw, 30vw"
              className="object-cover contrast-[1.05] saturate-[0.85]"
            />
          </motion.div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(10,10,12,0.6)_100%)]" />
          <div className="film-grain" />
          <motion.div
            animate={{ opacity: open ? 0.05 : 0.18 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-ink mix-blend-multiply"
          />
        </div>

        <div className="flex items-baseline gap-2.5 px-1">
          <span className="font-mono text-label text-crimson-text">0{project.index}</span>
          <h4 className="font-display text-[clamp(1.125rem,1rem+0.45vw,1.375rem)] font-medium leading-tight text-paper">
            {project.title}
          </h4>
        </div>
        <p className="px-1 font-mono text-label tracking-[0.1em] text-paper-dim">
          {project.category.toUpperCase()}
        </p>

        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden px-1"
        >
          <p className="pb-2 text-support text-paper-body">{project.description}</p>
          <ProjectMeta technologies={project.technologies} />
        </motion.div>

        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-1 mb-1 inline-flex w-fit items-center gap-1.5 border border-paper/30 bg-paper/[0.04] px-3 py-2 font-mono text-label tracking-[0.1em] text-paper-body transition-colors hover:border-paper/60 hover:text-paper"
          >
            <ArrowUpRight size={14} />
            VIEW CODE
          </a>
        )}

        {!project.githubUrl && !project.liveUrl && (
          <p className="mx-1 mb-1 font-mono text-label tracking-[0.1em] text-paper-dim">DETAILS COMING SOON</p>
        )}

        <WebCorner corner="tr" size={58} seed={hashString(project.slug)} className="!-right-3 !-top-3" />
      </div>
    </ProjectReveal>
  );
}
