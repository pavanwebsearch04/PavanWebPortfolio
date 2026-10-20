"use client";

import { createContext, useContext, type HTMLAttributes } from "react";
import { ArrowRight } from "lucide-react";
import SiteLink from "./SiteLink";

// The same section components are used twice: as part of the full homepage
// scroll, and as the main content of their own page. This context tells a
// section which of the two it is in, so that
//  - on a dedicated page its heading is the page's single <h1> (on the
//    homepage the hero owns the <h1> and sections use <h2>), and
//  - on the homepage it can offer a link to its dedicated page.
const PageContext = createContext<{ inner: boolean }>({ inner: false });

export function PageContextProvider({ inner, children }: { inner: boolean; children: React.ReactNode }) {
  return <PageContext.Provider value={{ inner }}>{children}</PageContext.Provider>;
}

// True on a section's dedicated page, where it is the first thing in view.
export function useIsInnerPage(): boolean {
  return useContext(PageContext).inner;
}

export function PrimaryHeading(props: HTMLAttributes<HTMLHeadingElement>) {
  const { inner } = useContext(PageContext);
  const Tag = inner ? "h1" : "h2";
  return <Tag {...props} />;
}

// "Explore ..." link to a section's dedicated page; shown on the homepage only.
export function SectionCta({ href, label }: { href: string; label: string }) {
  const { inner } = useContext(PageContext);
  if (inner) return null;
  return (
    <div className="mt-14 flex md:mt-20">
      <SiteLink
        href={href}
        className="inline-flex items-center gap-2.5 border border-paper/40 bg-paper/[0.05] px-6 py-3.5 font-mono text-support font-medium tracking-wide text-paper transition-colors hover:border-crimson-bright/70 hover:bg-paper/[0.1]"
      >
        {label}
        <ArrowRight size={15} />
      </SiteLink>
    </div>
  );
}
