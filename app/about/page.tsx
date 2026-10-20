import type { Metadata } from "next";
import SiteShell from "@/components/shell/SiteShell";
import AboutSection from "@/components/about/AboutSection";
import PageFooter from "@/components/footer/PageFooter";

export const metadata: Metadata = {
  title: "About — The Person Behind the Web | Pavan Vasita",
  description:
    "About Pavan Vasita, a Web Developer from Udaipur, Rajasthan focused on WordPress development, responsive interfaces and practical digital experiences.",
};

export default function Page() {
  return (
    <SiteShell inner>
      <AboutSection />
      <PageFooter />
    </SiteShell>
  );
}
