// Ponto único de acesso da área de descoberta. As telas importam só daqui;
// NEXT_PUBLIC_USE_MOCKS troca mock e banco real sem mexer em componente.
import { usarMocks } from "@/lib/supabase/config";
import * as mock from "./service-mock";
import * as real from "./service-supabase";
import type {
  Avaliacao,
  CategoriaResumo,
  DadosAvaliacao,
  FiltrosBusca,
  NovaAvaliacao,
  PrestadoraDetalhe,
  PrestadoraResumo,
} from "./types";

// A flag vem de lib/supabase/config, que a ignora em produção.
export const USAR_MOCKS = usarMocks;

const impl = USAR_MOCKS ? mock : real;

function validarDados(dados: DadosAvaliacao): DadosAvaliacao {
  if (!Number.isInteger(dados.nota) || dados.nota < 1 || dados.nota > 5) {
    throw new Error("A nota deve ser um número inteiro de 1 a 5.");
  }
  const comentario = dados.comentario?.trim() || null;
  return { nota: dados.nota, comentario };
}

// Categorias para o filtro da busca (vêm de `categorias_servico`, da P1).
export function listarCategorias(): Promise<CategoriaResumo[]> {
  return impl.listarCategorias();
}

export function buscarPrestadoras(filtros: FiltrosBusca = {}): Promise<PrestadoraResumo[]> {
  return impl.buscarPrestadoras(filtros);
}

export function obterPrestadora(id: string): Promise<PrestadoraDetalhe | null> {
  return impl.obterPrestadora(id);
}

export function listarAvaliacoes(prestadoraId: string): Promise<Avaliacao[]> {
  return impl.listarAvaliacoes(prestadoraId);
}

export function criarAvaliacao(clienteId: string, dados: NovaAvaliacao): Promise<Avaliacao> {
  const { nota, comentario } = validarDados(dados);
  return impl.criarAvaliacao(clienteId, { prestadoraId: dados.prestadoraId, nota, comentario });
}

export function editarAvaliacao(
  clienteId: string,
  id: number,
  dados: DadosAvaliacao,
): Promise<Avaliacao> {
  return impl.editarAvaliacao(clienteId, id, validarDados(dados));
}

export function apagarAvaliacao(clienteId: string, id: number): Promise<void> {
  return impl.apagarAvaliacao(clienteId, id);
}

export function listarIndicacoesDaCliente(clienteId: string): Promise<Avaliacao[]> {
  return impl.listarIndicacoesDaCliente(clienteId);
}
