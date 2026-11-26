// Busca por preço no modo real: a view prestadoras_resumo (P2) mais os preços
// do service da identidade (P1), juntados e ordenados aqui. Cliente falso no
// lugar do Supabase do navegador.
import { describe, expect, it, vi } from "vitest";

import { argumentos, criarClienteFalso } from "@/lib/identidade/__tests__/cliente-falso";

const A = "00000000-0000-4000-8000-0000000000a1";
const B = "00000000-0000-4000-8000-0000000000a2";
const C = "00000000-0000-4000-8000-0000000000a3";

const falso = criarClienteFalso({
  responder: (c) => {
    if (c.tabela === "prestadoras_resumo") {
      return {
        data: [
          { id: A, nome: "Ana", avatar_url: null, cidade: null, categorias: [], nota_media: 5, total_avaliacoes: 1 },
          { id: B, nome: "Bia", avatar_url: null, cidade: null, categorias: [], nota_media: null, total_avaliacoes: 0 },
          { id: C, nome: "Cris", avatar_url: null, cidade: null, categorias: [], nota_media: 3, total_avaliacoes: 2 },
        ],
        error: null,
      };
    }
    // servicos_prestadora (preços); numeric pode chegar como texto.
    return {
      data: [
        { prestadora_id: A, categoria_id: 1, preco_base: "200.00", aceita_negociar: false },
        { prestadora_id: C, categoria_id: 1, preco_base: 80, aceita_negociar: true },
      ],
      error: null,
    };
  },
});

vi.mock("@/lib/supabase/client", () => ({ criarClienteNavegador: () => falso.cliente }));

describe("buscarPrestadoras por preço (Supabase)", () => {
  it("junta os preços e ordena do mais barato ao mais caro, a combinar no fim", async () => {
    const { buscarPrestadoras } = await import("../service-supabase");
    const lista = await buscarPrestadoras({ ordenarPor: "preco" });
    expect(lista.map((p) => p.nome)).toEqual(["Cris", "Ana", "Bia"]);
    expect(lista[0].precos).toEqual([{ categoriaId: 1, precoBase: 80, aceitaNegociar: true }]);
    expect(lista[1].precos[0].precoBase).toBe(200);
    expect(lista[2].precos).toEqual([]);

    const precos = falso.consultas.find((c) => c.tabela === "servicos_prestadora")!;
    // Sem filtro de serviço: uma consulta só, sem lista de ids.
    expect(argumentos(precos, "eq")).toEqual([]);
    expect(argumentos(precos, "in")).toEqual([]);
  });
});
