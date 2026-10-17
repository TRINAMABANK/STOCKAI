import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        stockai: {
          navy: "#0a1120",
          sidebar: "#0d1527",
          sidebarActive: "#1e293b",
          sidebarHover: "#17233a",
          teal: "#00d084",
          tealGlow: "rgba(0, 208, 132, 0.2)",
          accentPurple: "#6366f1",
          cardDark: "#0f172a",
          cardBorder: "#1e293b",
          bgLight: "#f8fafc",
          green: "#10b981",
          greenLight: "#dcfce7",
          red: "#ef4444",
          redLight: "#fee2e2",
          yellow: "#f59e0b",
          blue: "#3b82f6",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
