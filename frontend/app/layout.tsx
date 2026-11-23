import type { Metadata } from "next";
import { Navbar } from "@/components/identidade/Navbar";
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
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
