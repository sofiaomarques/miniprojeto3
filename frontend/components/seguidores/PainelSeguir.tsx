"use client";

// Números de seguidores e seguindo (cada um abre a lista) e o botão Seguir.
// Usado no meu perfil, no perfil de outra pessoa e na página da prestadora.
// No próprio perfil não há botão; sem login, o botão leva para o login.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { MinhaSessao } from "@/components/descoberta/useMeuPerfil";
import { linkDaLista } from "@/lib/seguidores/regras";
import { contarSeguidores, deixarDeSeguir, euSigo, seguir } from "@/lib/seguidores/service";
import type { Contagem } from "@/lib/seguidores/types";

type Props = {
  perfilId: string;
  usuaria: MinhaSessao; // undefined = ainda carregando a sessão
  centralizado?: boolean;
};

const classeContador =
  "flex min-h-11 flex-col justify-center rounded-[14px] px-2 leading-tight focus-visible:outline-2 focus-visible:outline-vinho hover:bg-rosa-claro";

export function PainelSeguir({ perfilId, usuaria, centralizado = false }: Props) {
  const caminho = usePathname();
  const [contagem, setContagem] = useState<Contagem | null>(null);
  const [sigo, setSigo] = useState<boolean | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const logada = usuaria !== undefined && usuaria !== null && usuaria !== "erro";
  const ehEu = logada && usuaria.id === perfilId;
  const podeSeguir = logada && !ehEu && usuaria.papel !== null;

  useEffect(() => {
    let cancelado = false;
    contarSeguidores(perfilId).then(
      (c) => !cancelado && setContagem(c),
      (err) => console.error("Erro ao contar seguidores:", err), // só os números somem
    );
    return () => {
      cancelado = true;
    };
  }, [perfilId]);

  useEffect(() => {
    if (!podeSeguir) return;
    let cancelado = false;
    euSigo(perfilId).then(
      (s) => !cancelado && setSigo(s),
      (err) => {
        if (cancelado) return;
        console.error("Erro ao ler se sigo:", err);
        setErro("Não consegui carregar. Recarregue a página.");
      },
    );
    return () => {
      cancelado = true;
    };
  }, [perfilId, podeSeguir]);

  async function alternar() {
    if (sigo === null) return;
    setOcupado(true);
    setErro(null);
    try {
      if (sigo) await deixarDeSeguir(perfilId);
      else await seguir(perfilId);
      const agora = !sigo;
      setSigo(agora);
      setContagem((c) => c && { ...c, seguidores: Math.max(0, c.seguidores + (agora ? 1 : -1)) });
    } catch (err) {
      console.error("Erro ao seguir:", err);
      setErro(err instanceof Error && err.message ? err.message : "Não deu certo. Tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  const alinhamento = centralizado ? "items-center text-center" : "items-start";

  return (
    <div className={`flex flex-col gap-2 ${alinhamento}`}>
      <div className={`flex gap-3 ${centralizado ? "justify-center" : "-ml-2"}`}>
        <Link href={linkDaLista(perfilId, "seguidores")} className={classeContador}>
          <b className="text-[17px] text-texto">{contagem?.seguidores ?? "–"}</b>
          <span className="text-[13px] text-corpo">
            {contagem?.seguidores === 1 ? "seguidor" : "seguidores"}
          </span>
        </Link>
        <Link href={linkDaLista(perfilId, "seguindo")} className={classeContador}>
          <b className="text-[17px] text-texto">{contagem?.seguindo ?? "–"}</b>
          <span className="text-[13px] text-corpo">seguindo</span>
        </Link>
      </div>

      {usuaria === null && (
        <Link
          href={`/entrar?next=${encodeURIComponent(caminho ?? "/")}`}
          className="flex min-h-11 items-center rounded-full bg-vinho px-6 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vinho"
        >
          Entrar para seguir
        </Link>
      )}

      {podeSeguir && (
        <button
          type="button"
          onClick={alternar}
          disabled={ocupado || sigo === null}
          aria-pressed={sigo ?? undefined}
          aria-busy={ocupado || undefined}
          className={`flex min-h-11 items-center rounded-full px-6 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vinho disabled:opacity-60 ${
            sigo ? "border border-vinho text-vinho" : "bg-vinho text-white"
          }`}
        >
          {sigo ? "Seguindo" : "Seguir"}
        </button>
      )}

      {erro && (
        <p role="alert" className="text-sm text-vinho">
          {erro}
        </p>
      )}
    </div>
  );
}
