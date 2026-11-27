"use client";

// Perfil de outra pessoa da rede: nome, avatar, seguidores/seguindo, botão
// Seguir e as indicações que ela fez. Prestadora tem página própria
// (descoberta), então vai para lá.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/descoberta/Avatar";
import { Carregando, Erro, Vazio } from "@/components/descoberta/Estados";
import { ListaIndicacoes } from "@/components/descoberta/ListaIndicacoes";
import { IconeVoltar } from "@/components/rede/icones";
import type { Perfil } from "@/lib/identidade/types";
import { obterPessoa } from "@/lib/seguidores/service";
import type { PessoaResumo } from "@/lib/seguidores/types";

import { PainelSeguir } from "./PainelSeguir";

type Estado =
  | { situacao: "carregando" }
  | { situacao: "nao_encontrada" }
  | { situacao: "erro" }
  | { situacao: "pronta"; pessoa: PessoaResumo };

export function PaginaPessoa({ id, usuaria }: { id: string; usuaria: Perfil }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ situacao: "carregando" });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setEstado({ situacao: "carregando" });
    obterPessoa(id).then(
      (pessoa) => {
        if (cancelado) return;
        if (pessoa?.papel === "prestadora") {
          router.replace(`/prestadoras/${pessoa.id}`);
          return;
        }
        setEstado(pessoa ? { situacao: "pronta", pessoa } : { situacao: "nao_encontrada" });
      },
      (err) => {
        if (cancelado) return;
        console.error("Erro ao carregar a pessoa:", err);
        setEstado({ situacao: "erro" });
      },
    );
    return () => {
      cancelado = true;
    };
  }, [id, tentativa, router]);

  const voltar = (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Voltar"
      className="-ml-2 flex h-11 w-11 items-center justify-center self-start"
    >
      <IconeVoltar size={24} />
    </button>
  );

  if (estado.situacao !== "pronta") {
    return (
      <div className="flex flex-1 flex-col gap-4 px-5 pt-5">
        {voltar}
        {estado.situacao === "carregando" && <Carregando texto="Carregando perfil…" linhas={2} />}
        {estado.situacao === "erro" && (
          <Erro mensagem="Não consegui carregar o perfil." onTentarDeNovo={() => setTentativa((t) => t + 1)} />
        )}
        {estado.situacao === "nao_encontrada" && (
          <Vazio>
            <h1 className="mb-1 font-display text-xl font-semibold text-texto">Perfil não encontrado</h1>
            O link pode estar errado ou a conta não existe mais.{" "}
            <Link href="/pessoas" className="font-bold text-vinho underline">
              Encontrar pessoas
            </Link>
          </Vazio>
        )}
      </div>
    );
  }

  const { pessoa } = estado;
  return (
    <>
      <div className="flex flex-col items-center gap-2 rounded-b-[28px] bg-rosa px-5 pb-5 pt-5 text-center">
        {voltar}
        <Avatar nome={pessoa.nome} url={pessoa.avatarUrl} tamanho={84} fundo="papel" />
        <h1 className="break-words font-display text-[26px] font-semibold leading-[1.15]">{pessoa.nome}</h1>
        <span className="text-sm text-corpo">Cliente</span>
        <PainelSeguir perfilId={pessoa.id} usuaria={usuaria} centralizado />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-6 pt-5 md:pb-10">
        <ListaIndicacoes clienteId={pessoa.id} />
      </div>
    </>
  );
}
