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
import { FormularioAvaliacao } from "@/components/descoberta/FormularioAvaliacao";
import { ListaAvaliacoes } from "@/components/descoberta/ListaAvaliacoes";
import { obterPrestadora } from "@/lib/descoberta/service";
import { usuarioAtual, type UsuarioAtual } from "@/lib/descoberta/sessao";
import type { PrestadoraDetalhe } from "@/lib/descoberta/types";

type Estado =
  | { situacao: "carregando" }
  | { situacao: "nao_encontrada" }
  | { situacao: "erro"; mensagem: string }
  | { situacao: "pronta"; prestadora: PrestadoraDetalhe };

export default function PaginaPrestadora() {
  const { id } = useParams<{ id: string }>();
  const [estado, setEstado] = useState<Estado>({ situacao: "carregando" });
  const [usuaria, setUsuaria] = useState<UsuarioAtual | null>(null);
  // Muda a cada avaliação salva, para recarregar a nota média e a lista.
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let cancelado = false;
    usuarioAtual().then(
      (u) => !cancelado && setUsuaria(u),
      () => !cancelado && setUsuaria(null),
    );
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    // Ignora a resposta se o id mudou ou a página saiu da tela antes.
    let cancelado = false;
    // Só mostra "carregando" na primeira vez; depois atualiza sem piscar a tela.
    if (versao === 0) setEstado({ situacao: "carregando" });

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
        // Detalhe técnico só no console; a tela mostra texto fixo.
        console.error("Erro ao carregar a prestadora:", err);
        setEstado({
          situacao: "erro",
          mensagem: "Não consegui carregar a prestadora. Tente de novo.",
        });
      },
    );

    return () => {
      cancelado = true;
    };
  }, [id, versao]);

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
            {usuaria?.papel === "cliente" ? (
              <FormularioAvaliacao
                key={usuaria.id}
                prestadoraId={id}
                clienteId={usuaria.id}
                existente={
                  estado.prestadora.avaliacoes.find((a) => a.clienteId === usuaria.id) ?? null
                }
                onSalvo={() => setVersao((v) => v + 1)}
              />
            ) : usuaria?.papel === "prestadora" ? (
              <p className="text-sm text-zinc-500">Só clientes podem avaliar prestadoras.</p>
            ) : (
              <p className="text-sm text-zinc-600">
                <Link
                  href={`/login?next=${encodeURIComponent(`/prestadoras/${id}`)}`}
                  className="underline"
                >
                  Entre na sua conta
                </Link>{" "}
                para avaliar.
              </p>
            )}
            <ListaAvaliacoes avaliacoes={estado.prestadora.avaliacoes} />
          </section>
        </>
      )}
    </div>
  );
}
