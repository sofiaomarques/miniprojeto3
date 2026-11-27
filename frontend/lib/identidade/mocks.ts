// Dados de mentira e implementação em memória da identidade, usados quando
// NEXT_PUBLIC_USE_MOCKS=true (ver service.ts). Os ids das contas são os mesmos
// dos mocks da descoberta (P2), para as telas das duas áreas baterem.
//
// O estado vive na memória do módulo: no navegador e no servidor são cópias
// separadas, e um reload volta tudo ao início. Testes usam redefinirMocks().
//
// A implementação repete as regras do banco (RLS, GRANTs e triggers da 01)
// para o mock falhar nos mesmos casos que o Supabase. A entrada já chega
// validada por service.ts.
import { ErroIdentidade } from "./erros";
import { novoCaminhoFoto } from "./fotos";
import type {
  AtualizacaoPerfil,
  CategoriaServico,
  FotoPortfolio,
  Perfil,
  ServicoIdentidade,
  ServicoPrestadora,
} from "./types";

export const ID_PRESTADORA_MARINA = "00000000-0000-4000-8000-0000000000a1";
export const ID_PRESTADORA_CAMILA = "00000000-0000-4000-8000-0000000000a2";
export const ID_PRESTADORA_JOANA = "00000000-0000-4000-8000-0000000000a3";
export const ID_PRESTADORA_ALINE = "00000000-0000-4000-8000-0000000000a4";
export const ID_CLIENTE_BEATRIZ = "00000000-0000-4000-8000-0000000000c1";
export const ID_CLIENTE_FERNANDA = "00000000-0000-4000-8000-0000000000c2";
// Conta recém-criada, antes do onboarding: papel e nome ainda null.
export const ID_SEM_PAPEL = "00000000-0000-4000-8000-0000000000d1";

// Conta "logada" no modo mock. Troque com definirUsuariaMock().
export const ID_USUARIA_MOCK_PADRAO = ID_PRESTADORA_MARINA;

// Mesmo seed e mesma ordem de ids da 01_identidade.sql.
export const CATEGORIAS_MOCK: readonly CategoriaServico[] = [
  { id: 1, nome: "Ar-condicionado" },
  { id: 2, nome: "Elétrica" },
  { id: 3, nome: "Encanamento" },
  { id: 4, nome: "Montagem de móveis" },
  { id: 5, nome: "Pintura" },
  { id: 6, nome: "Pequenos reparos" },
  { id: 7, nome: "Instalação de eletrodomésticos" },
  { id: 8, nome: "Jardinagem" },
];

export const PERFIS_MOCK: readonly Perfil[] = [
  {
    id: ID_PRESTADORA_MARINA,
    papel: "prestadora",
    nome: "Marina Souza",
    avatar_url: null,
    bio: "Instalação e limpeza de ar-condicionado split. Atendo com hora marcada.",
    cidade: "João Pessoa",
    criado_em: "2026-11-01T12:00:00.000Z",
    atualizado_em: "2026-11-01T12:00:00.000Z",
  },
  {
    id: ID_PRESTADORA_CAMILA,
    papel: "prestadora",
    nome: "Camila Ribeiro",
    avatar_url: null,
    bio: "Encanadora: vazamentos, torneiras, descargas e chuveiros.",
    cidade: "Recife",
    criado_em: "2026-11-02T12:00:00.000Z",
    atualizado_em: "2026-11-02T12:00:00.000Z",
  },
  {
    id: ID_PRESTADORA_JOANA,
    papel: "prestadora",
    nome: "Joana Lima",
    avatar_url: null,
    bio: "Monto guarda-roupas, camas, estantes e prateleiras.",
    cidade: "João Pessoa",
    criado_em: "2026-11-03T12:00:00.000Z",
    atualizado_em: "2026-11-03T12:00:00.000Z",
  },
  {
    id: ID_PRESTADORA_ALINE,
    papel: "prestadora",
    nome: "Aline Costa",
    avatar_url: null,
    bio: "Eletricista: tomadas, chuveiro elétrico e troca de fiação.",
    cidade: "Natal",
    criado_em: "2026-11-04T12:00:00.000Z",
    atualizado_em: "2026-11-04T12:00:00.000Z",
  },
  {
    id: ID_CLIENTE_BEATRIZ,
    papel: "cliente",
    nome: "Beatriz Alves",
    avatar_url: null,
    bio: null,
    cidade: "João Pessoa",
    criado_em: "2026-11-05T12:00:00.000Z",
    atualizado_em: "2026-11-05T12:00:00.000Z",
  },
  {
    id: ID_CLIENTE_FERNANDA,
    papel: "cliente",
    nome: "Fernanda Dias",
    avatar_url: null,
    bio: null,
    cidade: "Recife",
    criado_em: "2026-11-06T12:00:00.000Z",
    atualizado_em: "2026-11-06T12:00:00.000Z",
  },
  {
    id: ID_SEM_PAPEL,
    papel: null,
    nome: null,
    avatar_url: null,
    bio: null,
    cidade: null,
    criado_em: "2026-11-07T12:00:00.000Z",
    atualizado_em: "2026-11-07T12:00:00.000Z",
  },
];

export const SERVICOS_MOCK: readonly ServicoPrestadora[] = [
  { prestadora_id: ID_PRESTADORA_MARINA, categoria_id: 1, criado_em: "2026-11-01T12:05:00.000Z" },
  { prestadora_id: ID_PRESTADORA_CAMILA, categoria_id: 3, criado_em: "2026-11-02T12:05:00.000Z" },
  { prestadora_id: ID_PRESTADORA_JOANA, categoria_id: 4, criado_em: "2026-11-03T12:05:00.000Z" },
  { prestadora_id: ID_PRESTADORA_ALINE, categoria_id: 2, criado_em: "2026-11-04T12:05:00.000Z" },
  { prestadora_id: ID_PRESTADORA_ALINE, categoria_id: 3, criado_em: "2026-11-04T12:06:00.000Z" },
];

// Caminhos no formato exigido pela 01: '<prestadora_id>/<arquivo>'.
export const FOTOS_MOCK: readonly FotoPortfolio[] = [
  {
    id: 1,
    prestadora_id: ID_PRESTADORA_MARINA,
    caminho: `${ID_PRESTADORA_MARINA}/ar-split-sala.jpg`,
    criada_em: "2026-11-01T13:00:00.000Z",
  },
  {
    id: 2,
    prestadora_id: ID_PRESTADORA_MARINA,
    caminho: `${ID_PRESTADORA_MARINA}/ar-limpeza.jpg`,
    criada_em: "2026-11-01T13:10:00.000Z",
  },
  {
    id: 3,
    prestadora_id: ID_PRESTADORA_CAMILA,
    caminho: `${ID_PRESTADORA_CAMILA}/pia-cozinha.jpg`,
    criada_em: "2026-11-02T13:00:00.000Z",
  },
  {
    id: 4,
    prestadora_id: ID_PRESTADORA_JOANA,
    caminho: `${ID_PRESTADORA_JOANA}/guarda-roupa.jpg`,
    criada_em: "2026-11-03T13:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Estado mutável da sessão mock
// ---------------------------------------------------------------------------

type EstadoMock = {
  perfis: Perfil[];
  servicos: ServicoPrestadora[];
  fotos: FotoPortfolio[];
  idUsuaria: string | null;
};

function estadoInicial(): EstadoMock {
  return {
    perfis: structuredClone([...PERFIS_MOCK]),
    servicos: structuredClone([...SERVICOS_MOCK]),
    fotos: structuredClone([...FOTOS_MOCK]),
    idUsuaria: ID_USUARIA_MOCK_PADRAO,
  };
}

let estado = estadoInicial();

// Volta os dados e a usuária logada ao início (para testes e demos).
export function redefinirMocks(): void {
  estado = estadoInicial();
}

// Troca a conta "logada" no modo mock; null simula usuária deslogada.
// Só existe no mock: no modo real a identidade vem da sessão do Supabase.
export function definirUsuariaMock(id: string | null): void {
  estado.idUsuaria = id;
}

// Cópias, para quem chama não alterar o estado por fora do service.
const copiar = <T>(valor: T): T => structuredClone(valor);

// Todos os perfis do estado atual (com o que o onboarding e a edição mudaram),
// sem o filtro de visibilidade da RLS. Para outros mocks (P2, P3) imitarem
// views que expõem nome e avatar, como `avaliacoes_publicas`. Só existe no mock.
export function perfisMockAtuais(): Perfil[] {
  return copiar(estado.perfis);
}
const porId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

function exigirSessao(): string {
  if (!estado.idUsuaria) throw new ErroIdentidade("nao_autenticada", "Entre na sua conta para continuar.");
  return estado.idUsuaria;
}

// Policy perfis_leitura_publica: prestadoras são públicas; cliente e conta sem
// papel só aparecem para a própria dona.
const visivel = (p: Perfil) => p.papel === "prestadora" || p.id === estado.idUsuaria;

export const servicoMock: ServicoIdentidade = {
  async obterPerfil(id) {
    const perfil = estado.perfis.find((p) => p.id === id && visivel(p));
    return perfil ? copiar(perfil) : null;
  },

  async listarPerfis(ids) {
    return copiar(estado.perfis.filter((p) => ids.includes(p.id) && visivel(p)).sort(porId));
  },

  async obterMeuPerfil() {
    if (!estado.idUsuaria) return null;
    const perfil = estado.perfis.find((p) => p.id === estado.idUsuaria);
    if (!perfil) throw new ErroIdentidade("nao_encontrado", "Perfil não encontrado.");
    return copiar(perfil);
  },

  async atualizarMeuPerfil(dados: AtualizacaoPerfil) {
    const id = exigirSessao();
    const perfil = estado.perfis.find((p) => p.id === id);
    if (!perfil) throw new ErroIdentidade("nao_encontrado", "Perfil não encontrado.");
    Object.assign(perfil, dados, { atualizado_em: new Date().toISOString() });
    return copiar(perfil);
  },

  // Mesma regra do modo real: o papel só é gravado enquanto ainda é null.
  async escolherMeuPapel(papel, nome) {
    const id = exigirSessao();
    const perfil = estado.perfis.find((p) => p.id === id);
    if (!perfil) throw new ErroIdentidade("nao_encontrado", "Perfil não encontrado.");
    if (perfil.papel !== null) {
      throw new ErroIdentidade("conflito", "Você já escolheu se é cliente ou prestadora.");
    }
    Object.assign(perfil, { papel, nome, atualizado_em: new Date().toISOString() });
    return copiar(perfil);
  },

  async listarCategorias() {
    return copiar([...CATEGORIAS_MOCK].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
  },

  async listarServicosDaPrestadora(prestadoraId) {
    return copiar(
      estado.servicos
        .filter((s) => s.prestadora_id === prestadoraId)
        .sort((a, b) => a.categoria_id - b.categoria_id),
    );
  },

  // Mesma ordem de checagem do banco: trigger exigir_prestadora, unique, FK.
  async adicionarMeuServico(categoriaId) {
    const id = exigirSessao();
    const perfil = estado.perfis.find((p) => p.id === id);
    if (perfil?.papel !== "prestadora") {
      throw new ErroIdentidade("permissao", "Só prestadoras podem cadastrar serviços.");
    }
    if (estado.servicos.some((s) => s.prestadora_id === id && s.categoria_id === categoriaId)) {
      throw new ErroIdentidade("conflito", "Este serviço já está cadastrado.");
    }
    if (!CATEGORIAS_MOCK.some((c) => c.id === categoriaId)) {
      throw new ErroIdentidade("validacao", "Categoria de serviço inexistente.");
    }
    const novo: ServicoPrestadora = {
      prestadora_id: id,
      categoria_id: categoriaId,
      criado_em: new Date().toISOString(),
    };
    estado.servicos.push(novo);
    return copiar(novo);
  },

  async removerMeuServico(categoriaId) {
    const id = exigirSessao();
    const indice = estado.servicos.findIndex(
      (s) => s.prestadora_id === id && s.categoria_id === categoriaId,
    );
    if (indice === -1) throw new ErroIdentidade("nao_encontrado", "Serviço não encontrado.");
    estado.servicos.splice(indice, 1);
  },

  async listarFotosDaPrestadora(prestadoraId) {
    return copiar(
      estado.fotos
        .filter((f) => f.prestadora_id === prestadoraId)
        .sort((a, b) => a.criada_em.localeCompare(b.criada_em) || a.id - b.id),
    );
  },

  // #17: mesmas regras do banco (trigger exigir_prestadora e RLS da dona).
  // O arquivo em si não é guardado: no mock não há Storage.
  async enviarMinhaFoto(arquivo) {
    const id = exigirSessao();
    const perfil = estado.perfis.find((p) => p.id === id);
    if (perfil?.papel !== "prestadora") {
      throw new ErroIdentidade("permissao", "Só prestadoras podem enviar fotos.");
    }
    const nova: FotoPortfolio = {
      id: Math.max(0, ...estado.fotos.map((f) => f.id)) + 1,
      prestadora_id: id,
      caminho: novoCaminhoFoto(id, arquivo.type),
      criada_em: new Date().toISOString(),
    };
    estado.fotos.push(nova);
    return copiar(nova);
  },

  async apagarMinhaFoto(fotoId) {
    const id = exigirSessao();
    const indice = estado.fotos.findIndex((f) => f.id === fotoId && f.prestadora_id === id);
    if (indice === -1) throw new ErroIdentidade("nao_encontrado", "Foto não encontrada.");
    estado.fotos.splice(indice, 1);
  },
};
