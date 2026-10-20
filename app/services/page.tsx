import type { Metadata } from "next";
import SiteShell from "@/components/shell/SiteShell";
import ServicesSection from "@/components/services/ServicesSection";
import PageFooter from "@/components/footer/PageFooter";

export const metadata: Metadata = {
  title: "Services — WordPress & Responsive Web Design | Pavan Vasita",
  description:
    "Web services from Pavan Vasita in Udaipur, Rajasthan: WordPress development, responsive web design, frontend development, custom WordPress solutions, website maintenance and performance optimization.",
};

export default function Page() {
  return (
    <SiteShell inner>
      <ServicesSection />
      <PageFooter />
    </SiteShell>
  );
}
