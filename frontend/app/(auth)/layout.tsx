import Link from "next/link";
import { MolduraRede } from "@/components/rede/Moldura";
import { Marca, Tela } from "@/components/rede/Tela";

// Telas de conta (cadastro, login e onboarding), com o visual da Rede de Mulheres.
// A marca leva de volta à busca: sem ela, quem chegava aqui só saía pelo
// botão de voltar do navegador.
export default function LayoutConta({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <MolduraRede>
      <Tela estreita className="gap-6 px-6 py-8">
        <Link
          href="/"
          aria-label="Rede de Mulheres, ir para a busca"
          className="self-start rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vinho"
        >
          <Marca />
        </Link>
        {children}
      </Tela>
    </MolduraRede>
  );
}
