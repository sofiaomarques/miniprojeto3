"use client";

// Feed da rede: as indicações (avaliações) de quem eu sigo, das mais
// recentes para as mais antigas. Cada item diz quem indicou (abre o perfil
// dela) e qual prestadora (abre a página dela).
import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar, tomDaPosicao } from "@/components/descoberta/Avatar";
import { Carregando, Erro, Vazio } from "@/components/descoberta/Estados";
import { NotaAvaliacao } from "@/components/descoberta/Estrelas";
import type { Avaliacao } from "@/lib/descoberta/types";
import { listarIndicacoesDeQuemSigo } from "@/lib/seguidores/service";

export function FeedIndicacoes() {
  const [indicacoes, setIndicacoes] = useState<Avaliacao[] | null>(null);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setIndicacoes(null);
    setErro(false);
    listarIndicacoesDeQuemSigo().then(
      (lista) => !cancelado && setIndicacoes(lista),
      (err) => {
        if (cancelado) return;
        console.error("Erro ao carregar o feed:", err);
        setErro(true);
      },
    );
    return () => {
      cancelado = true;
    };
  }, [tentativa]);

  if (erro) {
    return (
      <Erro
        mensagem="Não consegui carregar as indicações da sua rede."
        onTentarDeNovo={() => setTentativa((t) => t + 1)}
      />
    );
  }
  if (indicacoes === null) return <Carregando texto="Carregando indicações…" linhas={3} />;

  if (indicacoes.length === 0) {
    return (
      <Vazio>
        Ainda não há indicações por aqui. Siga suas amigas para ver quem elas
        recomendam.{" "}
        <Link href="/pessoas" className="font-bold text-vinho underline">
          Encontrar pessoas
        </Link>
      </Vazio>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {indicacoes.map((a, i) => (
        <li key={a.id} className="flex flex-col gap-2.5 rounded-[18px] border border-borda bg-papel p-3.5">
          <Link
            href={`/pessoas/${a.clienteId}`}
            className="flex items-center gap-2 self-start text-[13.5px] text-corpo focus-visible:outline-2 focus-visible:outline-vinho"
          >
            <Avatar nome={a.clienteNome} url={a.clienteAvatarUrl} tamanho={28} fundo="areia" />
            <span>
              <b className="text-texto">{a.clienteNome || "Cliente"}</b> indicou
            </span>
          </Link>

          <Link
            href={`/prestadoras/${a.prestadoraId}`}
            className="flex w-full items-center gap-3 focus-visible:outline-2 focus-visible:outline-vinho"
          >
            <Avatar nome={a.prestadoraNome} url={a.prestadoraAvatarUrl} tamanho={44} fundo={tomDaPosicao(i)} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <b className="truncate text-[15.5px]">{a.prestadoraNome || "Prestadora"}</b>
              <time dateTime={a.criadaEm} className="text-[13px] text-suave">
                {new Date(a.criadaEm).toLocaleDateString("pt-BR")}
              </time>
            </div>
            <NotaAvaliacao nota={a.nota} />
          </Link>

          {a.comentario && (
            <p className="whitespace-pre-line break-words text-[13.5px] leading-[1.45] text-corpo">
              {a.comentario}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
