// Real project data only — no invented clients, links, or stats.
// Keep this separate from UI: components read from here, never hardcode copy.

export type ProjectType = "personal" | "internship" | "client";

export interface Project {
  slug: string;
  index: number; // display number, e.g. "01"
  title: string;
  category: string;
  description: string;
  technologies: string[];
  type: ProjectType;
  featured: boolean;
  liveUrl?: string;
  githubUrl?: string;
  /** Approximate position in the section's shared web canvas (0-1000 x 0-560). */
  webPosition: { x: number; y: number };
  accent: "crimson" | "neutral";
}

// The only verifiable public link across these projects is the GitHub
// profile disclosed on the internship line of the CV. It's linked only on
// the projects it actually corresponds to — nothing else is invented.
const INTERNSHIP_GITHUB = "https://github.com/pavantech48";

export const projects: Project[] = [
  {
    slug: "portfolio-website",
    index: 1,
    title: "Portfolio Website",
    category: "Personal Site",
    description:
      "A responsive personal portfolio built during a full-stack internship, focused on clean structure and a fast, distraction-free presentation of work.",
    technologies: ["HTML", "CSS", "JavaScript"],
    type: "internship",
    featured: true,
    githubUrl: INTERNSHIP_GITHUB,
    webPosition: { x: 720, y: 190 },
    accent: "crimson",
  },
  {
    slug: "todo-list-app",
    index: 2,
    title: "To-Do List Application",
    category: "Web App",
    description:
      "A task-management app with add, complete and delete flows, built to practice clean state handling and responsive layout.",
    technologies: ["HTML", "CSS", "JavaScript"],
    type: "internship",
    featured: false,
    githubUrl: INTERNSHIP_GITHUB,
    webPosition: { x: 190, y: 340 },
    accent: "neutral",
  },
  {
    slug: "calculator-app",
    index: 3,
    title: "Calculator Application",
    category: "Web App",
    description:
      "A functional calculator covering standard arithmetic operations, with an interface focused on precise input handling.",
    technologies: ["HTML", "CSS", "JavaScript"],
    type: "internship",
    featured: false,
    githubUrl: INTERNSHIP_GITHUB,
    webPosition: { x: 420, y: 470 },
    accent: "neutral",
  },
  {
    slug: "tic-tac-toe-game",
    index: 4,
    title: "Tic-Tac-Toe Game",
    category: "Interactive / Game",
    description:
      "A two-player browser game with win/draw detection and turn-based logic, built to practice DOM interaction and game-state management.",
    technologies: ["HTML", "CSS", "JavaScript"],
    type: "internship",
    featured: false,
    githubUrl: INTERNSHIP_GITHUB,
    webPosition: { x: 850, y: 420 },
    accent: "neutral",
  },
  {
    slug: "wordpress-dynamic-websites",
    index: 5,
    title: "WordPress Dynamic Websites",
    category: "Client Work",
    description:
      "Multiple client websites built and customized on WordPress — theme and plugin work, Elementor layouts, ACF-driven content, and ongoing maintenance.",
    technologies: ["WordPress", "Elementor", "PHP", "ACF"],
    type: "client",
    featured: false,
    // client work — no public repo to link
    webPosition: { x: 570, y: 300 },
    accent: "crimson",
  },
];

export const featuredProject = projects.find((p) => p.featured)!;
export const secondaryProjects = projects.filter((p) => !p.featured);
