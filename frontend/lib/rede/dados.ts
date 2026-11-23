// Dados de exemplo só para as telas visuais. Quando as telas forem ligadas ao
// Supabase, estes dados saem e entram os do lib/descoberta.
// O `slug` só existe aqui; identidade, descoberta e chat usam o uuid do perfil.
// `prestadoraId` aponta cada exemplo para uma prestadora dos mocks da
// identidade, para o "Conversar" abrir o chat de verdade (#44).
import {
  ID_PRESTADORA_ALINE,
  ID_PRESTADORA_CAMILA,
  ID_PRESTADORA_JOANA,
  ID_PRESTADORA_MARINA,
} from "@/lib/identidade/mocks";

export type PrestadoraExemplo = {
  slug: string;
  prestadoraId: string;
  nome: string;
  primeiroNome: string;
  iniciais: string;
  servico: string;
  cidade: string;
  nota: string;
  avaliacoes: number;
  tom: "rosa" | "areia";
  bio: string;
};

export const PRESTADORAS: PrestadoraExemplo[] = [
  {
    slug: "marina",
    prestadoraId: ID_PRESTADORA_MARINA,
    nome: "Marina Costa",
    primeiroNome: "Marina",
    iniciais: "MC",
    servico: "Ar-condicionado",
    cidade: "João Pessoa",
    nota: "4,9",
    avaliacoes: 32,
    tom: "rosa",
    bio: "Técnica em refrigeração há 6 anos. Instalação, limpeza e manutenção de ar-condicionado, com orçamento combinado antes da visita.",
  },
  {
    slug: "helena",
    prestadoraId: ID_PRESTADORA_CAMILA,
    nome: "Helena Duarte",
    primeiroNome: "Helena",
    iniciais: "HD",
    servico: "Encanamento",
    cidade: "João Pessoa",
    nota: "4,8",
    avaliacoes: 21,
    tom: "areia",
    bio: "Encanadora autônoma. Vazamentos, troca de torneiras, descargas e desentupimentos, com atendimento no mesmo dia quando possível.",
  },
  {
    slug: "beatriz",
    prestadoraId: ID_PRESTADORA_ALINE,
    nome: "Beatriz Lima",
    primeiroNome: "Beatriz",
    iniciais: "BL",
    servico: "Elétrica",
    cidade: "João Pessoa",
    nota: "4,7",
    avaliacoes: 14,
    tom: "rosa",
    bio: "Eletricista residencial. Troca de chuveiros, tomadas e disjuntores, além de revisão do quadro de luz.",
  },
  {
    slug: "camila",
    prestadoraId: ID_PRESTADORA_JOANA,
    nome: "Camila Rocha",
    primeiroNome: "Camila",
    iniciais: "CR",
    servico: "Montagem",
    cidade: "João Pessoa",
    nota: "4,6",
    avaliacoes: 9,
    tom: "areia",
    bio: "Montagem de camas, guarda-roupas e estantes, e instalação de prateleiras e suportes de TV.",
  },
];

export const CATEGORIAS = ["Todos", ...PRESTADORAS.map((p) => p.servico)];

export function buscarPrestadora(slug: string): PrestadoraExemplo | undefined {
  return PRESTADORAS.find((p) => p.slug === slug);
}

export const INDICACOES = [
  {
    slug: "helena",
    estrelas: 5,
    comentario: "Resolveu o vazamento no mesmo dia, com preço justo.",
  },
  {
    slug: "beatriz",
    estrelas: 5,
    comentario: "Trocou o chuveiro e revisou o quadro de luz com cuidado.",
  },
];
