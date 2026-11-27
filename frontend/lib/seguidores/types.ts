// Contrato de seguidores (06_seguidores.sql). Datas em ISO 8601 UTC.
// Papel vem da identidade (P1): não redefinir.
import type { Papel } from "@/lib/identidade/types";

// Uma linha da view `pessoas_publicas`: só nome, avatar e papel. Bio e cidade
// da cliente continuam privadas (RLS da 01).
export type PessoaResumo = {
  id: string;
  papel: Papel;
  nome: string;
  avatarUrl: string | null;
};

// Uma pessoa numa lista de seguidores ou de seguindo, e desde quando.
export type Conexao = {
  pessoa: PessoaResumo;
  desde: string;
};

export type Contagem = {
  seguidores: number;
  seguindo: number;
};

// Qual das duas listas de um perfil.
export type TipoLista = "seguidores" | "seguindo";

// Mensagens fixas (nunca a mensagem crua do banco).
export const ERRO_SEGUIR_DESLOGADA = "Entre na sua conta para seguir pessoas.";
export const ERRO_SEGUIR_A_SI_MESMA = "Você não pode seguir a si mesma.";
export const ERRO_SEGUIR_SEM_PAPEL = "Conclua seu cadastro para seguir pessoas.";
export const ERRO_SEGUIR_GENERICO = "Não foi possível concluir a operação. Tente novamente.";

// Máximo de pessoas por lista ou busca (a tela não pagina nesta versão).
export const LIMITE_LISTA = 100;
