"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TextRoll from "@/components/motion/TextRoll";
import { ArrowUpRight } from "lucide-react";
import { SocialLink } from "@/data/contact";

export default function ContactLinks({
  links,
  activeId,
  onActivate,
}: {
  links: SocialLink[];
  activeId: string | null;
  onActivate: (id: string | null) => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  // clicking the email link copies the address (the mailto: href stays as the
  // fallback if the clipboard is unavailable)
  const copyEmail = (e: React.MouseEvent, link: SocialLink) => {
    if (link.id !== "email" || !navigator.clipboard) return;
    e.preventDefault();
    navigator.clipboard
      .writeText(link.href.replace(/^mailto:/, ""))
      .then(() => {
        setCopied(link.id);
        window.setTimeout(() => setCopied((c) => (c === link.id ? null : c)), 1600);
      })
      .catch(() => {
        window.location.href = link.href;
      });
  };

  return (
    <ul className="flex flex-col">
      {links.map((link, i) => {
        const active = activeId === link.id;
        const external = link.href.startsWith("http");
        return (
          <motion.li
            key={link.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.07 }}
            className="border-b border-paper/20 first:border-t"
          >
            <a
              href={link.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              onMouseEnter={() => onActivate(link.id)}
              onMouseLeave={() => onActivate(null)}
              onFocus={() => onActivate(link.id)}
              onBlur={() => onActivate(null)}
              onClick={(e) => copyEmail(e, link)}
              className="group relative flex items-center justify-between gap-4 py-5 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson-bright"
            >
              <span className="flex items-baseline gap-3">
                <span className="font-mono text-nav text-crimson-text">
                  0{i + 1} /
                </span>
                <TextRoll
                  className={`font-display text-[clamp(1.125rem,1rem+0.5vw,1.5rem)] transition-colors ${
                    active ? "text-paper" : "text-paper-body"
                  }`}
                >
                  {link.label}
                </TextRoll>
              </span>
              <motion.span animate={{ x: active ? 4 : 0 }} transition={{ duration: 0.25 }}>
                {/* rests turned 45 degrees and straightens on hover */}
                <ArrowUpRight
                  size={16}
                  className={`rotate-45 transition-transform duration-300 group-hover:rotate-0 group-focus-visible:rotate-0 ${
                    active ? "text-crimson-text" : "text-paper-body"
                  }`}
                />
              </motion.span>
              <AnimatePresence>
                {copied === link.id && (
                  <motion.span
                    role="status"
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="pointer-events-none absolute -top-1 right-0 border border-crimson-bright/60 bg-ink px-2.5 py-1 font-mono text-label tracking-[0.12em] text-paper"
                  >
                    COPIED!
                  </motion.span>
                )}
              </AnimatePresence>
            </a>
          </motion.li>
        );
      })}
    </ul>
  );
}
