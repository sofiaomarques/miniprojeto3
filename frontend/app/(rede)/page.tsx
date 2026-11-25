import Link from "next/link";

import { IconeBusca, IconeEstrela, IconePino } from "@/components/rede/icones";
import { Avatar, BarraAbas, Rotulo, Tela } from "@/components/rede/Tela";
import { CATEGORIAS, PRESTADORAS } from "@/lib/rede/dados";
import { perfilOuNull } from "@/lib/rede/sessao";

const TONS_FOTO = ["bg-rosa", "bg-areia", "bg-rosa-claro"];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria = "Todos" } = await searchParams;
  const lista = PRESTADORAS.filter((p) => categoria === "Todos" || p.servico === categoria);
  const perfil = await perfilOuNull();

  return (
    <Tela className="h-dvh">
      <div className="flex flex-col gap-3.5 rounded-b-[28px] bg-rosa px-5 pb-4 pt-5">
        <div className="flex items-center justify-between gap-3 text-[13.5px]">
          <span className="flex items-center gap-2 text-corpo">
            <IconePino size={16} className="text-vinho" />
            <b>João Pessoa, PB</b>
          </span>
          {!perfil ? (
            <Link href="/entrar" className="inline-block px-1 py-2.5 font-bold text-vinho">
              Entrar
            </Link>
          ) : !perfil.papel ? (
            <Link href="/onboarding" className="inline-block px-1 py-2.5 font-bold text-vinho">
              Concluir cadastro
            </Link>
          ) : (
            <span className="truncate text-corpo">Olá, {perfil.nome?.split(" ")[0] ?? "você"}</span>
          )}
        </div>
        <h1 className="font-display text-[26px] font-semibold leading-[1.15]">
          Do que você precisa hoje?
        </h1>
        <label className="flex h-12 items-center gap-2.5 rounded-3xl bg-papel px-3.5 text-suave">
          <IconeBusca size={20} />
          <input
            type="search"
            aria-label="Buscar serviço"
            placeholder="Ar-condicionado, encanamento…"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-texto outline-none placeholder:text-suave"
          />
        </label>
      </div>

      <div className="flex gap-2 overflow-x-auto px-5 pb-1 pt-3.5">
        {CATEGORIAS.map((c) => {
          const on = c === categoria;
          return (
            <Link
              key={c}
              href={c === "Todos" ? "/" : `/?categoria=${encodeURIComponent(c)}`}
              aria-current={on ? "true" : undefined}
              className={`flex h-10 shrink-0 items-center rounded-full px-3.5 text-[13.5px] ${
                on ? "bg-vinho font-bold text-white" : "bg-areia font-medium text-texto"
              }`}
            >
              {c}
            </Link>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-4 pt-2">
        <Rotulo>Melhores avaliadas</Rotulo>
        {lista.map((p) => (
          <Link
            key={p.slug}
            href={`/p/${p.slug}`}
            className="flex w-full flex-col gap-3 rounded-[20px] border border-borda bg-papel p-3.5 text-left"
          >
            <div className="flex w-full items-center gap-3">
              <Avatar iniciais={p.iniciais} tamanho={52} fundo={p.tom} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <b className="text-base">{p.nome}</b>
                <span className="text-[13.5px] text-suave">
                  {p.servico} · {p.cidade}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-[14px] bg-rosa px-2.5 py-1 text-sm font-bold">
                <IconeEstrela className="text-vinho" />
                {p.nota}
              </div>
            </div>
            <div className="flex w-full gap-2" aria-hidden="true">
              {TONS_FOTO.map((t) => (
                <div key={t} className={`h-[54px] flex-1 rounded-xl ${t}`} />
              ))}
            </div>
            <span className="text-[13px] text-suave">{p.avaliacoes} avaliações públicas</span>
          </Link>
        ))}
      </div>

      <BarraAbas ativa="buscar" />
    </Tela>
  );
}
