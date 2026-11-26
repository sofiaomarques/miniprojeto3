// Valores em reais no formato brasileiro (preço base dos serviços, #precos).
// Funções puras, sem Supabase: usadas no formulário da prestadora, no service
// e nas telas da busca. O banco guarda numeric(10,2) (05_precos_servicos.sql).

// Mesma faixa do CHECK servicos_prestadora_preco_base_faixa da 05.
export const PRECO_MINIMO = 0.01;
export const PRECO_MAXIMO = 99999.99;

export type LeituraPreco =
  | { ok: true; valor: number | null } // null = campo vazio, "a combinar"
  | { ok: false; erro: string };

// Lê o que a pessoa digitou: "150", "150,5", "150,50", "1.234,56", "R$ 80",
// "80.00" (ponto como decimal quando há 1 ou 2 casas depois dele). Vazio vira
// null. Arredonda para centavos só quando já vem com até 2 casas; mais casas
// é recusado, para o valor gravado ser exatamente o que a pessoa viu.
export function lerPreco(texto: string): LeituraPreco {
  const limpo = texto.replace(/R\$/i, "").replace(/\s/g, "");
  if (limpo === "") return { ok: true, valor: null };

  let normalizado: string;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(limpo)) {
    // 1.234 ou 1.234,56: ponto de milhar
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else if (/^\d+(,\d{1,2})?$/.test(limpo)) {
    normalizado = limpo.replace(",", ".");
  } else if (/^\d+\.\d{1,2}$/.test(limpo)) {
    normalizado = limpo; // 80.5 ou 80.00
  } else {
    return { ok: false, erro: "Use só números, como 150 ou 150,50." };
  }

  const valor = Math.round(Number(normalizado) * 100) / 100;
  if (!Number.isFinite(valor) || valor < PRECO_MINIMO) {
    return { ok: false, erro: "O preço precisa ser maior que zero. Deixe vazio para “a combinar”." };
  }
  if (valor > PRECO_MAXIMO) {
    return { ok: false, erro: "O preço pode ser no máximo R$ 99.999,99." };
  }
  return { ok: true, valor };
}

const MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const MOEDA_SEM_CENTAVOS = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

// "R$ 150" quando é inteiro, "R$ 150,50" quando tem centavos. O Intl usa um
// espaço não separável entre "R$" e o número; troca por espaço comum para o
// texto ser igual no servidor e no navegador.
export function formatarPreco(valor: number): string {
  const inteiro = Number.isInteger(valor);
  return (inteiro ? MOEDA_SEM_CENTAVOS : MOEDA).format(valor).replace(/\s/g, " ");
}

// Valor para pôr de volta no campo de edição: "150" ou "150,50".
export function precoParaCampo(valor: number | null): string {
  if (valor === null) return "";
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(2).replace(".", ",");
}
