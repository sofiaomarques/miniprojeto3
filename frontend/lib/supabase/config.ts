// Configuração compartilhada pelos clientes Supabase (navegador, servidor e middleware).
// As variáveis NEXT_PUBLIC_* precisam ser lidas de forma literal para o Next
// conseguir embuti-las no bundle do navegador.

// A Vercel preenche NEXT_PUBLIC_VERCEL_ENV sozinha ("production", "preview" ou
// "development"). Localmente ela fica vazia.
const emProducao = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

// true = telas usam dados de mentira e nenhum cliente Supabase é criado.
// Em produção a flag é ignorada: o site publicado sempre usa o Supabase de verdade.
export const usarMocks = !emProducao && process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export type ConfigSupabase = { url: string; chave: string };

// A chave secret (sb_secret_...) e a service_role legada (JWT) ignoram o RLS.
// Tudo que é NEXT_PUBLIC_* vai para o navegador, então elas nunca podem estar aqui.
function ehChaveSecreta(chave: string): boolean {
  if (chave.startsWith("sb_secret_")) return true;

  const partes = chave.split(".");
  if (partes.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(partes[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload?.role === "service_role";
  } catch {
    return false;
  }
}

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

  if (ehChaveSecreta(chave)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY contém uma chave secret/service_role. " +
        "Ela seria exposta no navegador: troque pela publishable key e gere uma " +
        "secret nova no painel do Supabase.",
    );
  }

  return { url, chave };
}
