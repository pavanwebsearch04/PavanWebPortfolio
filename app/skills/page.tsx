import type { Metadata } from "next";
import SiteShell from "@/components/shell/SiteShell";
import SkillsSection from "@/components/skills/SkillsSection";
import PageFooter from "@/components/footer/PageFooter";

export const metadata: Metadata = {
  title: "Skills — WordPress, Frontend & Backend | Pavan Vasita",
  description:
    "Skills of Pavan Vasita, Web Developer in Udaipur: WordPress and WooCommerce, HTML, CSS, JavaScript, React, PHP, Node.js, MySQL, MongoDB and professional skills.",
};

export default function Page() {
  return (
    <SiteShell inner>
      <SkillsSection />
      <PageFooter />
    </SiteShell>
  );
}
