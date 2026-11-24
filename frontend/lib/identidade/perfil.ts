// Edição do próprio perfil (#16): leitura do formulário e quais categorias de
// serviço adicionar ou remover. As regras de verdade (limites, quem pode
// gravar) continuam no service.ts e no banco; aqui só a parte sem rede, que
// dá para testar sem Supabase.
import type { AtualizacaoPerfil } from "./types";

export type EdicaoPerfil = {
  dados: AtualizacaoPerfil;
  // ids das categorias marcadas no formulário (só prestadora)
  categorias: number[];
};

function texto(valor: FormDataEntryValue | null): string {
  return typeof valor === "string" ? valor : "";
}

// Lê nome, bio, cidade e as categorias marcadas. Campo vazio de bio e cidade
// vira null (o service apaga o valor); o nome é obrigatório e o service recusa
// vazio com mensagem própria.
export function lerEdicaoPerfil(form: FormData): EdicaoPerfil {
  const bio = texto(form.get("bio")).trim();
  const cidade = texto(form.get("cidade")).trim();
  const categorias = form
    .getAll("categorias")
    .map((v) => Number(v))
    .filter((n) => Number.isSafeInteger(n) && n > 0);
  return {
    dados: {
      nome: texto(form.get("nome")),
      bio: bio === "" ? null : bio,
      cidade: cidade === "" ? null : cidade,
    },
    categorias: [...new Set(categorias)],
  };
}

// O que mudar em servicos_prestadora para ficar igual ao que foi marcado.
export function diferencaCategorias(
  atuais: readonly number[],
  escolhidas: readonly number[],
): { adicionar: number[]; remover: number[] } {
  const antes = new Set(atuais);
  const depois = new Set(escolhidas);
  return {
    adicionar: [...depois].filter((id) => !antes.has(id)).sort((a, b) => a - b),
    remover: [...antes].filter((id) => !depois.has(id)).sort((a, b) => a - b),
  };
}
