// Links das três áreas na barra de cima (#15): navLinks de lib/identidade/rotas.ts,
// filtrados pelo estado da conta. Entra ao lado do MenuConta, sem trocá-lo.
import { linksVisiveis } from "@/lib/identidade/rotas";
import { obterMeuPerfilNoServidor } from "@/lib/identidade/sessao";
import type { Perfil } from "@/lib/identidade/types";
import { LinksNavegacao, MenuCelular } from "./LinksNavegacao";

export async function NavegacaoPrincipal() {
  let perfil: Perfil | null = null;
  try {
    perfil = await obterMeuPerfilNoServidor(); // mesmo cache do MenuConta
  } catch {
    perfil = null; // Supabase indisponível: mostra só os links públicos
  }
  // Só href e rótulo vão para o navegador.
  const links = linksVisiveis(perfil !== null, perfil?.papel).map(({ href, rotulo }) => ({
    href,
    rotulo,
  }));

  return (
    <>
      <LinksNavegacao links={links} />
      <MenuCelular links={links} />
    </>
  );
}
