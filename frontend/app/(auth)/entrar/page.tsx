import type { Metadata } from "next";
import Link from "next/link";
import { FormularioEntrar } from "@/components/identidade/FormularioEntrar";
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Entrar</h1>
        <p className="text-sm text-zinc-600">Use o e-mail e a senha do seu cadastro.</p>
      </div>

      <AvisoModoMock />
      {erro === "link" && (
        <Aviso tipo="erro">
          O link de confirmação é inválido, já expirou ou foi aberto em outro navegador. Tente
          entrar com seu e-mail e senha.
        </Aviso>
      )}

      <FormularioEntrar next={voltarPara} />

      <p className="text-center text-sm text-zinc-600">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-zinc-900 underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
