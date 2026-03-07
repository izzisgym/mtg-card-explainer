import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "What does this Magic card do?",
  description: "Search Magic: The Gathering cards and get plain-English explanations powered by AI.",
  icons: { icon: "/favicon.ico" },
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
