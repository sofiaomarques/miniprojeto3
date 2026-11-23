// Sessão nas telas do protótipo, em cima do lib/identidade (#14).
// Só para Server Components: usa cookies() via obterMeuPerfilNoServidor.
import { redirect } from "next/navigation";

import { ehErroIdentidade } from "@/lib/identidade/service";
import { obterMeuPerfilNoServidor } from "@/lib/identidade/sessao";
import type { Perfil } from "@/lib/identidade/types";

// Perfil da usuária logada, ou null sem sessão. Supabase fora do ar também
// vira null, para a tela não quebrar (o mesmo que o MenuConta faz).
export async function perfilOuNull(): Promise<Perfil | null> {
  try {
    return await obterMeuPerfilNoServidor();
  } catch {
    return null;
  }
}

// Telas que só fazem sentido com conta (conversa, avaliar, perfil): sem sessão
// vai para /entrar e volta para `voltarPara` depois; sem papel, para o
// onboarding. Devolve o perfil, ou null se o Supabase não respondeu.
export async function exigirConta(voltarPara: string): Promise<Perfil | null> {
  let perfil: Perfil | null;
  try {
    perfil = await obterMeuPerfilNoServidor();
  } catch (erro) {
    if (ehErroIdentidade(erro) && erro.codigo === "nao_autenticada") perfil = null;
    else return null;
  }
  if (!perfil) redirect(`/entrar?next=${encodeURIComponent(voltarPara)}`);
  if (!perfil.papel) redirect("/onboarding");
  return perfil;
}

// "Ana Paula Souza" -> "AS"; sem nome, "?".
export function iniciaisDe(nome: string | null): string {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}
