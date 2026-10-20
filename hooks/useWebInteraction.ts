"use client";

import { useContext } from "react";
import { WebContext, WebContextValue } from "@/components/web/webContext";

// Shared access to the pointer springs, scroll tension and the list of
// elements that currently have a web formed around them.
export function useWebInteraction(): WebContextValue {
  const ctx = useContext(WebContext);
  if (!ctx) throw new Error("useWebInteraction must be used inside <WebInteractionProvider>");
  return ctx;
}

// The cursor only needs the smoothed position + engagement values.
export function useWebCursor() {
  const { cursorX, cursorY, pointerX, pointerY, engage, cursorActive } = useWebInteraction();
  return { cursorX, cursorY, pointerX, pointerY, engage, cursorActive };
}

// Scroll progress + velocity-driven tension for the page-wide web.
export function useScrollWeb() {
  const { scrollY, tension } = useWebInteraction();
  return { scrollY, tension };
}
