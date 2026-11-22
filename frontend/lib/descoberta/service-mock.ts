// Implementação em memória do service (NEXT_PUBLIC_USE_MOCKS=true).
// Replica as regras do banco: uma avaliação por cliente e prestadora,
// sem autoavaliação, só cliente avalia, só prestadora é avaliada,
// só a autora edita ou apaga.
import type { Perfil } from "./identidade-provisoria";
import {
  AVALIACOES_MOCK,
  CATEGORIAS_MOCK,
  CLIENTES_MOCK,
  FOTOS_MOCK,
  PRESTADORAS_MOCK,
  SERVICOS_MOCK,
} from "./mocks";
import { mediaComUmaCasa, normalizarTexto } from "./texto";
import type {
  Avaliacao,
  CategoriaResumo,
  DadosAvaliacao,
  FiltrosBusca,
  NovaAvaliacao,
  PrestadoraDetalhe,
  PrestadoraResumo,
} from "./types";

const avaliacoes: Avaliacao[] = [...AVALIACOES_MOCK];
let proximoId = Math.max(0, ...avaliacoes.map((a) => a.id)) + 1;

function perfilPorId(id: string): Perfil | undefined {
  return [...PRESTADORAS_MOCK, ...CLIENTES_MOCK].find((p) => p.id === id);
}

function categoriasDe(prestadoraId: string): CategoriaResumo[] {
  const ids = SERVICOS_MOCK[prestadoraId] ?? [];
  return CATEGORIAS_MOCK.filter((c) => ids.includes(c.id)).sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

function resumir(perfil: Perfil): PrestadoraResumo {
  const notas = avaliacoes.filter((a) => a.prestadoraId === perfil.id).map((a) => a.nota);
  return {
    id: perfil.id,
    nome: perfil.nome,
    avatarUrl: perfil.avatarUrl,
    cidade: perfil.cidade,
    categorias: categoriasDe(perfil.id),
    notaMedia: mediaComUmaCasa(notas),
    totalAvaliacoes: notas.length,
  };
}

export async function buscarPrestadoras(filtros: FiltrosBusca): Promise<PrestadoraResumo[]> {
  const cidade = filtros.cidade ? normalizarTexto(filtros.cidade) : "";
  const resultado = PRESTADORAS_MOCK.map(resumir).filter((p) => {
    if (filtros.categoriaId && !p.categorias.some((c) => c.id === filtros.categoriaId)) {
      return false;
    }
    if (cidade && !normalizarTexto(p.cidade ?? "").includes(cidade)) return false;
    return true;
  });
  if (filtros.ordenarPor === "nome") {
    return resultado.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }
  // "nota" (padrão): maior primeiro, sem avaliação por último.
  return resultado.sort((a, b) => (b.notaMedia ?? -1) - (a.notaMedia ?? -1));
}

export async function listarAvaliacoes(prestadoraId: string): Promise<Avaliacao[]> {
  return avaliacoes
    .filter((a) => a.prestadoraId === prestadoraId)
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
}

export async function obterPrestadora(id: string): Promise<PrestadoraDetalhe | null> {
  const perfil = PRESTADORAS_MOCK.find((p) => p.id === id);
  if (!perfil) return null;
  const resumo = resumir(perfil);
  return {
    perfil,
    categorias: resumo.categorias,
    fotos: FOTOS_MOCK.filter((f) => f.prestadoraId === id),
    avaliacoes: await listarAvaliacoes(id),
    notaMedia: resumo.notaMedia,
    totalAvaliacoes: resumo.totalAvaliacoes,
  };
}

export async function criarAvaliacao(clienteId: string, dados: NovaAvaliacao): Promise<Avaliacao> {
  const cliente = perfilPorId(clienteId);
  const prestadora = perfilPorId(dados.prestadoraId);
  if (!cliente) throw new Error("Entre na sua conta para avaliar.");
  if (cliente.papel !== "cliente") throw new Error("Só clientes podem avaliar.");
  if (!prestadora || prestadora.papel !== "prestadora") {
    throw new Error("Só é possível avaliar uma prestadora.");
  }
  if (avaliacoes.some((a) => a.prestadoraId === prestadora.id && a.clienteId === cliente.id)) {
    throw new Error("Você já avaliou esta prestadora. Edite a avaliação existente.");
  }
  const nova: Avaliacao = {
    id: proximoId++,
    prestadoraId: prestadora.id,
    clienteId: cliente.id,
    nota: dados.nota,
    comentario: dados.comentario ?? null,
    criadaEm: new Date().toISOString(),
    prestadoraNome: prestadora.nome,
    prestadoraAvatarUrl: prestadora.avatarUrl,
    clienteNome: cliente.nome,
    clienteAvatarUrl: cliente.avatarUrl,
  };
  avaliacoes.push(nova);
  return nova;
}

function acharDaAutora(clienteId: string, id: number): Avaliacao {
  const avaliacao = avaliacoes.find((a) => a.id === id && a.clienteId === clienteId);
  if (!avaliacao) throw new Error("Avaliação não encontrada ou não é sua.");
  return avaliacao;
}

export async function editarAvaliacao(
  clienteId: string,
  id: number,
  dados: DadosAvaliacao,
): Promise<Avaliacao> {
  const avaliacao = acharDaAutora(clienteId, id);
  avaliacao.nota = dados.nota;
  avaliacao.comentario = dados.comentario ?? null;
  return avaliacao;
}

export async function apagarAvaliacao(clienteId: string, id: number): Promise<void> {
  const avaliacao = acharDaAutora(clienteId, id);
  avaliacoes.splice(avaliacoes.indexOf(avaliacao), 1);
}

export async function listarIndicacoesDaCliente(clienteId: string): Promise<Avaliacao[]> {
  return avaliacoes
    .filter((a) => a.clienteId === clienteId)
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
}
