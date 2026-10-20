import type { Metadata } from "next";
import SiteShell from "@/components/shell/SiteShell";
import ProjectArchive from "@/components/projects/ProjectArchive";
import PageFooter from "@/components/footer/PageFooter";
import { websites } from "@/data/websites";

export const metadata: Metadata = {
  title: "Projects — Project Archive | Pavan Vasita",
  description: `A closer look at ${websites.length} live websites by Pavan Vasita, a Web Developer in Udaipur: business and WordPress websites across hospitality, travel, property, industry, retail and events.`,
};

export default function Page() {
  return (
    <SiteShell inner>
      <ProjectArchive />
      <PageFooter />
    </SiteShell>
  );
}
