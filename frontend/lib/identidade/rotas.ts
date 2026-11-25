// Mapa de rotas do app: links da navbar (das três áreas) e quais rotas exigem
// login. Fica num lugar só para a navbar e o middleware não divergirem.
// Não usa nada do servidor: pode ser importado por Client Components.
import type { Papel } from "./types";

// Quem vê cada link da navbar.
//   "todas": logada ou não  ·  "logadas": qualquer conta com papel
export type VisibilidadeLink = "todas" | "logadas";

export type LinkNavegacao = {
  href: string;
  rotulo: string;
  visivelPara: VisibilidadeLink;
  area: "P1" | "P2" | "P3"; // de quem é a tela (para a equipe saber onde mexer)
};

// Links da navbar, na ordem em que aparecem. Para adicionar uma tela nova,
// inclua aqui; se ela exigir login, inclua também em ROTAS_PROTEGIDAS.
// A busca é a página inicial e as indicações da cliente ficam no perfil
// (#62): /buscar e /minhas-indicacoes só redirecionam, então não viram link.
export const navLinks: readonly LinkNavegacao[] = [
  { href: "/", rotulo: "Buscar", visivelPara: "todas", area: "P2" },
  { href: "/chat", rotulo: "Conversas", visivelPara: "logadas", area: "P3" },
  { href: "/perfil", rotulo: "Meu perfil", visivelPara: "logadas", area: "P1" },
];

// Rotas que exigem login (a rota e tudo abaixo dela: /chat cobre /chat/123).
// O resto é público: início, busca, página da prestadora, login e cadastro.
// /onboarding não entra: a própria página já manda para /entrar sem sessão.
// /minhas-indicacoes hoje só redireciona para /perfil; fica aqui para quem
// abrir o link antigo deslogada ir direto ao login.
export const ROTAS_PROTEGIDAS: readonly string[] = [
  "/perfil",
  "/chat",
  "/minhas-indicacoes",
  "/avaliar",
];

function comecaCom(caminho: string, rota: string): boolean {
  return caminho === rota || caminho.startsWith(`${rota}/`);
}

export function ehRotaProtegida(caminho: string): boolean {
  return ROTAS_PROTEGIDAS.some((rota) => comecaCom(caminho, rota));
}

// Links que aparecem para a visitante. papel: null = logada sem onboarding;
// undefined = não logada.
export function linksVisiveis(logada: boolean, papel: Papel | null | undefined): LinkNavegacao[] {
  // Sem papel, a conta termina o onboarding antes de ver os links de logada.
  return navLinks.filter((link) => link.visivelPara === "todas" || (logada && !!papel));
}

// Link ativo: a rota exata ou uma página abaixo dela.
export function linkAtivo(caminhoAtual: string, href: string): boolean {
  return comecaCom(caminhoAtual, href);
}
