"use client";

import { createContext } from "react";
import type { MotionValue } from "framer-motion";

export type WebMode = "hover" | "focus" | "tap";

export interface WebInstance {
  key: number;
  el: Element;
  modes: WebMode[];
  /** viewport rect at activation; the overlay follows scroll from here */
  rect: { left: number; top: number; width: number; height: number };
  scrollY0: number;
  seed: number;
  /** element sits in the fixed header, so it does not scroll with the page */
  inHeader: boolean;
  /** pointer position at activation, used to pick the accent strand */
  pointer: { x: number; y: number } | null;
  leaving: boolean;
}

export interface WebContextValue {
  reducedMotion: boolean;
  isCoarse: boolean;
  /** fine pointer + desktop width: the custom cursor is active */
  cursorActive: boolean;
  isMobile: boolean;
  /** raw pointer position in client coordinates */
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  /** spring-smoothed cursor position (what the cursor glyph draws at) */
  cursorX: MotionValue<number>;
  cursorY: MotionValue<number>;
  /** 0..1, springs towards 1 while a web target is active under/near the pointer */
  engage: MotionValue<number>;
  scrollY: MotionValue<number>;
  /** -1..1 smoothed scroll velocity, positive while scrolling down */
  tension: MotionValue<number>;
  webs: WebInstance[];
}

export const WebContext = createContext<WebContextValue | null>(null);
