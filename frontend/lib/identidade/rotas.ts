// Quais rotas exigem login, para o middleware (lib/supabase/middleware.ts).
// A navegação entre as telas é a BarraAbas de components/rede (#62, #64);
// a navbar antiga do grupo (site) saiu junto com ele.
// Não usa nada do servidor: pode ser importado por Client Components.

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
  "/pessoas",
  "/indicacoes",
];

function comecaCom(caminho: string, rota: string): boolean {
  return caminho === rota || caminho.startsWith(`${rota}/`);
}

export function ehRotaProtegida(caminho: string): boolean {
  return ROTAS_PROTEGIDAS.some((rota) => comecaCom(caminho, rota));
}
