// Erro único da área de identidade. A mensagem é segura para mostrar na tela:
// nunca carrega a mensagem crua do banco (nomes de tabela, policies, valores).
import type { CodigoErroIdentidade } from "./types";

export class ErroIdentidade extends Error {
  readonly codigo: CodigoErroIdentidade;
  // Código do PostgreSQL/PostgREST quando veio do banco (ex.: "42501"),
  // útil para log. Não contém dados da usuária.
  readonly codigoBanco: string | null;

  constructor(codigo: CodigoErroIdentidade, mensagem: string, codigoBanco: string | null = null) {
    super(mensagem);
    this.name = "ErroIdentidade";
    this.codigo = codigo;
    this.codigoBanco = codigoBanco;
  }
}

export function ehErroIdentidade(erro: unknown): erro is ErroIdentidade {
  return erro instanceof ErroIdentidade;
}
