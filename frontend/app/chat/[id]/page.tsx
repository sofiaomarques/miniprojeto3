"use client";
// A página só compõe componentes; as regras e queries ficam em lib/chat.
// Tempo real (#37), "Pedir orçamento" e estados finais (#39) entram depois.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BolhaMensagem } from "@/components/chat/BolhaMensagem";
import { CampoMensagem } from "@/components/chat/CampoMensagem";
import {
  enviarMensagem,
  listarMensagens,
  marcarLidas,
  obterConversa,
  obterUsuariaAtualId,
} from "@/lib/chat/service";
import type { Conversa, Mensagem } from "@/lib/chat/types";

export default function ConversaPage() {
  const { id } = useParams<{ id: string }>();
  const conversaId = Number(id);

  const [conversa, setConversa] = useState<Conversa | null | undefined>(undefined);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [usuariaId, setUsuariaId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!Number.isInteger(conversaId)) {
      setConversa(null);
      return;
    }
    Promise.all([obterConversa(conversaId), listarMensagens(conversaId), obterUsuariaAtualId()])
      .then(([c, lista, uid]) => {
        setConversa(c);
        setMensagens(lista);
        setUsuariaId(uid);
        if (c && c.naoLidas > 0) void marcarLidas(conversaId);
      })
      .catch(() => setErro("Não consegui abrir a conversa. Tente de novo."));
  }, [conversaId]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [mensagens]);

  async function enviar(texto: string) {
    const nova = await enviarMensagem(conversaId, texto);
    setMensagens((atuais) => [...atuais, nova]);
  }

  if (erro) {
    return (
      <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {erro}
      </p>
    );
  }
  if (conversa === undefined) return <p className="text-sm text-zinc-500">Carregando…</p>;
  if (conversa === null) {
    return (
      <div className="space-y-2">
        <p className="rounded border bg-white p-4 text-sm text-zinc-600">Conversa não encontrada.</p>
        <Link href="/chat" className="text-sm text-rose-700 underline">
          Voltar para as conversas
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col gap-3">
      <header className="flex items-center gap-3 border-b pb-3">
        <Link href="/chat" className="text-sm text-zinc-500 hover:text-zinc-900" aria-label="Voltar">
          ←
        </Link>
        <h1 className="truncate text-lg font-bold">{conversa.outra.nome}</h1>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto" aria-live="polite">
        {mensagens.length === 0 && (
          <p className="text-center text-sm text-zinc-500">
            Diga oi e conte qual serviço você precisa.
          </p>
        )}
        {mensagens.map((m) => (
          <BolhaMensagem key={m.id} mensagem={m} minha={m.autorId === usuariaId} />
        ))}
        <div ref={fim} />
      </div>

      <CampoMensagem onEnviar={enviar} />
    </div>
  );
}
