// Real services only — no invented pricing, stats, or client claims.
// Five services. Each technology appears under the service it belongs to, so
// the cards do not repeat one another.

export type ServiceIcon = "wordpress" | "frontend" | "fullstack" | "ecommerce" | "maintenance";

export interface Service {
  id: string;
  index: string; // "01".."05"
  title: string;
  /** one short sentence; keeps the cards a consistent height */
  description: string;
  capabilities: string[];
  /** what the client gets out of it, in plain language */
  benefit: string;
  icon: ServiceIcon;
  /** short technology labels shown as chips (at most six) */
  tech: string[];
}

export const services: Service[] = [
  {
    id: "wordpress-development",
    index: "01",
    title: "WordPress Development",
    description: "Custom WordPress websites with tailored themes, plugins and content you can manage yourself.",
    capabilities: [
      "Custom themes and theme customization",
      "Plugin integration, Custom Post Types and ACF",
      "Elementor and Gutenberg page layouts",
      "WordPress REST API and dynamic content",
    ],
    benefit: "A site you can update yourself, built around your content.",
    icon: "wordpress",
    tech: ["WordPress", "Elementor", "Gutenberg", "ACF"],
  },
  {
    id: "frontend-development",
    index: "02",
    title: "Frontend Development",
    description: "Responsive, accessible interfaces that look right and work smoothly on every screen.",
    capabilities: [
      "Mobile-first, responsive layouts",
      "HTML5, CSS3 and JavaScript interfaces",
      "Tailwind CSS and Bootstrap styling",
      "Accessible navigation, forms and validation",
    ],
    benefit: "A clear, comfortable experience on whatever device visitors use.",
    icon: "frontend",
    tech: ["HTML", "CSS", "JavaScript", "Tailwind CSS", "Bootstrap"],
  },
  {
    id: "full-stack-web-development",
    index: "03",
    title: "Full-Stack Web Development",
    description: "Complete web applications, from interface to database, on PHP and Laravel or the MERN stack.",
    capabilities: [
      "PHP, Laravel, MySQL and SQL back ends",
      "React.js and Next.js front ends",
      "Node.js, Express.js and MongoDB (MERN stack)",
      "Backend logic, REST APIs and database integration",
    ],
    benefit: "One developer for the interface, the logic and the data behind it.",
    icon: "fullstack",
    tech: ["PHP & Laravel", "MySQL & SQL", "React & Next.js", "Node.js & Express", "MongoDB", "MERN Stack"],
  },
  {
    id: "ecommerce-development",
    index: "04",
    title: "E-commerce Development",
    description: "Online stores with product catalogs, carts, secure checkout and order management.",
    capabilities: [
      "Product catalogs and detail pages",
      "Shopping cart and checkout flow",
      "Payment gateway integration",
      "Order management and WooCommerce setup",
    ],
    benefit: "A store where customers can browse and order, and you can manage what comes in.",
    icon: "ecommerce",
    tech: ["WooCommerce", "Cart & Checkout", "Payment Gateways", "Order Management"],
  },
  {
    id: "website-maintenance-optimization",
    index: "05",
    title: "Website Maintenance & Optimization",
    description: "Updates, fixes and security care, plus speed improvements checked against real measurements.",
    capabilities: [
      "Bug fixes and content updates",
      "Backups, security and compatibility checks",
      "Image and asset loading optimization",
      "Core Web Vitals analysis and testing",
    ],
    benefit: "Fewer surprises and a faster-feeling site, with changes verified by testing.",
    icon: "maintenance",
    tech: ["Bug Fixes", "Security", "Speed", "Core Web Vitals"],
  },
];
