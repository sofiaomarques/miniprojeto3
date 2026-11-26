import { MolduraRede } from "@/components/rede/Moldura";
import { Marca, Tela } from "@/components/rede/Tela";

// Telas de conta (cadastro, login e onboarding), com o visual da Rede de Mulheres.
export default function LayoutConta({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <MolduraRede>
      <Tela estreita className="gap-6 px-6 py-8">
        <Marca />
        {children}
      </Tela>
    </MolduraRede>
  );
}
