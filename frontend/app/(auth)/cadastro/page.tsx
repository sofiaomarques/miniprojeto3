import type { Metadata } from "next";
import Link from "next/link";
import { FormularioCadastro } from "@/components/identidade/FormularioCadastro";
import { redirecionarSeLogada } from "@/lib/identidade/sessao";
import { AvisoModoMock } from "../AvisoModoMock";

export const metadata: Metadata = { title: "Criar conta" };

export default async function PaginaCadastro() {
  await redirecionarSeLogada();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[32px] font-semibold leading-[1.1]">Crie sua conta</h1>
        <p className="text-[15px] leading-snug text-suave">
          Prestadoras com avaliações públicas de outras clientes. Depois você escolhe se vai
          contratar serviços ou oferecer os seus.
        </p>
      </div>

      <AvisoModoMock />
      <FormularioCadastro />

      <p className="text-center text-[14.5px] text-suave">
        Já tem conta?{" "}
        <Link href="/entrar" className="inline-block px-1 py-2.5 font-bold text-vinho">
          Entrar
        </Link>
      </p>
    </div>
  );
}
