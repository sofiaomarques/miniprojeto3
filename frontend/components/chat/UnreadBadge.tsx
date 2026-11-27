"use client";

// Contador de mensagens não lidas (#38), no ícone da aba "Conversas" da
// BarraAbas (components/rede/Tela.tsx). Some quando não há não lidas ou
// ninguém está logada. Atualiza sozinho quando chega mensagem ou quando a
// conversa é aberta (marcar_lidas).
//
// Uso: dentro de um elemento `relative`, por exemplo
//   <span className="relative"><IconeChat /><UnreadBadge className="absolute -right-2 -top-1" /></span>
//
// Leitor de tela: o número fica escondido e vai por extenso em texto sr-only,
// que entra no nome do link ("3 mensagens não lidas, Conversas"). Sem
// role="status": como a barra aparece em toda tela, o anúncio se repetiria a
// cada navegação.
import { useEffect, useState } from "react";

import { assinarNaoLidas, contarNaoLidas, obterUsuariaAtualId } from "@/lib/chat/service";

// Vários eventos juntos (ex.: marcar 5 mensagens como lidas) viram uma recontagem.
const ESPERA_RECONTAGEM_MS = 300;

// Último total conhecido nesta aba do navegador. A BarraAbas é renderizada
// por página, então o badge monta de novo a cada navegação: começar daqui
// evita o número sumir e voltar enquanto a recontagem não chega.
let ultimoTotal = 0;

export function UnreadBadge({ className = "" }: { className?: string }) {
  const [total, setTotal] = useState(ultimoTotal);

  useEffect(() => {
    let ativa = true;
    let cancelar: (() => void) | null = null;
    let espera: ReturnType<typeof setTimeout> | null = null;

    function contar() {
      contarNaoLidas()
        .then((n) => {
          ultimoTotal = n;
          if (ativa) setTotal(n);
        })
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
        if (!id) {
          // Deslogada: sem contador e sem assinatura (e esquece o total de antes).
          ultimoTotal = 0;
          if (ativa) setTotal(0);
          return;
        }
        if (!ativa) return;
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
      className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-vinho px-1 text-[11px] font-bold leading-none text-white ${className}`}
    >
      <span aria-hidden="true">{total > 99 ? "99+" : total}</span>
      {/* A vírgula dá a pausa antes do nome da aba: "2 mensagens não lidas, Conversas". */}
      <span className="sr-only">{rotulo}, </span>
    </span>
  );
}
