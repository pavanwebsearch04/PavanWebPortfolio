import type { Metadata } from "next";
import SiteShell from "@/components/shell/SiteShell";
import ContactSection from "@/components/contact/ContactSection";

export const metadata: Metadata = {
  title: "Contact — Start a Project | Pavan Vasita",
  description:
    "Contact Pavan Vasita, Web Developer in Udaipur, Rajasthan, about a website idea, a WordPress project or a development challenge.",
};

export default function Page() {
  return (
    <SiteShell inner>
      <ContactSection />
    </SiteShell>
  );
}
