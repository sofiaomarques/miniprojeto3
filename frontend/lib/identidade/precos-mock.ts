// Preços em memória (NEXT_PUBLIC_USE_MOCKS=true), sobre os serviços do mock da
// identidade (mocks.ts). Os valores iniciais batem com supabase/seed-demo-precos.sql
// nos serviços que existem nos dois.
//
// Como no banco, o preço é do SERVIÇO (a linha prestadora × categoria): cada
// preço guarda o criado_em do serviço a que pertence, e a cada leitura ou
// escrita os preços de serviços que não existem mais são apagados. Se a
// prestadora tira o serviço e marca de novo, ele volta "a combinar", igual
// ao DELETE + INSERT do banco.
//
// redefinirMocks() (mocks.ts) não mexe aqui: testes que gravam preço chamam
// também redefinirPrecosMock().
import { ErroIdentidade } from "./erros";
import {
  ID_PRESTADORA_ALINE,
  ID_PRESTADORA_CAMILA,
  ID_PRESTADORA_JOANA,
  ID_PRESTADORA_MARINA,
  SERVICOS_MOCK,
  perfisMockAtuais,
  servicoMock,
} from "./mocks";
import type { PrecoServico, ServicoPrecos } from "./precos";
import type { ServicoPrestadora } from "./types";

type Valor = Pick<PrecoServico, "preco_base" | "aceita_negociar">;

// prestadora, categoria, preço, aceita negociar (Aline/Encanamento fica a combinar).
const PRECOS_INICIAIS: readonly [string, number, number, boolean][] = [
  [ID_PRESTADORA_MARINA, 1, 150, true], // Ar-condicionado
  [ID_PRESTADORA_CAMILA, 3, 120, true], // Encanamento
  [ID_PRESTADORA_JOANA, 4, 180, false], // Montagem de móveis
  [ID_PRESTADORA_ALINE, 2, 99.9, true], // Elétrica
];

const chave = (s: Pick<ServicoPrestadora, "prestadora_id" | "categoria_id" | "criado_em">) =>
  `${s.prestadora_id}|${s.categoria_id}|${s.criado_em}`;

let precos = new Map<string, Valor>();

// Volta os preços ao início (para testes; o mock da identidade tem o seu
// próprio redefinirMocks, que não mexe aqui).
export function redefinirPrecosMock(): void {
  precos = new Map();
  for (const [prestadora_id, categoria_id, preco_base, aceita_negociar] of PRECOS_INICIAIS) {
    const servico = SERVICOS_MOCK.find(
      (s) => s.prestadora_id === prestadora_id && s.categoria_id === categoria_id,
    );
    if (servico) precos.set(chave(servico), { preco_base, aceita_negociar });
  }
}
redefinirPrecosMock();

function comPreco(s: ServicoPrestadora): PrecoServico {
  const valor = precos.get(chave(s)) ?? { preco_base: null, aceita_negociar: false };
  return { prestadora_id: s.prestadora_id, categoria_id: s.categoria_id, ...valor };
}

async function servicosDe(prestadoraId: string): Promise<ServicoPrestadora[]> {
  return servicoMock.listarServicosDaPrestadora(prestadoraId);
}

const idsPrestadoras = () =>
  perfisMockAtuais()
    .filter((p) => p.papel === "prestadora")
    .map((p) => p.id)
    .sort();

// Apaga os preços de serviços que saíram (o DELETE da linha no banco).
async function apagarOrfaos(): Promise<void> {
  const vivos = new Set((await Promise.all(idsPrestadoras().map(servicosDe))).flat().map(chave));
  for (const k of precos.keys()) if (!vivos.has(k)) precos.delete(k);
}

export const servicoPrecosMock: ServicoPrecos = {
  async listarPrecos(filtro = {}) {
    await apagarOrfaos();
    // Serviços do estado atual da identidade: inclui quem virou prestadora
    // no onboarding e o que foi marcado ou tirado em "Editar perfil".
    const ids = filtro.prestadoraId ? [filtro.prestadoraId] : idsPrestadoras();
    const listas = await Promise.all(ids.map(servicosDe));
    return listas
      .flat()
      .filter((s) => !filtro.categoriaId || s.categoria_id === filtro.categoriaId)
      .map(comPreco);
  },

  // Mesmas recusas do banco: sem sessão, não prestadora, serviço que não é dela.
  async salvarMeusPrecos(alteracoes) {
    const perfil = await servicoMock.obterMeuPerfil();
    if (!perfil) throw new ErroIdentidade("nao_autenticada", "Entre na sua conta para continuar.");
    if (perfil.papel !== "prestadora") {
      throw new ErroIdentidade("permissao", "Só prestadoras podem definir preços.");
    }
    await apagarOrfaos();
    const meus = await servicosDe(perfil.id);
    // Confere todos antes de gravar, para não salvar só metade.
    const servicos = alteracoes.map(({ categoria_id }) => {
      const servico = meus.find((s) => s.categoria_id === categoria_id);
      if (!servico) {
        throw new ErroIdentidade(
          "nao_encontrado",
          "Um dos serviços não está mais no seu perfil. Recarregue a página.",
        );
      }
      return servico;
    });
    return servicos.map((servico, i) => {
      const { preco_base, aceita_negociar } = alteracoes[i];
      precos.set(chave(servico), { preco_base, aceita_negociar });
      return comPreco(servico);
    });
  },
};
