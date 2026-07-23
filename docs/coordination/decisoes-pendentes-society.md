# Decisões pendentes — WEPAC Society (2026-07-22)

Tudo o que está por decidir do lado do Rui, num sítio só. Cada item diz onde se mexe, o que
desbloqueia, e — quando existe — a recomendação fundamentada de quem analisou.

Nada disto bloqueia o que já está em produção. Bloqueia secções que hoje simplesmente não aparecem.

---

## 1. Universidade de Verão — seis constantes a `null`

Ficheiro: `src/data/universidade-verao.ts`. Cada constante preenchida faz a respetiva secção começar
a renderizar. Nenhuma foi inventada: as secções estão ausentes, não vazias.

| Constante | O que desbloqueia |
|---|---|
| `EXACT_DATES` | O facto "Quando" no hero |
| `COST_CEILING_EUR` | A secção inteira "Quanto custa" |
| `FUNDED_PLACES_AVAILABLE` | A garantia de lugar financiado, dentro dessa secção |
| `PLACE_COUNT` | O facto "Lugares" |
| `REPLY_DATE` | O facto "Respostas até" |
| `MENTORS` | A secção "Quem te acompanha" |

### 1.1 A decisão de fundo: publicar a data?

O briefing dizia data secreta. O board recomendou o contrário, e o argumento é o mais forte do
dossiê:

> A data secreta não filtra por compromisso, filtra por agenda vazia — ou seja, por privilégio. Quem
> tem turnos, exame de recurso, trabalho de verão ou casamento de um irmão não se pode candidatar;
> quem tem agosto livre pode. E garante desistências **depois** da seleção, que é o pior modo de
> falha possível: queima-se um lugar quando já não há tempo de o repor.

Regra que propõem: **o segredo é um orçamento, não um estilo — guardam-se duas coisas, não quatro.**
Local e programa ficam secretos (*"um sítio consumido em fotografia antes de ser habitado já foi
gasto"*); data e teto de custo publicam-se.

Piso mínimo, se a data exata não puder sair: publicar uma **janela** ("um dos fins de semana entre X
e Y") e pôr no formulário um campo para marcar quais são impossíveis.

### 1.2 O custo — porque um teto, e não silêncio

Anunciar o valor só a quem é convocado põe a pessoa a saber o número no momento de máximo
compromisso público; desistir aí deixa de ser logística e passa a ser uma declaração embaraçosa.
O board escreveu a copy exata para este bloco, incluindo a garantia de lugar financiado sem
perguntas e o direito a dizer que não sem justificar. Está em
`/private/tmp/.../scratchpad/uni-proposta.md` secção 4 — vale a pena ler antes de decidir o valor.

### 1.3 "Vencedores" caiu

O board eliminou o termo por doutrina: vencedor implica concurso, concurso implica que o potencial é
prémio — e o manifesto diz o contrário na primeira página. A página usa **convocados**.

---

## 2. O nome "A Travessia"

O H1 da página é **A Travessia**, com "Universidade de Verão WEPAC Society" acima em eyebrow. Foi o
imaginário proposto pelo board — a passagem entre dois rios onde há um troço que não se rema,
carrega-se, e não se carrega sozinho — resolvendo o facto de 18-26 ser a costura entre dois stages.

O board escreveu explicitamente que **o nome é território do fundador**. Não foi aprovado por ti.
Uma palavra e sai; o H1 passa a ser o nome oficial.

---

## 3. Care — cinco condições legais

A página existe, revista e implementada, em `feat/clinica-landing` (`568f8cd`). **Não está em
produção.** O detalhe completo está em `docs/coordination/clinica-care-release-checklist.md`; em
resumo, falta: registo/licenciamento ERS, equipa com cédulas e diretor técnico identificado, morada
da V1, identificação legal do operador no rodapé, e parecer de advogado de direito da saúde.

A pergunta que decide tudo, e é a primeira a levar ao advogado: **o regime segue a atividade, não a
etiqueta.** Chamar-lhe Care não elimina os bloqueadores se o serviço for o mesmo. O que pode mudar é
o âmbito — acompanhamento pedagógico e familiar sem atos clínicos é coisa diferente de uma clínica.

---

## 4. Coisas menores, já decididas por defeito e reversíveis

- A entrada no menu principal e no rodapé diz **"Society"**, não "WEPAC Society" — porque "A WEPAC"
  já é uma entrada do mesmo menu e repetir seria redundante.
- A área antes chamada Clínica aparece na `/society` como **Care**, descrita sem qualquer
  vocabulário de saúde e sem data nem cidade.
- A **Academia** foi retirada do lote por contradizer o modelo de produto único. O trabalho está em
  `feat/academia-landing` (`1f59b12`) e serve de base a uma campanha.

---

## 5. Fora do âmbito desta página, mas a valer mais

- **Stripe continua em modo de teste em produção.** Sem risco hoje, porque a bilheteira não tem
  eventos publicados. Mas o flip tem de acontecer **antes** de publicares o primeiro evento, nunca
  depois — senão fica uma página de venda que não vende. Registado no `OPS_LOG.md`.
- **O gate E2E está cego em três de quatro fluxos** nesta máquina (NextAuth recusa `localhost` com
  `UntrustedHost`). Provado contra `origin/main`: não é regressão. Enquanto não for corrigido, não
  serve de gate para superfícies autenticadas.
