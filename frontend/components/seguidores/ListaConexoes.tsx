"use client";

// Tela de seguidores / seguindo de um perfil, com as duas abas.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Carregando, Erro, Vazio } from "@/components/descoberta/Estados";
import { IconeVoltar } from "@/components/rede/icones";
import { linkDaLista, linkDaPessoa } from "@/lib/seguidores/regras";
import { listarConexoes, obterPessoa } from "@/lib/seguidores/service";
import type { Conexao, PessoaResumo, TipoLista } from "@/lib/seguidores/types";

import { ListaPessoas } from "./ListaPessoas";

type Props = { perfilId: string; tipo: TipoLista; minhaId: string };

type Estado =
  | { situacao: "carregando" }
  | { situacao: "nao_encontrada" }
  | { situacao: "erro" }
  | { situacao: "pronta"; pessoa: PessoaResumo; conexoes: Conexao[] };

const ABAS: { tipo: TipoLista; rotulo: string }[] = [
  { tipo: "seguidores", rotulo: "Seguidores" },
  { tipo: "seguindo", rotulo: "Seguindo" },
];

function textoVazio(tipo: TipoLista, ehEu: boolean, primeiroNome: string): string {
  if (tipo === "seguidores") {
    return ehEu ? "Ninguém segue você ainda." : `Ninguém segue ${primeiroNome} ainda.`;
  }
  return ehEu ? "Você ainda não segue ninguém." : `${primeiroNome} ainda não segue ninguém.`;
}

export function ListaConexoes({ perfilId, tipo, minhaId }: Props) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ situacao: "carregando" });
  const [tentativa, setTentativa] = useState(0);
  const ehEu = perfilId === minhaId;

  useEffect(() => {
    let cancelado = false;
    setEstado({ situacao: "carregando" });
    Promise.all([obterPessoa(perfilId), listarConexoes(perfilId, tipo)]).then(
      ([pessoa, conexoes]) => {
        if (cancelado) return;
        setEstado(pessoa ? { situacao: "pronta", pessoa, conexoes } : { situacao: "nao_encontrada" });
      },
      (err) => {
        if (cancelado) return;
        console.error("Erro ao carregar a lista:", err);
        setEstado({ situacao: "erro" });
      },
    );
    return () => {
      cancelado = true;
    };
  }, [perfilId, tipo, tentativa]);

  const pessoa = estado.situacao === "pronta" ? estado.pessoa : null;
  const voltarPara = ehEu ? "/perfil" : pessoa ? linkDaPessoa(pessoa) : null;
  const primeiroNome = pessoa?.nome.split(" ")[0] || "esta pessoa";

  return (
    <>
      <div className="flex flex-col gap-3 rounded-b-[28px] bg-rosa px-5 pb-4 pt-5">
        <button
          type="button"
          onClick={() => (voltarPara ? router.push(voltarPara) : router.back())}
          aria-label="Voltar"
          className="-ml-2 flex h-11 w-11 items-center justify-center"
        >
          <IconeVoltar size={24} />
        </button>
        <h1 className="font-display text-[24px] font-semibold leading-[1.15]">
          {ehEu ? "Minha rede" : (pessoa?.nome ?? "Rede")}
        </h1>
        <nav aria-label="Listas" className="flex gap-2">
          {ABAS.map((aba) => {
            const ativa = aba.tipo === tipo;
            return (
              <Link
                key={aba.tipo}
                href={linkDaLista(perfilId, aba.tipo)}
                aria-current={ativa ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-full px-5 text-sm font-bold ${
                  ativa ? "bg-vinho text-white" : "border border-vinho text-vinho"
                }`}
              >
                {aba.rotulo}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-6 pt-5 md:pb-10">
        {estado.situacao === "carregando" && <Carregando texto="Carregando a lista…" linhas={3} />}
        {estado.situacao === "erro" && (
          <Erro mensagem="Não consegui carregar a lista." onTentarDeNovo={() => setTentativa((t) => t + 1)} />
        )}
        {estado.situacao === "nao_encontrada" && (
          <Vazio>
            Perfil não encontrado.{" "}
            <Link href="/" className="font-bold text-vinho underline">
              Voltar para o início
            </Link>
          </Vazio>
        )}
        {estado.situacao === "pronta" && estado.conexoes.length === 0 && (
          <Vazio>
            {textoVazio(tipo, ehEu, primeiroNome)}
            {ehEu && tipo === "seguindo" && (
              <>
                {" "}
                <Link href="/pessoas" className="font-bold text-vinho underline">
                  Encontrar pessoas
                </Link>
              </>
            )}
          </Vazio>
        )}
        {estado.situacao === "pronta" && estado.conexoes.length > 0 && (
          <ListaPessoas pessoas={estado.conexoes.map((c) => c.pessoa)} />
        )}
      </div>
    </>
  );
}
