"use client";
// A página só compõe componentes; as regras e queries ficam em lib/chat.
// Tempo real (#37), "Pedir orçamento" e estados finais (#39) entram depois.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AvisoDeslogada } from "@/components/chat/AvisoDeslogada";
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

// Só dígitos: Number() aceitaria "1e3", "0x10" ou " 5 ".
function lerId(id: string | undefined): number | null {
  return id && /^\d+$/.test(id) ? Number(id) : null;
}

type Estado =
  | { tipo: "carregando" }
  | { tipo: "deslogada" }
  | { tipo: "nao-encontrada" }
  | { tipo: "erro" }
  | { tipo: "pronta"; conversa: Conversa; usuariaId: string };

export default function ConversaPage() {
  const params = useParams<{ id: string }>();
  const conversaId = lerId(params.id);

  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ao trocar de conversa, limpa a anterior e ignora respostas atrasadas dela.
    let atual = true;
    setEstado({ tipo: "carregando" });
    setMensagens([]);

    if (conversaId === null) {
      setEstado({ tipo: "nao-encontrada" });
      return;
    }

    (async () => {
      const usuariaId = await obterUsuariaAtualId();
      if (!atual) return;
      if (!usuariaId) {
        setEstado({ tipo: "deslogada" });
        return;
      }
      const [conversa, lista] = await Promise.all([
        obterConversa(conversaId),
        listarMensagens(conversaId),
      ]);
      if (!atual) return;
      if (!conversa) {
        setEstado({ tipo: "nao-encontrada" });
        return;
      }
      setEstado({ tipo: "pronta", conversa, usuariaId });
      setMensagens(lista);

      if (conversa.naoLidas > 0) {
        try {
          await marcarLidas(conversaId);
          if (!atual) return;
          const agora = new Date().toISOString();
          setMensagens((ms) =>
            ms.map((m) => (m.autorId !== usuariaId && m.lidaEm === null ? { ...m, lidaEm: agora } : m)),
          );
        } catch {
          // Não bloqueia a conversa: as mensagens continuam não lidas e a
          // próxima abertura tenta de novo.
        }
      }
    })().catch(() => {
      if (atual) setEstado({ tipo: "erro" });
    });

    return () => {
      atual = false;
    };
  }, [conversaId]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [mensagens]);

  async function enviar(texto: string) {
    if (estado.tipo !== "pronta") return;
    const nova = await enviarMensagem(estado.conversa.id, texto);
    setMensagens((atuais) => [...atuais, nova]);
  }

  if (estado.tipo === "carregando") return <p className="text-sm text-zinc-500">Carregando…</p>;
  if (estado.tipo === "deslogada") return <AvisoDeslogada voltarPara={`/chat/${params.id}`} />;
  if (estado.tipo === "erro") {
    return (
      <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        Não consegui abrir a conversa. Tente de novo.
      </p>
    );
  }
  if (estado.tipo === "nao-encontrada") {
    return (
      <div className="space-y-2">
        <p className="rounded border bg-white p-4 text-sm text-zinc-600">Conversa não encontrada.</p>
        <Link href="/chat" className="text-sm text-rose-700 underline">
          Voltar para as conversas
        </Link>
      </div>
    );
  }

  const { conversa, usuariaId } = estado;
  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col gap-3">
      <header className="flex items-center gap-3 border-b pb-3">
        <Link
          href="/chat"
          className="-m-2 p-2 text-sm text-zinc-500 hover:text-zinc-900"
          aria-label="Voltar para as conversas"
        >
          ←
        </Link>
        <h1 className="truncate text-lg font-bold">{conversa.outra.nome || "Conversa"}</h1>
      </header>

      {/* Sem aria-live aqui: o leitor de tela leria o histórico inteiro ao abrir.
          O aviso de mensagem nova entra com o tempo real (#37). */}
      <div className="flex-1 space-y-2 overflow-y-auto" aria-label="Mensagens">
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
