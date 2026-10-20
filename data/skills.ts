// Real skills only — no invented tools, no proficiency scores.

export type SkillCategoryId =
  | "wordpress"
  | "frontend"
  | "backend"
  | "database"
  | "tools"
  | "professional";

export interface SkillCategoryMeta {
  id: SkillCategoryId;
  label: string;
  shortLabel: string;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategoryId;
}

export const skillCategories: SkillCategoryMeta[] = [
  { id: "wordpress", label: "WordPress Development", shortLabel: "WORDPRESS" },
  { id: "frontend", label: "Frontend Development", shortLabel: "FRONTEND" },
  { id: "backend", label: "Backend Development", shortLabel: "BACKEND" },
  { id: "database", label: "Database Management", shortLabel: "DATA" },
  { id: "tools", label: "Tools & Workflow", shortLabel: "TOOLS" },
  { id: "professional", label: "Professional Skills", shortLabel: "SOFT SKILLS" },
];

function makeSkills(category: SkillCategoryId, names: string[]): Skill[] {
  return names.map((name) => ({
    id: `${category}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    category,
  }));
}

export const skills: Skill[] = [
  ...makeSkills("wordpress", [
    "WordPress",
    "WooCommerce",
    "Theme Customization",
    "Plugin Integration",
    "Custom Post Types",
    "Advanced Custom Fields (ACF)",
    "Elementor",
    "Gutenberg",
    "Dynamic Content Management",
    "WordPress REST API",
  ]),
  ...makeSkills("frontend", ["HTML", "CSS", "JavaScript", "React", "Bootstrap", "Tailwind CSS", "Responsive Web Design"]),
  ...makeSkills("backend", ["PHP", "Node.js", "Express.js"]),
  ...makeSkills("database", ["MySQL", "MongoDB"]),
  ...makeSkills("tools", ["Visual Studio Code", "Git", "GitHub"]),
  ...makeSkills("professional", [
    "Problem Solving",
    "Communication",
    "Teamwork",
    "Time Management",
    "Adaptability",
    "Attention to Detail",
  ]),
];

export function skillsByCategory(category: SkillCategoryId): Skill[] {
  return skills.filter((s) => s.category === category);
}

/* ------------------------------------------------------------------ */
/* Relationships, emphasis and short descriptions used by the Skills web. */
/* ------------------------------------------------------------------ */

const byName = new Map(skills.map((s) => [s.name, s]));
const idOf = (name: string): string => {
  const skill = byName.get(name);
  if (!skill) throw new Error(`data/skills.ts: unknown skill "${name}"`);
  return skill.id;
};

// Skills that appear most often across the roles in data/experience.ts get a
// slightly larger node. This is emphasis, not a proficiency rating.
export const coreSkillIds: ReadonlySet<string> = new Set(
  ["WordPress", "Elementor", "PHP", "HTML", "CSS", "JavaScript", "MySQL", "Responsive Web Design"].map(idOf)
);

// Real technology relationships ("builds on", "runs on", "styles", "is used
// with"). The Skills web highlights exactly these connections.
const LINKS: Array<[string, string]> = [
  // WordPress ecosystem
  ["WordPress", "WooCommerce"],
  ["WordPress", "Theme Customization"],
  ["WordPress", "Plugin Integration"],
  ["WordPress", "Custom Post Types"],
  ["WordPress", "Advanced Custom Fields (ACF)"],
  ["WordPress", "Elementor"],
  ["WordPress", "Gutenberg"],
  ["WordPress", "Dynamic Content Management"],
  ["WordPress", "WordPress REST API"],
  ["Advanced Custom Fields (ACF)", "Custom Post Types"],
  ["Dynamic Content Management", "Advanced Custom Fields (ACF)"],
  ["Dynamic Content Management", "Custom Post Types"],
  ["Elementor", "Gutenberg"],
  ["WooCommerce", "Plugin Integration"],
  // WordPress to the languages and data it runs on
  ["WordPress", "PHP"],
  ["WordPress", "MySQL"],
  ["Theme Customization", "PHP"],
  ["Theme Customization", "HTML"],
  ["Theme Customization", "CSS"],
  ["Plugin Integration", "PHP"],
  ["Custom Post Types", "PHP"],
  ["WordPress REST API", "PHP"],
  ["WordPress REST API", "JavaScript"],
  ["Gutenberg", "React"],
  // Frontend
  ["HTML", "CSS"],
  ["HTML", "JavaScript"],
  ["CSS", "JavaScript"],
  ["JavaScript", "React"],
  ["CSS", "Bootstrap"],
  ["CSS", "Tailwind CSS"],
  ["CSS", "Responsive Web Design"],
  ["Bootstrap", "Responsive Web Design"],
  ["Tailwind CSS", "Responsive Web Design"],
  // Backend and data
  ["PHP", "MySQL"],
  ["PHP", "Node.js"],
  ["Node.js", "JavaScript"],
  ["Node.js", "Express.js"],
  ["Express.js", "MongoDB"],
  ["Node.js", "MongoDB"],
  ["MySQL", "MongoDB"],
  // Tools
  ["Git", "GitHub"],
  ["Visual Studio Code", "Git"],
  ["Visual Studio Code", "JavaScript"],
  ["Visual Studio Code", "PHP"],
  // Professional skills
  ["Problem Solving", "Attention to Detail"],
  ["Problem Solving", "Adaptability"],
  ["Communication", "Teamwork"],
  ["Teamwork", "GitHub"],
  ["Time Management", "Adaptability"],
  ["Time Management", "Attention to Detail"],
];

export const skillLinks: ReadonlyArray<readonly [string, string]> = LINKS.map(
  ([a, b]) => [idOf(a), idOf(b)] as const
);

// id -> ids of directly related skills (both directions)
export const skillNeighbors: Readonly<Record<string, string[]>> = (() => {
  const map: Record<string, string[]> = {};
  skills.forEach((s) => (map[s.id] = []));
  skillLinks.forEach(([a, b]) => {
    map[a].push(b);
    map[b].push(a);
  });
  return map;
})();

// What each technology is, in one factual sentence. No levels and no claims
// beyond what the technology does; where it was used is shown in Experience.
const DESCRIPTIONS: Record<string, string> = {
  WordPress: "A content management system for building and managing dynamic websites.",
  WooCommerce: "A WordPress plugin that adds online-store features such as products and checkout.",
  "Theme Customization": "Adapting a WordPress theme's templates, styles and layout to a site's design.",
  "Plugin Integration": "Installing and configuring plugins to add features such as SEO, security or forms.",
  "Custom Post Types": "WordPress content types beyond posts and pages, defined for structured content.",
  "Advanced Custom Fields (ACF)": "A WordPress plugin that attaches structured custom fields to content.",
  Elementor: "A visual page builder for designing WordPress layouts.",
  Gutenberg: "WordPress's block editor, used to compose page layouts from blocks.",
  "Dynamic Content Management": "Keeping site content editable and data-driven instead of fixed in page templates.",
  "WordPress REST API": "Exposes WordPress content as JSON endpoints that other apps and scripts can use.",
  HTML: "The markup language that gives web pages their structure and content.",
  CSS: "The styling language for layout, typography, colour and responsive behaviour.",
  JavaScript: "The language of browser interactivity: events, DOM updates and data fetching.",
  React: "A JavaScript library for building interactive user interfaces from components.",
  Bootstrap: "A CSS framework with a responsive grid and ready-made components.",
  "Tailwind CSS": "A utility-first CSS framework for building custom designs directly in markup.",
  "Responsive Web Design": "Layouts that adapt to screen size so a site works on phones, tablets and desktops.",
  PHP: "A server-side language, and the one WordPress itself is written in.",
  "Node.js": "A JavaScript runtime for running code on the server.",
  "Express.js": "A minimal Node.js web framework for routes and APIs.",
  MySQL: "A relational database; the data store behind WordPress and many PHP applications.",
  MongoDB: "A document database that stores JSON-like records.",
  "Visual Studio Code": "The code editor used for day-to-day development.",
  Git: "Version control: tracks changes to code and supports working in branches.",
  GitHub: "Hosts Git repositories for sharing, review and collaboration.",
  "Problem Solving": "Breaking an issue into parts to find its cause and a workable fix.",
  Communication: "Keeping clients and teammates clear on requirements, progress and decisions.",
  Teamwork: "Working with others on shared projects and UI/UX improvements.",
  "Time Management": "Planning and ordering work so project deadlines are met.",
  Adaptability: "Picking up new tools and adjusting to changing project requirements.",
  "Attention to Detail": "Checking layouts, behaviour and content closely before they ship.",
};

export const skillDescriptions: Readonly<Record<string, string>> = Object.fromEntries(
  skills.map((s) => [s.id, DESCRIPTIONS[s.name] ?? ""])
);

export const categoryDescriptions: Readonly<Record<SkillCategoryId, string>> = {
  wordpress: "Building, customising and extending WordPress sites.",
  frontend: "The languages and frameworks that run in the browser.",
  backend: "Server-side languages and runtimes.",
  database: "Where application and site data is stored.",
  tools: "Editors, version control and design software.",
  professional: "How the work gets planned, shared and finished.",
};
