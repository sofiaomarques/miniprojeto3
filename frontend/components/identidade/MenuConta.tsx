// Canto direito da navbar: links de entrar/cadastrar ou nome + Sair.
import Link from "next/link";
import type { Perfil } from "@/lib/identidade/types";
import { BotaoSair } from "./BotaoSair";

export function MenuConta({ perfil }: { perfil: Perfil | null }) {
  if (!perfil) {
    return (
      <div className="flex items-center gap-4 whitespace-nowrap text-sm">
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
    <div className="flex items-center gap-4 whitespace-nowrap text-sm">
      {perfil.papel === null && (
        <Link href="/onboarding" className="font-medium text-zinc-900 underline">
          Concluir cadastro
        </Link>
      )}
      {/* No celular o nome some para caber o menu. */}
      <span className="hidden max-w-40 truncate text-zinc-600 sm:inline">
        {perfil.nome ?? "Minha conta"}
      </span>
      <BotaoSair />
    </div>
  );
}
