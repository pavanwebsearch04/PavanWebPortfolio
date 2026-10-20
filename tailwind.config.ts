import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Near-black stays the base; the lighter graphite steps are for cards
        // and panels so content separates from the page without going bright.
        ink: {
          DEFAULT: "#0a0a0c",
          raised: "#111115",
          graphite: "#19191e",
          panel: "#202026",
          line: "#2e2e35",
        },
        // Text hierarchy (contrast vs #0a0a0c / vs #19191e panels):
        //   DEFAULT headings  ~17:1 / ~15:1
        //   body              ~13:1 / ~11:1
        //   muted secondary   ~9:1  / ~8:1
        //   dim metadata      ~6.9:1 / ~6.1:1
        paper: {
          DEFAULT: "#f2efe8",
          body: "#d9d6cf",
          muted: "#b4b2b8",
          dim: "#9c9aa1",
        },
        crimson: {
          DEFAULT: "#a73a2f",
          bright: "#d4483b",
          // lighter crimson for small text on dark surfaces (>= 5.7:1)
          text: "#ee6c5c",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        // technical labels: small but legible (13px)
        label: ["0.8125rem", { lineHeight: "1.45", letterSpacing: "0.1em" }],
        // navigation (13 -> 15px)
        nav: ["clamp(0.8125rem, 0.78rem + 0.12vw, 0.9375rem)", { lineHeight: "1.4", letterSpacing: "0.07em" }],
        // supporting text (15 -> 16px)
        support: ["clamp(0.9375rem, 0.91rem + 0.12vw, 1rem)", { lineHeight: "1.65" }],
        // paragraph body (17 -> 19px)
        body: ["clamp(1.0625rem, 1.02rem + 0.18vw, 1.1875rem)", { lineHeight: "1.7" }],
        // card headings (20 -> 28px)
        card: ["clamp(1.25rem, 1.1rem + 0.6vw, 1.75rem)", { lineHeight: "1.2" }],
        // section headings (36 -> 76px)
        section: ["clamp(2.25rem, 1.4rem + 4.4vw, 4.75rem)", { lineHeight: "0.98" }],
      },
    },
  },
  plugins: [],
};
export default config;
