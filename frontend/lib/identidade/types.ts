// Contrato de identidade (P1) usado por P2 e P3. Espelha
// supabase/migrations/01_identidade.sql: mesmos nomes de coluna (snake_case),
// mesmos tipos e mesmos nulos. uuid, text e timestamptz chegam como string
// (datas em ISO 8601); bigint chega como number.
//
// Importe sempre daqui (não redefina estes tipos em outra pasta):
//   import type { Perfil, FotoPortfolio } from "@/lib/identidade/types";

// null até o onboarding (#14) escolher; depois disso não muda pelo app.
export type Papel = "cliente" | "prestadora";

// Uma linha de `perfis` (uma por conta do Supabase Auth).
export type Perfil = {
  id: string; // uuid = auth.users.id
  papel: Papel | null;
  nome: string | null; // obrigatório quando papel não é null
  avatar_url: string | null;
  bio: string | null;
  cidade: string | null;
  criado_em: string;
  atualizado_em: string;
};

// Uma linha de `categorias_servico` (catálogo fixo, só leitura para o app).
export type CategoriaServico = {
  id: number;
  nome: string;
};

// Uma linha de `servicos_prestadora` (prestadora × categoria).
export type ServicoPrestadora = {
  prestadora_id: string;
  categoria_id: number;
  criado_em: string;
};

// Uma linha de `fotos_portfolio`. `caminho` é o caminho no bucket
// `portfolio` ('<prestadora_id>/<arquivo>'); o arquivo fica no Storage.
export type FotoPortfolio = {
  id: number;
  prestadora_id: string;
  caminho: string;
  criada_em: string;
};

// Campos que a dona pode editar no próprio perfil. Fora daqui, de propósito:
//   id, criado_em, atualizado_em: nunca mudam pelo app (trigger da 01);
//   papel: escolhido uma única vez no onboarding (#14), não na edição.
// nome não aceita null: quem já tem papel precisa de nome.
export type AtualizacaoPerfil = {
  nome?: string;
  avatar_url?: string | null;
  bio?: string | null;
  cidade?: string | null;
};

export type CodigoErroIdentidade =
  | "nao_autenticada" // sem sessão válida
  | "nao_encontrado" // registro não existe (ou a RLS não deixa ver/alterar)
  | "validacao" // entrada inválida ou campo protegido
  | "permissao" // a conta não pode fazer isso (RLS, GRANT ou trigger)
  | "conflito" // registro repetido
  | "indisponivel" // Supabase fora do ar, sem rede ou sem cliente
  | "desconhecido";

// Operações de identidade. O modo mock e o modo real implementam este mesmo
// contrato; as telas não sabem qual dos dois estão usando.
export type ServicoIdentidade = {
  // Pela RLS da 01, só prestadoras são públicas: o perfil de uma cliente ou de
  // conta sem papel só aparece para a própria dona.
  // null quando o perfil não existe, não é visível ou o id não é um uuid.
  obterPerfil(id: string): Promise<Perfil | null>;
  // Ignora ids inexistentes, invisíveis ou inválidos; ordem por id. Máximo 100 ids.
  listarPerfis(ids: readonly string[]): Promise<Perfil[]>;
  // null quando não há usuária autenticada.
  obterMeuPerfil(): Promise<Perfil | null>;
  // Só altera o perfil da usuária autenticada.
  atualizarMeuPerfil(dados: AtualizacaoPerfil): Promise<Perfil>;
  // Onboarding (#14): grava papel e nome de uma vez, só enquanto o papel é
  // null. Depois disso falha com "conflito" (o papel não muda pelo app).
  escolherMeuPapel(papel: Papel, nome: string): Promise<Perfil>;
  // Ordem alfabética.
  listarCategorias(): Promise<CategoriaServico[]>;
  // Ordem por categoria_id.
  listarServicosDaPrestadora(prestadoraId: string): Promise<ServicoPrestadora[]>;
  // Só a prestadora autenticada, para ela mesma.
  adicionarMeuServico(categoriaId: number): Promise<ServicoPrestadora>;
  removerMeuServico(categoriaId: number): Promise<void>;
  // Ordem de envio (criada_em, depois id).
  listarFotosDaPrestadora(prestadoraId: string): Promise<FotoPortfolio[]>;
  // #17: só a prestadora autenticada, na própria galeria. Sobe o arquivo
  // para o bucket `portfolio` e registra em fotos_portfolio.
  enviarMinhaFoto(arquivo: Blob): Promise<FotoPortfolio>;
};
