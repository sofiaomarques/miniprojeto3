// Fotos do portfólio (#17): regras do arquivo antes de enviar. Os limites são
// os mesmos do bucket `portfolio` na 01_identidade.sql (o Storage recusa o
// resto de qualquer jeito); conferir aqui só dá a mensagem certa mais cedo.
// Não usa nada do servidor: pode ser importado por Client Components.

export const BUCKET_PORTFOLIO = "portfolio";
export const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024; // 5 MB

// Tipo do arquivo → extensão usada no nome salvo no bucket.
export const TIPOS_FOTO: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MENSAGENS_FOTO = {
  tipo: "Use uma foto JPG, PNG ou WebP.",
  vazia: "Esse arquivo está vazio.",
  grande: "A foto pode ter no máximo 5 MB.",
} as const;

// O que importa do arquivo (um File do navegador serve).
export type ArquivoFoto = Pick<Blob, "type" | "size">;

export function validarArquivoFoto(arquivo: ArquivoFoto): string | undefined {
  if (!(arquivo.type in TIPOS_FOTO)) return MENSAGENS_FOTO.tipo;
  if (arquivo.size <= 0) return MENSAGENS_FOTO.vazia;
  if (arquivo.size > TAMANHO_MAXIMO_FOTO) return MENSAGENS_FOTO.grande;
  return undefined;
}

// Caminho no bucket: '<prestadora_id>/<uuid>.<ext>', um nível só (é o que a
// policy de upload e o CHECK de fotos_portfolio.caminho exigem). O nome é
// aleatório: o nome original do arquivo não vai para o Storage.
export function novoCaminhoFoto(prestadoraId: string, tipo: string): string {
  return `${prestadoraId}/${crypto.randomUUID()}.${TIPOS_FOTO[tipo] ?? "jpg"}`;
}

// ===========================================================================
// Avatar (#18): bucket `avatares` da 04_avatares.sql. Qualquer conta envia,
// só na própria pasta. Limite menor que o das fotos de trabalho: 2 MB.
// ===========================================================================

export const BUCKET_AVATARES = "avatares";
export const TAMANHO_MAXIMO_AVATAR = 2 * 1024 * 1024; // 2 MB

export const MENSAGEM_AVATAR_GRANDE = "A foto de perfil pode ter no máximo 2 MB.";

export function validarArquivoAvatar(arquivo: ArquivoFoto): string | undefined {
  if (!(arquivo.type in TIPOS_FOTO)) return MENSAGENS_FOTO.tipo;
  if (arquivo.size <= 0) return MENSAGENS_FOTO.vazia;
  if (arquivo.size > TAMANHO_MAXIMO_AVATAR) return MENSAGEM_AVATAR_GRANDE;
  return undefined;
}

// Mesmo formato das fotos: '<id>/<uuid>.<ext>'. Nome novo a cada troca, para
// o link antigo (em cache) não mostrar a foto nova.
export function novoCaminhoAvatar(perfilId: string, tipo: string): string {
  return novoCaminhoFoto(perfilId, tipo);
}

// Caminho no bucket a partir do link público salvo em perfis.avatar_url
// (".../storage/v1/object/public/avatares/<id>/<arquivo>"), ou null se o link
// não for deste bucket (ex.: um link externo antigo). Usado para apagar o
// arquivo anterior ao trocar ou remover o avatar.
export function caminhoDoAvatar(url: string | null | undefined): string | null {
  if (!url) return null;
  const marca = `/storage/v1/object/public/${BUCKET_AVATARES}/`;
  const posicao = url.indexOf(marca);
  if (posicao === -1) return null;
  const caminho = decodeURIComponent(url.slice(posicao + marca.length).split(/[?#]/)[0]);
  return /^[0-9a-f-]{36}\/[^/]+$/.test(caminho) ? caminho : null;
}
