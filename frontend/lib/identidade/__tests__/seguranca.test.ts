// Checagens estáticas do código de lib/identidade (sem os testes).
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const PASTA = fileURLToPath(new URL("../", import.meta.url));
const ARQUIVOS = readdirSync(PASTA).filter((f) => f.endsWith(".ts"));
const fonte = (arquivo: string) => readFileSync(PASTA + arquivo, "utf8");

describe("lib/identidade não expõe nem usa credencial administrativa", () => {
  it("encontra os arquivos do módulo", () => {
    // Pelo menos estes; arquivo novo entra sozinho nas checagens abaixo
    // (it.each(ARQUIVOS)), sem precisar mexer nesta lista.
    expect(ARQUIVOS.sort()).toEqual(expect.arrayContaining([
      "auth.ts",
      "erros.ts",
      "fotos.ts",
      "mocks.ts",
      "perfil.ts",
      "service.ts",
      "sessao.ts",
      "types.ts",
    ]));
  });

  it.each(ARQUIVOS)("%s não cita service_role, secret key nem lê variáveis de ambiente", (arquivo) => {
    const codigo = fonte(arquivo);
    expect(codigo).not.toMatch(/service_role|sb_secret_|SERVICE_ROLE|SECRET_KEY|eyJ[A-Za-z0-9_-]{10,}/);
    // A flag de mock e as chaves vêm só de lib/supabase/config.ts.
    expect(codigo).not.toMatch(/process\.env/);
  });

  it.each(ARQUIVOS)("%s não monta SQL nem chama RPC/admin", (arquivo) => {
    const codigo = fonte(arquivo);
    expect(codigo).not.toMatch(/\.rpc\(|auth\.admin|\.sql`|createClient\(|\.or\(|\.filter\(\s*["'`]/);
    // Nada de interpolar texto em filtros do PostgREST.
    expect(codigo).not.toMatch(/\.(eq|in|ilike|like|or)\([^)]*`/);
  });

  it("service.ts importa do supabase-js só o tipo do cliente", () => {
    const imports = [...fonte("service.ts").matchAll(/^import .* from "([^"]+)";$/gm)].map((m) => m[0]);
    const doSupabase = imports.filter((i) => i.includes("@supabase/"));
    expect(doSupabase).toEqual(['import type { SupabaseClient } from "@supabase/supabase-js";']);
    // Cliente só chega de fora (lib/supabase); o service não cria nenhum.
    expect(fonte("service.ts")).not.toMatch(/createBrowserClient|createServerClient/);
  });

  it("cadastro e login não escrevem nada em log (a senha passa por eles)", () => {
    const acoes = readFileSync(fileURLToPath(new URL("../../../app/(auth)/acoes.ts", import.meta.url)), "utf8");
    for (const codigo of [fonte("auth.ts"), acoes]) {
      expect(codigo).not.toMatch(/console\./);
    }
  });

  it("escritas filtram pelo id da sessão, nunca por argumento", () => {
    const codigo = fonte("service.ts");
    const escritas = [...codigo.matchAll(/\.(update|insert|delete)\(/g)];
    expect(escritas.length).toBe(8);
    // Toda escrita é precedida por exigirSessao() na mesma função.
    for (const funcao of [
      "atualizarMeuPerfil",
      "escolherMeuPapel",
      "adicionarMeuServico",
      "removerMeuServico",
      "enviarMinhaFoto",
      "apagarMinhaFoto",
      "enviarMeuAvatar",
      "removerMeuAvatar",
    ]) {
      // lastIndexOf: a última definição é a do Supabase (a primeira é a validação).
      const corpo = codigo.slice(codigo.lastIndexOf(`async ${funcao}(`));
      const ate = corpo.indexOf("\n    },");
      expect(corpo.slice(0, ate)).toMatch(/const id = await exigirSessao\(\);/);
    }
  });
});
