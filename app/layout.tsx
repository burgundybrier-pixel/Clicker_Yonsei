import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "학과 대항전 클릭 배틀",
  description: "내 학과를 클릭하면 +1점, 다른 학과를 클릭하면 -1점. 실시간 학과 대항전.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
