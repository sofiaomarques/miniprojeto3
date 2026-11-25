"use client";
// Indicações (avaliações) que uma cliente fez, no visual do protótipo. Carrega
// por conta própria: basta <ListaIndicacoes clienteId={...} />. Com `editavel`
// (quando quem vê é a própria cliente) cada item ganha o link de editar, que
// abre a tela de avaliação.

import Link from "next/link";
import { useEffect, useState } from "react";

import { Rotulo } from "@/components/rede/Tela";
import { listarIndicacoesDaCliente } from "@/lib/descoberta/service";
import type { Avaliacao } from "@/lib/descoberta/types";

import { Avatar, tomDaPosicao } from "./Avatar";
import { NotaAvaliacao } from "./Estrelas";
import { Carregando, Erro, Vazio } from "./Estados";

type Props = { clienteId: string; editavel?: boolean };

export function ListaIndicacoes({ clienteId, editavel = false }: Props) {
  const [indicacoes, setIndicacoes] = useState<Avaliacao[] | null>(null);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setIndicacoes(null);
    setErro(false);
    listarIndicacoesDaCliente(clienteId).then(
      (lista) => !cancelado && setIndicacoes(lista),
      (err) => {
        if (cancelado) return;
        console.error("Erro ao carregar as indicações:", err);
        setErro(true);
      },
    );
    return () => {
      cancelado = true;
    };
  }, [clienteId, tentativa]);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <Rotulo>{editavel ? "Minhas indicações" : "Indicações"}</Rotulo>
        {indicacoes && (
          <span className="text-[13px] text-suave">
            {indicacoes.length} {indicacoes.length === 1 ? "prestadora" : "prestadoras"}
          </span>
        )}
      </div>

      {erro && (
        <Erro
          mensagem={editavel ? "Não consegui carregar suas indicações." : "Não consegui carregar as indicações."}
          onTentarDeNovo={() => setTentativa((t) => t + 1)}
        />
      )}
      {!erro && indicacoes === null && <Carregando texto="Carregando indicações…" linhas={2} />}

      {indicacoes?.length === 0 && (
        <Vazio>
          {editavel ? (
            <>
              Você ainda não avaliou ninguém.{" "}
              <Link href="/" className="font-bold text-vinho underline">
                Encontre uma prestadora
              </Link>
            </>
          ) : (
            "Nenhuma indicação ainda."
          )}
        </Vazio>
      )}

      {indicacoes && indicacoes.length > 0 && (
        <ul className="flex flex-col gap-3">
          {indicacoes.map((a, i) => (
            <li
              key={a.id}
              className="flex flex-col gap-2.5 rounded-[18px] border border-borda bg-papel p-3.5"
            >
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
              {editavel && (
                <Link
                  href={`/avaliar/${a.prestadoraId}`}
                  className="flex min-h-11 items-center self-start text-[13.5px] font-bold text-vinho"
                >
                  Editar ou apagar
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
