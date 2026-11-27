import Link from "next/link";

import { FormularioAvaliacao } from "@/components/descoberta/FormularioAvaliacao";
import { Tela } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import { exigirConta } from "@/lib/rede/sessao";

// Avaliar exige conta de cliente: sem sessão vai para o login e volta aqui.
export default async function AvaliarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfil = await exigirConta(`/avaliar/${id}`);

  return (
    <Tela estreita className="gap-[22px] px-6 pb-8 pt-5">
      {!perfil ? (
        <Aviso tipo="erro">
          Não foi possível carregar sua conta agora. Recarregue a página em alguns instantes.
        </Aviso>
      ) : perfil.papel !== "cliente" ? (
        <Aviso tipo="erro">
          Só clientes podem avaliar prestadoras.{" "}
          <Link href={`/prestadoras/${id}`} className="font-bold underline">
            Voltar ao perfil
          </Link>
        </Aviso>
      ) : (
        <FormularioAvaliacao prestadoraId={id} clienteId={perfil.id} />
      )}
    </Tela>
  );
}
