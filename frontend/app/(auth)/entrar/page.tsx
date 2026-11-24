import type { Metadata } from "next";
import Link from "next/link";
import { FormularioEntrar } from "@/components/identidade/FormularioEntrar";
import { IconeEscudo } from "@/components/rede/icones";
import { Aviso } from "@/components/ui/Aviso";
import { caminhoInterno } from "@/lib/identidade/auth";
import { redirecionarSeLogada } from "@/lib/identidade/sessao";
import { AvisoModoMock } from "../AvisoModoMock";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaEntrar({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; next?: string | string[] }>;
}) {
  const { erro, next } = await searchParams;
  // ?next=: para onde voltar depois de entrar (validado; externo é ignorado).
  const voltarPara = caminhoInterno(next);
  await redirecionarSeLogada(voltarPara);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[32px] font-semibold leading-[1.1]">Que bom ter você de volta.</h1>
        <p className="text-[15px] leading-snug text-suave">Use o e-mail e a senha do seu cadastro.</p>
      </div>

      <AvisoModoMock />
      {erro === "link" && (
        <Aviso tipo="erro">
          O link de confirmação é inválido, já expirou ou foi aberto em outro navegador. Tente
          entrar com seu e-mail e senha.
        </Aviso>
      )}

      <FormularioEntrar next={voltarPara} />

      <p className="text-center text-[14.5px] text-suave">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="inline-block px-1 py-2.5 font-bold text-vinho">
          Criar conta
        </Link>
      </p>

      <div className="mt-auto flex items-start gap-3 rounded-[18px] bg-areia p-4">
        <IconeEscudo size={24} className="shrink-0 text-vinho" />
        <p className="text-[13.5px] leading-[1.45] text-corpo">
          Toda prestadora tem perfil, fotos de trabalhos e avaliações públicas de outras clientes.
        </p>
      </div>
    </div>
  );
}
