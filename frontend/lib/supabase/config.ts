// Configuração compartilhada pelos clientes Supabase (navegador, servidor e middleware).
// As variáveis NEXT_PUBLIC_* precisam ser lidas de forma literal para o Next
// conseguir embuti-las no bundle do navegador.

// true = telas usam dados de mentira e nenhum cliente Supabase é criado.
export const usarMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export type ConfigSupabase = { url: string; chave: string };

// Retorna null em modo mock; fora dele, exige as duas variáveis.
export function lerConfigSupabase(): ConfigSupabase | null {
  if (usarMocks) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !chave) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY " +
        "(ver .env.local.example) ou use NEXT_PUBLIC_USE_MOCKS=true.",
    );
  }

  return { url, chave };
}
