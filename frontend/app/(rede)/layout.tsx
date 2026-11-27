import { MolduraRede } from "@/components/rede/Moldura";

// Telas do app (visual do protótipo "Rede de Mulheres"). Conta e sessão vêm do
// lib/identidade; prestadoras e avaliações, do lib/descoberta; conversas, do lib/chat.
// Telas novas entram neste grupo e usam Tela e BarraAbas de components/rede.
export default function RedeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <MolduraRede>{children}</MolduraRede>;
}
