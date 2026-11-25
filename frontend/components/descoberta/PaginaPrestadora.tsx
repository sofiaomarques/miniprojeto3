"use client";

// Perfil público da prestadora: fotos, serviços, nota e avaliações antes de
// chamar no chat. Tudo vem do service da descoberta; a tela não sabe se os
// dados são de mock ou do banco.
import Link from "next/link";
import { useEffect, useState } from "react";

import { IconeVoltar } from "@/components/rede/icones";
import { Rotulo } from "@/components/rede/Tela";
import { obterPrestadora } from "@/lib/descoberta/service";
import type { PrestadoraDetalhe } from "@/lib/descoberta/types";

import { Avatar } from "./Avatar";
import { BotaoConversar } from "./BotaoConversar";
import { linhaServicoCidade } from "./Categorias";
import { Carregando, Erro, Vazio } from "./Estados";
import { NotaMedia } from "./Estrelas";
import { GaleriaPortfolio } from "./GaleriaPortfolio";
import { ListaAvaliacoes } from "./ListaAvaliacoes";
import { useMeuPerfil } from "./useMeuPerfil";

type Estado =
  | { situacao: "carregando" }
  | { situacao: "nao_encontrada" }
  | { situacao: "erro" }
  | { situacao: "pronta"; prestadora: PrestadoraDetalhe };

function Voltar() {
  return (
    <Link
      href="/"
      aria-label="Voltar para a busca"
      className="-ml-2 flex h-11 w-11 items-center justify-center"
    >
      <IconeVoltar size={24} />
    </Link>
  );
}

export function PaginaPrestadora({ id }: { id: string }) {
  const [estado, setEstado] = useState<Estado>({ situacao: "carregando" });
  const [tentativa, setTentativa] = useState(0);
  const usuaria = useMeuPerfil();

  useEffect(() => {
    let cancelado = false;
    setEstado({ situacao: "carregando" });
    obterPrestadora(id).then(
      (prestadora) => {
        if (cancelado) return;
        setEstado(prestadora ? { situacao: "pronta", prestadora } : { situacao: "nao_encontrada" });
      },
      (err) => {
        if (cancelado) return;
        console.error("Erro ao carregar a prestadora:", err); // detalhe só no console
        setEstado({ situacao: "erro" });
      },
    );
    return () => {
      cancelado = true;
    };
  }, [id, tentativa]);

  if (estado.situacao !== "pronta") {
    return (
      <div className="flex w-full flex-col gap-4 px-5 pt-5 md:mx-auto md:max-w-6xl">
        <Voltar />
        {estado.situacao === "carregando" && <Carregando texto="Carregando prestadora…" linhas={2} />}
        {estado.situacao === "erro" && (
          <Erro
            mensagem="Não consegui carregar a prestadora."
            onTentarDeNovo={() => setTentativa((t) => t + 1)}
          />
        )}
        {estado.situacao === "nao_encontrada" && (
          <Vazio>
            <h1 className="mb-1 font-display text-xl font-semibold text-texto">
              Prestadora não encontrada
            </h1>
            O link pode estar errado ou o perfil não está mais disponível.{" "}
            <Link href="/" className="font-bold text-vinho underline">
              Ver outras prestadoras
            </Link>
          </Vazio>
        )}
      </div>
    );
  }

  const { perfil, categorias, fotos, avaliacoes, notaMedia, totalAvaliacoes } = estado.prestadora;
  const primeiroNome = perfil.nome?.split(" ")[0] ?? "esta prestadora";
  const minhaAvaliacao =
    usuaria && usuaria !== "erro" ? avaliacoes.find((a) => a.clienteId === usuaria.id) : undefined;
  // Só cliente (ou quem ainda não entrou) vê o link de avaliar; com erro na
  // sessão o link some, para não mandar quem já está logada para o login.
  const podeAvaliar = usuaria === null || (usuaria !== "erro" && usuaria?.papel === "cliente");

  return (
    <>
      <div className="rounded-b-[28px] bg-rosa pb-[22px] pt-5 md:pb-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3.5 px-5">
          <Voltar />
          <div className="flex items-center gap-3.5 md:gap-5">
            <Avatar nome={perfil.nome} url={perfil.avatar_url} tamanho={72} fundo="papel" />
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="break-words font-display text-[25px] font-semibold leading-[1.1] md:text-[32px]">
                {perfil.nome}
              </h1>
              <span className="text-sm text-corpo">{linhaServicoCidade(categorias, perfil.cidade)}</span>
              <NotaMedia nota={notaMedia} total={totalAvaliacoes} />
            </div>
          </div>
        </div>
      </div>

      {/* Celular: bio, fotos, avaliações e o botão fixo embaixo. Computador (lg):
          bio e botão numa coluna à esquerda, fotos e avaliações à direita. */}
      <div className="flex flex-1 flex-col lg:mx-auto lg:grid lg:w-full lg:max-w-6xl lg:flex-none lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:grid-rows-[auto_auto_1fr] lg:gap-x-10 lg:px-5 lg:pb-10 lg:pt-8">
        {perfil.bio && (
          <p className="whitespace-pre-line break-words px-5 pt-[18px] text-[14.5px] leading-normal text-corpo lg:col-start-1 lg:row-start-1 lg:px-0 lg:pb-4 lg:pt-0">
            {perfil.bio}
          </p>
        )}

        <div className="flex flex-1 flex-col gap-4 px-5 pt-4 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:gap-6 lg:px-0 lg:pt-0">
          <section className="flex flex-col gap-2">
            <Rotulo>Trabalhos realizados</Rotulo>
            <GaleriaPortfolio fotos={fotos} nome={perfil.nome} />
          </section>

          <section className="flex flex-col gap-2 pb-4">
            <Rotulo>Avaliações</Rotulo>
            <ListaAvaliacoes avaliacoes={avaliacoes} />
          </section>
        </div>

        <div className="sticky bottom-0 flex flex-col gap-1 border-t border-borda bg-papel px-5 pb-[26px] pt-3 lg:static lg:col-start-1 lg:row-start-2 lg:self-start lg:rounded-[20px] lg:border lg:pb-3 lg:pt-4">
          <BotaoConversar prestadoraId={perfil.id} usuaria={usuaria} />
          {podeAvaliar && (
            <Link
              href={`/avaliar/${perfil.id}`}
              className="flex min-h-11 items-center justify-center text-[14.5px] font-bold text-vinho"
            >
              {minhaAvaliacao ? "Editar sua avaliação" : `Já foi atendida? Avaliar ${primeiroNome}`}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
