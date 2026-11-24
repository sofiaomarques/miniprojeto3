// /login é apelido de /entrar (a descoberta e textos antigos usam /login).
// Repassa só um ?next= interno; o resto é descartado.
import { redirect } from "next/navigation";
import { caminhoInterno } from "@/lib/identidade/auth";

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const next = caminhoInterno((await searchParams).next);
  redirect(next ? `/entrar?next=${encodeURIComponent(next)}` : "/entrar");
}
