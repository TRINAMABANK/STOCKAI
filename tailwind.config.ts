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
        // FireAnt-inspired precise color palette
        fireant: {
          bg: "#F5F8FC",           // Nền tổng thể
          card: "#FFFFFF",         // Thẻ nội dung
          primary: "#008FD3",      // Màu chủ đạo
          primaryHover: "#007bb8",
          menuActive: "#E0F2FE",   // Màu nền khi chọn menu
          textMain: "#172033",     // Tiêu đề và nội dung chính
          textSub: "#64748B",      // Chữ phụ
          border: "#E2E8F0",       // Đường viền
          ai: "#8B5CF6",           // Tính năng AI
          aiLight: "#EDE9FE",
          profit: "#10B981",       // Lợi nhuận
          profitLight: "#D1FAE5",
          loss: "#F43F5E",         // Thua lỗ và cảnh báo
          lossLight: "#FFE4E6",
        },
      },
      borderRadius: {
        'card': '14px',
      },
      fontFamily: {
        sans: ["'Calibri'", "'Calibri (Body)'", "'Carlito'", "'Segoe UI'", "Arial", "sans-serif"],
        mono: ["'Calibri'", "'Calibri (Body)'", "'Carlito'", "'Segoe UI'", "Arial", "sans-serif"],
      },

    },
  },
  plugins: [],
};
export default config;
