"use server";
// Server Action da edição do próprio perfil (#16). Grava pelo service de
// identidade (lib/identidade/service.ts): ele valida os campos e só altera o
// perfil da sessão; o banco confere de novo (RLS, GRANTs e triggers da 01).
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { diferencaCategorias, lerEdicaoPerfil } from "@/lib/identidade/perfil";
import { ehErroIdentidade, servicoIdentidade } from "@/lib/identidade/service";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoEdicaoPerfil = {
  erro?: string;
  valores?: { nome: string; bio: string; cidade: string; categorias: number[] };
};

const ERRO_GENERICO = "Não foi possível salvar agora. Tente de novo.";

export async function salvarPerfil(
  _anterior: EstadoEdicaoPerfil,
  form: FormData,
): Promise<EstadoEdicaoPerfil> {
  const { dados, categorias } = lerEdicaoPerfil(form);
  const valores = {
    nome: dados.nome ?? "",
    bio: dados.bio ?? "",
    cidade: dados.cidade ?? "",
    categorias,
  };

  const identidade = servicoIdentidade(await criarClienteServidor());

  let papel: string | null = null;
  try {
    const perfil = await identidade.obterMeuPerfil();
    if (!perfil) redirect(`/entrar?next=${encodeURIComponent("/perfil/editar")}`);
    papel = perfil.papel;
    await identidade.atualizarMeuPerfil(dados);

    // Categorias: só prestadora tem serviços (o banco recusaria a cliente).
    if (papel === "prestadora") {
      const atuais = (await identidade.listarServicosDaPrestadora(perfil.id)).map(
        (s) => s.categoria_id,
      );
      const { adicionar, remover } = diferencaCategorias(atuais, categorias);
      for (const id of adicionar) await identidade.adicionarMeuServico(id);
      for (const id of remover) await identidade.removerMeuServico(id);
    }
  } catch (erro) {
    unstable_rethrow(erro); // redirect() do Next não é erro: deixa seguir
    if (ehErroIdentidade(erro)) {
      if (erro.codigo === "nao_autenticada") {
        redirect(`/entrar?next=${encodeURIComponent("/perfil/editar")}`);
      }
      // Mensagem do service: fixa e em português, nunca a do banco.
      return { erro: erro.message, valores };
    }
    return { erro: ERRO_GENERICO, valores };
  }

  revalidatePath("/perfil");
  redirect("/perfil");
}
