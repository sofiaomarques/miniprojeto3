"use client";

// Contador de mensagens não lidas (#38), para pôr ao lado de "Conversas" na
// navbar (P1) e na barra de abas do protótipo (components/rede/Tela.tsx).
// Some quando não há não lidas ou ninguém está logada. Atualiza sozinho
// quando chega mensagem ou quando a conversa é aberta (marcar_lidas).
//
// Uso: dentro de um elemento `relative`, por exemplo
//   <span className="relative"><IconeChat /><UnreadBadge className="absolute -right-2 -top-1" /></span>
import { useEffect, useState } from "react";

import { assinarNaoLidas, contarNaoLidas, obterUsuariaAtualId } from "@/lib/chat/service";

// Vários eventos juntos (ex.: marcar 5 mensagens como lidas) viram uma recontagem.
const ESPERA_RECONTAGEM_MS = 300;

export function UnreadBadge({ className = "" }: { className?: string }) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let ativa = true;
    let cancelar: (() => void) | null = null;
    let espera: ReturnType<typeof setTimeout> | null = null;

    function contar() {
      contarNaoLidas()
        .then((n) => ativa && setTotal(n))
        .catch(() => {
          // Sem rede: mantém o último número; a próxima recontagem tenta de novo.
        });
    }

    function agendar() {
      if (espera) clearTimeout(espera);
      espera = setTimeout(contar, ESPERA_RECONTAGEM_MS);
    }

    obterUsuariaAtualId()
      .then((id) => {
        if (!ativa || !id) return; // deslogada: sem contador e sem assinatura
        contar();
        cancelar = assinarNaoLidas(agendar);
      })
      .catch(() => {});

    return () => {
      ativa = false;
      if (espera) clearTimeout(espera);
      cancelar?.();
    };
  }, []);

  if (total === 0) return null;
  const rotulo = `${total} ${total === 1 ? "mensagem não lida" : "mensagens não lidas"}`;
  return (
    <span
      role="status"
      aria-label={rotulo}
      title={rotulo}
      className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-vinho px-1 text-[11px] font-bold leading-none text-white ${className}`}
    >
      {total > 99 ? "99+" : total}
    </span>
  );
}
