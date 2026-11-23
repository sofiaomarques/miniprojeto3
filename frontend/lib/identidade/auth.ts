// Cadastro e login com e-mail e senha (Supabase Auth), usados pelas Server
// Actions de app/(auth)/acoes.ts. Fica separado das telas para ser testável
// com um cliente falso (ver __tests__/auth.test.ts).
//
// Segurança:
//   * a senha só passa por aqui a caminho do Supabase: nunca é guardada,
//     devolvida para a tela nem escrita em log;
//   * as mensagens de erro são fixas e em português: nunca repassam a
//     mensagem crua do Supabase;
//   * o papel não vai nos metadados do cadastro (o trigger da 01 ignoraria):
//     ele é escolhido depois, no onboarding.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Perfil } from "./types";

// Limites de senha: mínimo do app; 72 é o máximo que o Supabase aceita.
export const SENHA_MINIMA = 8;
export const SENHA_MAXIMA = 72;

// Estado dos formulários de cadastro, login e onboarding (useActionState).
// Nunca inclui a senha: ela não volta para a tela quando há erro.
export type CampoFormulario = "nome" | "email" | "senha" | "confirmacao" | "papel";
export type EstadoFormulario = {
  erro?: string;
  campos?: Partial<Record<CampoFormulario, string>>;
  sucesso?: string;
  valores?: { nome?: string; email?: string; papel?: string };
};

export const ESTADO_INICIAL: EstadoFormulario = {};

// Só a parte de auth do cliente (facilita o cliente falso dos testes).
export type ClienteAuth = Pick<SupabaseClient["auth"], "signUp" | "signInWithPassword">;

// Rota que recebe a volta do link de confirmação de e-mail.
export const ROTA_CALLBACK = "/auth/callback";

// Para onde mandar a usuária logada: sem papel ainda, para o onboarding.
export function destinoAposLogin(perfil: Pick<Perfil, "papel"> | null): string {
  return perfil?.papel ? "/" : "/onboarding";
}

// ===========================================================================
// Validação (a mesma mensagem que a tela mostra ao lado de cada campo)
// ===========================================================================

const tamanho = (texto: string) => [...texto].length;

function texto(valor: FormDataEntryValue | null | undefined): string {
  return typeof valor === "string" ? valor : "";
}

// Cada validador devolve a mensagem do campo ou undefined. Os formulários
// usam os mesmos enquanto a pessoa digita; o servidor confere de novo.
export function validarNome(nome: string): string | undefined {
  const limpo = nome.trim();
  if (limpo === "") return "Informe seu nome.";
  if (tamanho(limpo) > 80) return "O nome pode ter no máximo 80 caracteres.";
  return undefined;
}

// E-mail: só confere se tem @. O resto (domínio, caixa existente) fica com o
// Supabase, que recusa endereço inválido com a mesma mensagem.
export const MENSAGEM_EMAIL_INVALIDO = "E-mail inválido.";

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validarEmail(email: string): string | undefined {
  return normalizarEmail(email).includes("@") ? undefined : MENSAGEM_EMAIL_INVALIDO;
}

// Senha nova (cadastro). Sem trim: espaço também é caractere.
export function validarSenhaNova(senha: string): string | undefined {
  if (senha === "") return "Crie uma senha.";
  if (senha.length < SENHA_MINIMA) return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  if (senha.length > SENHA_MAXIMA) return `A senha pode ter no máximo ${SENHA_MAXIMA} caracteres.`;
  return undefined;
}

export function validarConfirmacaoSenha(senha: string, confirmacao: string): string | undefined {
  if (confirmacao === "") return "Digite a senha de novo.";
  if (confirmacao !== senha) return "As senhas não são iguais.";
  return undefined;
}

type Resultado<T> = { ok: true; dados: T } | { ok: false; estado: EstadoFormulario };

export type DadosCadastro = { nome: string; email: string; senha: string };
export type DadosEntrada = { email: string; senha: string };

export function lerCadastro(form: FormData): Resultado<DadosCadastro> {
  const nome = texto(form.get("nome")).trim();
  const email = normalizarEmail(texto(form.get("email")));
  const senha = texto(form.get("senha"));
  const confirmacao = texto(form.get("confirmacao"));

  const campos: EstadoFormulario["campos"] = {};
  const erroNome = validarNome(nome);
  if (erroNome) campos.nome = erroNome;
  const erroEmail = validarEmail(email);
  if (erroEmail) campos.email = erroEmail;
  const erroSenha = validarSenhaNova(senha);
  if (erroSenha) campos.senha = erroSenha;
  // Só compara as duas quando a senha em si já está boa (evita dois avisos).
  else {
    const erroConfirmacao = validarConfirmacaoSenha(senha, confirmacao);
    if (erroConfirmacao) campos.confirmacao = erroConfirmacao;
  }

  if (Object.keys(campos).length > 0) {
    return { ok: false, estado: { campos, valores: { nome, email } } };
  }
  return { ok: true, dados: { nome, email, senha } };
}

export function lerEntrada(form: FormData): Resultado<DadosEntrada> {
  const email = normalizarEmail(texto(form.get("email")));
  const senha = texto(form.get("senha"));

  const campos: EstadoFormulario["campos"] = {};
  const erroEmail = validarEmail(email);
  if (erroEmail) campos.email = erroEmail;
  if (senha === "") campos.senha = "Informe sua senha.";

  if (Object.keys(campos).length > 0) return { ok: false, estado: { campos, valores: { email } } };
  return { ok: true, dados: { email, senha } };
}

// ===========================================================================
// Erros do Supabase Auth → mensagem para a tela
// ===========================================================================

export const MENSAGENS_AUTH = {
  credenciais: "E-mail ou senha incorretos.",
  emailNaoConfirmado:
    "Confirme seu e-mail antes de entrar: abra o link que enviamos para sua caixa de entrada.",
  emailJaUsado: "Já existe uma conta com este e-mail. Entre na sua conta ou use outro e-mail.",
  senhaFraca: "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.",
  emailInvalido: "E-mail inválido.",
  muitasTentativas: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.",
  cadastroDesligado: "O cadastro de novas contas está desativado no momento.",
  semConexao: "Não foi possível falar com o servidor. Confira sua internet e tente de novo.",
  desconhecido: "Não foi possível concluir agora. Tente de novo.",
} as const;

type ErroAuthLike = { code?: unknown; status?: unknown; name?: unknown };

export function mensagemErroAuth(erro: unknown): string {
  const e = (typeof erro === "object" && erro !== null ? erro : {}) as ErroAuthLike;
  switch (e.code) {
    case "invalid_credentials":
      return MENSAGENS_AUTH.credenciais;
    case "email_not_confirmed":
      return MENSAGENS_AUTH.emailNaoConfirmado;
    case "user_already_exists":
    case "email_exists":
      return MENSAGENS_AUTH.emailJaUsado;
    case "weak_password":
      return MENSAGENS_AUTH.senhaFraca;
    case "email_address_invalid":
    // Supabase recusou o formato do e-mail (a tela só confere o @).
    case "validation_failed":
    case "email_address_not_authorized":
      return MENSAGENS_AUTH.emailInvalido;
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return MENSAGENS_AUTH.muitasTentativas;
    case "signup_disabled":
    case "email_provider_disabled":
      return MENSAGENS_AUTH.cadastroDesligado;
  }
  if (e.status === 429) return MENSAGENS_AUTH.muitasTentativas;
  // Falha de rede: o Supabase nem respondeu.
  if (e.name === "AuthRetryableFetchError" || e.status === 0) return MENSAGENS_AUTH.semConexao;
  return MENSAGENS_AUTH.desconhecido;
}

// ===========================================================================
// Operações
// ===========================================================================

export type ResultadoCadastro =
  | { tipo: "logada" } // confirmação de e-mail desligada: já entrou
  | { tipo: "confirmar_email" } // conta criada; falta abrir o link do e-mail
  | { tipo: "erro"; mensagem: string };

// urlConfirmacao: para onde o link do e-mail volta (rota /auth/callback).
export async function cadastrarConta(
  auth: ClienteAuth,
  dados: DadosCadastro,
  urlConfirmacao: string,
): Promise<ResultadoCadastro> {
  let resposta: Awaited<ReturnType<ClienteAuth["signUp"]>>;
  try {
    resposta = await auth.signUp({
      email: dados.email,
      password: dados.senha,
      // Só o nome vai nos metadados: o trigger da 01 copia para perfis.nome.
      options: { data: { nome: dados.nome }, emailRedirectTo: urlConfirmacao },
    });
  } catch (erro) {
    return { tipo: "erro", mensagem: mensagemErroAuth(erro) };
  }

  const { data, error } = resposta;
  if (error) return { tipo: "erro", mensagem: mensagemErroAuth(error) };

  // Com a confirmação de e-mail ligada, o Supabase não acusa e-mail repetido
  // (para não revelar quem tem conta): devolve um usuário sem identidades.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { tipo: "erro", mensagem: MENSAGENS_AUTH.emailJaUsado };
  }

  return data.session ? { tipo: "logada" } : { tipo: "confirmar_email" };
}

export type ResultadoEntrada = { tipo: "logada" } | { tipo: "erro"; mensagem: string };

export async function entrarNaConta(auth: ClienteAuth, dados: DadosEntrada): Promise<ResultadoEntrada> {
  try {
    const { error } = await auth.signInWithPassword({ email: dados.email, password: dados.senha });
    if (error) return { tipo: "erro", mensagem: mensagemErroAuth(error) };
    return { tipo: "logada" };
  } catch (erro) {
    return { tipo: "erro", mensagem: mensagemErroAuth(erro) };
  }
}
