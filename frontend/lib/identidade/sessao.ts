// Sessão no servidor (Server Components, Server Actions e Route Handlers).
// Não importe em Client Components: usa cookies() via criarClienteServidor.
import { redirect } from "next/navigation";
import { cache } from "react";
import { usarMocks } from "@/lib/supabase/config";
import { criarClienteServidor } from "@/lib/supabase/server";
import { destinoAposLogin } from "./auth";
import { carregarEdicaoPerfil, servicoIdentidade } from "./service";
import type { CategoriaServico, Perfil } from "./types";

// Perfil da usuária logada, ou null sem sessão. Pode lançar ErroIdentidade
// (ex.: Supabase fora do ar).
// cache(): se mais de um componente pedir o perfil na mesma request, o banco
// é consultado uma vez só por página.
export const obterMeuPerfilNoServidor = cache(async (): Promise<Perfil | null> => {
  return servicoIdentidade(await criarClienteServidor()).obterMeuPerfil();
});

// Telas de cadastro e login: quem já está logada vai direto para onde deve.
// No modo mock não redireciona, para as telas continuarem visíveis.
// next: o ?next= da tela de login (validado em destinoAposLogin).
export async function redirecionarSeLogada(next?: unknown): Promise<void> {
  if (usarMocks) return;
  let perfil: Perfil | null = null;
  try {
    perfil = await obterMeuPerfilNoServidor();
  } catch {
    return; // na dúvida, mostra a tela de login
  }
  if (perfil) redirect(destinoAposLogin(perfil, next));
}

// Tela de edição do perfil (#16): catálogo e categorias marcadas da prestadora
// (vazios para a cliente). null se o Supabase não respondeu.
export async function carregarEdicaoPerfilNoServidor(
  perfil: Perfil,
): Promise<{ categorias: CategoriaServico[]; marcadas: number[] } | null> {
  try {
    return await carregarEdicaoPerfil(servicoIdentidade(await criarClienteServidor()), perfil);
  } catch {
    return null;
  }
}
