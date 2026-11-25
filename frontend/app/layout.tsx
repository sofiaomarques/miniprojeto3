import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rede de Mulheres",
  description: "Mulheres que contratam mulheres, com confiança e avaliações públicas.",
};

// Layout mínimo: a moldura fica no layout de cada grupo de rotas ((rede) e (auth)).
// (site) só guarda o chat até ele passar para (rede).
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
