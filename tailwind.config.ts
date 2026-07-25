import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F2EFE6",
        card: "#FBFAF5",
        ink: "#15170F",
        forest: {
          DEFAULT: "#1F3D2B",
          light: "#2E5A3E",
          dark: "#132A1C"
        },
        sage: "#93A392",
        line: "rgba(21,23,15,0.10)"
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        accent: ["Georgia", "ui-serif", "serif"]
      },
      borderRadius: {
        pill: "999px"
      }
    }
  },
  plugins: []
};
export default config;
