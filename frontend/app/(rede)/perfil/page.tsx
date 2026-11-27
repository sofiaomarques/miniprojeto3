import Link from "next/link";

import { BotaoSair } from "@/components/identidade/BotaoSair";
import { ResumoPrestadora } from "@/components/identidade/ResumoPrestadora";
import { Avatar } from "@/components/descoberta/Avatar";
import { ListaIndicacoes } from "@/components/descoberta/ListaIndicacoes";
import { PainelSeguir } from "@/components/seguidores/PainelSeguir";
import { BarraAbas, Tela } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import { exigirConta } from "@/lib/rede/sessao";

const PAPEIS = { cliente: "Cliente", prestadora: "Prestadora" } as const;

// Cabeçalho com o perfil de verdade (lib/identidade); para cliente, a lista
// de indicações vem da descoberta.
export default async function PerfilPage() {
  const perfil = await exigirConta("/perfil");

  if (!perfil) {
    return (
      <Tela className="h-dvh md:h-auto">
        <div className="flex-1 px-5 pt-8">
          <Aviso tipo="erro">
            Não foi possível carregar sua conta agora. Recarregue a página em alguns instantes.
          </Aviso>
        </div>
        <BarraAbas ativa="perfil" />
      </Tela>
    );
  }

  const ehCliente = perfil.papel === "cliente";
  const subtitulo = [perfil.papel ? PAPEIS[perfil.papel] : null, perfil.cidade]
    .filter(Boolean)
    .join(" · ");

  return (
    // Celular: a Tela inteira rola (cabeçalho e conteúdo juntos) e só a barra
    // de abas fica presa embaixo; com bio longa ou tela baixa, um cabeçalho
    // fixo deixava o conteúdo sem altura (#20). Computador (md, #71): altura
    // automática, a página rola e a BarraAbas sobe para o topo. Cabeçalho e
    // conteúdo ficam filhos diretos da Tela por causa da regra .tela > *.
    <Tela className="h-dvh overflow-y-auto md:h-auto md:overflow-visible">
      <div className="flex shrink-0 flex-col items-center gap-2 rounded-b-[28px] bg-rosa px-5 pb-5 pt-8 text-center">
        <Avatar nome={perfil.nome} url={perfil.avatar_url} tamanho={84} fundo="papel" />
        <h1 className="font-display text-[26px] font-semibold leading-[1.15]">
          {perfil.nome ?? "Minha conta"}
        </h1>
        <span className="text-sm text-corpo">{subtitulo}</span>
        <PainelSeguir perfilId={perfil.id} usuaria={perfil} centralizado />
        {perfil.bio && (
          <p className="mt-1 max-w-[300px] text-[14.5px] leading-[1.45] text-corpo">
            {perfil.bio}
          </p>
        )}
        <Link
          href="/perfil/editar"
          className="mt-1 flex min-h-11 items-center rounded-full border border-vinho px-5 text-sm font-bold text-vinho focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vinho"
        >
          Editar perfil
        </Link>
        <Link
          href="/pessoas"
          className="flex min-h-11 items-center rounded-full border border-vinho px-5 text-sm font-bold text-vinho focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vinho"
        >
          Encontrar pessoas
        </Link>
        {perfil.papel === "prestadora" && (
          <Link
            href="/perfil/fotos"
            className="flex min-h-11 items-center rounded-full border border-vinho px-5 text-sm font-bold text-vinho focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vinho"
          >
            Minhas fotos
          </Link>
        )}
        <BotaoSair />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-5 md:pb-10">
        {!ehCliente && <ResumoPrestadora prestadoraId={perfil.id} />}
        {ehCliente && <ListaIndicacoes clienteId={perfil.id} editavel />}
      </div>

      <BarraAbas ativa="perfil" className="max-md:sticky max-md:bottom-0" />
    </Tela>
  );
}
