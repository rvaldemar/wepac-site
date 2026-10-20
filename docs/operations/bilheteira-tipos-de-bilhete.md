# Bilheteira: tipos de bilhete, estados e landing de evento

## Tipos de bilhete (admin → evento → Editar bilhete)

| Tipo | Regra | Exemplo |
|---|---|---|
| Individual | Preço por lugar; o comprador escolhe 1 a N lugares | Público 25 €, Concerto 10 € |
| Pacote | Preço fixo por pacote com N lugares; conta N lugares na lotação e no check-in | Concerto a Dois (15 € / 2), Família (20 € / 4) |
| Grupo | Preço por lugar escondido, mínimo obrigatório, mostra «a partir de» (mínimo × preço) | Pack Escola (15 €, mín. 10 → «a partir de 150 €») |
| Fase | Sequência (`phaseGroup`) ordenada (`phaseOrder`); a seguinte abre quando a anterior esgota ou quando a equipa a fecha à mão (estado forçado «Vendas encerradas» ou «Esgotado»). Sem quantidade, a passagem é sempre manual | Artista Early Bird → Second Wave → Last Call |
| Pedido | Sem pagamento: botão leva à página `/bilheteira/[evento]/pedido/[bilhete]` (ou a um link externo); a equipa aprova no admin e a aprovação emite o bilhete | Acreditação Key Players da Cultura |

## Estados (calculados em `src/lib/bilheteira/tier-state.ts`)

Ordem de avaliação: arquivado → estado forçado (esgotado/encerrado) → fecho das vendas → fase anterior ainda aberta → abertura das vendas → quantidade do bilhete → pedido → lotação do evento → à venda.

| Estado | Público vê |
|---|---|
| À venda | Botão «Escolher» |
| Esgotado | Riscado, «Esgotado», sem compra |
| Bloqueado | «Em breve» com cadeado e a frase configurada |
| Encerrado | «Vendas encerradas» |
| Pedido | Cartão com botão para a página de pedido |

A reserva (`reserve-action.ts`) usa a mesma máquina de estados: nenhuma compra passa num bilhete que não esteja «À venda», mesmo com POST forjado. Lugares pendentes de pagamento contam durante 30 minutos.

Fases do festival: sem quantidade, abertas e fechadas à mão. Para passar à fase seguinte, pôr a fase atual em «Vendas encerradas» (ou «Esgotado» se esgotou de facto); a seguinte abre sozinha. Não usar «Esgotado» num bilhete que não esgotou.

## Email de confirmação

Por bilhete: nota, texto e link de botão. Por evento: nota geral. Campos: `{{nome}}`, `{{email}}`, `{{bilhete}}`, `{{evento}}`, `{{tipo}}`, `{{lugares}}`. Nos links os valores são codificados, o que permite pré-preencher formulários (`https://forms…/?bilhete={{bilhete}}&email={{email}}`). O editor do bilhete mostra a pré-visualização e envia um email de teste ao admin.

## Landing do evento

Admin → evento → «Página do evento»: destaque no índice, descrição para Google/partilhas, imagem de partilha, programa (uma linha por momento: `10h00 | Título | descrição`), FAQ (pergunta na primeira linha, resposta a seguir, linha em branco entre perguntas), como chegar, mapa, nota geral do email e convidados com data de revelação (cada nome só aparece a partir dessa hora de Lisboa).

A descrição do evento (detalhes do evento) é markdown.

## Medição

- UTM da visita guardados na sessão e enviados para a metadata do pagamento Stripe.
- Meta Pixel (ViewContent, InitiateCheckout, Purchase) só com `NEXT_PUBLIC_META_PIXEL_ID` definido e depois de o visitante aceitar cookies.
- Códigos de desconto (ex.: WEPACker −25 %) criam-se no Stripe; o checkout aceita-os.

## Festival 21 nov 2026

`scripts/seed-festival-21-nov-2026.ts` cria/atualiza o evento (em rascunho) e os 11 bilhetes. Lotação única de 120 lugares para todo o evento, sem limites por bilhete; fases do Artista com passagem manual. Por env: `CAPACITY`.

Opcional: `BILHETEIRA_REQUESTS_INBOX` define o email que recebe o aviso de novos pedidos (por omissão `SMTP_FROM`).
