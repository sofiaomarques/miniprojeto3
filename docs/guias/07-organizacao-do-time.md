# Guia 07: divisão do time

São 7 times: 4 de 4 pessoas e 3 de 3. A avaliação é a mesma para todos.

## O produto é de todo mundo

Nicho, público, problema, vídeo e pitch são decisões do time inteiro. Todo
mundo opina na seção Produto do `DECISIONS.md`. Treinar o senso de produto é o
objetivo do projeto, e ele não fica com uma pessoa só.

## Ninguém fica só no front

Cada pessoa aprende mais fazendo uma feature de ponta a ponta. Por isso o dono
de uma feature faz ela inteira: backend, tela e, se usar, a estrutura em `core/`.

Além das features, cada pessoa cuida de uma área e revisa os PRs que mexem
nela:

- **Backend:** models, routers, services e `main.py`.
- **Frontend:** layout, navegação e o helper de fetch (`frontend/lib/`).
- **Dados:** seed, estruturas do `core/` e deploy.

## Time de 3

| Pessoa | Área | Núcleo |
|---|---|---|
| A | Frontend | Auth, Perfil |
| B | Backend | Posts, Feed, Curtidas, Comentários |
| C | Dados | Follow, Seed fake |


## Time de 4

| Pessoa | Área | Núcleo |
|---|---|---|
| A | Frontend | Auth |
| B | Backend | Posts, Feed, Comentários |
| C | Dados | Follow, Curtidas, Seed fake |
| D | Reforça a área mais carregada (por exemplo, deploy e testes) | Perfil |

Se sobrar tempo, vale investir no deploy, que dá bônus.

Nos dois casos, cada pessoa é dona de pelo menos uma feature. Podem trocar áreas
e features à vontade.

## Quem depende de quem

Os testes do núcleo cruzam features de donos diferentes. Olhem esta tabela
antes de dividir o trabalho:

| Teste | Precisa de |
|---|---|
| todos, menos o do seed | registro e login (guia 01, Passos 1 e 2): a fixture `logar` usa os dois |
| `test_auth_eu` | o `get_current_user` real (guia 01, Passo 3) |
| `test_posts_crud` | `POST`, `GET`, `PATCH` e `DELETE` de `/posts` |
| `test_feed_cronologico_dos_seguidos` | `POST /posts` e `POST /usuarios/{username}/follow` |
| `test_perfil_editavel` | `PATCH /usuarios/eu`, `GET /usuarios/{username}`, `GET /usuarios/{username}/posts` e `POST /posts` |
| `test_follow_unfollow_com_contadores` | follow e unfollow, e `GET /usuarios/{username}` (do Perfil) com `seguidores` e `seguindo` |
| `test_curtidas_idempotentes` | `POST /posts` e `GET /posts/{id}` com `curtidas` |
| `test_comentarios_planos_cronologicos` | `POST /posts` |
| `test_seed_fake_popula_a_rede` | os models de posts, follows e curtidas, com as tabelas `users`, `posts`, `follows` e `likes` |

Três coisas saem daí:

- **Registro e login são o gargalo.** Sem eles, nenhum teste do núcleo roda.
  Quem pegou a auth faz primeiro o backend (Passos 1 e 2 do guia 01)
  e só depois o front.
- **`POST /posts`, `GET /posts/{id}` e `GET /usuarios/{username}` destravam
  quase todo o resto.** Saem logo depois da auth, mesmo que simples. Os donos
  de Perfil e Follow combinam cedo o formato do `GET /usuarios/{username}`.
- **O seed fake vem por último**, porque precisa dos models dos outros.

## Ordem de trabalho

1. **Dia 1.** Todo mundo com `make check` verde. Escolham o nicho, comecem a
   seção Produto e a tabela de donos do `DECISIONS.md` e abram uma issue por
   feature. O arquivo muda junto com o projeto, então não precisa ficar pronto.
2. **Dias 1 e 2.** Quem pegou a auth sobe primeiro o bypass do Passo 0 do
   guia 01 (minutos) e depois faz registro e login no backend. Enquanto isso,
   os outros já escrevem models, services e rotas das suas features,
   protegendo as rotas com o bypass e testando pelo Swagger com o header
   `X-User-Id`. Os testes do núcleo destravam quando o login sair.
3. **Até o fim da primeira semana: o núcleo inteiro**, com o fluxo cadastro →
   login → post → follow → feed funcionando na tela. Quase tudo depende dele.
4. **Segunda semana:** as features que o time escolheu, seed com a cara do
   nicho, vídeo, pitch e, se der, deploy.
5. Uma branch por feature. Conflito em `main.py` é o mais comum; a receita
   está no [guia 02](02-git-em-equipe.md).
