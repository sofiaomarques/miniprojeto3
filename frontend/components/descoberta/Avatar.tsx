// Foto de perfil redonda; sem foto, mostra a inicial do nome.
const TAMANHOS = {
  p: "h-10 w-10 text-base",
  m: "h-12 w-12 text-lg",
  g: "h-20 w-20 text-2xl",
} as const;

type Props = { nome: string | null; url: string | null; tamanho?: keyof typeof TAMANHOS };

export function Avatar({ nome, url, tamanho = "m" }: Props) {
  const classe = `${TAMANHOS[tamanho]} shrink-0 rounded-full`;
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={`${classe} object-cover`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`${classe} flex items-center justify-center bg-zinc-200 font-semibold text-zinc-700`}
    >
      {nome?.trim()[0]?.toUpperCase() ?? "?"}
    </span>
  );
}
