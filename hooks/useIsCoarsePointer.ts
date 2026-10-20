"use client";

import { useEffect, useState } from "react";

// True for touch/coarse-pointer devices where we should disable the custom
// cursor and heavy mouse-driven web physics.
export function useIsCoarsePointer(): boolean {
  const [isCoarse, setIsCoarse] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    setIsCoarse(query.matches);
    const handler = (e: MediaQueryListEvent) => setIsCoarse(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  return isCoarse;
}
