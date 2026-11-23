// Renova a sessão do Supabase a cada request e grava os cookies atualizados.
// Server Components não conseguem gravar cookies, então é aqui que o token
// expirado é trocado por um novo. Usado por frontend/middleware.ts.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { lerConfigSupabase } from "./config";

export async function atualizarSessao(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const config = lerConfigSupabase();
  if (!config) return resposta; // modo mock: nada para renovar

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
  await supabase.auth.getClaims();

  return resposta;
}
