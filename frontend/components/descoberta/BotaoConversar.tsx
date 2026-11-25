"use client";

// Botão "Conversar": a cliente logada abre (ou cria) a conversa com a
// prestadora no chat da P3; quem não está logada vai para o login e volta
// para a página dela depois.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { iniciarConversa } from "@/lib/chat/service";
import { ERRO_DESLOGADA } from "@/lib/chat/types";
import type { Perfil } from "@/lib/identidade/types";

type Props = {
  prestadoraId: string;
  usuaria: Perfil | null | undefined; // undefined = ainda carregando a sessão
};

const BOTAO =
  "inline-flex min-h-11 w-full items-center justify-center rounded bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 active:bg-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto";

export function BotaoConversar({ prestadoraId, usuaria }: Props) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const linkLogin = `/entrar?next=${encodeURIComponent(`/prestadoras/${prestadoraId}`)}`;

  if (usuaria?.id === prestadoraId) {
    return <p className="text-sm text-zinc-500">Este é o seu perfil público.</p>;
  }
  if (usuaria?.papel === "prestadora") {
    return <p className="text-sm text-zinc-500">Só clientes podem iniciar uma conversa.</p>;
  }
  if (usuaria && usuaria.papel === null) {
    return (
      <p className="text-sm text-zinc-600">
        <Link href="/onboarding" className="underline">
          Conclua seu cadastro
        </Link>{" "}
        para conversar.
      </p>
    );
  }
  if (usuaria === null) {
    return (
      <Link href={linkLogin} className={BOTAO}>
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
    <div className="space-y-2">
      <button
        type="button"
        onClick={conversar}
        disabled={ocupado || usuaria === undefined}
        aria-busy={ocupado || undefined}
        className={BOTAO}
      >
        {ocupado ? "Abrindo conversa…" : "Conversar"}
      </button>
      {erro && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {erro}
        </p>
      )}
    </div>
  );
}
