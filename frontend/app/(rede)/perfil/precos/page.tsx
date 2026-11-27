// Preço base e negociação de cada serviço da prestadora. Página nova ao lado
// de /perfil/editar (que escolhe QUAIS serviços ela faz); aqui ela diz quanto
// cobra em cada um. A página só compõe; as regras ficam em lib/identidade.
import Link from "next/link";
import { redirect } from "next/navigation";

import { Vazio } from "@/components/descoberta/Estados";
import { FormularioPrecos } from "@/components/identidade/FormularioPrecos";
import { IconeVoltar } from "@/components/rede/icones";
import { BarraAbas, Tela } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import { servicoPrecos } from "@/lib/identidade/precos";
import { carregarMeusPrecos, type LinhaPreco } from "@/lib/identidade/precos-formulario";
import { servicoIdentidade } from "@/lib/identidade/service";
import { exigirConta } from "@/lib/rede/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Preços dos serviços" };

async function linhasDe(prestadoraId: string): Promise<LinhaPreco[] | null> {
  try {
    const cliente = await criarClienteServidor();
    return await carregarMeusPrecos(servicoIdentidade(cliente), servicoPrecos(cliente), prestadoraId);
  } catch {
    return null;
  }
}

export default async function PrecosPage() {
  const perfil = await exigirConta("/perfil/precos");
  // Preço é de serviço, e só prestadora tem serviços.
  if (perfil && perfil.papel !== "prestadora") redirect("/perfil");
  const linhas = perfil ? await linhasDe(perfil.id) : null;

  return (
    <Tela className="h-dvh md:h-auto">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-8 pt-5 md:overflow-visible">
        <Link
          href="/perfil"
          aria-label="Voltar ao perfil"
          className="-ml-2.5 flex h-11 w-11 items-center justify-center"
        >
          <IconeVoltar size={24} />
        </Link>
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-[28px] font-semibold leading-[1.15]">Preços dos serviços</h1>
          <p className="text-[14.5px] leading-[1.45] text-corpo md:max-w-xl">
            Um preço base para cada serviço que você faz. Ele aparece no seu perfil e na busca, e
            você pode mudar quando quiser.
          </p>
        </div>

        {!linhas ? (
          <Aviso tipo="erro">
            Não foi possível carregar seus serviços agora. Recarregue a página em alguns instantes.
          </Aviso>
        ) : linhas.length === 0 ? (
          <Vazio>
            Você ainda não escolheu nenhum serviço. Marque o que você faz em{" "}
            <Link href="/perfil/editar" className="font-bold text-vinho underline">
              Editar perfil
            </Link>{" "}
            e volte aqui para definir os preços.
          </Vazio>
        ) : (
          <FormularioPrecos linhas={linhas} />
        )}
      </div>
      <BarraAbas ativa="perfil" />
    </Tela>
  );
}
