import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#007A33",
          "green-dark": "#005C27",
          "green-light": "#E8F5EE",
          red: "#C8102E",
          black: "#0A0A0A",
        },
        surface: "#FFFFFF",
        muted: "#64748B",
        border: "#E2E8F0",
        background: "#F8FAFC",
        netflix: "#E50914",
      },
      boxShadow: {
        card: "0 4px 16px rgba(10, 10, 10, 0.08)",
      },
      borderRadius: {
        xl: "24px",
        lg: "16px",
        md: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
