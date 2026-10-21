"use client";

import { Fragment, useLayoutEffect, useRef, useState } from "react";

// Fades a paragraph in one visual line at a time. The text is split into
// words, the rendered lines are measured, and each line gets its own delay
// (CSS animation, so it costs nothing after it finishes). `delay` is in seconds.
export default function LineFade({
  text,
  delay = 0,
  step = 0.11,
  className,
}: {
  text: string;
  delay?: number;
  step?: number;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [lines, setLines] = useState<number[] | null>(null);
  const words = text.split(/\s+/);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      let line = -1;
      let top = -1;
      const out: number[] = [];
      el.querySelectorAll<HTMLElement>("[data-w]").forEach((w) => {
        if (Math.abs(w.offsetTop - top) > 2) {
          line += 1;
          top = w.offsetTop;
        }
        out.push(line);
      });
      setLines((prev) => (prev && prev.join() === out.join() ? prev : out));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  return (
    <p ref={ref} data-reveal className={className} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={i}>
          {i > 0 ? " " : null}
          <span
            data-w
            aria-hidden
            className={lines ? "line-fade-word inline-block" : "inline-block opacity-0"}
            style={lines ? ({ "--d": `${delay + lines[i] * step}s` } as React.CSSProperties) : undefined}
          >
            {w}
          </span>
        </Fragment>
      ))}
    </p>
  );
}
