// Respostas rápidas da conversa (#39). O objetivo do produto é fechar o
// serviço, então a cliente tem "Pedir orçamento" e a prestadora "Enviar
// orçamento", com os campos que faltam para combinar. O texto vai para o
// campo de mensagem (não é enviado direto): dá para completar antes de enviar.
import type { Papel } from "@/lib/identidade/types";

export type RespostaRapida = { rotulo: string; texto: string };

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? "";
}

// meuPapel = papel de quem está escrevendo; nomeOutra = com quem conversa.
export function respostasRapidas(meuPapel: Papel | null, nomeOutra: string): RespostaRapida[] {
  const oi = primeiroNome(nomeOutra) ? `Olá, ${primeiroNome(nomeOutra)}!` : "Olá!";

  if (meuPapel === "cliente") {
    return [
      {
        rotulo: "Pedir orçamento",
        texto: `${oi} Gostaria de um orçamento.\nServiço: \nBairro: \nData desejada: `,
      },
      { rotulo: "Qual o valor?", texto: "Qual o valor do serviço?" },
      { rotulo: "Tem horário esta semana?", texto: "Você tem horário esta semana?" },
    ];
  }
  if (meuPapel === "prestadora") {
    return [
      {
        rotulo: "Enviar orçamento",
        texto: `${oi} Segue o orçamento:\nServiço: \nValor: R$ \nData disponível: `,
      },
      { rotulo: "Posso visitar antes?", texto: "Posso fazer uma visita para avaliar antes de passar o valor?" },
    ];
  }
  return [];
}
