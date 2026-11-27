import { BuscaPessoas } from "@/components/seguidores/BuscaPessoas";
import { BarraAbas, Tela } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import { exigirConta } from "@/lib/rede/sessao";

// Encontrar pessoas para seguir. Só com conta: nomes de clientes não são públicos.
export default async function PessoasPage() {
  const perfil = await exigirConta("/pessoas");

  return (
    <Tela>
      <div className="flex flex-col gap-1 rounded-b-[28px] bg-rosa px-5 pb-5 pt-8">
        <h1 className="font-display text-[26px] font-semibold leading-[1.15]">Encontrar pessoas</h1>
        <span className="text-sm text-corpo">Siga amigas e prestadoras da sua rede.</span>
      </div>
      <div className="flex flex-1 flex-col px-5 pb-6 pt-5 md:pb-10">
        {perfil ? (
          <BuscaPessoas minhaId={perfil.id} />
        ) : (
          <Aviso tipo="erro">Não foi possível carregar sua conta agora. Recarregue a página em alguns instantes.</Aviso>
        )}
      </div>
      <BarraAbas ativa="perfil" />
    </Tela>
  );
}
