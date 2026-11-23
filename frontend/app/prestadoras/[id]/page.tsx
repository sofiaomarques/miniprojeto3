"use client";
// ↑ usa useEffect e useParams → client component.

// Página pública da prestadora (#25): a cliente vê fotos, categorias, nota e
// avaliações antes de chamar no chat. Tudo vem do service da descoberta; a
// tela não sabe se os dados são de mock ou do banco.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CabecalhoPrestadora } from "@/components/descoberta/CabecalhoPrestadora";
import { GaleriaPortfolio } from "@/components/descoberta/GaleriaPortfolio";
import { ListaAvaliacoes } from "@/components/descoberta/ListaAvaliacoes";
import { obterPrestadora } from "@/lib/descoberta/service";
import type { PrestadoraDetalhe } from "@/lib/descoberta/types";

type Estado =
  | { situacao: "carregando" }
  | { situacao: "nao_encontrada" }
  | { situacao: "erro"; mensagem: string }
  | { situacao: "pronta"; prestadora: PrestadoraDetalhe };

export default function PaginaPrestadora() {
  const { id } = useParams<{ id: string }>();
  const [estado, setEstado] = useState<Estado>({ situacao: "carregando" });

  useEffect(() => {
    // Ignora a resposta se o id mudou ou a página saiu da tela antes.
    let cancelado = false;
    setEstado({ situacao: "carregando" });

    obterPrestadora(id).then(
      (prestadora) => {
        if (cancelado) return;
        setEstado(
          prestadora
            ? { situacao: "pronta", prestadora }
            : { situacao: "nao_encontrada" },
        );
      },
      (err) => {
        if (cancelado) return;
        setEstado({
          situacao: "erro",
          mensagem: err instanceof Error ? err.message : "Erro ao carregar a prestadora.",
        });
      },
    );

    return () => {
      cancelado = true;
    };
  }, [id]);

  return (
    <div className="space-y-6">
      <Link href="/buscar" className="text-sm text-zinc-600 underline hover:text-zinc-900">
        ← Voltar para a busca
      </Link>

      {estado.situacao === "carregando" && (
        <p role="status" className="text-zinc-600">
          Carregando prestadora...
        </p>
      )}

      {estado.situacao === "nao_encontrada" && (
        <section className="space-y-2 rounded-lg border bg-white p-6 text-center">
          <h1 className="text-xl font-bold">Prestadora não encontrada</h1>
          <p className="text-sm text-zinc-600">
            O link pode estar errado ou o perfil não está mais disponível.
          </p>
          <Link href="/buscar" className="inline-block text-sm underline">
            Ver outras prestadoras
          </Link>
        </section>
      )}

      {estado.situacao === "erro" && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {estado.mensagem}
        </p>
      )}

      {estado.situacao === "pronta" && (
        <>
          <CabecalhoPrestadora prestadora={estado.prestadora} />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Trabalhos</h2>
            <GaleriaPortfolio fotos={estado.prestadora.fotos} />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Avaliações</h2>
            <ListaAvaliacoes avaliacoes={estado.prestadora.avaliacoes} />
          </section>
        </>
      )}
    </div>
  );
}
