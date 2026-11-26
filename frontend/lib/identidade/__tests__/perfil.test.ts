// Edição do perfil (#16): leitura do formulário, diferença de categorias e o
// caminho completo pelo service no modo mock.
import { afterEach, describe, expect, it, vi } from "vitest";
import { carregarEdicaoPerfil, diferencaCategorias, lerEdicaoPerfil } from "../perfil";

function formulario(campos: [string, string][]): FormData {
  const form = new FormData();
  for (const [chave, valor] of campos) form.append(chave, valor);
  return form;
}

describe("lerEdicaoPerfil", () => {
  it("lê nome, bio, cidade e categorias marcadas", () => {
    const r = lerEdicaoPerfil(
      formulario([
        ["nome", "Ana Souza"],
        ["bio", "  Eletricista há 10 anos.  "],
        ["cidade", " João Pessoa "],
        ["categorias", "2"],
        ["categorias", "3"],
      ]),
    );
    expect(r).toEqual({
      dados: { nome: "Ana Souza", bio: "Eletricista há 10 anos.", cidade: "João Pessoa" },
      categorias: [2, 3],
    });
  });

  it("bio e cidade vazias viram null (apagam o valor)", () => {
    const r = lerEdicaoPerfil(formulario([["nome", "Ana"], ["bio", "   "], ["cidade", ""]]));
    expect(r.dados).toEqual({ nome: "Ana", bio: null, cidade: null });
  });

  it("ignora categoria repetida ou inválida", () => {
    const r = lerEdicaoPerfil(
      formulario([
        ["categorias", "1"],
        ["categorias", "1"],
        ["categorias", "abc"],
        ["categorias", "-2"],
        ["categorias", "1.5"],
      ]),
    );
    expect(r.categorias).toEqual([1]);
  });

  it("sem campos não lança erro (o service recusa o nome vazio)", () => {
    expect(lerEdicaoPerfil(new FormData())).toEqual({
      dados: { nome: "", bio: null, cidade: null },
      categorias: [],
    });
  });
});

describe("diferencaCategorias", () => {
  it("adiciona as novas e remove as desmarcadas", () => {
    expect(diferencaCategorias([1, 2, 3], [2, 3, 5])).toEqual({ adicionar: [5], remover: [1] });
  });

  it("nada muda quando é igual (em qualquer ordem)", () => {
    expect(diferencaCategorias([3, 1], [1, 3])).toEqual({ adicionar: [], remover: [] });
  });

  it("desmarcar tudo remove tudo", () => {
    expect(diferencaCategorias([4, 1], [])).toEqual({ adicionar: [], remover: [1, 4] });
  });
});

describe("salvar pelo service (modo mock)", () => {
  afterEach(() => vi.unstubAllEnvs());

  async function carregar() {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "");
    return { ...(await import("../service")), ...(await import("../mocks")) };
  }

  it("prestadora atualiza dados e troca categorias", async () => {
    const m = await carregar();
    m.redefinirMocks();
    m.definirUsuariaMock(m.ID_PRESTADORA_ALINE); // começa com 2 e 3
    const s = m.servicoIdentidade(null);

    const { dados, categorias } = lerEdicaoPerfil(
      formulario([
        ["nome", "Aline C."],
        ["cidade", "Recife"],
        ["bio", ""],
        ["categorias", "3"],
        ["categorias", "6"],
      ]),
    );
    await s.atualizarMeuPerfil(dados);
    await m.sincronizarMeusServicos(s, m.ID_PRESTADORA_ALINE, categorias);

    expect(await s.obterMeuPerfil()).toMatchObject({ nome: "Aline C.", cidade: "Recife", bio: null });
    expect((await s.listarServicosDaPrestadora(m.ID_PRESTADORA_ALINE)).map((x) => x.categoria_id)).toEqual([3, 6]);
  });

  it("sincronizar é idempotente: serviço que já entrou ou já saiu não vira erro", async () => {
    const m = await carregar();
    m.redefinirMocks();
    m.definirUsuariaMock(m.ID_PRESTADORA_ALINE); // começa com 2 e 3
    const s = m.servicoIdentidade(null);
    // Outra aba já fez a mesma troca depois que esta leu a lista: a leitura
    // velha ([2, 3]) manda adicionar 6 (já existe) e remover 2 (já saiu).
    const leituraVelha = await s.listarServicosDaPrestadora(m.ID_PRESTADORA_ALINE);
    await m.sincronizarMeusServicos(s, m.ID_PRESTADORA_ALINE, [3, 6]);
    const atrasada = { ...s, listarServicosDaPrestadora: async () => leituraVelha };
    await expect(
      m.sincronizarMeusServicos(atrasada, m.ID_PRESTADORA_ALINE, [3, 6]),
    ).resolves.toBeUndefined();
    expect((await s.listarServicosDaPrestadora(m.ID_PRESTADORA_ALINE)).map((x) => x.categoria_id)).toEqual([3, 6]);
  });

  it("sincronizar repassa erros que não são de repetição", async () => {
    const m = await carregar();
    m.redefinirMocks();
    m.definirUsuariaMock(m.ID_PRESTADORA_ALINE);
    const s = m.servicoIdentidade(null);
    await expect(m.sincronizarMeusServicos(s, m.ID_PRESTADORA_ALINE, [9999])).rejects.toMatchObject({
      codigo: "validacao",
    });
  });

  it("nome vazio é recusado pelo service antes de gravar", async () => {
    const m = await carregar();
    m.redefinirMocks();
    m.definirUsuariaMock(m.ID_PRESTADORA_ALINE);
    const { dados } = lerEdicaoPerfil(formulario([["nome", "   "]]));
    await expect(m.servicoIdentidade(null).atualizarMeuPerfil(dados)).rejects.toMatchObject({
      codigo: "validacao",
    });
    expect((await m.servicoIdentidade(null).obterMeuPerfil())?.nome).toBe("Aline Costa");
  });
});

describe("carregarEdicaoPerfil", () => {
  const falha = () => Promise.reject(new Error("não devia chamar"));

  it("cliente não busca catálogo nem serviços", async () => {
    const r = await carregarEdicaoPerfil(
      { listarCategorias: falha, listarServicosDaPrestadora: falha },
      { id: "x", papel: "cliente" },
    );
    expect(r).toEqual({ categorias: [], marcadas: [] });
  });

  it("prestadora recebe o catálogo e as categorias marcadas", async () => {
    const r = await carregarEdicaoPerfil(
      {
        listarCategorias: async () => [{ id: 1, nome: "Elétrica" }],
        listarServicosDaPrestadora: async () => [{ prestadora_id: "x", categoria_id: 1, criado_em: "2026-01-01" }],
      },
      { id: "x", papel: "prestadora" },
    );
    expect(r).toEqual({ categorias: [{ id: 1, nome: "Elétrica" }], marcadas: [1] });
  });
});
