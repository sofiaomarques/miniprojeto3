import { FeedIndicacoes } from "@/components/seguidores/FeedIndicacoes";
import { BarraAbas, Tela } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import { exigirConta } from "@/lib/rede/sessao";

// Feed: indicações de quem eu sigo (#81). Só com conta.
export default async function IndicacoesPage() {
  const perfil = await exigirConta("/indicacoes");

  return (
    <Tela>
      <div className="flex flex-col gap-1 rounded-b-[28px] bg-rosa px-5 pb-5 pt-8">
        <h1 className="font-display text-[26px] font-semibold leading-[1.15]">Indicações da sua rede</h1>
        <span className="text-sm text-corpo">Quem as pessoas que você segue recomendam.</span>
      </div>
      <div className="flex flex-1 flex-col px-5 pb-6 pt-5 md:pb-10">
        {perfil ? (
          <FeedIndicacoes />
        ) : (
          <Aviso tipo="erro">Não foi possível carregar sua conta agora. Recarregue a página em alguns instantes.</Aviso>
        )}
      </div>
      <BarraAbas ativa="indicacoes" />
    </Tela>
  );
}
