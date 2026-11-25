import Link from "next/link";

import { MolduraRede } from "@/components/rede/Moldura";
import { Marca, Tela } from "@/components/rede/Tela";

// Telas de conta (cadastro, login e onboarding), com o visual da Rede de Mulheres.
// O logo (com a casinha) também leva para o início.
export default function LayoutConta({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <MolduraRede>
      <Tela className="gap-6 px-6 py-8">
        <Link
          href="/"
          aria-label="Rede de Mulheres: ir para o início"
          className="self-start rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vinho"
        >
          <Marca />
        </Link>
        {children}
      </Tela>
    </MolduraRede>
  );
}
