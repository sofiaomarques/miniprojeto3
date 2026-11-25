// Implementação em memória do service (NEXT_PUBLIC_USE_MOCKS=true).
// Perfis, categorias, serviços e fotos vêm do mock da identidade (P1), então
// o que a P1 muda no mock (onboarding, nome, serviços, fotos) aparece aqui também.
// Replica as regras do banco: uma avaliação por cliente e prestadora,
// sem autoavaliação, só cliente avalia, só prestadora é avaliada,
// só a autora edita ou apaga.
import { CATEGORIAS_MOCK, perfisMockAtuais, servicoMock } from "@/lib/identidade/mocks";
import type { Perfil } from "@/lib/identidade/types";

import { AVALIACOES_MOCK, type AvaliacaoMock } from "./mocks";
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

const avaliacoes: AvaliacaoMock[] = AVALIACOES_MOCK.map((a) => ({ ...a }));
let proximoId = Math.max(0, ...avaliacoes.map((a) => a.id)) + 1;

// Como a view `avaliacoes_publicas`: mostra nome e avatar de quem avaliou.
// Lê o estado atual do mock da identidade, não a lista inicial.
function perfilPublico(id: string): Perfil | undefined {
  return perfisMockAtuais().find((p) => p.id === id);
}

function paraAvaliacao(a: AvaliacaoMock): Avaliacao {
  const prestadora = perfilPublico(a.prestadoraId);
  const cliente = perfilPublico(a.clienteId);
  return {
    ...a,
    prestadoraNome: prestadora?.nome ?? "",
    prestadoraAvatarUrl: prestadora?.avatar_url ?? null,
    clienteNome: cliente?.nome ?? "",
    clienteAvatarUrl: cliente?.avatar_url ?? null,
  };
}

async function categoriasDe(prestadoraId: string): Promise<CategoriaResumo[]> {
  const ids = (await servicoMock.listarServicosDaPrestadora(prestadoraId)).map(
    (s) => s.categoria_id,
  );
  return CATEGORIAS_MOCK.filter((c) => ids.includes(c.id))
    .map((c) => ({ id: c.id, nome: c.nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

async function resumir(perfil: Perfil): Promise<PrestadoraResumo> {
  const notas = avaliacoes.filter((a) => a.prestadoraId === perfil.id).map((a) => a.nota);
  return {
    id: perfil.id,
    nome: perfil.nome ?? "",
    avatarUrl: perfil.avatar_url,
    cidade: perfil.cidade,
    categorias: await categoriasDe(perfil.id),
    notaMedia: mediaComUmaCasa(notas),
    totalAvaliacoes: notas.length,
  };
}

export async function listarCategorias(): Promise<CategoriaResumo[]> {
  return (await servicoMock.listarCategorias()).map((c) => ({ id: c.id, nome: c.nome }));
}

export async function buscarPrestadoras(filtros: FiltrosBusca): Promise<PrestadoraResumo[]> {
  const cidade = filtros.cidade ? normalizarTexto(filtros.cidade) : "";
  // Prestadoras do estado atual: inclui quem virou prestadora no onboarding.
  const prestadoras = perfisMockAtuais().filter((p) => p.papel === "prestadora");
  const resumos = await Promise.all(prestadoras.map(resumir));
  const resultado = resumos.filter((p) => {
    if (filtros.categoriaId && !p.categorias.some((c) => c.id === filtros.categoriaId)) {
      return false;
    }
    if (cidade && !normalizarTexto(p.cidade ?? "").includes(cidade)) return false;
    return true;
  });
  const porNome = (a: PrestadoraResumo, b: PrestadoraResumo) =>
    a.nome.localeCompare(b.nome, "pt-BR");
  if (filtros.ordenarPor === "nome") return resultado.sort(porNome);
  // "nota" (padrão): maior primeiro, sem avaliação por último, empate por nome.
  return resultado.sort((a, b) => (b.notaMedia ?? -1) - (a.notaMedia ?? -1) || porNome(a, b));
}

export async function listarAvaliacoes(prestadoraId: string): Promise<Avaliacao[]> {
  return avaliacoes
    .filter((a) => a.prestadoraId === prestadoraId)
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
    .map(paraAvaliacao);
}

export async function obterPrestadora(id: string): Promise<PrestadoraDetalhe | null> {
  const perfil = await servicoMock.obterPerfil(id);
  if (!perfil || perfil.papel !== "prestadora") return null;
  const [resumo, fotos, lista] = await Promise.all([
    resumir(perfil),
    servicoMock.listarFotosDaPrestadora(id),
    listarAvaliacoes(id),
  ]);
  return {
    perfil,
    categorias: resumo.categorias,
    fotos,
    avaliacoes: lista,
    notaMedia: resumo.notaMedia,
    totalAvaliacoes: resumo.totalAvaliacoes,
  };
}

export async function criarAvaliacao(clienteId: string, dados: NovaAvaliacao): Promise<Avaliacao> {
  const cliente = perfilPublico(clienteId);
  const prestadora = perfilPublico(dados.prestadoraId);
  if (!cliente) throw new Error("Entre na sua conta para avaliar.");
  if (cliente.papel !== "cliente") throw new Error("Só clientes podem avaliar.");
  if (!prestadora || prestadora.papel !== "prestadora") {
    throw new Error("Só é possível avaliar uma prestadora.");
  }
  if (avaliacoes.some((a) => a.prestadoraId === prestadora.id && a.clienteId === cliente.id)) {
    throw new Error("Você já avaliou esta prestadora. Edite a avaliação existente.");
  }
  const nova: AvaliacaoMock = {
    id: proximoId++,
    prestadoraId: prestadora.id,
    clienteId: cliente.id,
    nota: dados.nota,
    comentario: dados.comentario ?? null,
    criadaEm: new Date().toISOString(),
  };
  avaliacoes.push(nova);
  return paraAvaliacao(nova);
}

function acharDaAutora(clienteId: string, id: number): AvaliacaoMock {
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
  return paraAvaliacao(avaliacao);
}

export async function apagarAvaliacao(clienteId: string, id: number): Promise<void> {
  const avaliacao = acharDaAutora(clienteId, id);
  avaliacoes.splice(avaliacoes.indexOf(avaliacao), 1);
}

export async function listarIndicacoesDaCliente(clienteId: string): Promise<Avaliacao[]> {
  return avaliacoes
    .filter((a) => a.clienteId === clienteId)
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
    .map(paraAvaliacao);
}
