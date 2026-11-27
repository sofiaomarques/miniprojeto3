// Implementação em memória do service (NEXT_PUBLIC_USE_MOCKS=true).
// Replica as regras da 06_seguidores.sql: só segue em nome próprio, as duas
// contas precisam ter papel, ninguém segue a si mesma, sem repetição.
// Quem está logada vem do mock da identidade (P1): definirUsuariaMock.
import { perfisMockAtuais, servicoMock } from "@/lib/identidade/mocks";
import type { Perfil } from "@/lib/identidade/types";

import { SEGUIDORES_MOCK, type SeguimentoMock } from "./mocks";
import { ordenarConexoes, termoDeBusca } from "./regras";
import { normalizarTexto } from "@/lib/descoberta/texto";
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

let seguimentos: SeguimentoMock[] = [];

// Volta ao estado inicial (para testes; a identidade tem o seu redefinirMocks).
export function redefinirSeguidoresMock(): void {
  seguimentos = SEGUIDORES_MOCK.map((s) => ({ ...s }));
}
redefinirSeguidoresMock();

// Como a view `pessoas_publicas`: só quem tem papel, só nome, avatar e papel.
function paraPessoa(p: Perfil): PessoaResumo | null {
  if (!p.papel) return null;
  return { id: p.id, papel: p.papel, nome: p.nome ?? "", avatarUrl: p.avatar_url };
}

function pessoasPorId(): Map<string, PessoaResumo> {
  const mapa = new Map<string, PessoaResumo>();
  for (const p of perfisMockAtuais()) {
    const pessoa = paraPessoa(p);
    if (pessoa) mapa.set(pessoa.id, pessoa);
  }
  return mapa;
}

// Listas e nomes só para quem está logada (a view não tem grant para anon).
async function exigirLogada(): Promise<Perfil> {
  const eu = await servicoMock.obterMeuPerfil();
  if (!eu) throw new Error(ERRO_SEGUIR_DESLOGADA);
  return eu;
}

export async function contar(perfilId: string): Promise<Contagem> {
  return {
    seguidores: seguimentos.filter((s) => s.seguidaId === perfilId).length,
    seguindo: seguimentos.filter((s) => s.seguidoraId === perfilId).length,
  };
}

export async function listar(perfilId: string, tipo: TipoLista): Promise<Conexao[]> {
  await exigirLogada();
  const pessoas = pessoasPorId();
  const conexoes: Conexao[] = [];
  for (const s of seguimentos) {
    if (!pessoas.has(s.seguidoraId) || !pessoas.has(s.seguidaId)) continue;
    if (tipo === "seguidores" && s.seguidaId === perfilId) {
      conexoes.push({ pessoa: pessoas.get(s.seguidoraId)!, desde: s.criadoEm });
    }
    if (tipo === "seguindo" && s.seguidoraId === perfilId) {
      conexoes.push({ pessoa: pessoas.get(s.seguidaId)!, desde: s.criadoEm });
    }
  }
  return ordenarConexoes(conexoes).slice(0, LIMITE_LISTA);
}

// Ids de quem eu sigo, mais recentes primeiro (como a RLS da 06: só as minhas linhas).
export async function idsQueSigo(limite: number): Promise<string[]> {
  const eu = await exigirLogada();
  return seguimentos
    .filter((s) => s.seguidoraId === eu.id)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .slice(0, limite)
    .map((s) => s.seguidaId);
}

export async function euSigo(perfilId: string): Promise<boolean> {
  const eu = await servicoMock.obterMeuPerfil();
  if (!eu) return false;
  return seguimentos.some((s) => s.seguidoraId === eu.id && s.seguidaId === perfilId);
}

export async function seguir(perfilId: string): Promise<void> {
  const eu = await exigirLogada();
  if (!eu.papel) throw new Error(ERRO_SEGUIR_SEM_PAPEL);
  if (eu.id === perfilId) throw new Error(ERRO_SEGUIR_A_SI_MESMA);
  if (!pessoasPorId().has(perfilId)) throw new Error(ERRO_SEGUIR_GENERICO);
  // Seguir de novo não é erro: a tela pode ter ficado desatualizada.
  if (seguimentos.some((s) => s.seguidoraId === eu.id && s.seguidaId === perfilId)) return;
  seguimentos.push({ seguidoraId: eu.id, seguidaId: perfilId, criadoEm: new Date().toISOString() });
}

export async function deixarDeSeguir(perfilId: string): Promise<void> {
  const eu = await exigirLogada();
  seguimentos = seguimentos.filter((s) => !(s.seguidoraId === eu.id && s.seguidaId === perfilId));
}

export async function obterPessoa(id: string): Promise<PessoaResumo | null> {
  await exigirLogada();
  return pessoasPorId().get(id) ?? null;
}

export async function buscarPessoas(texto: string): Promise<PessoaResumo[]> {
  await exigirLogada();
  const termo = termoDeBusca(texto);
  if (!termo) return [];
  return [...pessoasPorId().values()]
    .filter((p) => normalizarTexto(p.nome).includes(termo))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .slice(0, LIMITE_LISTA);
}
