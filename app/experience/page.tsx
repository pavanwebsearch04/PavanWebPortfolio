import type { Metadata } from "next";
import SiteShell from "@/components/shell/SiteShell";
import CareerArchive from "@/components/experience/CareerArchive";
import PageFooter from "@/components/footer/PageFooter";

export const metadata: Metadata = {
  title: "Experience — Web & WordPress Developer | Pavan Vasita",
  description:
    "Professional experience of Pavan Vasita: Web Developer at Web Search Solutions, freelance WordPress developer, WordPress Developer at TechnoProfiles, Web Designer at Aarsh Digital Media, and a full stack internship.",
};

export default function Page() {
  return (
    <SiteShell inner>
      <CareerArchive />
      <PageFooter />
    </SiteShell>
  );
}
