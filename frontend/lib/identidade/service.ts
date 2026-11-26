// Ponto único de acesso aos dados de identidade (perfis, categorias,
// serviços e fotos do portfólio). As telas importam só daqui.
//
// Uso (o mesmo código nos dois modos; em modo mock o cliente vem null e é
// ignorado):
//   Client Component:
//     const identidade = servicoIdentidade(criarClienteNavegador());
//   Server Component, Server Action ou Route Handler:
//     const identidade = servicoIdentidade(await criarClienteServidor());
//   const perfil = await identidade.obterPerfil(id);
//
// NEXT_PUBLIC_USE_MOCKS=true usa mocks.ts; false usa o Supabase real. Uma falha
// do Supabase vira ErroIdentidade: nunca cai para os mocks em silêncio.
//
// Segurança: quem decide é o banco (RLS, GRANTs e triggers da 01). Este
// arquivo só usa o cliente com a chave publishable e a sessão da usuária,
// nunca recebe o id da usuária de quem chama (lê da sessão) e só envia
// colunas editáveis. As validações daqui existem para dar mensagens claras.
import type { SupabaseClient } from "@supabase/supabase-js";
import { usarMocks } from "@/lib/supabase/config";
import { ErroIdentidade } from "./erros";
import { servicoMock } from "./mocks";
import type {
  AtualizacaoPerfil,
  CategoriaServico,
  FotoPortfolio,
  Papel,
  Perfil,
  ServicoIdentidade,
  ServicoPrestadora,
} from "./types";

export { ErroIdentidade, ehErroIdentidade } from "./erros";
export {
  carregarEdicaoPerfil,
  lerEdicaoPerfil,
  sincronizarMeusServicos,
} from "./perfil";

// Qualquer cliente criado por lib/supabase (navegador ou servidor).
export type ClienteSupabase = SupabaseClient;

// Colunas pedidas ao banco: exatamente os campos dos tipos (nada de "*").
export const COLUNAS_PERFIL = [
  "id",
  "papel",
  "nome",
  "avatar_url",
  "bio",
  "cidade",
  "criado_em",
  "atualizado_em",
] as const satisfies readonly (keyof Perfil)[];
export const COLUNAS_CATEGORIA = ["id", "nome"] as const satisfies readonly (keyof CategoriaServico)[];
export const COLUNAS_SERVICO = [
  "prestadora_id",
  "categoria_id",
  "criado_em",
] as const satisfies readonly (keyof ServicoPrestadora)[];
export const COLUNAS_FOTO = [
  "id",
  "prestadora_id",
  "caminho",
  "criada_em",
] as const satisfies readonly (keyof FotoPortfolio)[];

// Únicos campos que atualizarMeuPerfil aceita (iguais a AtualizacaoPerfil).
export const CAMPOS_EDITAVEIS_PERFIL = [
  "nome",
  "avatar_url",
  "bio",
  "cidade",
] as const satisfies readonly (keyof AtualizacaoPerfil)[];

// Valores aceitos em perfis.papel (CHECK da 01).
export const PAPEIS = ["cliente", "prestadora"] as const satisfies readonly Papel[];

export const MAXIMO_IDS_POR_CONSULTA = 100;

const SELECT_PERFIL = COLUNAS_PERFIL.join(", ");
const SELECT_CATEGORIA = COLUNAS_CATEGORIA.join(", ");
const SELECT_SERVICO = COLUNAS_SERVICO.join(", ");
const SELECT_FOTO = COLUNAS_FOTO.join(", ");

// ===========================================================================
// Escolha do modo
// ===========================================================================

export function servicoIdentidade(cliente: ClienteSupabase | null): ServicoIdentidade {
  if (usarMocks) return comValidacao(servicoMock);
  if (!cliente) {
    // Modo real sem cliente: erro de configuração, não motivo para usar mock.
    throw new ErroIdentidade("indisponivel", "Serviço de identidade indisponível.");
  }
  return comValidacao(criarServicoSupabase(cliente));
}

// ===========================================================================
// Validação da entrada (vale para os dois modos)
// ===========================================================================

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// uuid normalizado em minúsculas, ou null se não for um uuid.
function normalizarUuid(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const id = valor.trim().toLowerCase();
  return REGEX_UUID.test(id) ? id : null;
}

function validarCategoriaId(valor: unknown): number {
  if (typeof valor !== "number" || !Number.isSafeInteger(valor) || valor < 1) {
    throw new ErroIdentidade("validacao", "Categoria de serviço inválida.");
  }
  return valor;
}

// char_length do PostgreSQL conta caracteres (code points), não UTF-16.
const tamanho = (texto: string) => [...texto].length;

function textoOpcional(valor: unknown, campo: string, maximo: number): string | null {
  if (valor === null) return null;
  if (typeof valor !== "string") throw new ErroIdentidade("validacao", `${campo} inválido.`);
  const texto = valor.trim();
  if (texto === "") return null;
  if (tamanho(texto) > maximo) {
    throw new ErroIdentidade("validacao", `${campo} pode ter no máximo ${maximo} caracteres.`);
  }
  return texto;
}

// CHECK de perfis.nome na 01: de 1 a 80 caracteres, sem contar espaços nas pontas.
function validarNome(valor: unknown): string {
  const nome = typeof valor === "string" ? valor.trim() : "";
  if (nome === "" || tamanho(nome) > 80) {
    throw new ErroIdentidade("validacao", "O nome deve ter de 1 a 80 caracteres.");
  }
  return nome;
}

function validarPapel(valor: unknown): Papel {
  if (!(PAPEIS as readonly unknown[]).includes(valor)) {
    throw new ErroIdentidade("validacao", "Escolha cliente ou prestadora.");
  }
  return valor as Papel;
}

// Mesmos limites dos CHECKs de perfis na 01.
function validarAtualizacaoPerfil(dados: unknown): AtualizacaoPerfil {
  if (typeof dados !== "object" || dados === null || Array.isArray(dados)) {
    throw new ErroIdentidade("validacao", "Dados do perfil inválidos.");
  }

  const permitidos: readonly string[] = CAMPOS_EDITAVEIS_PERFIL;
  for (const campo of Object.keys(dados)) {
    if (!permitidos.includes(campo)) {
      // Cobre id, papel, criado_em, atualizado_em e qualquer chave estranha.
      throw new ErroIdentidade("validacao", `O campo "${campo}" não pode ser alterado aqui.`);
    }
  }

  const entrada = dados as Record<string, unknown>;
  const saida: AtualizacaoPerfil = {};

  if (entrada.nome !== undefined) saida.nome = validarNome(entrada.nome);

  if (entrada.avatar_url !== undefined) {
    const url = textoOpcional(entrada.avatar_url, "Endereço do avatar", 2048);
    if (url !== null && !/^https?:\/\//.test(url)) {
      throw new ErroIdentidade("validacao", "O avatar precisa de um endereço http ou https.");
    }
    saida.avatar_url = url;
  }

  if (entrada.bio !== undefined) saida.bio = textoOpcional(entrada.bio, "Bio", 500);
  if (entrada.cidade !== undefined) saida.cidade = textoOpcional(entrada.cidade, "Cidade", 100);

  if (Object.keys(saida).length === 0) {
    throw new ErroIdentidade("validacao", "Nada para atualizar.");
  }
  return saida;
}

// Envolve uma implementação (mock ou real) com as mesmas validações, para os
// dois modos aceitarem e recusarem exatamente as mesmas entradas.
function comValidacao(impl: ServicoIdentidade): ServicoIdentidade {
  return {
    async obterPerfil(id) {
      const uuid = normalizarUuid(id);
      return uuid ? impl.obterPerfil(uuid) : null;
    },

    async listarPerfis(ids) {
      if (!Array.isArray(ids)) throw new ErroIdentidade("validacao", "Lista de perfis inválida.");
      const validos = [...new Set(ids.map(normalizarUuid).filter((id): id is string => id !== null))];
      if (validos.length > MAXIMO_IDS_POR_CONSULTA) {
        throw new ErroIdentidade(
          "validacao",
          `Peça no máximo ${MAXIMO_IDS_POR_CONSULTA} perfis por vez.`,
        );
      }
      return validos.length === 0 ? [] : impl.listarPerfis(validos);
    },

    obterMeuPerfil: () => impl.obterMeuPerfil(),

    async atualizarMeuPerfil(dados) {
      return impl.atualizarMeuPerfil(validarAtualizacaoPerfil(dados));
    },

    async escolherMeuPapel(papel, nome) {
      return impl.escolherMeuPapel(validarPapel(papel), validarNome(nome));
    },

    listarCategorias: () => impl.listarCategorias(),

    async listarServicosDaPrestadora(prestadoraId) {
      const uuid = normalizarUuid(prestadoraId);
      return uuid ? impl.listarServicosDaPrestadora(uuid) : [];
    },

    async adicionarMeuServico(categoriaId) {
      return impl.adicionarMeuServico(validarCategoriaId(categoriaId));
    },

    async removerMeuServico(categoriaId) {
      return impl.removerMeuServico(validarCategoriaId(categoriaId));
    },

    async listarFotosDaPrestadora(prestadoraId) {
      const uuid = normalizarUuid(prestadoraId);
      return uuid ? impl.listarFotosDaPrestadora(uuid) : [];
    },
  };
}

// ===========================================================================
// Implementação real (Supabase)
// ===========================================================================

type ErroBanco = { code?: string | null; message?: string | null } | null;

// Traduções específicas de uma operação, por código do banco.
type Traducoes = Partial<Record<string, ErroIdentidade>>;

// Converte o erro do PostgREST num ErroIdentidade com mensagem genérica.
function erroDoBanco(erro: NonNullable<ErroBanco>, traducoes: Traducoes = {}): ErroIdentidade {
  const codigo = erro.code ?? "";
  const traduzido = traducoes[codigo];
  if (traduzido) return new ErroIdentidade(traduzido.codigo, traduzido.message, codigo);

  if (codigo.startsWith("PGRST30")) {
    return new ErroIdentidade("nao_autenticada", "Sua sessão expirou. Entre novamente.", codigo);
  }
  switch (codigo) {
    case "42501":
      return new ErroIdentidade("permissao", "Você não tem permissão para isso.", codigo);
    case "23505":
      return new ErroIdentidade("conflito", "Registro repetido.", codigo);
    case "23503":
    case "23514":
    case "22P02":
    case "22001":
      return new ErroIdentidade("validacao", "Dados inválidos.", codigo);
    case "":
      // Sem código: falha de rede/fetch antes de chegar no banco.
      return new ErroIdentidade("indisponivel", "Não foi possível falar com o servidor.", null);
    default:
      return new ErroIdentidade("desconhecido", "Erro inesperado. Tente de novo.", codigo);
  }
}

// Devolve `data` sem tipo: o formato é fixado pelos conversores abaixo.
function dados(resposta: { data: unknown; error: ErroBanco }, traducoes?: Traducoes): unknown {
  if (resposta.error) throw erroDoBanco(resposta.error, traducoes);
  return resposta.data;
}

// As linhas chegam sem tipo (o cliente não tem o schema gerado); estes
// conversores fixam o formato e garantem as mesmas chaves do modo mock.
type Linha = Record<string, unknown>;
const comoLinhas = (valor: unknown) => (valor ?? []) as Linha[];

const paraPerfil = (l: Linha): Perfil => ({
  id: l.id as string,
  papel: (l.papel ?? null) as Papel | null,
  nome: (l.nome ?? null) as string | null,
  avatar_url: (l.avatar_url ?? null) as string | null,
  bio: (l.bio ?? null) as string | null,
  cidade: (l.cidade ?? null) as string | null,
  criado_em: l.criado_em as string,
  atualizado_em: l.atualizado_em as string,
});

const paraCategoria = (l: Linha): CategoriaServico => ({
  id: Number(l.id),
  nome: l.nome as string,
});

const paraServico = (l: Linha): ServicoPrestadora => ({
  prestadora_id: l.prestadora_id as string,
  categoria_id: Number(l.categoria_id),
  criado_em: l.criado_em as string,
});

const paraFoto = (l: Linha): FotoPortfolio => ({
  id: Number(l.id),
  prestadora_id: l.prestadora_id as string,
  caminho: l.caminho as string,
  criada_em: l.criada_em as string,
});

const TRADUCOES_SERVICO: Traducoes = {
  // 23514 = trigger exigir_prestadora; 42501 = RLS de insert.
  "23514": new ErroIdentidade("permissao", "Só prestadoras podem cadastrar serviços."),
  "42501": new ErroIdentidade("permissao", "Só prestadoras podem cadastrar serviços."),
  "23505": new ErroIdentidade("conflito", "Este serviço já está cadastrado."),
  "23503": new ErroIdentidade("validacao", "Categoria de serviço inexistente."),
};

const TRADUCOES_PERFIL: Traducoes = {
  "23514": new ErroIdentidade("validacao", "Dados do perfil inválidos."),
};

const MENSAGEM_PAPEL_JA_ESCOLHIDO = "Você já escolheu se é cliente ou prestadora.";

const TRADUCOES_PAPEL: Traducoes = {
  ...TRADUCOES_PERFIL,
  // 42501 = trigger perfis_proteger_campos (papel já definido).
  "42501": new ErroIdentidade("conflito", MENSAGEM_PAPEL_JA_ESCOLHIDO),
};

export function criarServicoSupabase(cliente: ClienteSupabase): ServicoIdentidade {
  // Id da usuária vindo de um token com assinatura conferida. getClaims
  // verifica a assinatura com a chave pública do projeto (sem ir à rede a cada
  // chamada; getSession só leria o cookie sem conferir nada). O banco confere
  // o mesmo token de novo em toda consulta (RLS). null = sem sessão válida.
  async function idDaSessao(): Promise<string | null> {
    const { data, error } = await cliente.auth.getClaims();
    if (error) {
      // Qualquer recusa 4xx do Auth (token inválido, refresh token revogado
      // ou já usado, que vem com 400) é sessão inválida, não falha do
      // servidor. 429 (limite de tentativas), 5xx e rede seguem 'indisponivel'.
      const status = (error as { status?: number }).status;
      const recusaDoAuth = typeof status === "number" && status >= 400 && status < 500 && status !== 429;
      const semSessao =
        error.name === "AuthSessionMissingError" ||
        error.name === "AuthInvalidJwtError" ||
        recusaDoAuth;
      if (semSessao) return null;
      throw new ErroIdentidade("indisponivel", "Não foi possível verificar sua sessão.");
    }
    const id = data?.claims?.sub;
    return typeof id === "string" && id !== "" ? id : null;
  }

  async function exigirSessao(): Promise<string> {
    const id = await idDaSessao();
    if (!id) throw new ErroIdentidade("nao_autenticada", "Entre na sua conta para continuar.");
    return id;
  }

  async function buscarPerfil(id: string): Promise<Perfil | null> {
    const linha = dados(
      await cliente.from("perfis").select(SELECT_PERFIL).eq("id", id).maybeSingle(),
    );
    return linha ? paraPerfil(linha as Linha) : null;
  }

  return {
    obterPerfil: buscarPerfil,

    async listarPerfis(ids) {
      const linhas = dados(
        await cliente
          .from("perfis")
          .select(SELECT_PERFIL)
          .in("id", [...ids])
          .order("id", { ascending: true }),
      );
      return comoLinhas(linhas).map(paraPerfil);
    },

    async obterMeuPerfil() {
      const id = await idDaSessao();
      if (!id) return null;
      const perfil = await buscarPerfil(id);
      // O trigger cria o perfil junto com a conta; faltar é inconsistência.
      if (!perfil) throw new ErroIdentidade("nao_encontrado", "Perfil não encontrado.");
      return perfil;
    },

    async atualizarMeuPerfil(alteracoes) {
      const id = await exigirSessao();
      // A RLS (perfis_update_da_dona) também exige id = auth.uid().
      const linha = dados(
        await cliente
          .from("perfis")
          .update(alteracoes)
          .eq("id", id)
          .select(SELECT_PERFIL)
          .maybeSingle(),
        TRADUCOES_PERFIL,
      );
      if (!linha) throw new ErroIdentidade("nao_encontrado", "Perfil não encontrado.");
      return paraPerfil(linha as Linha);
    },

    async escolherMeuPapel(papel, nome) {
      const id = await exigirSessao();
      // O filtro papel is null faz a escolha valer uma vez só, sem depender
      // do erro do trigger perfis_proteger_campos (que também bloqueia).
      const linha = dados(
        await cliente
          .from("perfis")
          .update({ papel, nome })
          .eq("id", id)
          .is("papel", null)
          .select(SELECT_PERFIL)
          .maybeSingle(),
        TRADUCOES_PAPEL,
      );
      if (linha) return paraPerfil(linha as Linha);
      // Nenhuma linha alterada: ou o papel já existia, ou o perfil sumiu.
      if (await buscarPerfil(id)) throw new ErroIdentidade("conflito", MENSAGEM_PAPEL_JA_ESCOLHIDO);
      throw new ErroIdentidade("nao_encontrado", "Perfil não encontrado.");
    },

    async listarCategorias() {
      const linhas = dados(
        await cliente
          .from("categorias_servico")
          .select(SELECT_CATEGORIA)
          .order("nome", { ascending: true }),
      );
      return comoLinhas(linhas).map(paraCategoria);
    },

    async listarServicosDaPrestadora(prestadoraId) {
      const linhas = dados(
        await cliente
          .from("servicos_prestadora")
          .select(SELECT_SERVICO)
          .eq("prestadora_id", prestadoraId)
          .order("categoria_id", { ascending: true }),
      );
      return comoLinhas(linhas).map(paraServico);
    },

    async adicionarMeuServico(categoriaId) {
      const id = await exigirSessao();
      const linha = dados(
        await cliente
          .from("servicos_prestadora")
          .insert({ prestadora_id: id, categoria_id: categoriaId })
          .select(SELECT_SERVICO)
          .single(),
        TRADUCOES_SERVICO,
      );
      return paraServico(linha as Linha);
    },

    async removerMeuServico(categoriaId) {
      const id = await exigirSessao();
      const removidos = dados(
        await cliente
          .from("servicos_prestadora")
          .delete()
          .eq("prestadora_id", id)
          .eq("categoria_id", categoriaId)
          .select("categoria_id"),
      );
      if (comoLinhas(removidos).length === 0) {
        throw new ErroIdentidade("nao_encontrado", "Serviço não encontrado.");
      }
    },

    async listarFotosDaPrestadora(prestadoraId) {
      const linhas = dados(
        await cliente
          .from("fotos_portfolio")
          .select(SELECT_FOTO)
          .eq("prestadora_id", prestadoraId)
          .order("criada_em", { ascending: true })
          .order("id", { ascending: true }),
      );
      return comoLinhas(linhas).map(paraFoto);
    },
  };
}
