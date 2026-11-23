// Destino do link do e-mail de confirmação do cadastro. Troca o código do
// link por uma sessão (cookies) e manda a usuária para o lugar certo:
// onboarding se ainda não escolheu o papel, início se já escolheu.
//   ?code=...                 fluxo PKCE (padrão do @supabase/ssr)
//   ?token_hash=...&type=...  template de e-mail customizado
//   ?error=...                o Supabase recusou o link
// Falhas (link velho, já usado, aberto em outro navegador) voltam para
// /entrar com um aviso. Os destinos são fixos (nada vem da URL), então não
// há redirecionamento aberto.
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { destinoAposLogin } from "@/lib/identidade/auth";
import { servicoIdentidade } from "@/lib/identidade/service";
import { criarClienteServidor } from "@/lib/supabase/server";

const TIPOS_ACEITOS: readonly EmailOtpType[] = ["signup", "email"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const ir = (destino: string) => NextResponse.redirect(new URL(destino, origin));

  if (searchParams.get("error")) return ir("/entrar?erro=link");

  const codigo = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;

  try {
    const supabase = await criarClienteServidor();
    if (!supabase) return ir("/entrar"); // modo mock: não há sessão de verdade

    let erro: unknown = "sem código";
    if (codigo) {
      erro = (await supabase.auth.exchangeCodeForSession(codigo)).error;
    } else if (tokenHash && tipo && TIPOS_ACEITOS.includes(tipo)) {
      erro = (await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash })).error;
    }
    if (erro) return ir("/entrar?erro=link");

    try {
      return ir(destinoAposLogin(await servicoIdentidade(supabase).obterMeuPerfil()));
    } catch {
      return ir("/"); // já está logada; sem o perfil, a página inicial resolve
    }
  } catch {
    return ir("/entrar?erro=link");
  }
}
