"use server";
// Server Action da tela "Preços dos serviços". Grava pelo service de preços
// (lib/identidade/precos.ts): ele valida e só altera os serviços da sessão; o
// banco confere de novo (RLS e GRANT da 05).
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { servicoPrecos } from "@/lib/identidade/precos";
import { lerFormularioPrecos, type ValorDigitado } from "@/lib/identidade/precos-formulario";
import { ehErroIdentidade } from "@/lib/identidade/service";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoPrecos = {
  erro?: string;
  erros?: Record<number, string>;
  valores?: Record<number, ValorDigitado>;
  salvo?: boolean;
};

const ERRO_GENERICO = "Não foi possível salvar os preços agora. Tente de novo.";
const ENTRAR = `/entrar?next=${encodeURIComponent("/perfil/precos")}`;

export async function salvarPrecos(_anterior: EstadoPrecos, form: FormData): Promise<EstadoPrecos> {
  const { alteracoes, erros, valores } = lerFormularioPrecos(form);
  if (Object.keys(erros).length > 0) {
    return { erro: "Confira os preços marcados abaixo.", erros, valores };
  }

  try {
    await servicoPrecos(await criarClienteServidor()).salvarMeusPrecos(alteracoes);
  } catch (erro) {
    unstable_rethrow(erro);
    if (ehErroIdentidade(erro) && erro.codigo === "nao_autenticada") redirect(ENTRAR);
    // Mensagem do service: fixa e em português, nunca a do banco.
    if (ehErroIdentidade(erro)) return { erro: erro.message, valores };
    return { erro: ERRO_GENERICO, valores };
  }

  revalidatePath("/perfil/precos");
  return { salvo: true };
}
