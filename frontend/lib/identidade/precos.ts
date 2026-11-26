// Preço base e negociação de cada serviço da prestadora (05_precos_servicos.sql).
// Arquivo próprio, ao lado do service.ts: mesmo padrão (modo mock e modo real
// com o mesmo contrato, ErroIdentidade com mensagem segura), sem mexer no
// contrato ServicoIdentidade.
//
// Uso:
//   const precos = servicoPrecos(await criarClienteServidor()); // ou do navegador
//   await precos.listarPrecos({ prestadoraId });
//   await precos.salvarMeusPrecos([{ categoria_id: 3, preco_base: 120, aceita_negociar: true }]);
//
// Segurança: quem decide é o banco (RLS servicos_update_da_dona e GRANT de
// update só em preco_base e aceita_negociar). O id da dona vem da sessão,
// nunca de argumento.
import { usarMocks } from "@/lib/supabase/config";
import { PRECO_MAXIMO, PRECO_MINIMO } from "./dinheiro";
import { ErroIdentidade } from "./erros";
import { servicoPrecosMock } from "./precos-mock";
import { criarServicoSupabase, type ClienteSupabase } from "./service";

// Uma linha de servicos_prestadora, só com o que interessa ao preço.
export type PrecoServico = {
  prestadora_id: string;
  categoria_id: number;
  preco_base: number | null; // null = "a combinar"
  aceita_negociar: boolean;
};

export type AlteracaoPreco = Omit<PrecoServico, "prestadora_id">;

export type FiltroPrecos = {
  prestadoraId?: string;
  categoriaId?: number;
};

export type ServicoPrecos = {
  // Leitura pública (a lista de serviços já é pública na 01). Sem filtro,
  // todos os serviços de todas as prestadoras. Ordem: prestadora, categoria.
  listarPrecos(filtro?: FiltroPrecos): Promise<PrecoServico[]>;
  // Só a prestadora logada, só em serviços que ela já tem. Devolve as linhas
  // gravadas. Serviço que não é dela (ou que saiu) → "nao_encontrado".
  salvarMeusPrecos(alteracoes: readonly AlteracaoPreco[]): Promise<PrecoServico[]>;
};

export const COLUNAS_PRECO = [
  "prestadora_id",
  "categoria_id",
  "preco_base",
  "aceita_negociar",
] as const satisfies readonly (keyof PrecoServico)[];
const SELECT_PRECO = COLUNAS_PRECO.join(", ");

// Uma prestadora tem no máximo as 8 categorias do catálogo; folga para crescer.
export const MAXIMO_PRECOS_POR_ENVIO = 50;

export function servicoPrecos(cliente: ClienteSupabase | null): ServicoPrecos {
  if (usarMocks) return comValidacao(servicoPrecosMock);
  if (!cliente) throw new ErroIdentidade("indisponivel", "Serviço de identidade indisponível.");
  return comValidacao(criarServicoPrecosSupabase(cliente));
}

// ===========================================================================
// Validação (vale para os dois modos)
// ===========================================================================

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function idPositivo(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isSafeInteger(valor) && valor > 0;
}

// Mesma faixa e mesmas 2 casas do numeric(10,2) da 05: o banco arredondaria
// 150,555 sem avisar, então aqui é recusado.
export function validarAlteracao(valor: unknown): AlteracaoPreco {
  if (typeof valor !== "object" || valor === null) {
    throw new ErroIdentidade("validacao", "Preço inválido.");
  }
  const { categoria_id, preco_base, aceita_negociar } = valor as Record<string, unknown>;
  if (!idPositivo(categoria_id)) throw new ErroIdentidade("validacao", "Categoria de serviço inválida.");
  if (typeof aceita_negociar !== "boolean") throw new ErroIdentidade("validacao", "Preço inválido.");
  if (preco_base !== null) {
    const ok =
      typeof preco_base === "number" &&
      Number.isFinite(preco_base) &&
      preco_base >= PRECO_MINIMO &&
      preco_base <= PRECO_MAXIMO &&
      Math.abs(Math.round(preco_base * 100) - preco_base * 100) < 1e-6;
    if (!ok) {
      throw new ErroIdentidade(
        "validacao",
        "O preço precisa ser de R$ 0,01 a R$ 99.999,99, com no máximo 2 casas.",
      );
    }
  }
  return {
    categoria_id,
    preco_base: preco_base === null ? null : Math.round((preco_base as number) * 100) / 100,
    // Sem preço é "a combinar": não há valor para negociar.
    aceita_negociar: preco_base === null ? false : aceita_negociar,
  };
}

function comValidacao(impl: ServicoPrecos): ServicoPrecos {
  return {
    async listarPrecos(filtro = {}) {
      const saida: FiltroPrecos = {};
      if (filtro.prestadoraId !== undefined) {
        const id = typeof filtro.prestadoraId === "string" ? filtro.prestadoraId.trim().toLowerCase() : "";
        if (!REGEX_UUID.test(id)) return []; // como obterPerfil: id inválido não existe
        saida.prestadoraId = id;
      }
      if (filtro.categoriaId !== undefined) {
        if (!idPositivo(filtro.categoriaId)) return [];
        saida.categoriaId = filtro.categoriaId;
      }
      return impl.listarPrecos(saida);
    },

    async salvarMeusPrecos(alteracoes) {
      if (!Array.isArray(alteracoes)) throw new ErroIdentidade("validacao", "Lista de preços inválida.");
      if (alteracoes.length > MAXIMO_PRECOS_POR_ENVIO) {
        throw new ErroIdentidade("validacao", "Preços demais num envio só.");
      }
      const validas = alteracoes.map(validarAlteracao);
      const categorias = new Set(validas.map((a) => a.categoria_id));
      if (categorias.size !== validas.length) {
        throw new ErroIdentidade("validacao", "Serviço repetido na lista de preços.");
      }
      return validas.length === 0 ? [] : impl.salvarMeusPrecos(validas);
    },
  };
}

// ===========================================================================
// Implementação real (Supabase)
// ===========================================================================

type ErroBanco = { code?: string | null; message?: string | null } | null;

function erroDoBanco(erro: NonNullable<ErroBanco>): ErroIdentidade {
  const codigo = erro.code ?? "";
  if (codigo.startsWith("PGRST30")) {
    return new ErroIdentidade("nao_autenticada", "Sua sessão expirou. Entre novamente.", codigo);
  }
  switch (codigo) {
    case "42501":
      return new ErroIdentidade("permissao", "Só prestadoras podem definir preços.", codigo);
    case "23514":
    case "22P02":
    case "22003":
      return new ErroIdentidade("validacao", "Preço inválido.", codigo);
    case "":
      return new ErroIdentidade("indisponivel", "Não foi possível falar com o servidor.", null);
    default:
      return new ErroIdentidade("desconhecido", "Erro inesperado. Tente de novo.", codigo);
  }
}

function dados(resposta: { data: unknown; error: ErroBanco }): unknown {
  if (resposta.error) throw erroDoBanco(resposta.error);
  return resposta.data;
}

// numeric chega do PostgREST como número JSON; Number() garante o tipo mesmo
// se vier como texto (como o paraResumo da descoberta faz com nota_media).
const paraPreco = (l: Record<string, unknown>): PrecoServico => ({
  prestadora_id: l.prestadora_id as string,
  categoria_id: Number(l.categoria_id),
  preco_base: l.preco_base === null || l.preco_base === undefined ? null : Number(l.preco_base),
  aceita_negociar: l.aceita_negociar === true,
});

export function criarServicoPrecosSupabase(cliente: ClienteSupabase): ServicoPrecos {
  const identidade = criarServicoSupabase(cliente);

  // Perfil da sessão (getClaims com assinatura conferida, no service.ts).
  async function exigirPrestadora(): Promise<string> {
    const perfil = await identidade.obterMeuPerfil();
    if (!perfil) throw new ErroIdentidade("nao_autenticada", "Entre na sua conta para continuar.");
    if (perfil.papel !== "prestadora") {
      throw new ErroIdentidade("permissao", "Só prestadoras podem definir preços.");
    }
    return perfil.id;
  }

  return {
    async listarPrecos(filtro = {}) {
      let consulta = cliente.from("servicos_prestadora").select(SELECT_PRECO);
      if (filtro.prestadoraId) consulta = consulta.eq("prestadora_id", filtro.prestadoraId);
      if (filtro.categoriaId) consulta = consulta.eq("categoria_id", filtro.categoriaId);
      const linhas = dados(
        await consulta
          .order("prestadora_id", { ascending: true })
          .order("categoria_id", { ascending: true }),
      );
      return ((linhas ?? []) as Record<string, unknown>[]).map(paraPreco);
    },

    async salvarMeusPrecos(alteracoes) {
      const id = await exigirPrestadora();
      const salvos: PrecoServico[] = [];
      // Um update por serviço (no máximo 8 categorias). A RLS também exige
      // prestadora_id = auth.uid(); linha que não é dela volta vazia, sem erro.
      for (const { categoria_id, preco_base, aceita_negociar } of alteracoes) {
        const linha = dados(
          await cliente
            .from("servicos_prestadora")
            .update({ preco_base, aceita_negociar })
            .eq("prestadora_id", id)
            .eq("categoria_id", categoria_id)
            .select(SELECT_PRECO)
            .maybeSingle(),
        );
        if (!linha) {
          throw new ErroIdentidade(
            "nao_encontrado",
            "Um dos serviços não está mais no seu perfil. Recarregue a página.",
          );
        }
        salvos.push(paraPreco(linha as Record<string, unknown>));
      }
      return salvos;
    },
  };
}
