// /p/<slug> era o perfil de exemplo do protótipo; os perfis reais usam o uuid
// em /prestadoras/<id>. Links antigos voltam para a busca em vez de dar 404.
import { redirect } from "next/navigation";

export default function PerfilExemploAntigo() {
  redirect("/");
}
