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
