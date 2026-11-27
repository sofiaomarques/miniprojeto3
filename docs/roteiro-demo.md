# Roteiro da demo (vídeo de ~4 min)

Roteiro para gravar o vídeo e para ensaiar a apresentação. Usa as contas do
`supabase/seed-demo.sql` (senha de todas: `demo12345`) na URL pública
https://miniprojeto3-phi.vercel.app.

**Antes de gravar:** siga o [checklist de deploy](checklist-deploy.md). Sem o
seed aplicado no Supabase, a busca aparece vazia.

## Preparação (fora do vídeo)

- **Navegador A** (janela normal): sem login, na página inicial.
- **Navegador B** (janela anônima): já entrando como `marina@demo.test`, na
  aba **Conversas**.
- Tamanho de celular (F12 → modo dispositivo, 390 px) ou o próprio celular.
  O app também funciona no computador; escolham um formato e mantenham.
- Para o cadastro, um e-mail novo que vocês consigam abrir (ou desliguem a
  confirmação de e-mail no Supabase; ver o checklist).

## O roteiro

| Tempo | Tela | O que fazer | O que falar |
|---|---|---|---|
| 0:00–0:20 | Início (A) | Mostrar a busca com as prestadoras de João Pessoa. | "A Rede de Mulheres liga mulheres que moram sozinhas a prestadoras de serviços de casa: ar-condicionado, elétrica, encanamento, montagem de móveis." |
| 0:20–0:50 | Cadastro → onboarding (A) | **Criar conta** com nome, e-mail e senha (mostrar o olho da senha). No onboarding, escolher **Sou cliente**. | "O cadastro pede o papel uma vez só: cliente ou prestadora. Depois disso ele não muda, para ninguém trocar de lado e ganhar avaliação." |
| 0:50–1:20 | Busca (A) | Tocar no filtro **Ar-condicionado** e digitar "João Pessoa" na cidade. Mostrar que a lista já vem por **Melhor nota**; tocar em **Menor preço** para ver os preços e o selo **Negociável**. | "A busca filtra por serviço e cidade, mostra primeiro quem tem melhor nota pública e deixa comparar o preço base de cada uma." |
| 1:20–1:50 | Perfil da Marina (A) | Abrir **Marina Souza**: serviços, cidade, nota 4,5 e as duas avaliações. | "Toda prestadora tem perfil público com as avaliações de outras mulheres. É isso que dá confiança para abrir a porta de casa." |
| 1:50–2:40 | Chat (A e B lado a lado) | Em A, tocar **Conversar e pedir orçamento** e depois **Pedir orçamento**: o campo vem preenchido com Serviço/Bairro/Data. Enviar. Em B (Marina, na lista de **Conversas**), a conversa nova aparece no topo **sem recarregar**, com o número de não lidas. Marina abre a conversa e responde com **Enviar orçamento**; em A, a resposta chega sozinha. | **Feature forte 1:** "O chat é em tempo real e tem respostas prontas para orçamento: a cliente não precisa saber o que perguntar." |
| 2:40–3:10 | Avaliar (A) | Voltar ao perfil da Marina → **Já foi atendida? Avaliar Marina** → 5 estrelas, comentário curto, **Publicar avaliação**. A nota da Marina muda na hora. | **Feature forte 2:** "A avaliação é pública e uma por cliente; dá para editar depois, não para avaliar duas vezes." |
| 3:10–3:40 | Perfil (A) e explicação | Abrir a aba **Perfil** da cliente: perfil, **Editar perfil** e **Minhas indicações**. | **Decisão de produto:** "O perfil da cliente não é público. Só a prestadora com quem ela conversa vê o nome e a foto, nada de bio ou bairro. Para quem mora sozinha, expor onde mora seria um risco." |
| 3:40–4:00 | Fechamento | Voltar para a busca (casinha ou aba **Buscar**). | "Mulheres que contratam mulheres, com confiança e avaliações públicas. Obrigado!" |

## Se algo der errado na hora

- **Busca vazia:** o seed não foi aplicado. Rodem o `seed-demo.sql` (checklist)
  e recarreguem.
- **Mensagem não chega sozinha:** o chat tem plano B. Ele consulta de novo a
  cada poucos segundos, então a mensagem aparece mesmo sem o Realtime. Esperem
  uns 3 segundos antes de cortar a cena.
- **Cadastro pede confirmação de e-mail:** usem uma conta pronta
  (`beatriz@demo.test`) e mostrem o cadastro só até o envio. **Com a Beatriz,
  troquem a Marina pela Camila Ribeiro** de 1:20 a 3:10 (janela B com
  `camila@demo.test`): no seed, a Beatriz já conversa com a Marina e já a
  avaliou, então lá apareceria "Editar sua avaliação" e a conversa antiga.
- **"Menor preço" dá erro ou tudo aparece "a combinar":** falta a migration
  05 ou o `seed-demo-precos.sql` (checklist). Fiquem em **Melhor nota**.
- **Alguém mexeu nas contas da demo:** rodar o `seed-demo.sql` de novo volta
  tudo (e desloga quem estiver nelas); logo depois, o `seed-demo-precos.sql`.

## Ensaio para o pitch (3 min, ao vivo)

A mesma ordem, mais curta: busca → perfil da prestadora → **Conversar e pedir
orçamento** → mensagem chegando na outra janela → avaliação. Cerca de 1 minuto
de demo no meio do pitch. Ao vivo, o mais seguro é `beatriz@demo.test` com a
**Camila Ribeiro** (janela anônima com `camila@demo.test`), pelo mesmo motivo
do item acima.

**Slides do pitch:** https://claude.ai/artifact/RZ2FopTmZ6L6Cv3bfE8amV (8 slides:
capa, público, problema, solução, demo, decisões, o que ficou de fora,
fechamento; cada um tem notas de fala com o tempo). Os trechos entre colchetes
são para o time confirmar. Tempo total: cerca de 3 min.
