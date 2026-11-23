import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormularioOnboarding } from "@/components/identidade/FormularioOnboarding";
import { obterMeuPerfilNoServidor } from "@/lib/identidade/sessao";

export const metadata: Metadata = { title: "Boas-vindas" };

export default async function PaginaOnboarding() {
  const perfil = await obterMeuPerfilNoServidor();
  if (!perfil) redirect("/entrar");
  // O papel é escolhido uma vez só: quem já escolheu segue para o app.
  if (perfil.papel) redirect("/");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Boas-vindas!</h1>
        <p className="text-sm text-zinc-600">Falta só um passo para começar.</p>
      </div>
      <FormularioOnboarding nomeInicial={perfil.nome ?? ""} />
    </div>
  );
}
