# Decisões do time

**Time:** Rodrigo Porto (`Rodrigo-Angelo-Porto`, P1, identidade), Sofia Marques
(`sofiaomarques`, P2, descoberta) e Pedro Macedo (`phmcd-bit`, P3, chat).

Este arquivo acompanha o projeto. Comecem com o que já sabem e atualizem quando
as decisões mudarem.

## Produto

- **Público:** mulheres que moram sozinhas e precisam de um serviço de casa
  (ar-condicionado, elétrica, encanamento, montagem de móveis, pequenos
  reparos) e as mulheres que prestam esses serviços. Começamos por João
  Pessoa: o seed e a demo são de lá.
- **Problema** (nossa hipótese, sem pesquisa formal): quem mora sozinha
  precisa abrir a porta de casa para um desconhecido. Hoje ela procura por
  indicação solta, em grupo de mensagens ou em site genérico, sem saber se a
  pessoa é de confiança, se outras mulheres já contrataram, nem quanto vai
  custar antes de chamar.
- **Como a rede resolve:** reúne prestadoras mulheres (a rede é feita por e
  para mulheres; nesta versão o cadastro não confere gênero), que a cliente
  acha por serviço e cidade, com avaliações públicas de outras clientes e o
  preço base de cada serviço. O orçamento é pedido no chat, com respostas
  prontas. E dá para seguir as amigas e ver em quem elas confiam.
- **Como saberíamos que funcionou:** uma cliente pede orçamento pelo chat a
  uma prestadora que viu nas indicações de uma amiga e, depois do serviço,
  deixa a própria avaliação, que passa a aparecer para quem segue essa
  cliente. Dá para aproximar isso no banco: a cliente segue uma amiga que já
  avaliou a prestadora (`seguidores.criado_em`, `avaliacoes.criada_em`),
  depois abre conversa com ela (`conversas.criada_em`) e, mais tarde, deixa a
  própria avaliação.

## Decisões de produto

### A avaliação é o "post" da rede, e não há curtidas (#26, #81)

- **Contexto:** uma rede social costuma ter post livre, curtida e comentário.
  Aqui o que interessa é: "essa prestadora é de confiança, e eu recomendo?".
- **Opções:** post livre com curtidas e comentários; ou um post com forma
  fixa, a avaliação (nota de 1 a 5 e comentário) de uma cliente sobre uma
  prestadora.
- **Escolha:** a avaliação é o post. É pública, uma por cliente para cada
  prestadora (`unique` na 02) e só a autora edita. Ela aparece na página da
  prestadora, nas indicações da cliente e no feed de quem a segue.
- **O que cortamos e por quê:** post livre, curtidas e comentários. Uma
  curtida não diz se o serviço foi bom, e a nota diz. Com uma avaliação por
  cliente, uma mesma conta não infla a nota repetindo avaliações. Também não
  exigimos conversa nem serviço fechado antes de avaliar: qualquer cliente
  avalia qualquer prestadora.

### O papel é escolhido uma vez: cliente ou prestadora (#14)

- **Contexto:** a mesma pessoa poderia querer contratar e prestar serviço.
- **Opções:** uma conta com os dois papéis; ou um papel escolhido no
  onboarding e fixo.
- **Escolha:** papel fixo. O onboarding pede cliente ou prestadora uma vez, e
  um trigger da 01 recusa a troca. Só cliente avalia e só prestadora recebe
  avaliação (policies da 02).
- **O que cortamos e por quê:** a conta com os dois papéis. Sem a troca, as
  avaliações ficam coerentes: as que uma prestadora recebeu não passam a
  pertencer a uma cliente, e as que uma cliente escreveu não passam a ser de
  uma prestadora. Quem também presta serviço cria outra conta.

### Excluir a conta apaga tudo dela (#46)

- **Contexto:** a Edge Function `excluir-conta` apaga os arquivos da conta no
  Storage e depois chama `auth.admin.deleteUser`. Todas as FKs para `perfis`
  são `on delete cascade`, então a exclusão leva junto: perfil, serviços e
  fotos do portfólio (01); as avaliações que a conta escreveu **e** as que
  recebeu (02); as conversas dela e todas as mensagens dessas conversas,
  inclusive as da outra pessoa (03).
- **Opções:** apagar tudo em cascata; ou manter avaliações e conversas
  anonimizadas ("Conta excluída"), trocando as FKs para `on delete set null`.
- **Escolha:** apagar tudo, como o banco já faz. Quem sai não deixa nome,
  nota nem mensagem para trás, e não precisamos tratar autora nula em
  `avaliacoes_publicas`, `prestadoras_resumo` nem no chat.
- **O que cortamos e por quê:** a estabilidade da nota. Se uma cliente exclui
  a conta, as avaliações dela somem e a nota média e o total de avaliações da
  prestadora mudam. A outra pessoa da conversa perde o histórico. O botão
  "Excluir conta" precisa avisar isso antes de confirmar. Para mudar de ideia,
  basta uma migration trocando as FKs de `avaliacoes`, `conversas` e
  `mensagens`.

### Nome e foto das clientes aparecem para quem tem conta (#78, PR 83)

- **Contexto:** para seguir amigas e ver as indicações delas, a cliente precisa
  ser achada pelo nome. Na 01 o perfil da cliente só é legível pela dona, e a
  `avaliacoes_publicas` (02) já mostra a anon o nome e a foto de quem avaliou.
- **Opções:** (a) qualquer conta com papel acha qualquer cliente pelo nome;
  (b) a busca acha só prestadoras e clientes já conectadas; (c) a cliente liga,
  por opção, "meu perfil aparece na rede".
- **Escolha:** (a), na migration 06. As views `pessoas_publicas` e
  `seguidores_publicos` expõem só nome, foto e papel, e só para quem já tem
  papel (`tem_papel(auth.uid())`); o cadastro é aberto, então sem esse filtro
  uma conta nova listaria todas. A tabela `seguidores` só deixa cada conta ler
  as próprias linhas. **Confirmada pelo grupo** (27/11): nome e foto das
  clientes podem ser vistos por quem tem conta e papel.
- **O que cortamos e por quê:** a privacidade total do nome. Bio e cidade
  continuam privadas.
- **Armadilha:** as duas views são `security definer` de propósito (avisos do
  advisor são esperados). `tem_papel` precisa continuar executável por
  `authenticated`: as views e a policy de insert a chamam com o papel de quem
  consulta, e revogá-la quebra as duas.

### Feed: só as indicações de quem eu sigo, em ordem cronológica (#81)

- **Contexto:** a rubrica pede follow → feed, e a cliente segue as amigas para
  saber em quem elas confiam.
- **Opções:** feed com indicações de toda a rede, ranqueado por nota; ou só de
  quem eu sigo, mais recentes primeiro.
- **Escolha:** só de quem eu sigo, cronológico, na aba **Indicações**. Não
  precisou de migration: lê as minhas linhas de `seguidores` (a RLS da 06 só
  mostra essas) e busca em `avaliacoes_publicas` (02).
- **O que cortamos e por quê:** o ranqueamento e as indicações de quem eu não
  sigo. A busca já ordena prestadoras por nota; o feed responde outra pergunta,
  "o que minhas amigas indicaram". O feed olha as últimas 200 pessoas
  seguidas e mostra até 50 indicações, sem paginação.

## Features

Números com # são issues; com "PR", pull requests (quando não houve issue).

| Feature | Dono | Por quê (1 frase) |
|---|---|---|
| Auth (núcleo): cadastro, login, onboarding com papel, rotas protegidas | Rodrigo (#14, #15) | Sem conta não há quem avalie nem com quem conversar; o papel separa quem contrata de quem presta. |
| Posts (núcleo): a avaliação, com nota de 1 a 5 e comentário | Sofia (#26) | É a recomendação de uma mulher para outra, o que dá confiança para abrir a porta de casa. |
| Feed (núcleo): indicações de quem eu sigo | Sofia (#81) | Responde "em quem minhas amigas confiam?", em ordem cronológica. |
| Perfil (núcleo): perfil, edição, avatar e fotos dos trabalhos | Rodrigo (#16, #17, #18) | A prestadora mostra o que faz e o resultado; a cliente mostra só nome e foto. |
| Follow (núcleo): seguir pessoas, seguidores e seguindo | Sofia (#78, #79, #80) | A cliente segue as amigas para ver as indicações delas. |
| Curtidas (núcleo) | Não entrou | Uma curtida não diz se o serviço foi bom; a nota diz (ver "A avaliação é o post da rede"). |
| Comentários (núcleo): o comentário da avaliação | Sofia (#26) | O comentário fica preso à avaliação, que é uma por cliente; não há comentário solto. |
| Seed fake (núcleo): contas, avaliações, conversas, preços e seguidores da demo | Pedro (#40); preços, Rodrigo (PR #74); seguidores, Sofia (#82) | O nicho aparece na demo: prestadoras de João Pessoa, clientes que moram sozinhas ou acabaram de se mudar, conversas de orçamento. |
| Busca de prestadoras por serviço e cidade, por nota ou menor preço | Sofia (#24); preço, Rodrigo (PR #74) | É como a cliente acha quem atende o serviço dela, na cidade dela. |
| Página pública da prestadora | Sofia (#25) | Junta serviços, preços, fotos e avaliações antes de chamar. |
| Preço base por serviço e "aceito negociar" | Rodrigo (PR #74) | A cliente sabe quanto custa antes de pedir orçamento. |
| Chat em tempo real com "Pedir orçamento" | Pedro (#34 a #39) | O orçamento é pedido e combinado dentro da rede; a resposta pronta ensina o que perguntar. |
| Não lidas na aba Conversas | Pedro (#38) | A prestadora vê que chegou pedido novo. |
| Deploy na Vercel com Supabase | Rodrigo (#11), Sofia (#58) | A banca testa na URL pública. |

## Uma escolha técnica

### Seguir e feed: as consultas andam pelos índices (06 e 02)

As três perguntas da rede de seguidores são "quem eu sigo", "quem me segue" e
"o que as pessoas que eu sigo indicaram". Cada uma tem um índice próprio, para
não varrer a tabela inteira:

| Pergunta | Índice | Custo (n linhas de `seguidores`, a linhas de `avaliacoes`, k resultados) |
|---|---|---|
| Quem eu sigo (`idsQueSigo`, `euSigo`, lista "seguindo") | chave primária `(seguidora_id, seguida_id)` | O(log n + k) para achar (`euSigo` é uma busca por ponto, O(log n)); a ordem por data não sai da chave, então as k linhas são ordenadas |
| Quem me segue, mais recentes primeiro (lista "seguidores") | `seguidores_seguida_id_idx (seguida_id, criado_em desc)` | O(log n + k), já na ordem; a view junta nome e foto pela chave de `perfis` |
| Números de seguidores e seguindo (`contar_seguidores`) | os dois acima | O(log n + k) cada contagem |
| Indicações de quem eu sigo (feed) | `avaliacoes_cliente_id_idx (cliente_id)` (02) | O(s · log a + r) para as s pessoas seguidas, mais a ordenação das r avaliações encontradas |

O feed não precisou de tabela nova: são duas consultas, primeiro quem eu sigo
(até 200), depois as avaliações dessas pessoas (até 50), sem copiar dado
nenhum. Como a tabela `seguidores` só deixa cada conta ler as próprias
linhas, a primeira consulta só devolve as linhas da própria conta, mesmo que o
filtro do front falhasse.

**Se a rede crescesse 100 vezes:**
- A lista de ids vai na URL da segunda consulta. Com 200 pessoas seguidas ela
  já tem uns 7.900 caracteres, perto do `urlLengthLimit` padrão do
  `postgrest-js` (8.000), acima do qual ele sugere trocar o `.in()` por uma
  função no banco quando a requisição falha. Faríamos isso: uma função que
  junta `seguidores` com `avaliacoes` e devolve as 50 mais recentes.
- Essa função usaria um índice `(cliente_id, criada_em desc)` em `avaliacoes`
  para pegar só as 50 mais recentes de cada pessoa seguida (`LATERAL ...
  LIMIT 50`) antes de juntar, em vez de ler todas as avaliações delas.
- `contar_seguidores` conta linhas a cada visita a um perfil. Com muitos
  seguidores, guardaríamos os dois números numa coluna atualizada por trigger.

## Deploy

- **URL pública:** https://miniprojeto3-phi.vercel.app
- **Onde roda:** o front (Next) na Vercel, com Root Directory `frontend`. Auth,
  banco e arquivos ficam no Supabase.
- **Por que sem Render:** o guia 08 usa o Render para hospedar o backend
  FastAPI do modelo. Este projeto não usa esse backend: o front fala direto com
  o Supabase usando a chave publishable, e quem protege os dados é a RLS do
  banco. Sem servidor próprio, não há nada para subir no Render.
- **Variáveis na Vercel:** `NEXT_PUBLIC_SUPABASE_URL` e
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A `NEXT_PUBLIC_USE_MOCKS` só é
  ignorada no deploy de produção, então a URL pública sempre usa o Supabase de
  verdade. Nos previews de PR ela continua valendo: deixem sem definir (ou
  `false`) na Vercel para o preview também usar o banco.
- **Banco:** as migrations 01 a 06 precisam estar aplicadas, em ordem, no
  Supabase compartilhado (são aplicadas à mão, por alguém do time). Sem a 03
  o chat não funciona, sem a 05 a busca por menor preço dá erro e sem a 06
  não há seguir nem feed. Os seeds da demo
  (`seed-demo.sql`, depois `seed-demo-precos.sql` e `seed-demo-seguidores.sql`)
  preparam as contas. O Supabase compartilhado é o banco da demo, por isso os
  seeds rodam nele. O que já foi aplicado, e quando, fica marcado em
  `docs/checklist-deploy.md`.
- **Para conferir:** cadastro → entrar → buscar prestadora → abrir o perfil →
  avaliar (o "post") → seguir uma amiga → ver a aba Indicações (o feed) →
  chat.

## Testes de RLS

### Avaliações com duas contas (#28)

- **Arquivo:** `supabase/tests/database/02_descoberta.test.sql` (pgTAP, roda
  numa transação com rollback). Rodar com `supabase start && supabase test db`.
- **Contas:** clientes A e B, prestadoras P e Q, conta sem papel N.
  `auth.uid()` é simulado via `request.jwt.claims`, como o PostgREST faz.
- **Resultado (24/11):** 53/53 ok. Rodado em Postgres 16 local com pgTAP e um
  shim mínimo do Supabase (papéis `anon`/`authenticated`, `auth.uid()`); a
  `01_identidade.test.sql` passou 95/95 no mesmo ambiente.

| Tentativa | Resultado |
|---|---|
| A edita/apaga a avaliação de B | bloqueado pela RLS (0 linhas; conferido como admin) |
| A troca `cliente_id` da avaliação de B para si | `42501` (sem GRANT na coluna) |
| A insere avaliação com `cliente_id` de B | `42501` (policy de insert) |
| A avalia outra cliente, conta sem papel, perfil inexistente ou a si mesma | `42501` |
| Prestadora P avalia Q; conta sem papel N avalia P | `42501` |
| P cria 5 estrelas para si em nome de A | `42501` |
| P apaga/edita avaliações sobre ela | bloqueado pela RLS (0 linhas) |
| Segunda avaliação de A para P | `23505` (`UNIQUE`) |
| Nota 0, 6, 9 (no update) ou nula; comentário > 1000 caracteres | `23514` / `23502` |
| Forjar `criada_em` ou mover a avaliação para outra prestadora | `42501` (GRANT só em `nota` e `comentario`) |
| anon insere, edita, apaga ou chama `perfil_tem_papel` | `42501` |
| anon lê `avaliacoes`, `avaliacoes_publicas` e `prestadoras_resumo` | ok (média, total e busca por cidade sem acento conferidos) |
| anon lê perfis de clientes | 0 linhas; a view só expõe nome e avatar da autora |

Para garantir que o teste pega erro de verdade, afrouxamos as policies de
insert e delete numa cópia: 8 testes falharam, como esperado. Afrouxando as de
update e delete (`using (true)`), 13 falharam: as tentativas em linha alheia
usam `returning id` + `is_empty`, então falham na hora, e não só na conferência
como admin.

As contagens são filtradas pelas contas de teste: o teste continua passando se
o banco local já tiver contas e avaliações criadas usando o app.

### Perfis e fotos com duas contas (#19)

- **Arquivo:** `supabase/tests/database/01_identidade_duas_contas.test.sql`
  (pgTAP, transação com rollback). Rodar com `supabase start && supabase test db`.
- **Contas:** cliente Ana, prestadoras Bia e Cris. `auth.uid()` simulado via
  `request.jwt.claims`.
- **Resultado (24/11):** 26/26 ok em Postgres 17.12 local (imagem do
  Supabase) com a 01 e a 02; no mesmo ambiente, `01_identidade.test.sql` 96/96
  e `02_descoberta.test.sql` 53/53. As mesmas tentativas também foram feitas no
  Supabase compartilhado, com contas temporárias numa transação desfeita: mesmo
  resultado, nada ficou gravado.

| Tentativa | Resultado |
|---|---|
| Ana (cliente) edita nome, bio, cidade ou avatar da Bia | bloqueado pela RLS (0 linhas) |
| Ana ou Cris sobem arquivo na pasta da Bia no bucket `portfolio` | `42501` (policy do Storage) |
| Ana ou Cris apagam arquivo da pasta da Bia | bloqueado (0 linhas) |
| Ana ou Cris registram foto em nome da Bia | `42501` |
| Ana ou Cris apagam foto ou serviço da Bia | bloqueado pela RLS (0 linhas) |
| Bia edita ou lê o perfil da Ana (cliente) | 0 linhas: perfil de cliente não é público |
| Cris sobe arquivo na própria pasta (controle) | ok |
| sem login lê perfil, fotos e serviços da Bia | ok (vitrine pública) |
| sem login lê o perfil da Ana | 0 linhas |
| sem login lista o bucket `portfolio` | 0 linhas: a foto abre só pelo link público |

Ao final, como admin: perfil, foto e arquivo da Bia continuam iguais.

Para garantir que o teste pega erro de verdade, afrouxamos três policies numa
cópia (update de `perfis`, delete de `fotos_portfolio` e upload no
`portfolio`): 11 testes falharam, como esperado. No Supabase compartilhado o
delete direto em `storage.objects` é bloqueado pelo próprio Storage
(`protect_delete`), então apagar arquivo alheio foi conferido no banco local.

## Uso de IA

- **Ferramenta:** Claude Code (Claude, da Anthropic), usado pelas três
  pessoas do time.
- **Para quê:**
  - escrever código e SQL a partir das issues de cada área: migrations,
    services, telas e seeds;
  - escrever os testes (vitest e pgTAP);
  - revisar diffs e PRs, às vezes com um segundo agente conferindo a revisão;
  - conferir as telas no navegador;
  - aplicar migrations e seeds no Supabase compartilhado, com alguém do time
    pedindo e conferindo;
  - redigir documentos: roteiro da demo, checklist de deploy e este arquivo.
- **O que ficou com o time:** escolher o nicho, as features e as decisões
  deste arquivo; revisar e testar os PRs uns dos outros; e decidir o que
  entra e o que fica de fora.
