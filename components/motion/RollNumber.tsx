"use client";

// A number that rolls in from below whenever its value changes. The wrapper
// clips it; `key` restarts the CSS animation, so it costs nothing at rest.
export default function RollNumber({ value, className }: { value: number | string; className?: string }) {
  return (
    <span className={`inline-block overflow-hidden align-bottom ${className ?? ""}`}>
      <span key={String(value)} className="roll-num inline-block">
        {value}
      </span>
    </span>
  );
}
