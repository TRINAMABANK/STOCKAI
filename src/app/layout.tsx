import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StockAI Personal — Quản trị Đầu tư & T+3 AI',
  description: 'Phần mềm quản lý tài khoản BMSC, phân tích kỹ thuật và phát hiện cơ hội giao dịch T+3 cá nhân',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-slate-100 text-slate-900 min-h-screen antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
