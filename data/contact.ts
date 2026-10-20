// Centralized contact data — edit here, nothing else needs to change.
// Only real, verified details from the CV/portfolio. No invented URLs.

export interface SocialLink {
  id: string;
  label: string;
  href: string;
}

export interface ContactData {
  name: string;
  role: string;
  email: string;
  location: string;
  availability: string[];
  socialLinks: SocialLink[];
}

export const contact: ContactData = {
  name: "Pavan Vasita",
  role: "Web Developer",
  email: "pavanvasita25@gmail.com",
  location: "Udaipur, Rajasthan, India",
  availability: [
    "Freelance Projects",
    "Web Development",
    "WordPress Development",
    "Collaborations",
  ],
  socialLinks: [
    { id: "email", label: "EMAIL", href: "mailto:pavanvasita25@gmail.com" },
    { id: "linkedin", label: "LINKEDIN", href: "https://www.linkedin.com/in/pavan-kumar-vasita" },
    { id: "github", label: "GITHUB", href: "https://github.com/pavantech48" },
    { id: "whatsapp", label: "WHATSAPP", href: "https://wa.me/918003811135" },
  ],
};
