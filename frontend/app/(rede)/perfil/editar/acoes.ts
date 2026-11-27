"use server";
// Server Action da edição do próprio perfil (#16). Grava pelo service de
// identidade (lib/identidade/service.ts): ele valida os campos e só altera o
// perfil da sessão; o banco confere de novo (RLS, GRANTs e triggers da 01).
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import {
  ehErroIdentidade,
  lerEdicaoPerfil,
  servicoIdentidade,
  sincronizarMeusServicos,
} from "@/lib/identidade/service";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoEdicaoPerfil = {
  erro?: string;
  valores?: { nome: string; bio: string; cidade: string; categorias: number[] };
};

const ERRO_GENERICO = "Não foi possível salvar agora. Tente de novo.";
// Nome, bio e cidade já foram gravados; só os serviços falharam.
const ERRO_SERVICOS =
  "Seus dados foram salvos, mas não foi possível atualizar os serviços. Tente de novo.";
const ENTRAR = `/entrar?next=${encodeURIComponent("/perfil/editar")}`;

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

  let dadosSalvos = false;
  try {
    const perfil = await identidade.obterMeuPerfil();
    if (!perfil) redirect(ENTRAR);
    // Igual ao exigirConta da página: sem papel, primeiro o onboarding.
    if (!perfil.papel) redirect("/onboarding");
    await identidade.atualizarMeuPerfil(dados);
    dadosSalvos = true;

    // Categorias: só prestadora tem serviços (o banco recusaria a cliente).
    if (perfil.papel === "prestadora") {
      await sincronizarMeusServicos(identidade, perfil.id, categorias);
    }
  } catch (erro) {
    unstable_rethrow(erro); // redirect() do Next não é erro: deixa seguir
    if (ehErroIdentidade(erro) && erro.codigo === "nao_autenticada") redirect(ENTRAR);
    if (dadosSalvos) {
      revalidatePath("/perfil");
      return { erro: ERRO_SERVICOS, valores };
    }
    // Mensagem do service: fixa e em português, nunca a do banco.
    if (ehErroIdentidade(erro)) return { erro: erro.message, valores };
    return { erro: ERRO_GENERICO, valores };
  }

  revalidatePath("/perfil");
  redirect("/perfil");
}
