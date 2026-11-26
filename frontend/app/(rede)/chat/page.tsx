"use client";
// A página só compõe componentes; as regras e queries ficam em lib/chat.
// Visual do protótipo "Rede de Mulheres" (components/rede), com a barra de abas.

import Link from "next/link";
import { useEffect, useState } from "react";

import { AvisoDeslogada } from "@/components/chat/AvisoDeslogada";
import { ItemConversa } from "@/components/chat/ItemConversa";
import { BarraAbas, Tela } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import { assinarNaoLidas, listarConversas, obterUsuariaAtualId } from "@/lib/chat/service";
import type { Conversa } from "@/lib/chat/types";

type Estado =
  | { tipo: "carregando" }
  | { tipo: "deslogada" }
  | { tipo: "erro" }
  | { tipo: "pronta"; conversas: Conversa[]; usuariaId: string };

export default function ChatPage() {
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  // "Tentar de novo" no erro: muda para refazer o carregamento.
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    setEstado({ tipo: "carregando" });
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
  }, [tentativa]);

  return (
    <Tela className="h-dvh">
      <div className="rounded-b-[28px] bg-rosa px-5 pb-5 pt-8">
        <h1 className="font-display text-[26px] font-semibold leading-[1.15]">Conversas</h1>
        <p className="mt-1 text-sm text-corpo">Combine o serviço e peça orçamento por aqui.</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-5 pb-4 pt-5">
        {estado.tipo === "carregando" && <p className="text-sm text-suave">Carregando conversas…</p>}
        {estado.tipo === "deslogada" && <AvisoDeslogada voltarPara="/chat" />}
        {estado.tipo === "erro" && (
          <div className="space-y-3">
            <Aviso tipo="erro">Não consegui carregar suas conversas. Confira sua conexão.</Aviso>
            <button
              type="button"
              onClick={() => setTentativa((t) => t + 1)}
              className="min-h-10 rounded-full border border-campo bg-papel px-4 text-sm font-bold text-vinho"
            >
              Tentar de novo
            </button>
          </div>
        )}
        {estado.tipo === "pronta" && estado.conversas.length === 0 && (
          <Aviso tipo="info">
            Você ainda não tem conversas.{" "}
            <Link href="/" className="font-bold text-vinho underline">
              Encontre uma prestadora
            </Link>{" "}
            e toque em &quot;Conversar&quot;.
          </Aviso>
        )}
        {estado.tipo === "pronta" && estado.conversas.length > 0 && (
          <ul className="flex flex-col gap-2.5">
            {estado.conversas.map((c) => (
              <li key={c.id}>
                <ItemConversa conversa={c} usuariaId={estado.usuariaId} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <BarraAbas ativa="conversas" />
    </Tela>
  );
}
