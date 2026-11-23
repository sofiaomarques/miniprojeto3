// escolherMeuPapel (onboarding, #14) nos dois modos: mesmo contrato e
// mesmas recusas.
import { afterEach, describe, expect, it, vi } from "vitest";
import { argumentos, criarClienteFalso, metodos } from "./cliente-falso";
import type { ErroIdentidade } from "../erros";

async function carregar(flag: "true" | "false") {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", flag);
  vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "");
  return { ...(await import("../service")), ...(await import("../mocks")) };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

async function erroDe(promessa: Promise<unknown>): Promise<ErroIdentidade> {
  try {
    await promessa;
  } catch (erro) {
    return erro as ErroIdentidade;
  }
  throw new Error("era esperado um erro");
}

const EU = "00000000-0000-4000-8000-0000000000d1";
const LINHA = {
  id: EU,
  papel: "cliente",
  nome: "Ana",
  avatar_url: null,
  bio: null,
  cidade: null,
  criado_em: "2026-11-23T12:00:00.000Z",
  atualizado_em: "2026-11-23T12:00:00.000Z",
};

describe("validação (vale para os dois modos)", () => {
  for (const flag of ["true", "false"] as const) {
    it(`USE_MOCKS=${flag}: recusa papel inválido e nome vazio sem tocar no banco`, async () => {
      const m = await carregar(flag);
      const f = criarClienteFalso({ usuaria: EU });
      const s = m.servicoIdentidade(f.cliente);
      for (const papel of ["admin", "", null, "Cliente"] as unknown as "cliente"[]) {
        expect((await erroDe(s.escolherMeuPapel(papel, "Ana"))).codigo).toBe("validacao");
      }
      for (const nome of ["", "   ", "a".repeat(81), null] as unknown as string[]) {
        expect((await erroDe(s.escolherMeuPapel("cliente", nome))).codigo).toBe("validacao");
      }
      expect(f.consultas).toHaveLength(0);
    });
  }
});

describe("modo real (Supabase)", () => {
  it("grava papel e nome (aparado) só no próprio perfil e só se o papel ainda é null", async () => {
    const m = await carregar("false");
    const f = criarClienteFalso({ usuaria: EU, responder: () => ({ data: LINHA, error: null }) });
    const perfil = await m.servicoIdentidade(f.cliente).escolherMeuPapel("cliente", "  Ana  ");
    expect(perfil).toEqual(LINHA);
    const [c] = f.consultas;
    expect(c.tabela).toBe("perfis");
    expect(argumentos(c, "update")).toEqual([[{ papel: "cliente", nome: "Ana" }]]);
    expect(argumentos(c, "eq")).toEqual([["id", EU]]);
    expect(argumentos(c, "is")).toEqual([["papel", null]]);
    expect(metodos(c)).toContain("maybeSingle");
  });

  it("sem sessão: nao_autenticada, sem consultar perfis", async () => {
    const m = await carregar("false");
    const f = criarClienteFalso({ usuaria: null });
    const erro = await erroDe(m.servicoIdentidade(f.cliente).escolherMeuPapel("cliente", "Ana"));
    expect(erro.codigo).toBe("nao_autenticada");
    expect(f.consultas).toHaveLength(0);
  });

  it("papel já escolhido (nenhuma linha alterada, perfil existe): conflito", async () => {
    const m = await carregar("false");
    let consulta = 0;
    const f = criarClienteFalso({
      usuaria: EU,
      // 1ª: update não altera nada; 2ª: o perfil existe.
      responder: () => (consulta++ === 0 ? { data: null, error: null } : { data: LINHA, error: null }),
    });
    const erro = await erroDe(m.servicoIdentidade(f.cliente).escolherMeuPapel("prestadora", "Ana"));
    expect(erro.codigo).toBe("conflito");
    expect(erro.message).toBe("Você já escolheu se é cliente ou prestadora.");
  });

  it("nenhuma linha alterada e perfil inexistente: nao_encontrado", async () => {
    const m = await carregar("false");
    const f = criarClienteFalso({ usuaria: EU, responder: () => ({ data: null, error: null }) });
    const erro = await erroDe(m.servicoIdentidade(f.cliente).escolherMeuPapel("cliente", "Ana"));
    expect(erro.codigo).toBe("nao_encontrado");
  });

  it("erro 42501 do trigger (papel já definido) também vira conflito", async () => {
    const m = await carregar("false");
    const f = criarClienteFalso({
      usuaria: EU,
      responder: () => ({ data: null, error: { code: "42501", message: "papel já foi definido" } }),
    });
    const erro = await erroDe(m.servicoIdentidade(f.cliente).escolherMeuPapel("cliente", "Ana"));
    expect(erro.codigo).toBe("conflito");
    expect(erro.message).not.toContain("definido");
  });
});

describe("modo mock", () => {
  it("a conta sem papel escolhe uma vez; a segunda tentativa dá conflito", async () => {
    const m = await carregar("true");
    m.redefinirMocks();
    m.definirUsuariaMock(m.ID_SEM_PAPEL);
    const s = m.servicoIdentidade(null);

    const perfil = await s.escolherMeuPapel("prestadora", " Nova ");
    expect(perfil).toMatchObject({ id: m.ID_SEM_PAPEL, papel: "prestadora", nome: "Nova" });
    expect((await s.obterMeuPerfil())?.papel).toBe("prestadora");

    expect((await erroDe(s.escolherMeuPapel("cliente", "Nova"))).codigo).toBe("conflito");
    expect((await s.obterMeuPerfil())?.papel).toBe("prestadora");
  });

  it("deslogada: nao_autenticada", async () => {
    const m = await carregar("true");
    m.redefinirMocks();
    m.definirUsuariaMock(null);
    const erro = await erroDe(m.servicoIdentidade(null).escolherMeuPapel("cliente", "Ana"));
    expect(erro.codigo).toBe("nao_autenticada");
  });
});
