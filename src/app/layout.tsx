import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Universal Personal Medical AI — Lifelong Health Intelligence",
  description: "Your Entire Medical Life. One Intelligent Platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="h-full text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900">
        {children}
      </body>
    </html>
  );
}
