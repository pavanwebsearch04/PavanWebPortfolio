"use client";

import { useEffect, useState } from "react";
import { WEB_CONFIG } from "@/lib/webConfig";

// True below the mobile breakpoint, where the hero stacks into one tall column.
export function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${WEB_CONFIG.layer.mobileBreakpoint - 1}px)`);
    setIsMobile(query.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
