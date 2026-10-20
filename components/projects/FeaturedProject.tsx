"use client";

import { useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Project } from "@/data/projects";
import { projectImages, PROJECT_IMAGE_FALLBACK } from "@/data/images";
import { useBorderThreads } from "@/hooks/useBorderThreads";
import ProjectReveal from "./ProjectReveal";
import ProjectMeta from "./ProjectMeta";

export default function FeaturedProject({
  project,
  onActivate,
  interactive,
}: {
  project: Project;
  onActivate: (slug: string | null) => void;
  interactive: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = projectImages[project.slug];

  const behindThreads = useBorderThreads(511, 4);
  const frontThreads = useBorderThreads(922, 4);

  // subtle cursor-follow parallax scoped to this frame only
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const springX = useSpring(px, { stiffness: 120, damping: 18 });
  const springY = useSpring(py, { stiffness: 120, damping: 18 });
  const imageX = useTransform(springX, (v) => v * 10);
  const imageY = useTransform(springY, (v) => v * 8);
  const frameX = useTransform(springX, (v) => v * 4);
  const frameY = useTransform(springY, (v) => v * 3);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    px.set(0);
    py.set(0);
    onActivate(null);
  };

  return (
    <div className="relative">
      <ProjectReveal direction="mask">
        <div
          onMouseEnter={() => onActivate(project.slug)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative"
        >
          {/* soft crimson bloom */}
          <div className="absolute -inset-8 -z-10 rounded-[2px] bg-crimson/20 blur-3xl opacity-40" />

          {/* border-wrap threads behind the frame */}
          <svg viewBox="-30 -30 160 185" className="pointer-events-none absolute -inset-[14%] overflow-visible" aria-hidden>
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
                transition={{ duration: 1, delay: 0.2 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </svg>

          <motion.div
            style={{ x: frameX, y: frameY }}
            className="relative border border-paper/15"
          >
            <div className="pointer-events-none absolute -inset-3 translate-x-1.5 translate-y-1.5 border border-crimson/25" />

            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <motion.div style={{ x: imageX, y: imageY }} className="absolute inset-[-4%]">
                <Image
                  src={imageFailed ? PROJECT_IMAGE_FALLBACK : image.src}
                  alt={image.alt}
                  fill
                  unoptimized={imageFailed}
                  onError={() => setImageFailed(true)}
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover contrast-[1.05] saturate-[0.85]"
                />
              </motion.div>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(10,10,12,0.6)_100%)]" />
              <div className="film-grain" />
              <div className="absolute inset-0 bg-ink/15 mix-blend-multiply" />
            </div>
          </motion.div>

          {/* border-wrap threads in front, crossing the frame edge */}
          <svg viewBox="-30 -30 160 185" className="pointer-events-none absolute -inset-[14%] overflow-visible" aria-hidden>
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
                transition={{ duration: 0.9, delay: 0.4 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </svg>
        </div>
      </ProjectReveal>

      <div className="panel mt-8 flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between md:p-7">
        <div className="flex flex-col gap-3">
          <ProjectReveal direction="left" delay={0.1}>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-nav text-crimson-text">0{project.index}</span>
              <h3 className="font-display text-[clamp(1.75rem,1.4rem+1.5vw,2.5rem)] font-medium leading-tight text-paper">{project.title}</h3>
            </div>
            <p className="mt-1 font-mono text-label tracking-[0.12em] text-paper-muted">
              {project.category.toUpperCase()}
            </p>
          </ProjectReveal>

          <ProjectReveal direction="up" delay={0.2}>
            <p className="max-w-xl text-body text-paper-body">
              {project.description}
            </p>
          </ProjectReveal>

          <ProjectReveal direction="up" delay={0.3}>
            <ProjectMeta technologies={project.technologies} reveal />
          </ProjectReveal>
        </div>

        <ProjectReveal direction="right" delay={0.3}>
          <div className="flex shrink-0 items-center gap-4 md:pt-1">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-paper/45 bg-paper/[0.05] px-5 py-3 font-mono text-nav font-medium text-paper transition-colors hover:border-paper/75 hover:bg-paper/[0.1]"
              >
                <ArrowUpRight size={14} />
                VIEW CODE
              </a>
            )}
          </div>
        </ProjectReveal>
      </div>
    </div>
  );
}
