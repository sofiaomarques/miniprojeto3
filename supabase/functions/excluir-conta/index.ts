// Edge Function 'excluir-conta' (issue #46).
//
// A usuária logada chama com o próprio token (supabase.functions.invoke
// já manda o header Authorization). A função descobre o id pelo token,
// apaga a pasta '<id>/' dos buckets e só então exclui o usuário. Não recebe
// id no corpo: ninguém exclui a conta de outra pessoa.
//
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetadas pelo Supabase no
// ambiente da função. A chave fica só aqui, nunca no frontend.
//
// ATENÇÃO: SUPABASE_SERVICE_ROLE_KEY é a chave LEGADA (o app já usa as
// sb_publishable_). As chaves novas vêm em SUPABASE_SECRET_KEYS. Se as
// chaves legadas forem desligadas no painel, esta função para: trocar a
// leitura daqui para uma chave secret (sb_secret_).
//
// O projeto assina os tokens com ES256. Se, depois do deploy, a chamada
// voltar 401 sem nenhum log da função, é o verify_jwt do gateway recusando:
// publicar de novo com --no-verify-jwt. É seguro, porque a função valida o
// token sozinha com admin.auth.getUser(token) logo abaixo.
import { createClient } from "npm:@supabase/supabase-js@2";
import { excluirConta } from "./excluir.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function resposta(status: number, corpo: Record<string, unknown>): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return resposta(405, { erro: "Método não permitido." });

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return resposta(401, { erro: "Entre na sua conta para excluí-la." });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Valida o token no Auth; a chave anon/publishable não identifica ninguém.
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return resposta(401, { erro: "Entre na sua conta para excluí-la." });

  const resultado = await excluirConta(admin, data.user.id);
  if (!resultado.ok) {
    console.error("excluir-conta falhou", { etapa: resultado.etapa, bucket: resultado.bucket });
    return resposta(500, { erro: "Não foi possível excluir a conta agora. Tente de novo." });
  }
  return resposta(200, { ok: true });
});
