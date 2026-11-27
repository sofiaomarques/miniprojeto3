// Implementação real do service (NEXT_PUBLIC_USE_MOCKS=false), sobre o banco
// criado por 06_seguidores.sql. A segurança de verdade está na RLS; as
// checagens daqui só dão mensagens claras.
import { criarClienteNavegador } from "@/lib/supabase/client";

import { ordenarConexoes, termoDeBusca } from "./regras";
import {
  type Conexao,
  type Contagem,
  ERRO_SEGUIR_A_SI_MESMA,
  ERRO_SEGUIR_DESLOGADA,
  ERRO_SEGUIR_GENERICO,
  ERRO_SEGUIR_SEM_PAPEL,
  LIMITE_LISTA,
  type PessoaResumo,
  type TipoLista,
} from "./types";

function clienteSupabase() {
  const cliente = criarClienteNavegador();
  if (!cliente) throw new Error("Supabase desligado (modo mock).");
  return cliente;
}

type ErroBanco = { code?: string; message?: string } | null;

/* eslint-disable @typescript-eslint/no-explicit-any */
// Traduz o erro do Postgres/PostgREST: a mensagem crua traz nome de policy.
function mensagemDoErro(erro: NonNullable<ErroBanco>): string {
  switch (erro.code) {
    case "23514":
      return ERRO_SEGUIR_A_SI_MESMA;
    case "42501": // RLS: a conta ainda não escolheu papel
      return ERRO_SEGUIR_SEM_PAPEL;
    case "PGRST301":
      return ERRO_SEGUIR_DESLOGADA;
    default:
      return ERRO_SEGUIR_GENERICO;
  }
}

function ou<T>(resposta: { data: T; error: ErroBanco }): T {
  if (resposta.error) throw new Error(mensagemDoErro(resposta.error));
  return resposta.data;
}

async function meuId(): Promise<string | null> {
  const { data } = await clienteSupabase().auth.getUser();
  return data.user?.id ?? null;
}

function paraPessoa(l: any): PessoaResumo {
  return { id: l.id, papel: l.papel, nome: l.nome ?? "", avatarUrl: l.avatar_url ?? null };
}

export async function contar(perfilId: string): Promise<Contagem> {
  const linhas = ou(
    await clienteSupabase().rpc("contar_seguidores", { perfil_id: perfilId }),
  ) as any[] | null;
  const linha = linhas?.[0];
  return { seguidores: Number(linha?.seguidores ?? 0), seguindo: Number(linha?.seguindo ?? 0) };
}

export async function listar(perfilId: string, tipo: TipoLista): Promise<Conexao[]> {
  // seguidores de X: linhas em que X é a seguida, e a pessoa é quem segue.
  const [filtro, lado] =
    tipo === "seguidores" ? (["seguida_id", "seguidora"] as const) : (["seguidora_id", "seguida"] as const);
  const linhas = ou(
    await clienteSupabase()
      .from("seguidores_publicos")
      .select("*")
      .eq(filtro, perfilId)
      .order("criado_em", { ascending: false })
      .limit(LIMITE_LISTA),
  ) as any[];
  return ordenarConexoes(
    linhas.map((l) => ({
      pessoa: {
        id: l[`${lado}_id`],
        papel: l[`${lado}_papel`],
        nome: l[`${lado}_nome`] ?? "",
        avatarUrl: l[`${lado}_avatar_url`] ?? null,
      },
      desde: l.criado_em,
    })),
  );
}

export async function euSigo(perfilId: string): Promise<boolean> {
  const eu = await meuId();
  if (!eu) return false;
  const linha = ou(
    await clienteSupabase()
      .from("seguidores")
      .select("seguida_id")
      .eq("seguidora_id", eu)
      .eq("seguida_id", perfilId)
      .maybeSingle(),
  );
  return linha !== null;
}

export async function seguir(perfilId: string): Promise<void> {
  const eu = await meuId();
  if (!eu) throw new Error(ERRO_SEGUIR_DESLOGADA);
  const { error } = await clienteSupabase()
    .from("seguidores")
    .insert({ seguidora_id: eu, seguida_id: perfilId });
  // Já seguia (23505): a tela estava desatualizada, o resultado é o mesmo.
  if (error && error.code !== "23505") throw new Error(mensagemDoErro(error));
}

export async function deixarDeSeguir(perfilId: string): Promise<void> {
  const eu = await meuId();
  if (!eu) throw new Error(ERRO_SEGUIR_DESLOGADA);
  ou(
    await clienteSupabase()
      .from("seguidores")
      .delete()
      .eq("seguidora_id", eu)
      .eq("seguida_id", perfilId),
  );
}

export async function obterPessoa(id: string): Promise<PessoaResumo | null> {
  const linha = ou(
    await clienteSupabase()
      .from("pessoas_publicas")
      .select("id, papel, nome, avatar_url")
      .eq("id", id)
      .maybeSingle(),
  );
  return linha ? paraPessoa(linha) : null;
}

export async function buscarPessoas(texto: string): Promise<PessoaResumo[]> {
  const termo = termoDeBusca(texto);
  if (!termo) return [];
  const linhas = ou(
    await clienteSupabase()
      .from("pessoas_publicas")
      .select("id, papel, nome, avatar_url")
      .ilike("nome_normalizado", `%${termo}%`)
      .order("nome")
      .limit(LIMITE_LISTA),
  ) as any[];
  return linhas.map(paraPessoa);
}
