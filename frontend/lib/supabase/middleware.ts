// Roda em toda request (ver frontend/middleware.ts):
//   1. renova a sessão do Supabase e grava os cookies atualizados (Server
//      Components não conseguem gravar cookies, então o token expirado é
//      trocado aqui);
//   2. guarda de rotas (#15): rota protegida sem login vai para /entrar
//      (?next= guarda para onde ela queria ir, como o resto do login); logada que ainda não
//      escolheu o papel vai para /onboarding.
// As rotas protegidas ficam em lib/identidade/rotas.ts.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ehRotaProtegida } from "@/lib/identidade/rotas";
import { lerConfigSupabase } from "./config";

export async function atualizarSessao(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const config = lerConfigSupabase();
  if (!config) return resposta; // modo mock: sem sessão de verdade para guardar

  const supabase = createServerClient(config.url, config.chave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaGravar, headers) {
        // Atualiza a request (para os Server Components verem o token novo)
        // e a resposta (para o navegador guardar o token novo).
        cookiesParaGravar.forEach(({ name, value }) => request.cookies.set(name, value));
        resposta = NextResponse.next({ request });
        cookiesParaGravar.forEach(({ name, value, options }) =>
          resposta.cookies.set(name, value, options),
        );
        // Cabeçalhos anti-cache: impedem que a sessão de um usuário seja
        // servida a outro por um CDN.
        Object.entries(headers).forEach(([chave, valor]) => resposta.headers.set(chave, valor));
      },
    },
  });

  // Não coloque código entre a criação do cliente e esta chamada: é ela que
  // valida o token e dispara a renovação dos cookies quando ele expira.
  // getClaims confere a assinatura do token localmente (chaves assimétricas do
  // projeto, guardadas em cache por 10 min), sem ir ao Supabase a cada página;
  // getUser faria uma consulta de rede em toda request.
  const { data } = await supabase.auth.getClaims();
  const idUsuaria = typeof data?.claims?.sub === "string" ? data.claims.sub : null;

  const { pathname, search } = request.nextUrl;
  if (!ehRotaProtegida(pathname)) return resposta; // rota pública: segue

  // Rota protegida sem login: vai para o login e volta depois.
  if (!idUsuaria) {
    const destino = new URL("/entrar", request.url);
    destino.searchParams.set("next", `${pathname}${search}`);
    return redirecionarComCookies(destino, resposta);
  }

  // Logada sem papel: termina o onboarding antes de usar o app. Só nas rotas
  // protegidas (as públicas não precisam de papel), então a consulta ao banco
  // não acontece em toda página.
  const { data: perfil, error } = await supabase
    .from("perfis")
    .select("papel")
    .eq("id", idUsuaria)
    .maybeSingle();
  // Com erro de banco, deixa passar: a página mostra o próprio erro.
  if (!error && perfil && perfil.papel === null) {
    return redirecionarComCookies(new URL("/onboarding", request.url), resposta);
  }

  return resposta;
}

// Redireciona levando os cookies que o Supabase acabou de renovar; sem isso,
// o navegador ficaria com o token velho e a sessão cairia.
function redirecionarComCookies(destino: URL, resposta: NextResponse): NextResponse {
  const redirecionamento = NextResponse.redirect(destino);
  resposta.cookies.getAll().forEach((cookie) => redirecionamento.cookies.set(cookie));
  resposta.headers.forEach((valor, chave) => {
    if (chave.toLowerCase() === "cache-control" || chave.toLowerCase() === "expires" || chave.toLowerCase() === "pragma") {
      redirecionamento.headers.set(chave, valor);
    }
  });
  return redirecionamento;
}
