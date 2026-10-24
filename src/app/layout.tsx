import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StockAI Personal — Nền Tảng Phân Tích Chứng Khoán & Quét T+3 AI',
  description: 'Phần mềm quản trị đầu tư, phân tích kỹ thuật và phát hiện cơ hội giao dịch ngắn hạn HOSE, HNX, UPCoM',
  icons: {
    icon: '/images/stockai-logo.png',
    shortcut: '/images/stockai-logo.png',
    apple: '/images/stockai-logo.png',
  },
};

import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Carlito:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F4F7FF] text-[#172554] min-h-screen antialiased selection:bg-[#087CFF] selection:text-white">
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}

