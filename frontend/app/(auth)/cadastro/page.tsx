import type { Metadata } from "next";
import Link from "next/link";
import { FormularioCadastro } from "@/components/identidade/FormularioCadastro";
import { redirecionarSeLogada } from "@/lib/identidade/sessao";
import { AvisoModoMock } from "../AvisoModoMock";

export const metadata: Metadata = { title: "Criar conta" };

export default async function PaginaCadastro() {
  await redirecionarSeLogada();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <p className="text-sm text-zinc-600">
          Depois você escolhe se vai contratar serviços ou oferecer os seus.
        </p>
      </div>

      <AvisoModoMock />
      <FormularioCadastro />

      <p className="text-center text-sm text-zinc-600">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-medium text-zinc-900 underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
