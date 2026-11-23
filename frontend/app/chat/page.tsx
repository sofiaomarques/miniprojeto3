"use client";
// A página só compõe componentes; as regras e queries ficam em lib/chat.

import { useEffect, useState } from "react";

import { AvisoDeslogada } from "@/components/chat/AvisoDeslogada";
import { ItemConversa } from "@/components/chat/ItemConversa";
import { listarConversas, obterUsuariaAtualId } from "@/lib/chat/service";
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
    (async () => {
      const usuariaId = await obterUsuariaAtualId();
      if (!atual) return;
      if (!usuariaId) {
        setEstado({ tipo: "deslogada" });
        return;
      }
      const conversas = await listarConversas();
      if (atual) setEstado({ tipo: "pronta", conversas, usuariaId });
    })().catch(() => {
      if (atual) setEstado({ tipo: "erro" });
    });
    return () => {
      atual = false;
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
