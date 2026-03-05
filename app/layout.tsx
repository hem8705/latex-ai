import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LaTeX AI — Cursor for LaTeX",
  description: "AI-powered LaTeX editor with live compilation and PDF preview",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#1e1e1e] text-[#cccccc] antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
