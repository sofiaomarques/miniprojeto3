import { describe, expect, it } from "vitest";

import { textoCidade } from "../Categorias";

describe("textoCidade", () => {
  it("sem cidade, avisa em vez de sumir", () => {
    expect(textoCidade(null)).toBe("Cidade não informada");
    expect(textoCidade("")).toBe("Cidade não informada");
    expect(textoCidade("   ")).toBe("Cidade não informada");
  });

  it("tira os espaços das pontas", () => {
    expect(textoCidade(" Recife ")).toBe("Recife");
  });
});
