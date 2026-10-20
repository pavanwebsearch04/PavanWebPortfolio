"use client";

import { motion } from "framer-motion";
import { contact } from "@/data/contact";
import SiteLink from "@/components/ui/SiteLink";
import { useSiteLinks } from "@/hooks/useSiteLinks";

// "lab" is its own page; everything else is a section of the home page.
const NAV_LINKS = [
  { label: "HOME", id: "hero" },
  { label: "WORK", id: "work" },
  { label: "EXPERIENCE", id: "experience" },
  { label: "SKILLS", id: "skills" },
  { label: "SERVICES", id: "services" },
  { label: "ABOUT", id: "about" },
  { label: "LAB", id: "lab" },
  { label: "CONTACT", id: "contact" },
];

// Only the verified channels already in data/contact.ts.
const CHANNELS = contact.socialLinks.filter((l) => l.id === "email" || l.id === "linkedin" || l.id === "github");

// Strands that fall from the page above and meet at one final node on the
// footer's top rule — the web's resting point. Drawn in a stretched box, so
// strokes use non-scaling-stroke to stay hairline-thin.
const CONVERGE = [
  "M 40 0 Q 180 6, 500 56",
  "M 230 0 Q 330 14, 500 56",
  "M 420 0 Q 470 18, 500 56",
  "M 640 0 Q 580 20, 500 56",
  "M 800 0 Q 660 10, 500 56",
  "M 960 0 Q 760 4, 500 56",
];

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const { section } = useSiteLinks();

  return (
    <footer className="relative mt-24 md:mt-32">
      <div className="pointer-events-none absolute inset-x-0 -top-14 h-14" aria-hidden="true">
        <svg viewBox="0 0 1000 56" preserveAspectRatio="none" className="h-full w-full overflow-visible" focusable="false">
          {CONVERGE.map((d, i) => (
            <motion.path
              key={d}
              d={d}
              fill="none"
              stroke="#F2EFE8"
              strokeOpacity={0.22}
              strokeWidth={0.9}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 1.1, delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </svg>
        {/* the final node: an irregular three-arm anchor, never a circle */}
        <svg width="18" height="18" viewBox="-9 -9 18 18" className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 overflow-visible">
          <path d="M 0 0 l -5.6 -3.2 M 0 0 l 4.2 -4.6 M 0 0 l 1.4 5.8" stroke="#EE6C5C" strokeWidth={1.2} strokeLinecap="round" fill="none" />
          <circle r={1.7} fill="#EE6C5C" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-10 border-t border-paper/20 pt-12"
      >
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1.5">
            <p className="font-display text-2xl font-medium tracking-[0.02em] text-paper">{contact.name.toUpperCase()}</p>
            <p className="font-mono text-label tracking-[0.12em] text-paper-muted">{contact.role.toUpperCase()}</p>
            <p className="max-w-xs pt-2 text-support text-paper-body">
              Building thoughtful websites, useful interfaces, and digital experiences that feel alive.
            </p>
            <p className="pt-1 font-mono text-label tracking-[0.1em] text-paper-dim">{contact.location.toUpperCase()}</p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-7 gap-y-1 md:max-w-md md:justify-end">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <SiteLink
                    href={link.id === "lab" ? "/lab" : section(link.id)}
                    className="inline-flex min-h-[44px] items-center font-mono text-nav text-paper-body transition-colors hover:text-paper"
                  >
                    {link.label}
                  </SiteLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-4 border-t border-paper/10 pt-6 md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap items-center gap-x-7 gap-y-1">
            {CHANNELS.map((c) => {
              const external = c.href.startsWith("http");
              return (
                <li key={c.id}>
                  <a
                    href={c.href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="inline-flex min-h-[44px] items-center font-mono text-nav text-paper-body transition-colors hover:text-crimson-text"
                  >
                    {c.id === "email" ? contact.email : c.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="font-mono text-label tracking-[0.08em] text-paper-dim">
            © {year} {contact.name.toUpperCase()}. ALL RIGHTS RESERVED.
          </p>
        </div>
      </motion.div>
    </footer>
  );
}
