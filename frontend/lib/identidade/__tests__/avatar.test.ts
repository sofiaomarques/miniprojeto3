// Avatar (#18) pelo service de identidade, nos dois modos: Supabase falso
// (sem rede) e mock.
import { afterEach, describe, expect, it, vi } from "vitest";
import { argumentos, criarClienteFalso } from "./cliente-falso";
import type { ErroIdentidade } from "../erros";
import { MENSAGEM_AVATAR_GRANDE, MENSAGENS_FOTO, TAMANHO_MAXIMO_AVATAR } from "../fotos";

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

const EU = "00000000-0000-4000-8000-0000000000c1";
const BASE = "https://exemplo.supabase.co/storage/v1/object/public/avatares/";
const ANTIGO = `${EU}/0f8fad5b-d9cb-469f-a165-70867728950e.png`;
const perfil = (avatar_url: string | null) => ({
  id: EU,
  papel: "cliente",
  nome: "Beatriz",
  avatar_url,
  bio: null,
  cidade: null,
  criado_em: "2026-11-24T12:00:00.000Z",
  atualizado_em: "2026-11-24T12:00:00.000Z",
});
const foto = (type = "image/png", tamanho = 1000) => new Blob([new Uint8Array(tamanho)], { type });

// 1ª consulta: perfil antes da troca; 2ª: o update devolve o perfil novo.
function respostas(antes: string | null) {
  let n = 0;
  return () => {
    n++;
    if (n === 1) return { data: perfil(antes), error: null };
    return { data: perfil(`${BASE}novo`), error: null };
  };
}

describe("enviarMeuAvatar: validação (vale para os dois modos)", () => {
  for (const flag of ["true", "false"] as const) {
    it(`USE_MOCKS=${flag}: tipo errado, vazio e acima de 2 MB são recusados sem tocar em nada`, async () => {
      const m = await carregar(flag);
      const f = criarClienteFalso({ usuaria: EU });
      const s = m.servicoIdentidade(f.cliente);
      expect((await erroDe(s.enviarMeuAvatar(foto("image/gif")))).message).toBe(MENSAGENS_FOTO.tipo);
      expect((await erroDe(s.enviarMeuAvatar(foto("image/png", 0)))).message).toBe(MENSAGENS_FOTO.vazia);
      expect((await erroDe(s.enviarMeuAvatar(foto("image/png", TAMANHO_MAXIMO_AVATAR + 1)))).message).toBe(
        MENSAGEM_AVATAR_GRANDE,
      );
      expect(f.armazenamento).toHaveLength(0);
      expect(f.consultas).toHaveLength(0);
    });
  }
});

describe("enviarMeuAvatar: modo real (Supabase falso)", () => {
  it("sobe no bucket avatares e grava o link público em avatar_url", async () => {
    const m = await carregar("false");
    const f = criarClienteFalso({ usuaria: EU, responder: respostas(null) });
    await m.servicoIdentidade(f.cliente).enviarMeuAvatar(foto("image/webp"));

    const [envio] = f.armazenamento;
    expect(envio.bucket).toBe("avatares");
    expect(envio.operacao).toBe("upload");
    const [caminho, , opcoes] = envio.args as [string, Blob, object];
    expect(caminho).toMatch(new RegExp(`^${EU}/[0-9a-f-]{36}\\.webp$`));
    expect(opcoes).toEqual({ contentType: "image/webp", upsert: false });

    const update = f.consultas[1];
    expect(update.tabela).toBe("perfis");
    expect(argumentos(update, "update")).toEqual([[{ avatar_url: `${BASE}${caminho}` }]]);
    expect(argumentos(update, "eq")).toEqual([["id", EU]]);
    expect(f.armazenamento).toHaveLength(1); // não tinha avatar: nada a apagar
  });

  it("trocar o avatar apaga o arquivo anterior do bucket", async () => {
    const m = await carregar("false");
    const f = criarClienteFalso({ usuaria: EU, responder: respostas(`${BASE}${ANTIGO}`) });
    await m.servicoIdentidade(f.cliente).enviarMeuAvatar(foto());
    expect(f.armazenamento.map((c) => c.operacao)).toEqual(["upload", "remove"]);
    expect(f.armazenamento[1].args).toEqual([[ANTIGO]]);
  });

  it("avatar anterior de fora do bucket (link externo) não é apagado", async () => {
    const m = await carregar("false");
    const f = criarClienteFalso({ usuaria: EU, responder: respostas("https://outro-site.com/eu.png") });
    await m.servicoIdentidade(f.cliente).enviarMeuAvatar(foto());
    expect(f.armazenamento.map((c) => c.operacao)).toEqual(["upload"]);
  });

  it("se gravar avatar_url falhar, apaga o arquivo novo e mantém o antigo", async () => {
    const m = await carregar("false");
    let n = 0;
    const f = criarClienteFalso({
      usuaria: EU,
      responder: () =>
        n++ === 0
          ? { data: perfil(`${BASE}${ANTIGO}`), error: null }
          : { data: null, error: { code: "23514", message: "check" } },
    });
    const erro = await erroDe(m.servicoIdentidade(f.cliente).enviarMeuAvatar(foto()));
    expect(erro.codigo).toBe("validacao");
    expect(f.armazenamento.map((c) => c.operacao)).toEqual(["upload", "remove"]);
    const novo = (f.armazenamento[0].args as [string])[0];
    expect(f.armazenamento[1].args).toEqual([[novo]]); // apagou o NOVO, não o antigo
  });

  it("413 do Storage vira a mensagem do limite de 2 MB", async () => {
    const m = await carregar("false");
    const f = criarClienteFalso({
      usuaria: EU,
      responder: respostas(null),
      responderStorage: () => ({ data: null, error: { statusCode: "413", message: "cru" } }),
    });
    const erro = await erroDe(m.servicoIdentidade(f.cliente).enviarMeuAvatar(foto()));
    expect(erro.message).toBe(MENSAGEM_AVATAR_GRANDE);
    expect(f.consultas).toHaveLength(1); // só leu o perfil; não gravou nada
  });

  it("sem sessão: nao_autenticada, sem tocar no Storage", async () => {
    const m = await carregar("false");
    const f = criarClienteFalso({ usuaria: null });
    expect((await erroDe(m.servicoIdentidade(f.cliente).enviarMeuAvatar(foto()))).codigo).toBe("nao_autenticada");
    expect(f.armazenamento).toHaveLength(0);
  });
});

describe("enviarMeuAvatar: modo mock", () => {
  it.each(["cliente", "prestadora", "sem papel"])("%s também troca o avatar", async (quem) => {
    const m = await carregar("true");
    m.redefinirMocks();
    const id = { cliente: m.ID_CLIENTE_BEATRIZ, prestadora: m.ID_PRESTADORA_MARINA, "sem papel": m.ID_SEM_PAPEL }[quem]!;
    m.definirUsuariaMock(id);
    const s = m.servicoIdentidade(null);
    const depois = await s.enviarMeuAvatar(foto());
    expect(depois.avatar_url).toBeTruthy();
    expect((await s.obterMeuPerfil())?.avatar_url).toBe(depois.avatar_url);
  });
});
