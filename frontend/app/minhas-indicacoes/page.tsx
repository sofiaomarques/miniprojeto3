"use client";
// Minhas indicações (#27): as avaliações que a cliente fez. A lista em si é o
// componente ListaIndicacoes, que a P1 também usa no perfil da cliente (#18).

import Link from "next/link";
import { useEffect, useState } from "react";

import { ListaIndicacoes } from "@/components/descoberta/ListaIndicacoes";
import { usuarioAtualId } from "@/lib/descoberta/sessao";

export default function MinhasIndicacoesPage() {
  // undefined = descobrindo quem está logada; null = ninguém logada.
  const [clienteId, setClienteId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    usuarioAtualId().then(setClienteId, () => setClienteId(null));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Minhas indicações</h1>
      {clienteId === undefined && (
        <p role="status" className="text-sm text-zinc-600">
          Carregando...
        </p>
      )}
      {clienteId === null && (
        <p className="rounded border bg-white p-4 text-sm text-zinc-600">
          Entre na sua conta para ver suas indicações.{" "}
          <Link
            href={`/entrar?next=${encodeURIComponent("/minhas-indicacoes")}`}
            className="underline"
          >
            Entrar
          </Link>
        </p>
      )}
      {clienteId && <ListaIndicacoes clienteId={clienteId} editavel />}
    </div>
  );
}
