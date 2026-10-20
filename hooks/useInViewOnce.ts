"use client";

import { RefObject, useEffect, useState } from "react";

// True once the referenced element has scrolled into view; never flips back.
// One-shot sibling of useOnScreen, used to trigger entrance transitions.
export function useInViewOnce(ref: RefObject<Element>, rootMargin = "0px 0px -8% 0px"): boolean {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.06 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return seen;
}
