import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

/**
 * Kamano design tokens, adapted from the reference editorial design:
 * near-black canvas, warm ember accent, bone/paper light sections, and a
 * small set of deep feature colours for capability cards.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#111213", raised: "#191a1b" },
        bone: "#f4f2ed",
        paper: "#e9e7e1",
        cream: "#f0ede5",
        ember: {
          DEFAULT: "#ff6a1a",
          hover: "#ff8444",
          deep: "#e9540d",
          hero: "#f06a18",
        },
        lagoon: "#143a45",
        crimson: "#a91f18",
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
        mono: ["ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(24px)", filter: "blur(4px)" },
          to: { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
        },
        "fade-down": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 760ms cubic-bezier(.22,.61,.36,1) both",
        "fade-down": "fade-down 210ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
