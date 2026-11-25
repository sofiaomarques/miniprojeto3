"use client";
// A página só compõe componentes; as regras e queries ficam em lib/chat.
// Mensagens novas chegam em tempo real (#37). "Pedir orçamento" e o visual
// do protótipo entram na #39.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AvisoDeslogada } from "@/components/chat/AvisoDeslogada";
import { BolhaMensagem } from "@/components/chat/BolhaMensagem";
import { CampoMensagem } from "@/components/chat/CampoMensagem";
import {
  assinarMensagens,
  enviarMensagem,
  listarMensagens,
  marcarLidas,
  obterConversa,
  obterUsuariaAtualId,
} from "@/lib/chat/service";
import { type Conversa, juntarMensagens, type Mensagem } from "@/lib/chat/types";

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
  // Texto lido pelo leitor de tela quando chega mensagem nova.
  const [avisoNova, setAvisoNova] = useState("");
  const fim = useRef<HTMLDivElement>(null);
  // Última lista na tela, para a assinatura saber o maior id já carregado.
  const mensagensRef = useRef<Mensagem[]>([]);
  mensagensRef.current = mensagens;

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

  // Tempo real (#37): assina quando a conversa termina de carregar e cancela
  // ao sair da tela ou trocar de conversa.
  const conversaPronta = estado.tipo === "pronta" ? estado.conversa : null;
  const usuariaPronta = estado.tipo === "pronta" ? estado.usuariaId : null;
  useEffect(() => {
    if (!conversaPronta || !usuariaPronta) return;
    const id = conversaPronta.id;
    const nomeOutra = conversaPronta.outra.nome || "a outra pessoa";
    const ultimoId = Math.max(0, ...mensagensRef.current.map((m) => m.id));

    const cancelar = assinarMensagens(id, ultimoId, (nova) => {
      setMensagens((atuais) => juntarMensagens(atuais, nova));
      if (nova.autorId === usuariaPronta) return;

      setAvisoNova(`Nova mensagem de ${nomeOutra}`);
      // Só conta como lida se a aba está na frente; senão continua não lida.
      if (document.visibilityState === "visible") {
        marcarLidas(id)
          .then(() => {
            const agora = new Date().toISOString();
            setMensagens((ms) =>
              ms.map((m) => (m.id === nova.id && m.lidaEm === null ? { ...m, lidaEm: agora } : m)),
            );
          })
          .catch(() => {
            // Fica não lida; a próxima abertura da conversa tenta de novo.
          });
      }
    });
    return cancelar;
  }, [conversaPronta, usuariaPronta]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [mensagens]);

  async function enviar(texto: string) {
    if (estado.tipo !== "pronta") return;
    const nova = await enviarMensagem(estado.conversa.id, texto);
    setMensagens((atuais) => juntarMensagens(atuais, nova));
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

      {/* Sem aria-live no histórico: o leitor de tela leria tudo ao abrir.
          Mensagem nova é anunciada só por este aviso. */}
      <p role="status" className="sr-only">
        {avisoNova}
      </p>
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
