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
        // STOCKAI OFFICIAL DESIGN TOKENS
        stockai: {
          navy: "#101B4B",
          primary: "#087CFF",
          primaryHover: "#0066D6",
          ai: "#8B36FF",
          aiLight: "#F3E8FF",
          cyan: "#13C9D5",
          success: "#16A34A",
          successLight: "#DCFCE7",
          danger: "#EF4444",
          dangerLight: "#FEE2E2",
          warning: "#F59E0B",
          warningLight: "#FEF3C7",
          realtime: "#00A991",
          realtimeLight: "#CCFBF1",
          pageBg: "#F4F7FF",
          surface: "#FFFFFF",
          text: "#172554",
          muted: "#647293",
          border: "#DCE5FF",
        },
        // Alias legacy fireant to new official design tokens for 100% compatibility
        fireant: {
          bg: "#F4F7FF",
          card: "#FFFFFF",
          primary: "#087CFF",
          primaryHover: "#0066D6",
          menuActive: "#EBF3FF",
          textMain: "#172554",
          textSub: "#647293",
          border: "#DCE5FF",
          ai: "#8B36FF",
          aiLight: "#F3E8FF",
          profit: "#16A34A",
          profitLight: "#DCFCE7",
          loss: "#EF4444",
          lossLight: "#FEE2E2",
        },
      },
      borderRadius: {
        'card': '16px',
      },
      fontFamily: {
        sans: ["'Inter'", "'Be Vietnam Pro'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        mono: ["'Inter'", "'Be Vietnam Pro'", "monospace"],
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(100deg, #7C3CFF 0%, #087CFF 100%)',
        'gradient-ai': 'linear-gradient(100deg, #8B36FF 0%, #EF4CBF 100%)',
        'gradient-data': 'linear-gradient(100deg, #13C9D5 0%, #087CFF 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
