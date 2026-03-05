import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MTG Card Explainer",
  description:
    "Search Magic: The Gathering cards and get plain-English explanations powered by Claude AI.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <header className="border-b" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🃏</span>
              <span className="text-xl font-bold" style={{ color: "var(--accent-light)" }}>
                MTG Explainer
              </span>
            </Link>
            <span className="text-sm" style={{ color: "rgba(232,232,240,0.5)" }}>
              AI-powered card explanations
            </span>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t mt-16 py-8 text-center text-sm" style={{ borderColor: "var(--card-border)", color: "rgba(232,232,240,0.4)" }}>
          <p>
            Card data provided by{" "}
            <a href="https://scryfall.com" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
              Scryfall
            </a>
            . Explanations powered by{" "}
            <a href="https://anthropic.com" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
              Claude
            </a>
            .
          </p>
          <p className="mt-1">
            Magic: The Gathering is ™ &amp; © Wizards of the Coast.
          </p>
        </footer>
      </body>
    </html>
  );
}
