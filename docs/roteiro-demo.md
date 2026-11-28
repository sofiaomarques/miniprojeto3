# Roteiro da demo (vídeo de ~4 min)

Roteiro para gravar o vídeo e para ensaiar a apresentação. Usa as contas do
`supabase/seed-demo.sql` (senha de todas: `demo12345`) na URL pública
https://miniprojeto3-phi.vercel.app.

**Vídeo pronto:** [video-demo-repara.webm](video-demo-repara.webm) (3 min 19 s,
sem som, com legendas e zoom nos botões). Foi gravado com o site rodando
localmente no modo de teste (`NEXT_PUBLIC_USE_MOCKS=true`): por isso o
cadastro e o login aparecem preenchidos com o aviso "Modo de dados de
mentira" e não são enviados, e alguns dados diferem do seed (no modo de
teste, a Camila é de Recife e a Aline de Natal). O roteiro abaixo é para
gravar de novo na URL pública.

**Antes de gravar:** siga o [checklist de deploy](checklist-deploy.md). Sem o
seed aplicado no Supabase, a busca aparece vazia.

## Preparação (fora do vídeo)

- **Navegador A** (janela normal): sem login, na página inicial.
- **Navegador B** (janela anônima): já entrando como `marina@demo.test`, na
  aba **Conversas**.
- Tamanho de celular (F12 → modo dispositivo, 390 px) ou o próprio celular.
  O app também funciona no computador; escolham um formato e mantenham.
- Para o cadastro, um e-mail novo que vocês consigam abrir (ou desliguem a
  confirmação de e-mail no Supabase; ver o checklist). Cada ensaio precisa de
  um e-mail novo.
- **Depois de cada ensaio, rodem `seed-demo.sql` e logo depois
  `seed-demo-precos.sql`.** O ensaio conta como "mexer nas contas da demo":
  a conversa e a avaliação que ele cria apareceriam na gravação seguinte.

## O roteiro

| Tempo | Tela | O que fazer | O que falar |
|---|---|---|---|
| 0:00–0:15 | Início (A) | Mostrar a busca com as prestadoras de João Pessoa. | "A Repara liga mulheres que moram sozinhas a prestadoras de serviços de casa: ar-condicionado, elétrica, encanamento, montagem de móveis." |
| 0:15–0:40 | Cadastro → onboarding (A) | **Criar conta** com nome, e-mail e senha (mostrar o olho da senha). No onboarding, escolher **Sou cliente**. | "O cadastro pede o papel uma vez só: cliente ou prestadora. Depois disso ele não muda, para ninguém trocar de lado e ganhar avaliação." |
| 0:40–1:05 | Busca (A) | Digitar "João Pessoa" na cidade e mostrar que a lista já vem por **Melhor nota**. Tocar no filtro **Instalação de eletrodomésticos** e em **Menor preço**: aparecem a **Aline (R$ 85, Negociável)** e a **Marina (R$ 90)**. | "A busca filtra por serviço e cidade, mostra primeiro quem tem melhor nota pública e deixa comparar o preço base do mesmo serviço, e se a prestadora aceita negociar." |
| 1:05–1:25 | Perfil da Marina (A) | Abrir **Marina Souza** (está na lista do filtro): serviços com preço, cidade, nota 4,5 e as duas avaliações. | "Toda prestadora tem perfil público com as avaliações de outras mulheres. É isso que dá confiança para abrir a porta de casa." |
| 1:25–1:55 | Seguir → Indicações (A) | Na avaliação da Marina, tocar no nome **Fernanda Dias** → página dela → **Seguir**. Abrir a aba **Indicações**: aparecem as prestadoras que a Fernanda indicou (Camila e Marina). Voltar ao perfil da Marina. | **Follow e feed:** "Dá para seguir as amigas. A aba Indicações é o feed: mostra em quem as pessoas que eu sigo confiam, das mais recentes para as mais antigas." |
| 1:55–2:40 | Chat (A e B lado a lado) | Em A, tocar **Conversar e pedir orçamento** e depois **Pedir orçamento**: o campo vem preenchido com Serviço/Bairro/Data. Enviar. Em B (Marina, na lista de **Conversas**), a conversa nova aparece no topo **sem recarregar**, com o número de não lidas. Marina abre a conversa e responde com **Enviar orçamento**; em A, a resposta chega sozinha. | **Feature forte 1:** "O chat é em tempo real e tem respostas prontas para orçamento: a cliente não precisa saber o que perguntar." |
| 2:40–3:10 | Avaliar (A) | Voltar ao perfil da Marina → **Já foi atendida? Avaliar Marina** → 5 estrelas, comentário curto, **Publicar avaliação**. A nota da Marina muda na hora. | **Feature forte 2:** "A avaliação é pública e uma por cliente; dá para editar depois, não para avaliar duas vezes." |
| 3:10–3:40 | Perfil (A) e explicação | Abrir a aba **Perfil** da cliente: perfil, **Editar perfil** e **Minhas indicações**. | **Decisão de produto:** "O perfil da cliente não é público: bio e bairro só ela vê. Nome e foto aparecem só para quem tem conta e já escolheu o papel, para uma amiga achar a outra e seguir, e a cliente nunca expõe onde mora. Para quem mora sozinha, isso é um risco que não corremos." |
| 3:40–4:00 | Fechamento | Voltar para a busca (casinha ou aba **Buscar**). | "Mulheres que contratam mulheres, com confiança e avaliações públicas. Obrigado!" |

**Cronometrem o cadastro no ensaio:** 25 s para nome, e-mail, senha e
onboarding é apertado. Se passar, tirem o tempo da busca (0:40–1:05), que é o
trecho mais fácil de encurtar.

## Se algo der errado na hora

- **Busca vazia:** o seed não foi aplicado. Rodem o `seed-demo.sql` (checklist)
  e recarreguem.
- **Mensagem não chega sozinha:** o chat tem plano B. Ele consulta de novo a
  cada poucos segundos, então a mensagem aparece mesmo sem o Realtime. Esperem
  uns 3 segundos antes de cortar a cena.
- **Cadastro pede confirmação de e-mail:** usem uma conta pronta
  (`beatriz@demo.test`) e mostrem o cadastro só até o envio. Com a Beatriz,
  o caminho muda um pouco (janela B com `camila@demo.test`):
  - **Busca e perfil da Marina (0:40–1:25):** iguais. A Beatriz já avaliou a
    Marina, então ali aparece **"Editar sua avaliação"** por uns segundos; é
    esperado, não parem nele.
  - **Seguir (1:25–1:55):** a Beatriz **já segue a Fernanda**, e o botão
    mostra **"Seguindo"**. **Não toquem nele** (isso deixaria de seguir e a
    aba Indicações ficaria vazia). Abram direto a aba **Indicações** e, no
    feed, toquem no card da **Camila Ribeiro**: ele abre o perfil dela.
  - **Chat e avaliação (1:55–3:10):** com a **Camila**, no lugar da Marina.
    No seed, a Beatriz já conversa com a Marina e já a avaliou, então lá
    apareceria a conversa antiga e "Editar sua avaliação".
- **"Menor preço" dá erro ou tudo aparece "a combinar":** falta a migration
  05 ou o `seed-demo-precos.sql` (checklist). Fiquem em **Melhor nota**.
- **Alguém mexeu nas contas da demo:** rodar o `seed-demo.sql` de novo volta
  tudo (e desloga quem estiver nelas); logo depois, o `seed-demo-precos.sql`.

## Ensaio para o pitch (3 min, ao vivo)

A mesma ordem, mais curta: busca → aba **Indicações** (o feed de quem eu
sigo) → card da **Camila Ribeiro** no feed, que abre o perfil dela →
**Conversar e pedir orçamento** → mensagem chegando na outra janela →
avaliação. Cerca de 1 minuto de demo no meio do pitch. Ao vivo, o mais seguro
é `beatriz@demo.test` com a **Camila** (janela anônima com
`camila@demo.test`), pelo mesmo motivo do item acima.

**Slides do pitch:** [docs/slides-repara.pdf](slides-repara.pdf) (8 slides:
capa, público, problema, solução, demo, decisões, o que ficou de fora,
fechamento). A versão editável, com notas de fala e o tempo de cada slide,
está em https://claude.ai/artifact/RZ2FopTmZ6L6Cv3bfE8amV. Tempo total:
cerca de 3 min.
