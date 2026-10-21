"use client";

import { useEffect, useRef, useState } from "react";
import { EASE_OUT_CSS } from "@/lib/motion";

// Crimson fill that grows from the exact point where the cursor entered its
// parent and retracts toward the exit point. Place inside a `relative` parent
// (the layer clips itself). Transform only.
export default function SweepFill({ className = "bg-crimson-bright" }: { className?: string }) {
  const layerRef = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState({ on: false, x: 50, y: 50 });

  useEffect(() => {
    const parent = layerRef.current?.parentElement;
    if (!parent) return;
    const at = (e: PointerEvent) => {
      const r = parent.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const enter = (e: PointerEvent) => setState({ on: true, ...at(e) });
    const leave = (e: PointerEvent) => setState({ on: false, ...at(e) });
    parent.addEventListener("pointerenter", enter);
    parent.addEventListener("pointerleave", leave);
    return () => {
      parent.removeEventListener("pointerenter", enter);
      parent.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <span ref={layerRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className={`absolute rounded-full ${className}`}
        style={{
          left: state.x,
          top: state.y,
          width: 420,
          height: 420,
          translate: "-50% -50%",
          transform: state.on ? "scale(1)" : "scale(0)",
          transition: `transform 520ms ${EASE_OUT_CSS}`,
        }}
      />
    </span>
  );
}
