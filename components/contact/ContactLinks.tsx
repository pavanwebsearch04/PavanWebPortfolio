"use client";

import { motion } from "framer-motion";
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
              className="group flex items-center justify-between gap-4 py-5 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson-bright"
            >
              <span className="flex items-baseline gap-3">
                <span className="font-mono text-nav text-crimson-text">
                  0{i + 1} /
                </span>
                <span
                  className={`font-display text-[clamp(1.125rem,1rem+0.5vw,1.5rem)] transition-colors ${
                    active ? "text-paper" : "text-paper-body"
                  }`}
                >
                  {link.label}
                </span>
              </span>
              <motion.span animate={{ x: active ? 4 : 0 }} transition={{ duration: 0.25 }}>
                <ArrowUpRight size={16} className={active ? "text-crimson-text" : "text-paper-body"} />
              </motion.span>
            </a>
          </motion.li>
        );
      })}
    </ul>
  );
}
