import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: "#05070d",
          900: "#0a0e1a",
          800: "#10162a",
          700: "#151d38",
          600: "#1c2750",
        },
        steel: {
          900: "#0b0d12",
          800: "#12151c",
          700: "#1a1e28",
          600: "#262b38",
          500: "#3a4052",
          400: "#5b6378",
          300: "#8b93a7",
          200: "#c4c9d6",
          100: "#e9ecf3",
        },
        accent: {
          DEFAULT: "#e0b86c",
          hot: "#f5d48a",
          ember: "#c48a3b",
          red: "#ff4d57",
          cyan: "#6bd6ff",
        },
      },
      fontFamily: {
        display: ["'Bebas Neue'", "Oswald", "Impact", "sans-serif"],
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Inter'", "'Helvetica Neue'", "Arial", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Courier New'", "monospace"],
      },
      backgroundImage: {
        "grid-lines":
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "radial-fade":
          "radial-gradient(ellipse at top, rgba(224,184,108,0.12), transparent 60%)",
        "grain": "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/><feColorMatrix values=%220 0 0 0 0.05 0 0 0 0 0.07 0 0 0 0 0.12 0 0 0 0.35 0%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')",
      },
      boxShadow: {
        "edge": "0 0 0 1px rgba(224,184,108,0.35), 0 20px 60px -20px rgba(0,0,0,0.9)",
        "inset-edge": "inset 0 0 0 1px rgba(255,255,255,0.06)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        flicker: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        shimmer: "shimmer 6s linear infinite",
        flicker: "flicker 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
