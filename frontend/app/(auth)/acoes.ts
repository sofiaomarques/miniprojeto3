"use server";
// Server Actions de cadastro, login, logout e onboarding (#14). Rodam só no
// servidor: a senha vai do formulário direto para o Supabase Auth e a sessão
// fica em cookies gravados pelo cliente de lib/supabase/server.ts.
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  cadastrarConta,
  destinoAposLogin,
  entrarNaConta,
  lerCadastro,
  lerEntrada,
  ROTA_CALLBACK,
  type EstadoFormulario,
} from "@/lib/identidade/auth";
import { proximaSegura } from "@/lib/identidade/rotas";
import { ehErroIdentidade, servicoIdentidade } from "@/lib/identidade/service";
import { usarMocks } from "@/lib/supabase/config";
import { criarClienteServidor } from "@/lib/supabase/server";

const AVISO_MOCK =
  "Cadastro e login usam o Supabase de verdade. Defina NEXT_PUBLIC_USE_MOCKS=false para testar.";

// Endereço do site que fez o pedido, para o link do e-mail de confirmação
// voltar para o mesmo lugar (localhost, preview ou produção). O Next já
// recusa Server Actions cuja origem não bate com o host.
async function enderecoDoSite(): Promise<string> {
  const h = await headers();
  const origem = h.get("origin");
  if (origem) return origem;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocolo = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

export async function cadastrar(
  _anterior: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  const lido = lerCadastro(form);
  if (!lido.ok) return lido.estado;
  const { nome, email } = lido.dados;

  const supabase = await criarClienteServidor();
  if (usarMocks || !supabase) return { erro: AVISO_MOCK, valores: { nome, email } };

  const resultado = await cadastrarConta(
    supabase.auth,
    lido.dados,
    `${await enderecoDoSite()}${ROTA_CALLBACK}`,
  );

  if (resultado.tipo === "erro") return { erro: resultado.mensagem, valores: { nome, email } };
  if (resultado.tipo === "confirmar_email") {
    return {
      sucesso:
        `Conta criada! Enviamos um link de confirmação para ${email}. ` +
        "Abra o link neste mesmo navegador para escolher se você é cliente ou prestadora.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function entrar(_anterior: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const lido = lerEntrada(form);
  if (!lido.ok) return lido.estado;
  const { email } = lido.dados;

  const supabase = await criarClienteServidor();
  if (usarMocks || !supabase) return { erro: AVISO_MOCK, valores: { email } };

  const resultado = await entrarNaConta(supabase.auth, lido.dados);
  if (resultado.tipo === "erro") return { erro: resultado.mensagem, valores: { email } };

  // Quem ainda não escolheu o papel vai para o onboarding; as demais voltam
  // para a página que pediram antes do login (?proxima=), se for segura.
  const proxima = proximaSegura(form.get("proxima"));
  let destino = proxima ?? "/";
  try {
    const perfil = await servicoIdentidade(supabase).obterMeuPerfil();
    if (destinoAposLogin(perfil) === "/onboarding") destino = "/onboarding";
  } catch {
    // Sem o perfil não dá para decidir; o middleware confere de novo.
  }

  revalidatePath("/", "layout");
  redirect(destino);
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  if (!usarMocks && supabase) {
    // scope "local": encerra só a sessão deste navegador.
    await supabase.auth.signOut({ scope: "local" });
  }
  revalidatePath("/", "layout");
  redirect("/entrar");
}

export async function escolherPapel(
  _anterior: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  const papel = form.get("papel");
  const nome = typeof form.get("nome") === "string" ? (form.get("nome") as string).trim() : "";
  const valores = { nome, papel: typeof papel === "string" ? papel : undefined };

  const campos: EstadoFormulario["campos"] = {};
  if (papel !== "cliente" && papel !== "prestadora") campos.papel = "Escolha uma das opções.";
  if (nome === "") campos.nome = "Informe seu nome.";
  if (Object.keys(campos).length > 0) return { campos, valores };

  try {
    const identidade = servicoIdentidade(await criarClienteServidor());
    await identidade.escolherMeuPapel(papel as "cliente" | "prestadora", nome);
  } catch (erro) {
    if (ehErroIdentidade(erro)) {
      // Já escolheu antes (outra aba, por exemplo): segue para o app.
      if (erro.codigo === "conflito") redirect("/");
      if (erro.codigo === "nao_autenticada") redirect("/entrar");
      return { erro: erro.message, valores };
    }
    return { erro: "Não foi possível salvar agora. Tente de novo.", valores };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
