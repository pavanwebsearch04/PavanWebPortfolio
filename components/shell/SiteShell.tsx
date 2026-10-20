"use client";

import SiteCursor from "@/components/cursor/SiteCursor";
import Header from "@/components/header/Header";
import WebInteractionProvider from "@/components/web/WebInteractionProvider";
import GlobalWebLayer from "@/components/web/GlobalWebLayer";
import InteractiveWeb from "@/components/web/InteractiveWeb";
import { PageContextProvider } from "@/components/ui/PageContext";

// Everything shared by every page: the web interaction engine, the spider
// cursor, the page-wide web layer and the header. Pages pass their
// <section>s as children; the web layer measures those to place its strands.
// `inner` marks pages that start straight with a section (no hero), which
// get extra top padding to clear the fixed header.
export default function SiteShell({ children, inner = false }: { children: React.ReactNode; inner?: boolean }) {
  return (
    <WebInteractionProvider>
      <SiteCursor />
      {/* z-order inside <main>: web layers (z-1) sit above section tints but
          below all section content (z-10) and the header (z-50) */}
      <main id="main" data-page={inner ? "inner" : "home"} className="relative isolate">
        <GlobalWebLayer />
        <InteractiveWeb scope="page" />
        <Header />
        <PageContextProvider inner={inner}>{children}</PageContextProvider>
      </main>
    </WebInteractionProvider>
  );
}
