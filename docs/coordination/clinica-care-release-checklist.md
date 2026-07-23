# Care (ex-Clínica WEPAC) — o que falta para a página poder ir a produção

A página está escrita, revista por um board de três lentes (pai que chega, ética clínica e regulação
portuguesa, posicionamento) e implementada. **Não está em produção por decisão deliberada.** Vive em
`feat/clinica-landing`, commit `568f8cd`, ficheiros `src/app/clinica/page.tsx` e `src/data/clinica.ts`.

Este documento existe para que, no dia em que os bloqueadores caírem, ninguém tenha de refazer o
raciocínio nem redescobrir porque é que a página ficou parada.

## Porque não foi publicada

Duas razões independentes, ambas suficientes:

1. **Bloqueadores legais.** A página usa publicamente vocabulário de saúde e descreve um serviço a
   menores. Em Portugal isso convoca um regime que exige identificação do operador e dos
   profissionais. A lista completa está no topo de `src/data/clinica.ts` — são cinco, e nenhuma se
   resolve escrevendo melhor.
2. **Decisão de produto do Rui (2026-07-22):** por agora não há "clínica". A área passa a chamar-se
   **Care** e a `/society` já a descreve sem qualquer vocabulário de saúde.

## Os cinco bloqueadores

| # | O que falta | O que desbloqueia |
|---|---|---|
| 1 | Registo/licenciamento da entidade junto da ERS | Se as palavras "clínica", "saúde mental" e "terapia" podem sequer ser usadas em público |
| 2 | Equipa: nomes, formação, profissão, número de cédula, e diretor técnico identificado | A secção "Quem vai estar na sala", hoje renderizada sem nomes — nenhum foi inventado |
| 3 | Morada da V1 em Lisboa e semana de abertura confirmadas | A morada no bloco de fecho e qualquer afirmação de local |
| 4 | Identificação legal do operador para o rodapé: entidade, NIPC, morada, diretor técnico, nº de registo ERS e de licenciamento | O rodapé, hoje sem nenhum destes dados por não estarem confirmados |
| 5 | Parecer de advogado de direito da saúde sobre: tipologia/licenciamento ERS de uma unidade híbrida pedagógico-clínica; se o nome comercial com "clínica" já aciona por si o regime de prestador de saúde; estatuto regulado (ou não) de musicoterapia e psicomotricidade; artigos do Código da Publicidade aplicáveis; âmbito da exigência de registo criminal; idade de consentimento digital | Tudo o resto |

## O que muda se a área ficar mesmo chamada "Care"

A decisão de nome não elimina os bloqueadores 1 a 5 se o serviço continuar a ser o mesmo — o regime
segue a atividade, não a etiqueta. Mas pode mudar o **âmbito**: uma oferta de acompanhamento
pedagógico e familiar, sem atos clínicos, sem terapias reguladas e sem linguagem de saúde, é coisa
diferente de uma clínica. Essa é a primeira pergunta a levar ao advogado, porque decide se a página
existente serve com ajustes de vocabulário ou se tem de ser reescrita para outro serviço.

## O que na página é para manter, independentemente do desfecho

Estas foram decisões do board que sobrevivem a qualquer mudança de nome ou âmbito, e não devem ser
revertidas por instinto de marketing:

- **Registo "você", não "tu"** — quebra deliberada face ao resto do site. Não se trata alguém
  assustado com a familiaridade que se usa para vender.
- **A banda de encaminhamento imediatamente a seguir ao hero**, antes de qualquer texto persuasivo,
  com médico de família, 112 e Linha SNS 24. Nenhuma página que põe a captação acima do
  encaminhamento de urgência escolheu bem.
- **Zero fotografias de crianças, zero testemunhos, zero percentagens, zero escassez.**
- **Nenhuma animação de revelação por scroll** — nada retido a quem procura ajuda.
- **Cada passo do processo carrega o seu limite na mesma linha e no mesmo tamanho de letra**, nunca
  numa secção de letra pequena no fundo.
- A ordem da página é a **ordem do medo de quem chega**, não a do catálogo: reconhecimento antes de
  explicação, e recusa explícita da culpa antes de qualquer descrição da oferta.

## Como retomar

```bash
git -C ~/Documents/code/wepac-site log --oneline -1 feat/clinica-landing   # 568f8cd
git -C ~/Documents/code/wepac-site show feat/clinica-landing:src/data/clinica.ts | head -60
```

O bloco TODO no topo de `src/data/clinica.ts` tem os 20 itens pendentes, dos quais 5 são
bloqueadores de lançamento. Fechados esses, a página integra-se como qualquer outra frente.
