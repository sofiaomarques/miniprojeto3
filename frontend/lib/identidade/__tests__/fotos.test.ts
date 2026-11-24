// Regras do arquivo de foto (lib/identidade/fotos.ts): os mesmos limites do
// bucket `portfolio` na 01, e o caminho que a policy de upload aceita.
import { describe, expect, it } from "vitest";
import { MENSAGENS_FOTO, novoCaminhoFoto, TAMANHO_MAXIMO_FOTO, validarArquivoFoto } from "../fotos";

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
