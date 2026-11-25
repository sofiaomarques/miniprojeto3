// Envio e remoção de fotos pelo service de identidade,
// nos dois modos: Supabase falso (sem rede) e mock.
import { afterEach, describe, expect, it, vi } from "vitest";
import { argumentos, criarClienteFalso } from "./cliente-falso";
import type { ErroIdentidade } from "../erros";
import { MENSAGENS_FOTO, TAMANHO_MAXIMO_FOTO } from "../fotos";

async function carregar(flag: "true" | "false") {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", flag);
  vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "");
  return { ...(await import("../service")), ...(await import("../mocks")) };
}

afterEach(() => vi.unstubAllEnvs());

async function erroDe(promessa: Promise<unknown>): Promise<ErroIdentidade> {
  try {
    await promessa;
  } catch (erro) {
    return erro as ErroIdentidade;
  }
  throw new Error("era esperado um erro");
}

const EU = "00000000-0000-4000-8000-0000000000a1";
const foto = (type = "image/jpeg", tamanho = 1000) => new Blob([new Uint8Array(tamanho)], { type });
const LINHA = { id: 9, prestadora_id: EU, caminho: `${EU}/x.jpg`, criada_em: "2026-11-24T12:00:00.000Z" };

describe("enviarMinhaFoto: validação (vale para os dois modos)", () => {
  for (const flag of ["true", "false"] as const) {
    it(`USE_MOCKS=${flag}: recusa tipo errado, vazio e acima de 5 MB sem tocar no Storage`, async () => {
      const m = await carregar(flag);
      const f = criarClienteFalso({ usuaria: EU });
      const s = m.servicoIdentidade(f.cliente);
      expect((await erroDe(s.enviarMinhaFoto(foto("image/gif")))).message).toBe(MENSAGENS_FOTO.tipo);
      expect((await erroDe(s.enviarMinhaFoto(foto("image/png", 0)))).message).toBe(MENSAGENS_FOTO.vazia);
      expect((await erroDe(s.enviarMinhaFoto(foto("image/png", TAMANHO_MAXIMO_FOTO + 1)))).message).toBe(
        MENSAGENS_FOTO.grande,
      );
      expect((await erroDe(s.enviarMinhaFoto(null as unknown as Blob))).codigo).toBe("validacao");
      expect(f.armazenamento).toHaveLength(0);
      expect(f.consultas).toHaveLength(0);
    });
  }
});

describe("enviarMinhaFoto: modo real (Supabase falso)", () => {
  it("sobe na pasta da usuária, sem sobrescrever, e registra em fotos_portfolio", async () => {
    const m = await carregar("false");
    const f = criarClienteFalso({ usuaria: EU, responder: () => ({ data: LINHA, error: null }) });
    const arquivo = foto("image/png");
    expect(await m.servicoIdentidade(f.cliente).enviarMinhaFoto(arquivo)).toEqual(LINHA);

    const [envio] = f.armazenamento;
    expect(envio.bucket).toBe("portfolio");
    expect(envio.operacao).toBe("upload");
    const [caminho, enviado, opcoes] = envio.args as [string, Blob, object];
    expect(caminho).toMatch(new RegExp(`^${EU}/[0-9a-f-]{36}\\.png$`));
    expect(enviado).toBe(arquivo);
    expect(opcoes).toEqual({ contentType: "image/png", upsert: false });

    const [insercao] = f.consultas;
    expect(insercao.tabela).toBe("fotos_portfolio");
    expect(argumentos(insercao, "insert")).toEqual([[{ prestadora_id: EU, caminho }]]);
  });

  it("sem sessão: nao_autenticada, sem tocar no Storage", async () => {
    const m = await carregar("false");
    const f = criarClienteFalso({ usuaria: null });
    expect((await erroDe(m.servicoIdentidade(f.cliente).enviarMinhaFoto(foto()))).codigo).toBe("nao_autenticada");
    expect(f.armazenamento).toHaveLength(0);
  });

  it.each([
    [413, "validacao", MENSAGENS_FOTO.grande],
    [415, "validacao", MENSAGENS_FOTO.tipo],
    [403, "permissao", undefined],
    [500, "indisponivel", undefined],
  ])("erro %i do Storage vira %s, sem registrar no banco", async (status, codigo, mensagem) => {
    const m = await carregar("false");
    const f = criarClienteFalso({
      usuaria: EU,
      responderStorage: () => ({ data: null, error: { statusCode: String(status), message: "cru" } }),
    });
    const erro = await erroDe(m.servicoIdentidade(f.cliente).enviarMinhaFoto(foto()));
    expect(erro.codigo).toBe(codigo);
    if (mensagem) expect(erro.message).toBe(mensagem);
    expect(erro.message).not.toContain("cru");
    expect(f.consultas).toHaveLength(0);
  });

  it("se o registro no banco falhar, apaga o arquivo que acabou de subir", async () => {
    const m = await carregar("false");
    const f = criarClienteFalso({
      usuaria: EU,
      responder: () => ({ data: null, error: { code: "23514", message: "perfil não é prestadora" } }),
    });
    const erro = await erroDe(m.servicoIdentidade(f.cliente).enviarMinhaFoto(foto()));
    expect(erro.codigo).toBe("permissao");
    expect(f.armazenamento.map((c) => c.operacao)).toEqual(["upload", "remove"]);
    const caminhoEnviado = (f.armazenamento[0].args as [string])[0];
    expect(f.armazenamento[1].args).toEqual([[caminhoEnviado]]);
  });
});

describe("enviarMinhaFoto: modo mock", () => {
  it("prestadora envia e a foto aparece na galeria dela", async () => {
    const m = await carregar("true");
    m.redefinirMocks();
    m.definirUsuariaMock(m.ID_PRESTADORA_JOANA); // tem 1 foto
    const s = m.servicoIdentidade(null);
    const nova = await s.enviarMinhaFoto(foto("image/webp"));
    expect(nova.caminho).toMatch(new RegExp(`^${m.ID_PRESTADORA_JOANA}/.+\\.webp$`));
    expect((await s.listarFotosDaPrestadora(m.ID_PRESTADORA_JOANA)).map((x) => x.id)).toContain(nova.id);
  });

  it("cliente não envia foto (permissao)", async () => {
    const m = await carregar("true");
    m.redefinirMocks();
    m.definirUsuariaMock(m.ID_CLIENTE_BEATRIZ);
    expect((await erroDe(m.servicoIdentidade(null).enviarMinhaFoto(foto()))).codigo).toBe("permissao");
  });
});

describe("apagarMinhaFoto: validação", () => {
  for (const flag of ["true", "false"] as const) {
    it(`USE_MOCKS=${flag}: id inválido é recusado sem tocar no banco nem no Storage`, async () => {
      const m = await carregar(flag);
      const f = criarClienteFalso({ usuaria: EU });
      const s = m.servicoIdentidade(f.cliente);
      for (const id of [0, -1, 1.5, Number.NaN, "3"] as unknown as number[]) {
        expect((await erroDe(s.apagarMinhaFoto(id))).codigo).toBe("validacao");
      }
      expect(f.consultas).toHaveLength(0);
      expect(f.armazenamento).toHaveLength(0);
    });
  }
});

describe("apagarMinhaFoto: modo real (Supabase falso)", () => {
  it("só acha a foto da própria usuária e apaga o arquivo ANTES da linha (#46)", async () => {
    const m = await carregar("false");
    const ordem: string[] = [];
    let consulta = 0;
    const f = criarClienteFalso({
      usuaria: EU,
      responder: () => {
        ordem.push(consulta === 0 ? "banco:ler" : "banco:apagar");
        return consulta++ === 0 ? { data: LINHA, error: null } : { data: [{ id: 9 }], error: null };
      },
      responderStorage: (op) => {
        ordem.push(`storage:${op}`);
        return { data: [], error: null };
      },
    });
    await m.servicoIdentidade(f.cliente).apagarMinhaFoto(9);
    expect(ordem).toEqual(["banco:ler", "storage:remove", "banco:apagar"]);
    expect(argumentos(f.consultas[0], "eq")).toEqual([["id", 9], ["prestadora_id", EU]]);
    expect(f.armazenamento[0].args).toEqual([[LINHA.caminho]]);
    expect(argumentos(f.consultas[1], "eq")).toEqual([["id", 9], ["prestadora_id", EU]]);
  });

  it("foto de outra pessoa (ou inexistente): nao_encontrado, sem apagar nada", async () => {
    const m = await carregar("false");
    const f = criarClienteFalso({ usuaria: EU, responder: () => ({ data: null, error: null }) });
    expect((await erroDe(m.servicoIdentidade(f.cliente).apagarMinhaFoto(9))).codigo).toBe("nao_encontrado");
    expect(f.armazenamento).toHaveLength(0);
    expect(f.consultas).toHaveLength(1);
  });

  it("se o Storage falhar, a linha fica (a foto continua na galeria)", async () => {
    const m = await carregar("false");
    const f = criarClienteFalso({
      usuaria: EU,
      responder: () => ({ data: LINHA, error: null }),
      responderStorage: () => ({ data: null, error: { statusCode: "500", message: "cru" } }),
    });
    const erro = await erroDe(m.servicoIdentidade(f.cliente).apagarMinhaFoto(9));
    expect(erro.codigo).toBe("indisponivel");
    expect(erro.message).not.toContain("cru");
    expect(f.consultas).toHaveLength(1); // só a leitura; nenhum delete
  });

  it("sem sessão: nao_autenticada", async () => {
    const m = await carregar("false");
    const f = criarClienteFalso({ usuaria: null });
    expect((await erroDe(m.servicoIdentidade(f.cliente).apagarMinhaFoto(9))).codigo).toBe("nao_autenticada");
  });
});

describe("apagarMinhaFoto: modo mock", () => {
  it("a dona apaga a própria foto; outra prestadora não consegue", async () => {
    const m = await carregar("true");
    m.redefinirMocks();
    m.definirUsuariaMock(m.ID_PRESTADORA_CAMILA);
    expect((await erroDe(m.servicoIdentidade(null).apagarMinhaFoto(1))).codigo).toBe("nao_encontrado"); // foto 1 é da Marina
    m.definirUsuariaMock(m.ID_PRESTADORA_MARINA);
    await m.servicoIdentidade(null).apagarMinhaFoto(1);
    expect((await m.servicoIdentidade(null).listarFotosDaPrestadora(m.ID_PRESTADORA_MARINA)).map((x) => x.id)).toEqual([2]);
  });
});
