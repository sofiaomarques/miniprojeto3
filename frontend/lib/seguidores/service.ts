// Ponto único de acesso de seguidores. As telas importam só daqui;
// NEXT_PUBLIC_USE_MOCKS troca mock e banco real sem mexer em componente.
// Só para Client Components (o modo real usa o cliente do navegador).
//
// Quem pode o quê (06_seguidores.sql):
//   contarSeguidores: qualquer pessoa, também sem login;
//   listas, perfil de pessoa e busca: só logada;
//   seguir e deixar de seguir: só a conta logada, em nome dela, com papel.
import { usarMocks } from "@/lib/supabase/config";

import { REGEX_UUID } from "./regras";
import * as mock from "./service-mock";
import * as real from "./service-supabase";
import { type Conexao, type Contagem, ERRO_SEGUIR_GENERICO, type PessoaResumo, type TipoLista } from "./types";

const impl = usarMocks ? mock : real;

// id que não é uuid vira "não encontrada", não erro 22P02 do Postgres.
const idValido = (id: string) => REGEX_UUID.test(id);

export function contarSeguidores(perfilId: string): Promise<Contagem> {
  if (!idValido(perfilId)) return Promise.resolve({ seguidores: 0, seguindo: 0 });
  return impl.contar(perfilId);
}

// Mais recentes primeiro. No máximo LIMITE_LISTA pessoas.
export function listarConexoes(perfilId: string, tipo: TipoLista): Promise<Conexao[]> {
  if (!idValido(perfilId)) return Promise.resolve([]);
  return impl.listar(perfilId, tipo);
}

// false também para quem não está logada.
export function euSigo(perfilId: string): Promise<boolean> {
  if (!idValido(perfilId)) return Promise.resolve(false);
  return impl.euSigo(perfilId);
}

export function seguir(perfilId: string): Promise<void> {
  if (!idValido(perfilId)) return Promise.reject(new Error(ERRO_SEGUIR_GENERICO));
  return impl.seguir(perfilId);
}

export function deixarDeSeguir(perfilId: string): Promise<void> {
  if (!idValido(perfilId)) return Promise.reject(new Error(ERRO_SEGUIR_GENERICO));
  return impl.deixarDeSeguir(perfilId);
}

// null quando não existe ou ainda não fez o onboarding.
export function obterPessoa(id: string): Promise<PessoaResumo | null> {
  if (!idValido(id)) return Promise.resolve(null);
  return impl.obterPessoa(id);
}

// Por nome, sem diferença de acento ou maiúscula. Ordem alfabética.
export function buscarPessoas(texto: string): Promise<PessoaResumo[]> {
  return impl.buscarPessoas(texto);
}
