import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rede Social da Trilha",
  description: "Mini-projeto 3 — troque este título pelo nome do seu nicho",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-zinc-50 text-zinc-900">
        <nav className="border-b bg-white">
          <div className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-bold">
              {/* troque pelo nome/logo do seu nicho */}
              Rede da Trilha
            </Link>
          </div>
        </nav>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
