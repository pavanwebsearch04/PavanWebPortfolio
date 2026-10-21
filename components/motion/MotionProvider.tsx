"use client";

import dynamic from "next/dynamic";
import ScrollProgress from "./ScrollProgress";
import SpiderThread from "./SpiderThread";
import PageTransition from "./PageTransition";
import Preloader from "./Preloader";
import EasterEggs from "./EasterEggs";

// Lenis + GSAP are loaded after first paint so they never block it.
const SmoothScroll = dynamic(() => import("./SmoothScroll"), { ssr: false });

// Site-wide motion foundation, mounted once in the root layout.
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <ScrollProgress />
      <SpiderThread />
      <PageTransition />
      <Preloader />
      <EasterEggs />
      <div aria-hidden className="film-grain-fixed" />
      {children}
    </>
  );
}
