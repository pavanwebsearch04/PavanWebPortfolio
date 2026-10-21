"use client";

import { EASE_OUT_CSS } from "@/lib/motion";

// Text-roll hover: the label slides up and a crimson duplicate rolls in from
// below. The parent must carry Tailwind's `group` class (the hover target).
export default function TextRoll({ children, className = "" }: { children: string; className?: string }) {
  const t = `transform 400ms ${EASE_OUT_CSS}`;
  return (
    <span className={`relative block overflow-hidden ${className}`}>
      <span className="block group-hover:-translate-y-full group-focus-visible:-translate-y-full" style={{ transition: t }}>
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-x-0 top-full block text-crimson-text group-hover:-translate-y-full group-focus-visible:-translate-y-full"
        style={{ transition: t }}
      >
        {children}
      </span>
    </span>
  );
}
