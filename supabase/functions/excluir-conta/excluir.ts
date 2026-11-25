// Regra da exclusão de conta (issue #46), sem nada de Deno nem de rede:
// recebe um cliente com service_role já criado, para ser testada no vitest.
//
// Ordem: primeiro os arquivos da pasta '<id>/' de cada bucket, depois o
// usuário. Se algum arquivo não sair, o usuário NÃO é excluído: com a conta
// ainda existindo, dá para tentar de novo. O contrário deixaria arquivos
// públicos sem dona e sem como achar a pasta pelo app.

// Buckets com pasta por usuária. 'avatares' vem da 04 (PR #60); enquanto a
// 04 não estiver aplicada, o bucket não existe e é pulado.
export const BUCKETS_DA_CONTA = ["portfolio", "avatares"] as const;

// Tamanho da página do list() e do lote do remove() da API do Storage.
export const LOTE = 100;

type Erro = { message: string; statusCode?: string | number; status?: number } | null;

// Só o que a função usa do SupabaseClient (o real satisfaz este tipo).
export interface ClienteAdmin {
  storage: {
    from(bucket: string): {
      list(
        pasta: string,
        opcoes: { limit: number; offset: number },
      ): Promise<{ data: { name: string; id: string | null }[] | null; error: Erro }>;
      remove(caminhos: string[]): Promise<{ data: unknown; error: Erro }>;
    };
  };
  auth: {
    admin: {
      deleteUser(id: string): Promise<{ error: Erro }>;
    };
  };
}

export type Resultado =
  | { ok: true; arquivosApagados: number }
  | { ok: false; etapa: "storage" | "usuario"; bucket?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function bucketInexistente(erro: NonNullable<Erro>): boolean {
  return (
    String(erro.statusCode) === "404" ||
    erro.status === 404 ||
    /bucket not found/i.test(erro.message)
  );
}

// Lista todos os arquivos de '<id>/' (as policies só deixam um nível).
// Itens com id null são pastas: não existem pelo app, mas entram na
// listagem recursiva para não sobrar nada.
async function listarPasta(
  admin: ClienteAdmin,
  bucket: string,
  pasta: string,
): Promise<{ caminhos: string[] } | { erro: NonNullable<Erro> }> {
  const caminhos: string[] = [];
  for (let offset = 0; ; offset += LOTE) {
    const { data, error } = await admin.storage.from(bucket).list(pasta, { limit: LOTE, offset });
    if (error) return { erro: error };
    const itens = data ?? [];
    for (const item of itens) {
      const caminho = `${pasta}/${item.name}`;
      if (item.id === null) {
        const sub = await listarPasta(admin, bucket, caminho);
        if ("erro" in sub) return sub;
        caminhos.push(...sub.caminhos);
      } else {
        caminhos.push(caminho);
      }
    }
    if (itens.length < LOTE) return { caminhos };
  }
}

export async function excluirConta(admin: ClienteAdmin, usuarioId: string): Promise<Resultado> {
  // O id vem do token validado, mas vira prefixo de caminho: nada além de UUID.
  if (!UUID.test(usuarioId)) return { ok: false, etapa: "usuario" };

  let arquivosApagados = 0;
  for (const bucket of BUCKETS_DA_CONTA) {
    const lista = await listarPasta(admin, bucket, usuarioId);
    if ("erro" in lista) {
      if (bucketInexistente(lista.erro)) continue;
      return { ok: false, etapa: "storage", bucket };
    }
    for (let i = 0; i < lista.caminhos.length; i += LOTE) {
      const lote = lista.caminhos.slice(i, i + LOTE);
      const { error } = await admin.storage.from(bucket).remove(lote);
      if (error) return { ok: false, etapa: "storage", bucket };
      arquivosApagados += lote.length;
    }
  }

  // Cascade da 01: perfis, servicos_prestadora e fotos_portfolio saem junto.
  const { error } = await admin.auth.admin.deleteUser(usuarioId);
  if (error) return { ok: false, etapa: "usuario" };
  return { ok: true, arquivosApagados };
}
