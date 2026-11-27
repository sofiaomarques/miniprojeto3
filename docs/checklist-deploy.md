# Checklist de deploy

Para deixar a URL pública (https://miniprojeto3-phi.vercel.app) pronta para a
banca e para cada ensaio. Marquem na ordem.

## Uma vez (antes da entrega)

### Supabase (projeto compartilhado)
- [ ] **Migrations aplicadas, em ordem:** `01_identidade.sql`, `02_descoberta.sql`,
      `03_chat.sql`, `04_avatares.sql` e `05_precos_servicos.sql` (SQL Editor →
      colar o arquivo → Run). A 01 a 04 já estavam aplicadas em 26/11. A 05
      (preços, #74) entra depois do merge do #74: sem ela, a ordem "Menor
      preço" da busca dá erro.
- [ ] **Realtime do chat:** em Database → Publications → `supabase_realtime`,
      `mensagens` e `conversas` aparecem (a 03 faz isso; só conferir).
- [ ] **Seed da demo:** rodar `supabase/seed-demo.sql` no SQL Editor. Conferir
      na URL pública: a busca mostra Marina, Camila, Joana e Aline.
      *Aplicado em 26/11: a busca mostra as 4 prestadoras da demo.*
- [ ] **Preços da demo:** depois do `seed-demo.sql` e da 05, rodar
      `supabase/seed-demo-precos.sql`. Conferir na busca: a Marina aparece com
      "R$ 150" (sem ele, todas aparecem "Preço a combinar").
- [ ] **Contas de teste soltas:** apagar as contas criadas em testes manuais
      em Authentication → Users, para a busca mostrar só o nicho (a
      "testeprestadora" já saiu em 26/11; repetir antes da entrega se alguém
      criar outra).
- [ ] **Auth → URL Configuration:** Site URL = `https://miniprojeto3-phi.vercel.app`
      e a mesma URL em Redirect URLs (o link de confirmação de e-mail volta
      para cá, e não para `localhost`).
- [ ] **Confirmação de e-mail:** decidir. Ligada, quem se cadastra precisa
      abrir o e-mail antes de entrar (o vídeo precisa de um e-mail de verdade).
      Desligada (Auth → Providers → Email → Confirm email), o cadastro entra
      direto.

### Vercel
- [ ] **Variáveis (Settings → Environment Variables, ambiente Production):**
      `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
      (a chave **publishable**, nunca a secret ou a service_role).
- [ ] **`NEXT_PUBLIC_USE_MOCKS`:** em produção ela é ignorada (o código usa o
      Supabase sempre que `NEXT_PUBLIC_VERCEL_ENV=production`), mas deixem sem
      definir ou `false`, para os previews de PR também usarem o banco.
- [ ] **Último deploy da `main` verde:** na aba Deployments, o mais recente da
      `main` está "Ready". Se estiver "Error", abram o log, porque nada novo vai
      para o ar até corrigir (aconteceu com o #56, corrigido no #75).

## Antes de cada ensaio e da apresentação

- [ ] **Acordar o Supabase:** projeto gratuito pausa depois de dias sem uso.
      Abrir o painel do Supabase e conferir se está "Active" (se estiver
      pausado, clicar em Restore e esperar uns minutos).
- [ ] **Abrir a URL pública** e ver a busca carregando as prestadoras.
- [ ] **Entrar com `marina@demo.test` / `demo12345`** e ver as conversas.
- [ ] **Se alguém mexeu nas contas da demo** (o repositório é público e a senha
      está no README), rodar o `seed-demo.sql` de novo: ele volta perfis,
      senhas, avaliações e conversas, e desloga quem estiver nelas. As fotos e
      o avatar enviados pelo site continuam. **Logo depois, rodar o
      `seed-demo-precos.sql`**: o `seed-demo.sql` recria os serviços da demo
      sem preço.
- [ ] **Duas janelas prontas** (normal e anônima) para mostrar o chat em tempo
      real, como no [roteiro da demo](roteiro-demo.md).
