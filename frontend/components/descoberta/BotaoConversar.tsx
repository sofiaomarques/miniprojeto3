"use client";

// "Conversar e pedir orçamento": a cliente logada abre (ou cria) a conversa
// com a prestadora no chat da P3; quem não está logada vai para o login e
// volta para a página dela depois.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { IconeChat } from "@/components/rede/icones";
import { classeBotao } from "@/components/rede/Tela";
import { iniciarConversa } from "@/lib/chat/service";
import { ERRO_DESLOGADA } from "@/lib/chat/types";

import type { MinhaSessao } from "./useMeuPerfil";

type Props = {
  prestadoraId: string;
  usuaria: MinhaSessao; // undefined = ainda carregando a sessão
};

export function BotaoConversar({ prestadoraId, usuaria }: Props) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const linkLogin = `/entrar?next=${encodeURIComponent(`/prestadoras/${prestadoraId}`)}`;

  if (usuaria === "erro") {
    return (
      <p role="alert" className="text-center text-sm text-vinho">
        Não consegui confirmar sua conta. Recarregue a página para conversar.
      </p>
    );
  }
  if (usuaria?.id === prestadoraId) {
    return <p className="text-center text-sm text-suave">Este é o seu perfil público.</p>;
  }
  if (usuaria?.papel === "prestadora") {
    return <p className="text-center text-sm text-suave">Só clientes podem iniciar uma conversa.</p>;
  }
  if (usuaria && usuaria.papel === null) {
    return (
      <Link href="/onboarding" className={classeBotao}>
        Concluir cadastro para conversar
      </Link>
    );
  }
  if (usuaria === null) {
    return (
      <Link href={linkLogin} className={classeBotao}>
        <IconeChat size={20} />
        Entrar para conversar
      </Link>
    );
  }

  async function conversar() {
    setOcupado(true);
    setErro(null);
    try {
      const conversa = await iniciarConversa(prestadoraId);
      router.push(`/chat/${conversa.id}`);
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "";
      if (mensagem === ERRO_DESLOGADA) {
        router.push(linkLogin);
        return;
      }
      console.error("Erro ao iniciar a conversa:", err);
      setErro(mensagem || "Não consegui iniciar a conversa. Tente de novo.");
      setOcupado(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={conversar}
        disabled={ocupado || usuaria === undefined}
        aria-busy={ocupado || undefined}
        className={`${classeBotao} disabled:opacity-60`}
      >
        <IconeChat size={20} />
        {ocupado ? "Abrindo conversa…" : "Conversar e pedir orçamento"}
      </button>
      {erro && (
        <p role="alert" className="text-center text-sm text-vinho">
          {erro}
        </p>
      )}
    </div>
  );
}
