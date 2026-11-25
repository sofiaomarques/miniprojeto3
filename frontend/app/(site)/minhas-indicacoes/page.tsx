"use client";
// Minhas indicações (#27): as avaliações que a cliente fez. A lista em si é o
// componente ListaIndicacoes, que a P1 também usa no perfil da cliente (#18).

import Link from "next/link";

import { Carregando, Vazio } from "@/components/descoberta/Estados";
import { ListaIndicacoes } from "@/components/descoberta/ListaIndicacoes";
import { useMeuPerfil } from "@/components/descoberta/useMeuPerfil";

export default function MinhasIndicacoesPage() {
  const usuaria = useMeuPerfil();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Minhas indicações</h1>
      {usuaria === undefined && <Carregando texto="Carregando…" linhas={2} />}
      {usuaria === null && (
        <Vazio>
          Entre na sua conta para ver suas indicações.{" "}
          <Link
            href={`/entrar?next=${encodeURIComponent("/minhas-indicacoes")}`}
            className="font-medium underline"
          >
            Entrar
          </Link>
        </Vazio>
      )}
      {usuaria?.papel === "prestadora" && (
        <Vazio>Indicações são as avaliações que clientes fazem. Contas de prestadora não avaliam.</Vazio>
      )}
      {usuaria && usuaria.papel === null && (
        <Vazio>
          <Link href="/onboarding" className="font-medium underline">
            Conclua seu cadastro
          </Link>{" "}
          para avaliar prestadoras.
        </Vazio>
      )}
      {usuaria?.papel === "cliente" && <ListaIndicacoes clienteId={usuaria.id} editavel />}
    </div>
  );
}
