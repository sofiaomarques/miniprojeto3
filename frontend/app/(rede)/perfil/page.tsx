import Link from "next/link";

import { BotaoSair } from "@/components/identidade/BotaoSair";
import { Avatar, BarraAbas, Rotulo, Tela } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import { buscarPrestadora, INDICACOES } from "@/lib/rede/dados";
import { exigirConta, iniciaisDe } from "@/lib/rede/sessao";

const PAPEIS = { cliente: "Cliente", prestadora: "Prestadora" } as const;

// Cabeçalho com o perfil de verdade (lib/identidade). As indicações ainda são
// dados de exemplo: a lista real é a ListaIndicacoes da descoberta.
export default async function PerfilPage() {
  const perfil = await exigirConta("/perfil");

  if (!perfil) {
    return (
      <Tela className="h-dvh">
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
  const itens = ehCliente
    ? INDICACOES.flatMap((i) => {
        const p = buscarPrestadora(i.slug);
        return p ? [{ ...i, p }] : [];
      })
    : [];
  const subtitulo = [perfil.papel ? PAPEIS[perfil.papel] : null, perfil.cidade]
    .filter(Boolean)
    .join(" · ");

  return (
    <Tela className="h-dvh">
      <div className="flex flex-col items-center gap-2 rounded-b-[28px] bg-rosa px-5 pb-5 pt-8 text-center">
        <Avatar iniciais={iniciaisDe(perfil.nome)} tamanho={84} fundo="papel" />
        <h1 className="font-display text-[26px] font-semibold leading-[1.15]">
          {perfil.nome ?? "Minha conta"}
        </h1>
        <span className="text-sm text-corpo">{subtitulo}</span>
        {perfil.bio && (
          <p className="mt-1 max-w-[300px] text-[14.5px] leading-[1.45] text-corpo">
            {perfil.bio}
          </p>
        )}
        <BotaoSair />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pt-5">
        {!ehCliente && (
          <p className="text-[14.5px] leading-[1.45] text-corpo">
            Seu perfil de prestadora, com serviços e fotos de trabalhos, aparece aqui em breve.
          </p>
        )}
        {ehCliente && (
          <div className="flex items-baseline justify-between">
            <Rotulo>Minhas indicações</Rotulo>
            <span className="text-[13px] text-suave">
              {itens.length} {itens.length === 1 ? "prestadora" : "prestadoras"}
            </span>
          </div>
        )}
        {itens.map(({ p, estrelas, comentario }) => (
          <Link
            key={p.slug}
            href={`/p/${p.slug}`}
            className="flex w-full flex-col gap-2.5 rounded-[18px] border border-borda bg-papel p-3.5"
          >
            <div className="flex w-full items-center gap-3">
              <Avatar iniciais={p.iniciais} tamanho={44} fundo={p.tom} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <b className="text-[15.5px]">{p.nome}</b>
                <span className="text-[13px] text-suave">{p.servico}</span>
              </div>
              <span
                role="img"
                aria-label={`${estrelas} de 5 estrelas`}
                className="text-sm font-bold tracking-[1px] text-vinho"
              >
                {"★".repeat(estrelas) + "☆".repeat(5 - estrelas)}
              </span>
            </div>
            <p className="text-[13.5px] leading-[1.45] text-corpo">{comentario}</p>
          </Link>
        ))}
      </div>

      <BarraAbas ativa="perfil" />
    </Tela>
  );
}
