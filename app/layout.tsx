import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Magic Cards Explained",
  description: "Search Magic: The Gathering cards and get plain-English explanations powered by AI.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <header style={{ borderBottom: "3px solid var(--accent)", background: "var(--card-bg)" }}>
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <span
                className="text-sm font-bold px-2 py-1"
                style={{ background: "var(--accent)", color: "#fff", letterSpacing: "0.05em" }}
              >
                MCE
              </span>
              <span className="text-lg font-bold uppercase tracking-widest">
                Magic Cards Explained
              </span>
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>

        <footer
          className="mt-16 py-6 text-center text-xs uppercase tracking-widest"
          style={{ borderTop: "2px solid var(--accent)", color: "var(--muted-fg)" }}
        >
          Magic: The Gathering is ™ &amp; © Wizards of the Coast.
        </footer>
      </body>
    </html>
  );
}
