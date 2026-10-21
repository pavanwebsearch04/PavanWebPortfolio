import type { Metadata } from "next";
import SiteShell from "@/components/shell/SiteShell";
import ServicesSection from "@/components/services/ServicesSection";
import PageFooter from "@/components/footer/PageFooter";

export const metadata: Metadata = {
  title: "Services — WordPress, Frontend & Full-Stack Development | Pavan Vasita",
  description:
    "Web services from Pavan Vasita in Udaipur, Rajasthan: WordPress development, frontend development, full-stack web development with PHP, Laravel and the MERN stack, e-commerce development, and website maintenance and optimization.",
};

export default function Page() {
  return (
    <SiteShell inner>
      <ServicesSection />
      <PageFooter />
    </SiteShell>
  );
}
