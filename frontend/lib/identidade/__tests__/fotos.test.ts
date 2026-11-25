// Regras do arquivo de foto (lib/identidade/fotos.ts): os mesmos limites do
// bucket `portfolio` na 01, e o caminho que a policy de upload aceita.
import { describe, expect, it } from "vitest";
import {
  caminhoDoAvatar,
  MENSAGEM_AVATAR_GRANDE,
  MENSAGENS_FOTO,
  novoCaminhoAvatar,
  novoCaminhoFoto,
  TAMANHO_MAXIMO_AVATAR,
  TAMANHO_MAXIMO_FOTO,
  validarArquivoAvatar,
  validarArquivoFoto,
} from "../fotos";

const PRESTADORA = "00000000-0000-4000-8000-0000000000a1";

describe("validarArquivoFoto", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("aceita %s", (type) => {
    expect(validarArquivoFoto({ type, size: 1000 })).toBeUndefined();
  });

  it.each(["image/gif", "image/svg+xml", "application/pdf", "text/html", ""])("recusa o tipo %j", (type) => {
    expect(validarArquivoFoto({ type, size: 1000 })).toBe(MENSAGENS_FOTO.tipo);
  });

  it("aceita exatamente 5 MB e recusa 1 byte a mais", () => {
    expect(validarArquivoFoto({ type: "image/png", size: TAMANHO_MAXIMO_FOTO })).toBeUndefined();
    expect(validarArquivoFoto({ type: "image/png", size: TAMANHO_MAXIMO_FOTO + 1 })).toBe(MENSAGENS_FOTO.grande);
  });

  it("recusa arquivo vazio", () => {
    expect(validarArquivoFoto({ type: "image/jpeg", size: 0 })).toBe(MENSAGENS_FOTO.vazia);
  });
});

describe("novoCaminhoFoto", () => {
  it("fica na pasta da prestadora, um nível só, com a extensão do tipo", () => {
    expect(novoCaminhoFoto(PRESTADORA, "image/png")).toMatch(
      /^00000000-0000-4000-8000-0000000000a1\/[0-9a-f-]{36}\.png$/,
    );
    expect(novoCaminhoFoto(PRESTADORA, "image/jpeg")).toMatch(/\.jpg$/);
    expect(novoCaminhoFoto(PRESTADORA, "image/webp")).toMatch(/\.webp$/);
  });

  it("cada envio ganha um nome novo (não sobrescreve foto anterior)", () => {
    expect(novoCaminhoFoto(PRESTADORA, "image/png")).not.toBe(novoCaminhoFoto(PRESTADORA, "image/png"));
  });

  it("bate com o CHECK de fotos_portfolio.caminho da 01", () => {
    const caminho = novoCaminhoFoto(PRESTADORA, "image/jpeg");
    expect(caminho).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[^/]+$/);
    expect(caminho.split("/")[0]).toBe(PRESTADORA);
  });
});

describe("avatar (#18)", () => {
  it("aceita JPG, PNG e WebP até 2 MB, com mensagem própria para o tamanho", () => {
    expect(validarArquivoAvatar({ type: "image/webp", size: TAMANHO_MAXIMO_AVATAR })).toBeUndefined();
    expect(validarArquivoAvatar({ type: "image/png", size: TAMANHO_MAXIMO_AVATAR + 1 })).toBe(MENSAGEM_AVATAR_GRANDE);
    expect(validarArquivoAvatar({ type: "image/gif", size: 10 })).toBe(MENSAGENS_FOTO.tipo);
    expect(validarArquivoAvatar({ type: "image/jpeg", size: 0 })).toBe(MENSAGENS_FOTO.vazia);
  });

  it("o caminho do avatar fica na pasta da conta, um nível só", () => {
    expect(novoCaminhoAvatar(PRESTADORA, "image/png")).toMatch(new RegExp(`^${PRESTADORA}/[0-9a-f-]{36}\.png$`));
  });

  it("acha o caminho a partir do link público do bucket avatares", () => {
    const caminho = `${PRESTADORA}/0f8fad5b-d9cb-469f-a165-70867728950e.png`;
    expect(caminhoDoAvatar(`https://x.supabase.co/storage/v1/object/public/avatares/${caminho}`)).toBe(caminho);
    expect(caminhoDoAvatar(`https://x.supabase.co/storage/v1/object/public/avatares/${caminho}?t=1`)).toBe(caminho);
  });

  it("ignora links que não são do bucket avatares (não apaga nada que não é dele)", () => {
    for (const url of [
      null,
      undefined,
      "",
      "https://outro-site.com/foto.png",
      `https://x.supabase.co/storage/v1/object/public/portfolio/${PRESTADORA}/a.png`,
      "https://x.supabase.co/storage/v1/object/public/avatares/../segredo.png",
      `https://x.supabase.co/storage/v1/object/public/avatares/${PRESTADORA}/sub/a.png`,
    ]) {
      expect(caminhoDoAvatar(url)).toBeNull();
    }
  });
});
