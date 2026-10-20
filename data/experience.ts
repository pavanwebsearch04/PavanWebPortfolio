// Real experience data only — no invented metrics, clients, or logos.
// Ordered most-recent first (matches how the timeline renders).

export interface ExperienceEntry {
  id: string;
  company: string;
  location?: string;
  role: string;
  duration: string;
  /** One line shown while the card is collapsed; restates the responsibilities below, nothing more. */
  summary: string;
  /** Longer lead-in for the dedicated Experience page; restates the record only. */
  overview: string;
  /** Technologies named in this role's own responsibilities. */
  technologies: string[];
  responsibilities: string[];
  current?: boolean;
}

export const experience: ExperienceEntry[] = [
  {
    id: "web-search-solutions",
    company: "Web Search Solutions",
    location: "Udaipur, Rajasthan",
    role: "Web Developer",
    duration: "August 2026 – Present",
    current: true,
    summary: "Responsive websites built with PHP, WordPress and Elementor.",
    overview:
      "Building and maintaining responsive websites to client requirements, and keeping them working and improving after launch.",
    technologies: ["PHP", "HTML", "CSS", "JavaScript", "MySQL", "WordPress", "Elementor"],
    responsibilities: [
      "Design and develop responsive, user-friendly websites based on client requirements.",
      "Develop and customize websites using PHP, HTML, CSS, JavaScript, and MySQL.",
      "Develop and manage WordPress websites, including theme customization, plugin configuration, and content management.",
      "Create and customize website layouts using Elementor and other WordPress tools.",
      "Implement custom website functionality and modify existing features using PHP.",
      "Ensure websites are responsive, cross-browser compatible, and optimized for performance.",
      "Troubleshoot website issues, fix bugs, and make ongoing design and functionality improvements.",
      "Work on website maintenance, updates, and technical improvements according to project requirements.",
    ],
  },
  {
    id: "freelance-wordpress",
    company: "Self-Employed",
    role: "Freelance WordPress Developer",
    duration: "June 2026 – August 2026",
    summary: "WordPress websites and custom solutions for clients, from planning to deployment.",
    overview:
      "Independent WordPress work for clients, covering design, development, deployment and ongoing maintenance.",
    technologies: ["WordPress", "REST API"],
    responsibilities: [
      "Collaborated with clients to design, develop, and deploy WordPress websites and custom web solutions.",
      "Created custom WordPress functionality through theme and plugin customization.",
      "Worked with REST API integration and dynamic content management.",
      "Improved website performance, accessibility, SEO, and responsive behavior.",
      "Managed project lifecycles from planning and development to deployment and maintenance.",
      "Maintained client communication and technical documentation.",
    ],
  },
  {
    id: "technoprofiles",
    company: "TechnoProfiles Pvt. Ltd.",
    location: "Udaipur, Rajasthan",
    role: "WordPress Developer",
    duration: "February 2026 – May 2026",
    summary: "WordPress sites using Custom Post Types, ACF, Elementor and Gutenberg.",
    overview:
      "WordPress development centred on structured content, theme customisation, and fast, responsive sites.",
    technologies: ["WordPress", "Custom Post Types", "ACF", "Elementor", "Gutenberg", "HTML", "CSS", "JavaScript", "PHP"],
    responsibilities: [
      "Developed responsive and user-friendly WordPress websites.",
      "Created and managed Custom Post Types and Advanced Custom Fields for structured content.",
      "Customized WordPress themes using HTML, CSS, JavaScript, and basic PHP.",
      "Designed layouts using Elementor and Gutenberg.",
      "Integrated and configured SEO, security, and functionality plugins.",
      "Focused on mobile responsiveness, cross-browser compatibility, and website speed optimization.",
      "Collaborated on UI/UX improvements.",
      "Performed maintenance and resolved technical issues.",
    ],
  },
  {
    id: "aarsh-digital-media",
    company: "Aarsh Digital Media",
    role: "Web Designer",
    duration: "September 2024 – September 2025",
    summary: "Websites built with HTML, CSS and JavaScript on live projects.",
    overview: "Web design and frontend work on live projects using HTML, CSS and JavaScript.",
    technologies: ["HTML", "CSS", "JavaScript"],
    responsibilities: [
      "Developed websites using HTML, CSS, JavaScript, and related tools.",
      "Contributed to multiple web projects.",
      "Worked on live projects using HTML, CSS, and JavaScript.",
    ],
  },
  {
    id: "unified-mentor",
    company: "Unified Mentor Pvt. Ltd.",
    role: "Full Stack Web Development Intern — Virtual",
    duration: "April 2025 – July 2025",
    summary: "Three-month virtual internship in responsive web development.",
    overview: "A three-month virtual internship building small web projects with HTML, CSS and JavaScript.",
    technologies: ["HTML", "CSS", "JavaScript"],
    responsibilities: [
      "Completed a three-month virtual internship focused on responsive web development.",
      "Built projects including a Tic-Tac-Toe game, a calculator application, a portfolio website, and a to-do list application.",
      "Used HTML, CSS, and JavaScript throughout the internship.",
    ],
  },
];
