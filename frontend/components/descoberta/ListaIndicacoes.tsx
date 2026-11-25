"use client";
// Indicações (avaliações) que uma cliente fez. Carrega, edita e apaga por conta
// própria, então a P1 só precisa de <ListaIndicacoes clienteId={...} /> no perfil.
// Só passe `editavel` quando quem vê é a própria cliente: sem ele a lista é só
// leitura e o texto não fala com a dona das avaliações.

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  apagarAvaliacao,
  editarAvaliacao,
  listarIndicacoesDaCliente,
} from "@/lib/descoberta/service";
import type { Avaliacao } from "@/lib/descoberta/types";

import { Avatar } from "./Avatar";
import { NotaAvaliacao } from "./Estrelas";
import { Carregando, Erro, Vazio } from "./Estados";

type Props = { clienteId: string; editavel?: boolean };

export function ListaIndicacoes({ clienteId, editavel = false }: Props) {
  const [indicacoes, setIndicacoes] = useState<Avaliacao[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");
  const [ocupada, setOcupada] = useState(false);
  // Muda a cada "Tentar de novo" para o efeito carregar outra vez.
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setIndicacoes(null);
    setErro(null);
    setEditandoId(null);
    listarIndicacoesDaCliente(clienteId).then(
      (lista) => !cancelado && setIndicacoes(lista),
      (err) => {
        if (cancelado) return;
        console.error("Erro ao carregar as indicações:", err);
        setErro(
          editavel
            ? "Não consegui carregar suas indicações."
            : "Não consegui carregar as indicações.",
        );
      },
    );
    return () => {
      cancelado = true;
    };
  }, [clienteId, editavel, tentativa]);

  function comecarEdicao(a: Avaliacao) {
    setEditandoId(a.id);
    setNota(a.nota);
    setComentario(a.comentario ?? "");
    setErro(null);
  }

  async function salvar(a: Avaliacao) {
    setOcupada(true);
    setErro(null);
    try {
      const nova = await editarAvaliacao(clienteId, a.id, { nota, comentario });
      setIndicacoes(
        (lista) =>
          lista?.map((i) =>
            i.id === a.id ? { ...i, nota: nova.nota, comentario: nova.comentario } : i,
          ) ?? null,
      );
      setEditandoId(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não consegui salvar. Tente de novo.");
    } finally {
      setOcupada(false);
    }
  }

  async function apagar(a: Avaliacao) {
    if (!window.confirm(`Apagar sua avaliação de ${a.prestadoraNome}?`)) return;
    setOcupada(true);
    setErro(null);
    try {
      await apagarAvaliacao(clienteId, a.id);
      setIndicacoes((lista) => lista?.filter((i) => i.id !== a.id) ?? null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não consegui apagar. Tente de novo.");
    } finally {
      setOcupada(false);
    }
  }

  if (indicacoes === null && !erro) {
    return (
      <Carregando
        texto={editavel ? "Carregando suas indicações…" : "Carregando indicações…"}
        linhas={2}
      />
    );
  }

  return (
    <div className="space-y-3">
      {erro && (
        <Erro
          mensagem={erro}
          onTentarDeNovo={indicacoes === null ? () => setTentativa((t) => t + 1) : undefined}
        />
      )}

      {indicacoes?.length === 0 && (
        <Vazio>
          {editavel ? (
            <>
              Você ainda não avaliou ninguém.{" "}
              <Link href="/buscar" className="underline">
                Encontre uma prestadora
              </Link>
            </>
          ) : (
            "Nenhuma indicação ainda."
          )}
        </Vazio>
      )}

      {indicacoes && indicacoes.length > 0 && (
        <ul className="space-y-3">
          {indicacoes.map((a) => (
            <li key={a.id} className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/prestadoras/${a.prestadoraId}`}
                  className="flex min-w-0 items-center gap-3 hover:underline"
                >
                  <Avatar nome={a.prestadoraNome} url={a.prestadoraAvatarUrl} tamanho="p" />
                  <span className="truncate font-medium">{a.prestadoraNome || "Prestadora"}</span>
                </Link>
                <time dateTime={a.criadaEm} className="shrink-0 text-xs text-zinc-500">
                  {new Date(a.criadaEm).toLocaleDateString("pt-BR")}
                </time>
              </div>

              {editavel && editandoId === a.id ? (
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void salvar(a);
                  }}
                >
                  <label className="block text-sm">
                    Nota
                    <select
                      value={nota}
                      onChange={(e) => setNota(Number(e.target.value))}
                      className="ml-2 min-h-11 rounded border bg-white px-2 text-base sm:min-h-0 sm:py-1 sm:text-sm"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "estrela" : "estrelas"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    Comentário
                    <textarea
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      rows={3}
                      maxLength={1000}
                      className="mt-1 w-full rounded border px-2 py-1 text-base sm:text-sm"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={ocupada}
                      className="min-h-11 rounded bg-zinc-900 px-4 text-sm text-white disabled:opacity-50 sm:min-h-0 sm:py-1.5"
                    >
                      {ocupada ? "Salvando…" : "Salvar"}
                    </button>
                    <button
                      type="button"
                      disabled={ocupada}
                      onClick={() => setEditandoId(null)}
                      className="min-h-11 rounded border bg-white px-4 text-sm sm:min-h-0 sm:py-1.5"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <NotaAvaliacao nota={a.nota} />
                  {a.comentario && (
                    <p className="whitespace-pre-line break-words text-sm text-zinc-700">
                      {a.comentario}
                    </p>
                  )}
                  {editavel && (
                    <div className="flex gap-1 text-sm">
                      <button
                        type="button"
                        disabled={ocupada}
                        onClick={() => comecarEdicao(a)}
                        className="min-h-11 px-2 underline disabled:opacity-50 sm:min-h-0 sm:py-1"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={ocupada}
                        onClick={() => void apagar(a)}
                        className="min-h-11 px-2 text-red-700 underline disabled:opacity-50 sm:min-h-0 sm:py-1"
                      >
                        Apagar
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
