// Portrait — file lives in /public. One source feeds the Home hero, the Home
// About section and the /about page (they share AboutSection).
export const heroImages = {
  portrait: {
    src: "/living-web-portrait.webp",
    alt: "Pavan Vasita wearing an original web-tech superhero suit in a cinematic spider-web environment",
    width: 1122,
    height: 1402,
  },
};

// Project visuals for the Selected Work section. No real screenshots are
// available yet, so these are thematically relevant placeholders — swap the
// `src` for a real screenshot per project whenever one exists. Every card
// falls back to /project-placeholder.svg automatically if a URL fails.
export const projectImages: Record<string, { src: string; alt: string }> = {
  "portfolio-website": {
    src: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=1400&auto=format&fit=crop",
    alt: "Code editor showing a personal portfolio website layout",
  },
  "todo-list-app": {
    src: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=1200&auto=format&fit=crop",
    alt: "Task list interface on a laptop screen",
  },
  "calculator-app": {
    src: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1200&auto=format&fit=crop",
    alt: "Calculator application interface close-up",
  },
  "tic-tac-toe-game": {
    src: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?q=80&w=1200&auto=format&fit=crop",
    alt: "Grid-based game interface on screen",
  },
  "wordpress-dynamic-websites": {
    src: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop",
    alt: "WordPress website dashboard and page builder on screen",
  },
};

export const PROJECT_IMAGE_FALLBACK = "/project-placeholder.svg";
