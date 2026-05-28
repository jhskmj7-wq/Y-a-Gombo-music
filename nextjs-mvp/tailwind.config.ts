import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gombo: {
          orange: {
            DEFAULT: "#FF7A00",
            hover: "#E06C00",
            light: "#FFF0E0",
          },
          dark: {
            DEFAULT: "#0F0F0F",
            card: "#18181B",
            border: "#27272A",
          },
          white: {
            DEFAULT: "#F5F5F5",
            pure: "#FFFFFF",
          },
          green: {
            DEFAULT: "#00C896",
            light: "#E6FCF7",
          }
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
