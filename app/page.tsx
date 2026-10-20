import Hero from "@/components/hero/Hero";
import SelectedWork from "@/components/projects/SelectedWork";
import ExperienceSection from "@/components/experience/ExperienceSection";
import SkillsSection from "@/components/skills/SkillsSection";
import ServicesSection from "@/components/services/ServicesSection";
import AboutSection from "@/components/about/AboutSection";
import LabSection from "@/components/lab/LabSection";
import ContactSection from "@/components/contact/ContactSection";
import SiteShell from "@/components/shell/SiteShell";
import { contact } from "@/data/contact";

// Structured data only states facts already published on the site.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: contact.name,
  jobTitle: "Web Developer",
  email: contact.email,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Udaipur",
    addressRegion: "Rajasthan",
    addressCountry: "IN",
  },
  sameAs: contact.socialLinks.filter((l) => l.id === "linkedin" || l.id === "github").map((l) => l.href),
};

// The homepage is the complete overview: every section in order. Each one
// also has its own dedicated page (/projects, /experience, ...), reached from
// the header or from the link at the end of the section.
export default function Home() {
  return (
    <SiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <Hero />
      <SelectedWork />
      <ExperienceSection />
      <SkillsSection />
      <ServicesSection />
      <AboutSection />
      <LabSection />
      <ContactSection />
    </SiteShell>
  );
}
