import Link from "next/link";

import { IconeBusca, IconeCasa, IconeChat, IconePessoa } from "./icones";

// Coluna de celular centralizada; no desktop vira um "aparelho" no meio da página.
// Com largura="larga", a partir de md a coluna ocupa a página toda e cada tela
// limita o próprio conteúdo (ex.: max-w-6xl). Só a busca e a prestadora usam.
export function Tela({
  children,
  className = "",
  largura = "celular",
}: {
  children: React.ReactNode;
  className?: string;
  largura?: "celular" | "larga";
}) {
  const classeLargura =
    largura === "larga" ? "max-w-[430px] shadow-xl md:max-w-none md:shadow-none" : "max-w-[430px] shadow-xl";
  return (
    <div className={`mx-auto flex min-h-dvh w-full flex-col bg-crema ${classeLargura} ${className}`}>
      {children}
    </div>
  );
}

export function Marca({ fundo = "rosa" }: { fundo?: "rosa" | "papel" }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full text-vinho ${
          fundo === "rosa" ? "bg-rosa" : "bg-papel"
        }`}
      >
        <IconeCasa />
      </div>
      <span className="font-display text-[19px] font-semibold">Rede de Mulheres</span>
    </div>
  );
}

export function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[12.5px] font-bold uppercase tracking-[0.04em] text-suave">
      {children}
    </span>
  );
}

// ANTIGO: o Avatar novo é o de components/descoberta/Avatar (nome + foto).
// Fica aqui só enquanto o chat (#64) ainda importa este; quando o #64 trocar o
// import para o novo, apagar este componente.
export function Avatar({
  iniciais,
  tamanho,
  fundo,
}: {
  iniciais: string;
  tamanho: number;
  fundo: "rosa" | "areia" | "papel";
}) {
  const bg = { rosa: "bg-rosa", areia: "bg-areia", papel: "bg-papel" }[fundo];
  return (
    <div
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.36 }}
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-vinho-escuro ${bg}`}
    >
      {iniciais}
    </div>
  );
}

const ABAS = [
  { id: "buscar", rotulo: "Buscar", href: "/", Icone: IconeBusca },
  { id: "conversas", rotulo: "Conversas", href: "/chat", Icone: IconeChat },
  { id: "perfil", rotulo: "Perfil", href: "/perfil", Icone: IconePessoa },
] as const;

type Aba = (typeof ABAS)[number]["id"];

// Barra de abas de baixo, do celular. Nas telas largas, passe className="md:hidden"
// e use a BarraTopo no lugar.
export function BarraAbas({ ativa, className = "" }: { ativa: Aba; className?: string }) {
  return (
    <nav
      aria-label="Principal"
      className={`flex border-t border-borda bg-papel px-5 pb-5 pt-2.5 ${className}`}
    >
      {ABAS.map(({ id, rotulo, href, Icone }) => {
        const on = id === ativa;
        return (
          <Link
            key={id}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
              on ? "font-bold text-vinho" : "font-medium text-suave"
            }`}
          >
            <Icone />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

// Navegação do computador (a partir de md): marca à esquerda e as mesmas abas
// da BarraAbas no topo. No celular fica escondida.
export function BarraTopo({ ativa }: { ativa?: Aba }) {
  return (
    <header className="sticky top-0 z-10 hidden border-b border-borda bg-papel md:block">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-5 py-2.5">
        <Link href="/" aria-label="Rede de Mulheres, ir para a busca" className="rounded-full">
          <Marca />
        </Link>
        <nav aria-label="Principal" className="flex gap-1">
          {ABAS.map(({ id, rotulo, href, Icone }) => {
            const on = id === ativa;
            return (
              <Link
                key={id}
                href={href}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-[14.5px] focus-visible:outline-2 focus-visible:outline-vinho ${
                  on ? "bg-rosa font-bold text-vinho" : "font-medium text-suave hover:bg-rosa-claro"
                }`}
              >
                <Icone />
                {rotulo}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export const classeBotao =
  "flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-vinho text-base font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vinho";

export const classeCampo =
  "h-[46px] w-full rounded-[14px] border border-campo bg-papel px-3.5 text-[15px] text-texto placeholder:text-suave focus-visible:outline-2 focus-visible:outline-vinho";
