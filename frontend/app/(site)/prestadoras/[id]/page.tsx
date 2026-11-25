"use client";
// ↑ usa useEffect e useParams → client component.

// Página pública da prestadora (#25): a cliente vê fotos, categorias, nota e
// avaliações antes de chamar no chat. Tudo vem do service da descoberta; a
// tela não sabe se os dados são de mock ou do banco.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CabecalhoPrestadora } from "@/components/descoberta/CabecalhoPrestadora";
import { Carregando, Erro } from "@/components/descoberta/Estados";
import { FormularioAvaliacao } from "@/components/descoberta/FormularioAvaliacao";
import { GaleriaPortfolio } from "@/components/descoberta/GaleriaPortfolio";
import { ListaAvaliacoes } from "@/components/descoberta/ListaAvaliacoes";
import { useMeuPerfil } from "@/components/descoberta/useMeuPerfil";
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
  const usuaria = useMeuPerfil();
  // Muda a cada avaliação salva, para recarregar a nota média e a lista.
  const [versao, setVersao] = useState(0);
  // Id da prestadora cujos dados estão na tela; só recarregar a mesma não pisca.
  const idCarregado = useRef<string | null>(null);

  useEffect(() => {
    // Ignora a resposta se o id mudou ou a página saiu da tela antes.
    let cancelado = false;
    // Só mostra "carregando" ao trocar de prestadora; recarregar a mesma (depois
    // de salvar uma avaliação) atualiza sem piscar a tela.
    if (idCarregado.current !== id) setEstado({ situacao: "carregando" });

    obterPrestadora(id).then(
      (prestadora) => {
        if (cancelado) return;
        idCarregado.current = prestadora ? id : null;
        setEstado(
          prestadora
            ? { situacao: "pronta", prestadora }
            : { situacao: "nao_encontrada" },
        );
      },
      (err) => {
        if (cancelado) return;
        idCarregado.current = null;
        // Detalhe técnico só no console; a tela mostra texto fixo.
        console.error("Erro ao carregar a prestadora:", err);
        setEstado({
          situacao: "erro",
          mensagem: "Não consegui carregar a prestadora.",
        });
      },
    );

    return () => {
      cancelado = true;
    };
  }, [id, versao]);

  return (
    <div className="space-y-6">
      <Link
        href="/buscar"
        className="inline-flex min-h-11 items-center text-sm text-zinc-600 underline hover:text-zinc-900 sm:min-h-0"
      >
        ← Voltar para a busca
      </Link>

      {estado.situacao === "carregando" && <Carregando texto="Carregando prestadora…" linhas={2} />}

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
        <Erro mensagem={estado.mensagem} onTentarDeNovo={() => setVersao((v) => v + 1)} />
      )}

      {estado.situacao === "pronta" && (
        <>
          <CabecalhoPrestadora prestadora={estado.prestadora} usuaria={usuaria} />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Trabalhos</h2>
            <GaleriaPortfolio fotos={estado.prestadora.fotos} nome={estado.prestadora.perfil.nome} />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Avaliações</h2>
            {usuaria === undefined ? null : usuaria?.papel === "cliente" ? (
              <FormularioAvaliacao
                key={`${usuaria.id}:${id}`}
                prestadoraId={id}
                clienteId={usuaria.id}
                existente={
                  estado.prestadora.avaliacoes.find((a) => a.clienteId === usuaria.id) ?? null
                }
                onSalvo={() => setVersao((v) => v + 1)}
              />
            ) : usuaria?.papel === "prestadora" ? (
              <p className="text-sm text-zinc-500">Só clientes podem avaliar prestadoras.</p>
            ) : usuaria ? (
              <p className="text-sm text-zinc-600">
                <Link href="/onboarding" className="underline">
                  Conclua seu cadastro
                </Link>{" "}
                para avaliar.
              </p>
            ) : (
              <p className="text-sm text-zinc-600">
                <Link
                  href={`/entrar?next=${encodeURIComponent(`/prestadoras/${id}`)}`}
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
