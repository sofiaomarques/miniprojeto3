"use client";
// Links da navbar com o link da página atual destacado (aria-current), e a
// versão de celular num menu que abre e fecha.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { linkAtivo, type LinkNavegacao } from "@/lib/identidade/rotas";

type Props = { links: readonly Pick<LinkNavegacao, "href" | "rotulo">[] };

function classeDoLink(ativo: boolean): string {
  return ativo
    ? "font-medium text-zinc-900"
    : "text-zinc-600 hover:text-zinc-900";
}

// Telas a partir de 640px: links lado a lado.
export function LinksNavegacao({ links }: Props) {
  const caminho = usePathname();
  if (links.length === 0) return null;
  return (
    <ul className="hidden items-center gap-5 text-sm sm:flex">
      {links.map((link) => {
        const ativo = linkAtivo(caminho, link.href);
        return (
          <li key={link.href}>
            <Link href={link.href} aria-current={ativo ? "page" : undefined} className={classeDoLink(ativo)}>
              {link.rotulo}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// Celular: botão "Menu" que abre a lista. key={caminho} fecha o menu ao
// trocar de página.
export function MenuCelular({ links }: Props) {
  const caminho = usePathname();
  if (links.length === 0) return null;
  return (
    <details key={caminho} className="relative sm:hidden">
      <summary
        className="cursor-pointer list-none rounded-md border border-zinc-300 px-3 py-1.5 text-sm [&::-webkit-details-marker]:hidden"
        aria-label="Abrir menu"
      >
        Menu
      </summary>
      <ul className="absolute right-0 z-10 mt-2 w-48 space-y-1 rounded-md border bg-white p-2 text-sm shadow-md">
        {links.map((link) => {
          const ativo = linkAtivo(caminho, link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={ativo ? "page" : undefined}
                className={`block rounded px-2 py-1.5 hover:bg-zinc-100 ${classeDoLink(ativo)}`}
              >
                {link.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
