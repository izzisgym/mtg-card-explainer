import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpellCheck",
  description: "Search Magic: The Gathering cards and get plain-English explanations powered by AI.",
  icons: { icon: "/favicon.ico" },
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <header style={{ borderBottom: "3px solid var(--accent)", background: "var(--card-bg)" }}>
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <a href="/" style={{ textDecoration: "none" }}>
              <span
                className="font-black uppercase"
                style={{ fontSize: "clamp(1.2rem, 4vw, 1.6rem)", letterSpacing: "-0.02em", color: "var(--foreground)" }}
              >
                Spell<span style={{ color: "var(--accent)" }}>Check</span>
              </span>
            </a>
            <span
              className="text-xs font-black uppercase tracking-widest"
              style={{ color: "var(--muted-fg)" }}
            >
              Magic Card Explainer
            </span>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
