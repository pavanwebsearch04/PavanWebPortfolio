// Real services only — no invented pricing, stats, or client claims.

export type ServiceIcon =
  | "wordpress"
  | "responsive"
  | "frontend"
  | "fullstack"
  | "database"
  | "react"
  | "ecommerce"
  | "maintenance"
  | "performance";

export interface Service {
  id: string;
  index: string; // "01".."09"
  title: string;
  description: string;
  capabilities: string[];
  /** what the client gets out of it, in plain language */
  benefit: string;
  icon: ServiceIcon;
  /** short, relevant technology labels (all backed by data/skills.ts) */
  tech: string[];
}

export const services: Service[] = [
  {
    id: "wordpress-development",
    index: "01",
    title: "WordPress Development",
    description:
      "Custom WordPress websites, theme customization, plugin integration, and manageable business websites.",
    capabilities: [
      "Custom themes and theme customization",
      "Plugin configuration and integration",
      "Elementor & Gutenberg layouts",
      "Content management and website customization",
    ],
    benefit: "A site you can manage and update yourself, built around your content.",
    icon: "wordpress",
    tech: ["WordPress", "PHP"],
  },
  {
    id: "responsive-web-design",
    index: "02",
    title: "Responsive Web Design",
    description:
      "Mobile-first layouts that adapt to desktop, tablet, and mobile screens while maintaining usability and visual consistency.",
    capabilities: [
      "Mobile-first layouts",
      "Responsive navigation",
      "Cross-browser compatibility",
      "Accessible interface layouts",
    ],
    benefit: "Visitors get a clear, comfortable experience on whatever device they use.",
    icon: "responsive",
    tech: ["HTML", "CSS", "JavaScript"],
  },
  {
    id: "frontend-development",
    index: "03",
    title: "Frontend Development",
    description:
      "Interactive, accessible interfaces using HTML, CSS, JavaScript, and relevant frontend frameworks.",
    capabilities: [
      "HTML, CSS & JavaScript",
      "Interactive UI components",
      "Form validation",
      "React integration where applicable",
    ],
    benefit: "Interfaces that feel responsive and are straightforward to maintain.",
    icon: "frontend",
    tech: ["HTML", "CSS", "JavaScript"],
  },
  {
    id: "full-stack-web-development",
    index: "04",
    title: "Full-Stack Web Development",
    description:
      "Complete web applications combining frontend interfaces, backend functionality, API integration, and database connectivity.",
    capabilities: [
      "Frontend and backend integration",
      "Server-side application logic (PHP, Node.js)",
      "REST API integration",
      "Database connectivity (MySQL, MongoDB)",
    ],
    benefit: "One developer handling both the interface and the logic behind it.",
    icon: "fullstack",
    tech: ["PHP", "React", "APIs"],
  },
  {
    id: "php-mysql-development",
    index: "05",
    title: "PHP & MySQL Development",
    description:
      "Dynamic PHP applications, MySQL database integration, authentication, CRUD functionality, and custom admin panels.",
    capabilities: [
      "Database design and queries",
      "CRUD functionality",
      "Authentication and authorization",
      "Admin dashboards",
    ],
    benefit: "Data-driven features and admin tools you can use day to day.",
    icon: "database",
    tech: ["PHP", "MySQL"],
  },
  {
    id: "react-nextjs-development",
    index: "06",
    title: "React & Next.js Development",
    description:
      "Modern component-based interfaces, reusable components, routing, and Next.js applications.",
    capabilities: [
      "Reusable React components",
      "Next.js routing",
      "API integration",
      "Rendering and loading optimization",
    ],
    benefit: "Interfaces built from reusable parts that stay easy to extend.",
    icon: "react",
    tech: ["React", "Next.js"],
  },
  {
    id: "ecommerce-development",
    index: "07",
    title: "E-commerce Website Development",
    description:
      "Online stores with product catalogs, product detail pages, shopping carts, checkout integration, and order management.",
    capabilities: [
      "Product catalogs",
      "Shopping cart functionality",
      "Checkout and payment gateway integration",
      "Order management",
    ],
    benefit: "A store where customers can browse and order, and you can manage what comes in.",
    icon: "ecommerce",
    tech: ["PHP", "MySQL", "APIs"],
  },
  {
    id: "website-maintenance",
    index: "08",
    title: "Website Maintenance",
    description:
      "Content updates, bug fixes, compatibility checks, security improvements, and ongoing technical support.",
    capabilities: [
      "Bug fixing",
      "Content updates",
      "Dependency and compatibility checks",
      "Backup and security maintenance",
    ],
    benefit: "Fewer surprises: issues get fixed and the site keeps working as things change.",
    icon: "maintenance",
    tech: ["Maintenance", "Bug Fixes"],
  },
  {
    id: "website-optimization",
    index: "09",
    title: "Website Performance Optimization",
    description:
      "Website speed improvements, image optimization, performance audits, and Core Web Vitals improvements. Results are measured after testing, not promised in advance.",
    capabilities: [
      "Image optimization",
      "Asset loading improvements",
      "Core Web Vitals analysis",
      "Performance testing and verification",
    ],
    benefit: "A faster-feeling site, with changes checked against real measurements.",
    icon: "performance",
    tech: ["Speed", "Core Web Vitals"],
  },
];
