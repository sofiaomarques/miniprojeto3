// Canto direito da navbar: links de entrar/cadastrar ou nome + Sair.
// A navbar completa e a guarda de rotas ficam na #15.
import Link from "next/link";
import { obterMeuPerfilNoServidor } from "@/lib/identidade/sessao";
import type { Perfil } from "@/lib/identidade/types";
import { BotaoSair } from "./BotaoSair";

export async function MenuConta() {
  let perfil: Perfil | null = null;
  try {
    perfil = await obterMeuPerfilNoServidor();
  } catch {
    perfil = null; // Supabase indisponível: mostra os links de entrar
  }

  if (!perfil) {
    return (
      <div className="ml-auto flex items-center gap-4 whitespace-nowrap text-sm">
        <Link href="/entrar" className="text-zinc-600 hover:text-zinc-900">
          Entrar
        </Link>
        <Link
          href="/cadastro"
          className="rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-700"
        >
          Criar conta
        </Link>
      </div>
    );
  }

  return (
    <div className="ml-auto flex items-center gap-4 whitespace-nowrap text-sm">
      {perfil.papel === null && (
        <Link href="/onboarding" className="font-medium text-zinc-900 underline">
          Concluir cadastro
        </Link>
      )}
      {perfil.avatar_url && (
        // Foto de perfil (#18). alt vazio: o nome já vem logo ao lado.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={perfil.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
      )}
      <span className="text-zinc-600">{perfil.nome ?? "Minha conta"}</span>
      <BotaoSair />
    </div>
  );
}
