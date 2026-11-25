"use client";
// A página só compõe componentes; as regras e queries ficam em lib/chat.

import { useEffect, useState } from "react";

import { AvisoDeslogada } from "@/components/chat/AvisoDeslogada";
import { ItemConversa } from "@/components/chat/ItemConversa";
import { assinarNaoLidas, listarConversas, obterUsuariaAtualId } from "@/lib/chat/service";
import type { Conversa } from "@/lib/chat/types";

type Estado =
  | { tipo: "carregando" }
  | { tipo: "deslogada" }
  | { tipo: "erro" }
  | { tipo: "pronta"; conversas: Conversa[]; usuariaId: string };

export default function ChatPage() {
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });

  useEffect(() => {
    let atual = true;
    let cancelar: (() => void) | null = null;
    let espera: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      const usuariaId = await obterUsuariaAtualId();
      if (!atual) return;
      if (!usuariaId) {
        setEstado({ tipo: "deslogada" });
        return;
      }
      const conversas = await listarConversas();
      if (!atual) return;
      setEstado({ tipo: "pronta", conversas, usuariaId });

      // #38: mensagem nova ou lida atualiza a prévia, a ordem e os contadores
      // da lista sem recarregar. Vários eventos juntos viram uma consulta.
      cancelar = assinarNaoLidas(() => {
        if (espera) clearTimeout(espera);
        espera = setTimeout(() => {
          listarConversas()
            .then((lista) => atual && setEstado({ tipo: "pronta", conversas: lista, usuariaId }))
            .catch(() => {
              // Mantém a lista na tela; a próxima mudança tenta de novo.
            });
        }, 300);
      });
    })().catch(() => {
      if (atual) setEstado({ tipo: "erro" });
    });

    return () => {
      atual = false;
      if (espera) clearTimeout(espera);
      cancelar?.();
    };
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Conversas</h1>

      {estado.tipo === "carregando" && <p className="text-sm text-zinc-500">Carregando…</p>}
      {estado.tipo === "deslogada" && <AvisoDeslogada voltarPara="/chat" />}
      {estado.tipo === "erro" && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Não consegui carregar suas conversas. Tente de novo.
        </p>
      )}
      {estado.tipo === "pronta" && estado.conversas.length === 0 && (
        <p className="rounded border bg-white p-4 text-sm text-zinc-600">
          Você ainda não tem conversas. Encontre uma prestadora na busca e clique em
          &quot;Conversar&quot;.
        </p>
      )}
      {estado.tipo === "pronta" && estado.conversas.length > 0 && (
        <ul className="space-y-2">
          {estado.conversas.map((c) => (
            <li key={c.id}>
              <ItemConversa conversa={c} usuariaId={estado.usuariaId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
