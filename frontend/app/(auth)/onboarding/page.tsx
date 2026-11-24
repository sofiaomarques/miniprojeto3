import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormularioOnboarding } from "@/components/identidade/FormularioOnboarding";
import { Aviso } from "@/components/ui/Aviso";
import { ehErroIdentidade } from "@/lib/identidade/service";
import { obterMeuPerfilNoServidor } from "@/lib/identidade/sessao";
import type { Perfil } from "@/lib/identidade/types";

export const metadata: Metadata = { title: "Boas-vindas" };

export default async function PaginaOnboarding() {
  let perfil: Perfil | null;
  try {
    perfil = await obterMeuPerfilNoServidor();
  } catch (erro) {
    // Sessão que não dá para usar: volta para o login.
    if (ehErroIdentidade(erro) && erro.codigo === "nao_autenticada") redirect("/entrar");
    // Supabase fora do ar ou perfil faltando: avisa em vez de quebrar a página.
    return (
      <Aviso tipo="erro">
        Não foi possível carregar sua conta agora. Recarregue a página em alguns instantes.
      </Aviso>
    );
  }
  if (!perfil) redirect("/entrar");
  // O papel é escolhido uma vez só: quem já escolheu segue para o app.
  if (perfil.papel) redirect("/");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[32px] font-semibold leading-[1.1]">Boas-vindas!</h1>
        <p className="text-[15px] leading-snug text-suave">Falta só um passo para começar.</p>
      </div>
      <FormularioOnboarding nomeInicial={perfil.nome ?? ""} />
    </div>
  );
}
