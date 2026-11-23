"use client";

// Botão "Conversar": se a cliente está logada, abre a conversa com a prestadora;
// se não, manda para o login e volta para a página dela depois.
import { useRouter } from "next/navigation";
import { useState } from "react";

import { iniciarConversa } from "@/lib/descoberta/conversa";
import { usuarioAtualId } from "@/lib/descoberta/sessao";

export function BotaoConversar({ prestadoraId }: { prestadoraId: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function conversar() {
    setOcupado(true);
    setErro(null);
    try {
      const quemSou = await usuarioAtualId();
      if (!quemSou) {
        const voltar = encodeURIComponent(`/prestadoras/${prestadoraId}`);
        router.push(`/login?next=${voltar}`);
        return;
      }
      const conversa = await iniciarConversa(prestadoraId);
      router.push(`/chat/${conversa.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não consegui iniciar a conversa.");
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={conversar}
        disabled={ocupado}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 active:bg-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {ocupado ? "Abrindo conversa..." : "Conversar"}
      </button>
      {erro && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {erro}
        </p>
      )}
    </div>
  );
}
