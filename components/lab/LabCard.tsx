"use client";

import { useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { hashString } from "@/lib/webGeometry";
import WebCorner from "@/components/web/WebCorner";

export interface InfoSection {
  id: string;
  /** button label, e.g. "How to Play" */
  label: string;
  content: React.ReactNode;
}

// small building blocks so every game formats its info the same way
export function InfoSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="flex list-decimal flex-col gap-1.5 pl-5 marker:font-mono marker:text-paper-muted">
      {steps.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ol>
  );
}
export function InfoList({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-crimson-text">
      {items.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ul>
  );
}
export function InfoTerms({ terms }: { terms: { term: string; meaning: string }[] }) {
  return (
    <dl className="grid gap-x-8 gap-y-3 md:grid-cols-2">
      {terms.map((t) => (
        <div key={t.term}>
          <dt className="font-mono text-label tracking-[0.1em] text-paper">{t.term.toUpperCase()}</dt>
          <dd className="text-paper-body">{t.meaning}</dd>
        </div>
      ))}
    </dl>
  );
}

// Shared frame for one experiment. What a visitor needs to play (number,
// category, title, short description, a one-line start hint and the game
// itself) is always visible. Everything else lives behind compact buttons
// under the game, as inline panels, one open at a time. The panels only
// change this component's own state, so the game is never remounted or
// interrupted by opening or closing them.
export default function LabCard({
  index,
  category,
  title,
  description,
  quickStart,
  info,
  children,
}: {
  index: string;
  category: string;
  title: string;
  description: string;
  /** the one-line instruction needed to start playing */
  quickStart: string;
  info: InfoSection[];
  children: React.ReactNode;
}) {
  const uid = useId();
  const [open, setOpen] = useState<string | null>(null);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});
  const current = info.find((s) => s.id === open) ?? null;
  const panelId = `${uid}-panel`;

  const toggle = (id: string) => setOpen((prev) => (prev === id ? null : id));
  const close = () => {
    const id = open;
    setOpen(null);
    if (id) buttons.current[id]?.focus({ preventScroll: true });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      aria-labelledby={`lab-${index}`}
      className="panel relative flex flex-col gap-5 p-4 sm:p-5 md:p-8"
    >
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-label tracking-[0.12em]">
          <span className="text-crimson-text">EXPERIMENT {index}</span>
          <span className="border border-paper/20 px-2 py-0.5 text-paper-muted">{category.toUpperCase()}</span>
        </div>
        <h2 id={`lab-${index}`} className="font-display text-card font-medium text-paper">
          {title}
        </h2>
        <p className="max-w-2xl text-support text-paper-body">{description}</p>
        <p className="max-w-2xl border-l border-crimson-bright/60 pl-3 text-support text-paper">
          <span className="mr-2 font-mono text-label tracking-[0.12em] text-crimson-text">TO PLAY</span>
          {quickStart}
        </p>
      </header>

      <div className="relative min-w-0">{children}</div>

      {/* secondary information */}
      <div className="flex flex-col gap-3 border-t border-paper/10 pt-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label={`${title}: more information`}>
          {info.map((s) => {
            const isOpen = open === s.id;
            return (
              <button
                key={s.id}
                ref={(el) => {
                  buttons.current[s.id] = el;
                }}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(s.id)}
                className={`inline-flex min-h-[44px] items-center gap-2 border px-3 py-2 font-mono text-label tracking-[0.1em] transition-colors ${
                  isOpen
                    ? "border-crimson-bright/70 bg-crimson/20 text-paper"
                    : "border-paper/25 bg-paper/[0.04] text-paper-body hover:border-paper/50 hover:text-paper"
                }`}
              >
                <span aria-hidden="true" className="w-3 text-center text-crimson-text">
                  {isOpen ? "−" : "+"}
                </span>
                {s.label.toUpperCase()}
              </button>
            );
          })}
        </div>

        <div
          id={panelId}
          role="region"
          aria-label={current ? `${title}: ${current.label}` : undefined}
          hidden={!current}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            }
          }}
          className={current ? "border border-paper/15 bg-ink-graphite p-4 md:p-5" : undefined}
        >
          {current && (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-mono text-label tracking-[0.12em] text-crimson-text">{current.label.toUpperCase()}</h3>
                <button
                  type="button"
                  onClick={close}
                  aria-label={`Close ${current.label}`}
                  className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center border border-paper/20 font-mono text-label text-paper-body hover:border-paper/50 hover:text-paper"
                >
                  CLOSE ✕
                </button>
              </div>
              <div className="max-w-3xl text-support text-paper-body">{current.content}</div>
            </div>
          )}
        </div>
      </div>

      <WebCorner corner="tr" size={64} seed={hashString(title)} opacity={0.24} className="!-right-1 !-top-1" />
    </motion.article>
  );
}
