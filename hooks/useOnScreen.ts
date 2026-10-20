"use client";

import { RefObject, useEffect, useState } from "react";

// True while the referenced element is within `margin` px of the viewport.
// Used to switch off idle/infinite animations in sections that are far
// off-screen so they cost nothing until the reader gets close.
export function useOnScreen(ref: RefObject<Element>, margin = 200): boolean {
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setOnScreen(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      rootMargin: `${margin}px 0px ${margin}px 0px`,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, margin]);

  return onScreen;
}
