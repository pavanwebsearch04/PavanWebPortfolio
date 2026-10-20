"use client";

import { ArrowRight } from "lucide-react";
import SiteLink from "@/components/ui/SiteLink";
import SiteFooter from "@/components/footer/SiteFooter";
import LabSection from "./LabSection";

// Dedicated /lab page: the shared Lab section plus a closing call to action
// and the footer.
export default function LabPage() {
  return (
    <>
      <LabSection full />

      <section id="lab-contact" className="surface surface-ink relative w-full overflow-x-clip px-6 pb-16 pt-12 md:px-14 md:pt-16 lg:px-20">
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="flex flex-col items-start gap-6">
            <h2 className="font-display text-card font-medium text-paper">Have a project in mind?</h2>
            <p className="max-w-xl text-body text-paper-body">
              The same care that goes into these experiments goes into client work. Take a look at the{" "}
              <SiteLink href="/projects" className="text-paper underline decoration-crimson-bright underline-offset-4">
                selected work
              </SiteLink>{" "}
              or get in touch.
            </p>
            <SiteLink
              href="/contact"
              className="inline-flex items-center gap-2.5 border border-crimson-bright/50 bg-crimson px-7 py-3.5 font-mono text-support font-medium tracking-wide text-paper transition-colors hover:bg-[#b8402f]"
            >
              LET&rsquo;S TALK
              <ArrowRight size={15} />
            </SiteLink>
          </div>
          <SiteFooter />
        </div>
      </section>
    </>
  );
}
