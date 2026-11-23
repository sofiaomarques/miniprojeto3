// Mapa de rotas do app: links da navbar (das três áreas) e quais rotas exigem
// login. Fica num lugar só para a navbar e o middleware não divergirem.
// Não usa nada do servidor: pode ser importado por Client Components.
import type { Papel } from "./types";

// Quem vê cada link da navbar.
//   "todas": logada ou não  ·  "logadas": qualquer conta com papel
//   "cliente" / "prestadora": só esse papel
export type VisibilidadeLink = "todas" | "logadas" | Papel;

export type LinkNavegacao = {
  href: string;
  rotulo: string;
  visivelPara: VisibilidadeLink;
  area: "P1" | "P2" | "P3"; // de quem é a tela (para a equipe saber onde mexer)
};

// Links da navbar, na ordem em que aparecem. Para adicionar uma tela nova,
// inclua aqui; se ela exigir login, inclua também em ROTAS_PROTEGIDAS.
export const navLinks: readonly LinkNavegacao[] = [
  { href: "/buscar", rotulo: "Buscar", visivelPara: "todas", area: "P2" },
  { href: "/chat", rotulo: "Conversas", visivelPara: "logadas", area: "P3" },
  { href: "/minhas-indicacoes", rotulo: "Minhas indicações", visivelPara: "cliente", area: "P2" },
  { href: "/perfil", rotulo: "Meu perfil", visivelPara: "logadas", area: "P1" },
];

// Rotas que exigem login (a rota e tudo abaixo dela: /chat cobre /chat/123).
// O resto é público: início, busca, página da prestadora, login e cadastro.
export const ROTAS_PROTEGIDAS: readonly string[] = [
  "/perfil",
  "/chat",
  "/minhas-indicacoes",
  "/onboarding",
];

// Rotas de conta: não fazem sentido como destino depois do login.
const ROTAS_DE_CONTA: readonly string[] = ["/entrar", "/cadastro", "/onboarding", "/auth"];

function comecaCom(caminho: string, rota: string): boolean {
  return caminho === rota || caminho.startsWith(`${rota}/`);
}

export function ehRotaProtegida(caminho: string): boolean {
  return ROTAS_PROTEGIDAS.some((rota) => comecaCom(caminho, rota));
}

// Links que aparecem para a visitante. papel: null = logada sem onboarding;
// undefined = não logada.
export function linksVisiveis(logada: boolean, papel: Papel | null | undefined): LinkNavegacao[] {
  return navLinks.filter((link) => {
    if (link.visivelPara === "todas") return true;
    if (!logada || !papel) return false; // sem papel, termina o onboarding primeiro
    return link.visivelPara === "logadas" || link.visivelPara === papel;
  });
}

// Link ativo: a rota exata ou uma página abaixo dela.
export function linkAtivo(caminhoAtual: string, href: string): boolean {
  return comecaCom(caminhoAtual, href);
}

// ===========================================================================
// "Voltar para onde estava" depois do login (?proxima=/chat/123)
// ===========================================================================

const PROXIMA_MAXIMO = 512;

// Devolve o caminho se for seguro redirecionar para ele, ou null. Só aceita
// caminho interno do próprio site: nada de "//outro-site.com", "https://...",
// barra invertida ou caracteres de controle (evita redirecionamento aberto).
export function proximaSegura(valor: unknown): string | null {
  if (typeof valor !== "string" || valor === "" || valor.length > PROXIMA_MAXIMO) return null;
  if (!valor.startsWith("/") || valor.startsWith("//")) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(valor)) return null;

  let url: URL;
  try {
    url = new URL(valor, "http://interno.invalid");
  } catch {
    return null;
  }
  if (url.origin !== "http://interno.invalid") return null;
  if (ROTAS_DE_CONTA.some((rota) => comecaCom(url.pathname, rota))) return null;
  return `${url.pathname}${url.search}`;
}
