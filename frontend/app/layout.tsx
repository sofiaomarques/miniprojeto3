import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rede de Mulheres",
  description: "Mulheres que contratam mulheres, com confiança e avaliações públicas.",
};

// Layout mínimo: cada grupo de rotas ((site) e (rede)) define a própria moldura.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
