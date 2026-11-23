import { MolduraRede } from "@/components/rede/Moldura";

// Telas do protótipo "Rede de Mulheres". Conta e sessão vêm do lib/identidade;
// prestadoras, conversa e avaliações ainda são dados de exemplo.
export default function RedeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <MolduraRede>{children}</MolduraRede>;
}
