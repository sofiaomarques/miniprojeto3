"use client";

// Formulário de avaliação (#26). Para quem ainda não avaliou é "criar"; se a
// cliente já tem avaliação nesta prestadora, vira "editar" (com opção de apagar).
// As regras (nota 1 a 5, uma por cliente) ficam em lib/descoberta/service.ts.
import { useState, type FormEvent } from "react";

import {
  apagarAvaliacao,
  criarAvaliacao,
  editarAvaliacao,
} from "@/lib/descoberta/service";
import type { Avaliacao } from "@/lib/descoberta/types";

type Props = {
  prestadoraId: string;
  clienteId: string;
  existente: Avaliacao | null; // avaliação atual da cliente, se houver
  onSalvo: () => void; // a página recarrega nota média e lista
};

const LIMITE_COMENTARIO = 1000;

export function FormularioAvaliacao({ prestadoraId, clienteId, existente, onSalvo }: Props) {
  const [nota, setNota] = useState<number>(existente?.nota ?? 0);
  const [comentario, setComentario] = useState(existente?.comentario ?? "");
  const [ocupada, setOcupada] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function executar(acao: () => Promise<unknown>, sucesso: string) {
    setOcupada(true);
    setErro(null);
    setAviso(null);
    try {
      await acao();
      setAviso(sucesso);
      onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não consegui salvar a avaliação.");
    } finally {
      setOcupada(false);
    }
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (nota < 1) {
      setErro("Escolha uma nota de 1 a 5.");
      return;
    }
    const dados = { nota, comentario };
    if (existente) {
      void executar(() => editarAvaliacao(clienteId, existente.id, dados), "Avaliação atualizada.");
    } else {
      void executar(
        () => criarAvaliacao(clienteId, { prestadoraId, ...dados }),
        "Avaliação enviada. Obrigada!",
      );
    }
  }

  function apagar() {
    if (!existente) return;
    if (!window.confirm("Apagar sua avaliação?")) return;
    void executar(async () => {
      await apagarAvaliacao(clienteId, existente.id);
      setNota(0);
      setComentario("");
    }, "Avaliação apagada.");
  }

  return (
    <form onSubmit={enviar} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="font-semibold">{existente ? "Sua avaliação" : "Avalie esta prestadora"}</h3>

      <fieldset className="space-y-1" disabled={ocupada}>
        <legend className="text-sm text-zinc-700">Nota</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => setNota(valor)}
              aria-pressed={nota === valor}
              aria-label={`${valor} ${valor === 1 ? "estrela" : "estrelas"}`}
              className={`text-3xl leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 ${
                valor <= nota ? "text-amber-500" : "text-zinc-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1">
        <label htmlFor="comentario-avaliacao" className="text-sm text-zinc-700">
          Comentário (opcional)
        </label>
        <textarea
          id="comentario-avaliacao"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={LIMITE_COMENTARIO}
          rows={3}
          disabled={ocupada}
          className="w-full rounded border border-zinc-300 p-2 text-sm"
        />
        <p className="text-right text-xs text-zinc-500">
          {comentario.length}/{LIMITE_COMENTARIO}
        </p>
      </div>

      {erro && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {erro}
        </p>
      )}
      {aviso && (
        <p role="status" className="rounded border border-green-200 bg-green-50 p-2 text-sm text-green-800">
          {aviso}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={ocupada}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ocupada ? "Salvando..." : existente ? "Salvar alterações" : "Enviar avaliação"}
        </button>
        {existente && (
          <button
            type="button"
            onClick={apagar}
            disabled={ocupada}
            className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apagar
          </button>
        )}
      </div>
    </form>
  );
}
