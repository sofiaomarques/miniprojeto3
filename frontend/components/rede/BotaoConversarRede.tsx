"use client";

// "Conversar" do protótipo: abre (ou cria) a conversa de verdade do chat (#44)
// e vai para /chat/<id da conversa>. Sem conta, manda para o login e volta ao
// perfil da prestadora depois.
import { useRouter } from "next/navigation";
import { useState } from "react";

import { iniciarConversa, obterUsuariaAtualId } from "@/lib/chat/service";

import { IconeChat } from "./icones";
import { classeBotao } from "./Tela";

export function BotaoConversarRede({
  prestadoraId,
  voltarPara,
}: {
  prestadoraId: string;
  voltarPara: string;
}) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function conversar() {
    setOcupado(true);
    setErro(null);
    try {
      if (!(await obterUsuariaAtualId())) {
        router.push(`/entrar?next=${encodeURIComponent(voltarPara)}`);
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
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={conversar}
        disabled={ocupado}
        className={`${classeBotao} disabled:opacity-60`}
      >
        <IconeChat size={20} />
        {ocupado ? "Abrindo conversa..." : "Conversar e pedir orçamento"}
      </button>
      {erro && (
        <p role="alert" className="text-center text-sm text-vinho">
          {erro}
        </p>
      )}
    </div>
  );
}
