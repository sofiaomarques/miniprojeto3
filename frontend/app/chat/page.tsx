"use client";
// A página só compõe componentes; as regras e queries ficam em lib/chat.

import { useEffect, useState } from "react";

import { ItemConversa } from "@/components/chat/ItemConversa";
import { listarConversas, obterUsuariaAtualId } from "@/lib/chat/service";
import type { Conversa } from "@/lib/chat/types";

export default function ChatPage() {
  const [conversas, setConversas] = useState<Conversa[] | null>(null);
  const [usuariaId, setUsuariaId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listarConversas(), obterUsuariaAtualId()])
      .then(([lista, id]) => {
        setConversas(lista);
        setUsuariaId(id);
      })
      .catch(() => setErro("Não consegui carregar suas conversas. Tente de novo."));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Conversas</h1>

      <div aria-live="polite">
        {erro && (
          <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {erro}
          </p>
        )}
        {!erro && conversas === null && <p className="text-sm text-zinc-500">Carregando…</p>}
        {conversas?.length === 0 && (
          <p className="rounded border bg-white p-4 text-sm text-zinc-600">
            Você ainda não tem conversas. Encontre uma prestadora na busca e clique em
            &quot;Conversar&quot;.
          </p>
        )}
      </div>

      {conversas && conversas.length > 0 && (
        <ul className="space-y-2">
          {conversas.map((c) => (
            <li key={c.id}>
              <ItemConversa conversa={c} usuariaId={usuariaId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
