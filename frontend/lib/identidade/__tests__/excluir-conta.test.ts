// Regra da Edge Function 'excluir-conta' (issue #46), com um Storage e um
// Auth falsos em memória. A função em si (Deno) só valida o token e chama
// esta regra.
import { describe, expect, it } from "vitest";
import {
  LOTE,
  excluirConta,
  type ClienteAdmin,
} from "../../../../supabase/functions/excluir-conta/excluir";

const ANA = "11111111-1111-4111-8111-111111111111";
const BIA = "22222222-2222-4222-8222-222222222222";

type Falhas = {
  listar?: Record<string, { message: string; statusCode?: string }>;
  remover?: string;
  excluirUsuario?: boolean;
};

// buckets: nome → caminhos de arquivos ('<id>/<arquivo>' ou mais fundo).
function adminFalso(buckets: Record<string, string[]>, falhas: Falhas = {}) {
  const usuarios = new Set([ANA, BIA]);
  const eventos: string[] = [];

  const admin: ClienteAdmin = {
    storage: {
      from(bucket) {
        return {
          async list(pasta, { limit, offset }) {
            const erro = falhas.listar?.[bucket];
            if (erro) return { data: null, error: erro };
            if (!(bucket in buckets)) {
              return { data: null, error: { message: "Bucket not found", statusCode: "404" } };
            }
            // Como o Storage: arquivos e subpastas diretas, em ordem de nome.
            const nomes = new Map<string, string | null>();
            for (const c of buckets[bucket]) {
              if (!c.startsWith(`${pasta}/`)) continue;
              const resto = c.slice(pasta.length + 1).split("/");
              nomes.set(resto[0], resto.length > 1 ? null : `id-${c}`);
            }
            const itens = [...nomes]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([name, id]) => ({ name, id }));
            return { data: itens.slice(offset, offset + limit), error: null };
          },
          async remove(caminhos) {
            if (falhas.remover === bucket) return { data: null, error: { message: "falhou" } };
            expect(caminhos.length).toBeLessThanOrEqual(LOTE);
            eventos.push(`remove:${bucket}:${caminhos.length}`);
            buckets[bucket] = buckets[bucket].filter((c) => !caminhos.includes(c));
            return { data: caminhos.map((name) => ({ name })), error: null };
          },
        };
      },
    },
    auth: {
      admin: {
        async deleteUser(id) {
          if (falhas.excluirUsuario) return { error: { message: "falhou" } };
          eventos.push(`deleteUser:${id}`);
          usuarios.delete(id);
          return { error: null };
        },
      },
    },
  };
  return { admin, buckets, usuarios, eventos };
}

describe("excluirConta", () => {
  it("apaga a pasta <id>/ do portfolio e dos avatares antes de excluir o usuário", async () => {
    const f = adminFalso({
      portfolio: [`${ANA}/a.jpg`, `${ANA}/b.png`, `${BIA}/c.webp`],
      avatares: [`${ANA}/eu.jpg`, `${BIA}/eu.jpg`],
    });

    const r = await excluirConta(f.admin, ANA);

    expect(r).toEqual({ ok: true, arquivosApagados: 3 });
    expect(f.buckets.portfolio).toEqual([`${BIA}/c.webp`]);
    expect(f.buckets.avatares).toEqual([`${BIA}/eu.jpg`]);
    expect(f.usuarios.has(ANA)).toBe(false);
    expect(f.usuarios.has(BIA)).toBe(true);
    // O usuário só sai depois de todos os arquivos.
    expect(f.eventos.at(-1)).toBe(`deleteUser:${ANA}`);
    expect(f.eventos.filter((e) => e.startsWith("remove:"))).toHaveLength(2);
  });

  it("não confunde a pasta com outra que começa com o mesmo id", async () => {
    const parecida = `${ANA.slice(0, -1)}2`;
    const f = adminFalso({ portfolio: [`${ANA}/a.jpg`, `${parecida}/b.jpg`] });

    await excluirConta(f.admin, ANA);

    expect(f.buckets.portfolio).toEqual([`${parecida}/b.jpg`]);
  });

  it("percorre todas as páginas da listagem e apaga em lotes", async () => {
    const muitos = Array.from({ length: LOTE * 2 + 5 }, (_, i) => `${ANA}/${String(i).padStart(4, "0")}.jpg`);
    const f = adminFalso({ portfolio: [...muitos], avatares: [] });

    const r = await excluirConta(f.admin, ANA);

    expect(r).toEqual({ ok: true, arquivosApagados: muitos.length });
    expect(f.buckets.portfolio).toEqual([]);
    expect(f.eventos).toEqual([
      `remove:portfolio:${LOTE}`,
      `remove:portfolio:${LOTE}`,
      "remove:portfolio:5",
      `deleteUser:${ANA}`,
    ]);
  });

  it("apaga também arquivos em subpastas", async () => {
    const f = adminFalso({ portfolio: [`${ANA}/a.jpg`, `${ANA}/antigo/b.jpg`], avatares: [] });

    const r = await excluirConta(f.admin, ANA);

    expect(r).toEqual({ ok: true, arquivosApagados: 2 });
    expect(f.buckets.portfolio).toEqual([]);
  });

  it("conta sem arquivos é excluída normalmente", async () => {
    const f = adminFalso({ portfolio: [`${BIA}/c.jpg`], avatares: [] });

    expect(await excluirConta(f.admin, ANA)).toEqual({ ok: true, arquivosApagados: 0 });
    expect(f.usuarios.has(ANA)).toBe(false);
  });

  it("pula o bucket de avatares enquanto a 04 não estiver aplicada", async () => {
    const f = adminFalso({ portfolio: [`${ANA}/a.jpg`] });

    expect(await excluirConta(f.admin, ANA)).toEqual({ ok: true, arquivosApagados: 1 });
    expect(f.usuarios.has(ANA)).toBe(false);
  });

  it("se um arquivo não sai, o usuário não é excluído", async () => {
    const f = adminFalso(
      { portfolio: [`${ANA}/a.jpg`], avatares: [`${ANA}/eu.jpg`] },
      { remover: "avatares" },
    );

    expect(await excluirConta(f.admin, ANA)).toEqual({ ok: false, etapa: "storage", bucket: "avatares" });
    expect(f.usuarios.has(ANA)).toBe(true);
    expect(f.eventos.some((e) => e.startsWith("deleteUser"))).toBe(false);
  });

  it("se a listagem falha (sem ser bucket inexistente), o usuário não é excluído", async () => {
    const f = adminFalso(
      { portfolio: [`${ANA}/a.jpg`], avatares: [] },
      { listar: { portfolio: { message: "timeout", statusCode: "500" } } },
    );

    expect(await excluirConta(f.admin, ANA)).toEqual({ ok: false, etapa: "storage", bucket: "portfolio" });
    expect(f.buckets.portfolio).toEqual([`${ANA}/a.jpg`]);
    expect(f.usuarios.has(ANA)).toBe(true);
  });

  it("devolve erro se o Auth não exclui o usuário", async () => {
    const f = adminFalso({ portfolio: [`${ANA}/a.jpg`], avatares: [] }, { excluirUsuario: true });

    expect(await excluirConta(f.admin, ANA)).toEqual({ ok: false, etapa: "usuario" });
  });

  it.each(["", "..", `${ANA}/..`, "abc", `${ANA} `])("recusa id que não é UUID (%j) sem tocar em nada", async (id) => {
    const f = adminFalso({ portfolio: [`${ANA}/a.jpg`], avatares: [] });

    expect(await excluirConta(f.admin, id)).toEqual({ ok: false, etapa: "usuario" });
    expect(f.eventos).toEqual([]);
    expect(f.buckets.portfolio).toEqual([`${ANA}/a.jpg`]);
  });
});
