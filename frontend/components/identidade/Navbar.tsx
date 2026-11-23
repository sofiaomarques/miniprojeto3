// Navbar de todas as páginas (#15): marca, links das três áreas (navLinks em
// lib/identidade/rotas.ts, filtrados pelo estado da conta) e a área da conta.
import Link from "next/link";
import { linksVisiveis } from "@/lib/identidade/rotas";
import { obterMeuPerfilNoServidor } from "@/lib/identidade/sessao";
import type { Perfil } from "@/lib/identidade/types";
import { LinksNavegacao, MenuCelular } from "./LinksNavegacao";
import { MenuConta } from "./MenuConta";

export async function Navbar() {
  let perfil: Perfil | null = null;
  try {
    perfil = await obterMeuPerfilNoServidor();
  } catch {
    perfil = null; // Supabase indisponível: mostra a navbar de quem não entrou
  }
  // Só href e rótulo vão para o navegador.
  const links = linksVisiveis(perfil !== null, perfil?.papel).map(({ href, rotulo }) => ({
    href,
    rotulo,
  }));

  return (
    <header className="border-b bg-white">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex max-w-3xl items-center gap-5 px-4 py-3"
      >
        <Link href="/" className="whitespace-nowrap font-bold">
          {/* troque pelo nome/logo do seu nicho */}
          Rede da Trilha
        </Link>
        <LinksNavegacao links={links} />
        <div className="ml-auto flex items-center gap-3">
          <MenuConta perfil={perfil} />
          <MenuCelular links={links} />
        </div>
      </nav>
    </header>
  );
}
