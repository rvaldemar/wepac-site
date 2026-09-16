# Auditoria de clareza pública WEPAC

**Data:** 2026-07-29

**Âmbito:** experiência pública live de `/society`, `/academy`, `/companhia-de-artes` e principais destinos de navegação/CTA.

**Lente:** visitante que nunca ouviu falar da WEPAC; marketing, comunicação e conversão.

## Veredicto dos primeiros 10 segundos

**Não.** O site transmite ambição, rigor e identidade visual, mas um visitante novo não percebe depressa o suficiente **o que pode obter concretamente, para quem é, o que está disponível agora e qual é a porta certa**.

A promessa emocional chega primeiro; a proposta concreta chega vários ecrãs depois. A Companhia de Artes torna-se clara quando aparecem Wessex e Arte à Capela, mas a Society e a Academy exigem que o visitante aprenda primeiro o vocabulário interno da WEPAC.

| Pergunta do visitante | Resultado em 10 s | Evidência live |
|---|---|---|
| O que é isto? | **Parcial** | “Uma vida inteira em caminho” e “Não é só arte. Existe método” são manifestos, não uma descrição de oferta. |
| É para mim? | **Fraco** | A Society refere pessoas, famílias e organizações, mas não explica o que cada uma pode fazer. A Academy não mostra idades/estado no primeiro ecrã. |
| Porque importa? | **Forte, mas abstrato** | Pessoa inteira, método, carácter e vida em prática criam diferenciação emocional. |
| O que existe agora? | **Falha** | Os estados “Em atividade”, “Em desenvolvimento” e “Em construção” aparecem muito abaixo; não foram verificados operacionalmente nesta auditoria. |
| O que faço a seguir? | **Parcial/Falha** | A Society tem dois CTAs, mas um abre uma candidatura genérica desalinhada e o outro leva a um login por convite. Academy e Companhia não têm CTA no hero. |

## Evidência por percurso

### Entrada e Society

- `/` responde `308` para `/society`; a Society é, portanto, a entrada pública real.
- No desktop e no mobile, o hero mostra “Uma vida inteira em caminho”, a frase “A casa comum de pessoas, famílias e organizações…” e os CTAs “Encontrar o ponto de partida” e “Abrir Backpack”.
- O hero não diz que a WEPAC oferece uma via educativa e uma Companhia de Artes. Academy e Companhia só se tornam visíveis depois da introdução conceptual.
- “Abrir Backpack” aparece como ação global sem a indicação imediata “para WEPACkers”. Só depois do clique o login explica “Acesso por convite”.
- A página usa, em sequência, **Society, pack, packer, WEPACker, WEPACKER, Backpack, Upgraded Backpack e Packs**. As distinções existem mais abaixo, mas chegam tarde:
  - Pack = comunidade;
  - WEPACKER = plataforma;
  - Backpack = espaço pessoal na plataforma;
  - Society = entrada pública, embora o texto também a descreva como “pack alargado” e “casa comum”.
- A própria página é honesta ao chamar às comunidades “em desenho” e ao declarar Casa, Aldeia, cowork e coliving como horizonte. O problema não é uma afirmação operacional falsa nessa secção; é o excesso de conceitos futuros numa página que ainda não esclareceu a oferta presente.

### Academy

- O primeiro ecrã é dominado por “A Academy não prepara para a vida. É vida em prática.” A construção negativa obriga a uma segunda leitura e não esclarece produto, formato, público ou disponibilidade.
- O subtítulo — “a pessoa inteira, uma prática real e comunidade suficiente para o caminho ganhar chão” — reforça filosofia, não decisão.
- Não há CTA no hero, nem estado da oferta. No mobile, o banner de cookies encobre parte do subtítulo.
- Mais abaixo, a página **declara** Easy Peasy `0—11` “Em atividade”, Step Up `12—21` “Em desenvolvimento” e YUP `22—∞` “Em construção”. Esta auditoria confirma que essas etiquetas estão publicadas, não que a operação de cada oferta esteja ativa.
- O título/metadata “dos 0 ao infinito” e a comunicação agregada podem ser lidos como cobertura já disponível para todas as idades, apesar de dois dos três stages estarem apresentados como não operacionais.
- A Academy é um destino separado, mas o cabeçalho continua a mostrar `wepac | SOCIETY` e o eyebrow diz “WEPAC Society · Via educativa”. Isso volta a aninhá-la visualmente na Society e contradiz a hierarquia que se pretende comunicar.

### Companhia de Artes

- O hero “Não é só arte. Existe método.” volta a privilegiar tese sobre oferta. “Criação, produção e programação…” é mais concreto, mas ainda não nomeia Wessex, Arte à Capela, públicos ou próxima ação.
- Não há CTA no primeiro ecrã. O mesmo cabeçalho `wepac | SOCIETY` enfraquece a identidade própria da Companhia.
- A clareza melhora muito na secção seguinte: Wessex é descrita como música para casamentos, eventos privados, empresas e instituições; Arte à Capela como concertos e experiências em capelas, igrejas e lugares de memória. Os links para ambas respondem `200`.
- Os cards têm texto editorial embebido nas próprias fotografias — “Quando as portas se abrirem…” e “Patrimónios ganham vida com a arte” — além do texto HTML sobreposto. No desktop e sobretudo no mobile, há duas hierarquias tipográficas concorrentes e leitura visual ruidosa.
- Agenda, Bilheteira e “Criar connosco” são boas portas funcionais, mas surgem tarde. `/programacao`, `/bilheteira` e `/contacto` respondem `200`.

### CTAs e destino de conversão

O maior corte de conversão está entre a promessa e o formulário:

- “Encontrar o ponto de partida” envia pessoas, famílias e organizações para `/wepacker/intake`.
- A página de destino diz “Torna-te WEPACker” e pede “Área de prática”, “Portfolio / redes sociais” e “Porquê o WEPACKER?”. A linguagem é individual e orientada para artista/praticante.
- Não pergunta se a pessoa é pai/mãe, jovem, adulto, escola, empresa, instituição, parceiro, cliente Wessex ou público de Arte à Capela.
- Assim, o principal CTA da entrada pública não encaminha o visitante: força públicos diferentes a adaptarem-se ao mesmo formulário.
- “Abrir Backpack” leva a `/wepacker/login`, que é acesso por convite. É uma boa porta para utilizadores existentes, mas fraca como CTA concorrente para um visitante novo sem qualificador.
- Todos os destinos principais testados responderam: `/society`, `/academy`, `/companhia-de-artes`, `/wepacker/intake`, `/wepacker/login`, `/wessex`, `/arte-a-capela`, `/bilheteira`, `/programacao`, `/contacto`, `/projetos/easy-peasy` e `/artist`.

## Hierarquia de mensagem

### Atual

1. Manifesto e identidade (“vida inteira”, “método”).
2. Cosmovisão, stages, pilares e vocabulário WEPAC.
3. Academy e Companhia.
4. Plataforma, candidatura e disponibilidade.
5. Packs, prova, Mission e horizonte futuro.

### Recomendada

1. **Proposta em linguagem comum:** educação/desenvolvimento humano + arte/música em prática.
2. **Escolha por intenção:** Academy, Wessex, Arte à Capela, parceria/bilhetes, ou acesso de WEPACker.
3. **Disponibilidade real:** operacional, por candidatura, em desenvolvimento ou horizonte — junto de cada escolha.
4. **Prova concreta:** lugares, agenda, obra visitável e um próximo passo verificável.
5. **Método:** pessoa inteira, seis pilares e stages como explicação do diferencial.
6. **Vocabulário e visão futura:** Pack, Backpack, Mission, Casa/Aldeia apenas depois de a oferta presente estar compreendida.

## Recomendações

### P0 — corrigir antes de otimizar aquisição

1. **Reescrever o hero da Society como entrada pública.** Nomear Academy, Companhia de Artes, Wessex, Arte à Capela e Backpack no primeiro ecrã; preservar o manifesto como camada de diferenciação, não como explicação principal.
2. **Interpor uma escolha de intenção antes da candidatura genérica.** No mínimo: “Quero conhecer a Academy”, “Procuro música para um evento”, “Quero Arte à Capela/bilhetes”, “Quero criar uma parceria” e “Já sou WEPACker”. Só depois mostrar o formulário adequado.
3. **Alinhar o formulário com o público de origem.** O intake atual não serve famílias, escolas, empresas e instituições. Se tiver de continuar único, deve recolher tipo de pessoa/organização, interesse e contexto antes de perguntar por prática ou portfolio.
4. **Tornar a hierarquia institucional inequívoca.** Usar identidade neutra WEPAC nas páginas da Academy e da Companhia; reservar `WEPAC | Society` para `/society`. Comunicar: Society = entrada pública; Academy = destino separado; Companhia = casa de Wessex e Arte à Capela; Backpack/WEPACKER = plataforma.
5. **Dar ação e estado ao hero de Academy e Companhia.** A Academy deve mostrar disponibilidade por stage sem sugerir operação não comprovada. A Companhia deve oferecer logo “Conhecer Wessex” e “Conhecer Arte à Capela”.

### P1 — reduzir fricção e carga cognitiva

1. Encurtar a homepage e mover “o que existe/para quem/como começar” para antes de cosmovisão, stages, pilares, Packs e Mission.
2. Qualificar sempre “Abrir Backpack” com “Para WEPACkers” ou “Já sou WEPACker”.
3. Substituir imagens com lettering embebido por fotografias limpas nos cards da Companhia; manter uma única camada editorial.
4. Mostrar estado e prova junto de cada oferta. Não usar apenas títulos amplos como “dos 0 ao infinito”; distinguir claramente publicado, por candidatura, em desenvolvimento e horizonte.
5. Reduzir o banner de cookies no mobile ou evitar que tape o argumento principal e a ação.
6. Trocar linguagem interna sem explicação — “stage”, “Discovery/Build/Transform”, “Upgraded Backpack”, “PPV” — por benefício em português e definição curta.

### P2 — acabamento editorial

1. Reduzir a repetição de fórmulas de manifesto entre os heros e reservar cada
   frase de marca para uma função clara na hierarquia.
2. Rever consistência de português/inglês e capitalização de Academy, Backpack, Pack, WEPACKER e WEPACker.
3. Alinhar titles/descriptions SEO com o estado real das ofertas.
4. Explicar a diferença entre Agenda e Bilheteira ou apresentar ambas como um único percurso.

## Direção concreta de copy para a homepage

### Hero

**Eyebrow**

`WEPAC Society · entrada pública`

**H1**

`Educação para a pessoa inteira. Arte que acontece no mundo.`

**Subhead**

`Aqui encontras os caminhos públicos da WEPAC: a Academy, a Companhia de Artes — com Wessex e Arte à Capela — e o próximo passo adequado ao teu interesse. O Backpack é a área pessoal de quem já é WEPACker.`

**CTA principal**

`Ver caminhos e disponibilidade`

**CTA secundário**

`Abrir Backpack`

Microcopy: `Para WEPACkers`

### Primeiras escolhas, imediatamente abaixo

**WEPAC Academy**

`Via educativa da WEPAC para a pessoa inteira. Conhece Easy Peasy, Step Up e YUP e vê o estado real de cada stage antes de avançar.`

CTA: `Conhecer a Academy`

**Companhia de Artes**

`Wessex leva música ao vivo a casamentos, eventos e instituições. Arte à Capela cria concertos e experiências em lugares de património.`

CTAs: `Conhecer Wessex` · `Conhecer Arte à Capela`

**Ainda não sabes qual é a tua porta?**

`Diz-nos se procuras educação, um evento, programação cultural, parceria ou acompanhamento. Encaminhamos-te sem te obrigar a aprender primeiro o vocabulário WEPAC.`

CTA: `Escolher o meu caminho`

Esta direção preserva a personalidade da marca, mas põe primeiro a utilidade, a hierarquia e a verdade operacional.

## Método, limitações e risco residual

- Verificação live em 2026-07-29 por HTTP direto: redirect de `/`, estados `200`, headlines, etiquetas de estado e copy dos destinos de CTA.
- Inspeção visual read-only de seis capturas live partilhadas, desktop e mobile:
  - `/private/tmp/wepac-public-qa.jADIe6/live-society-desktop.png`
  - `/private/tmp/wepac-public-qa.jADIe6/live-society-mobile.png`
  - `/private/tmp/wepac-public-qa.jADIe6/live-academy-desktop.png`
  - `/private/tmp/wepac-public-qa.jADIe6/live-academy-mobile.png`
  - `/private/tmp/wepac-public-qa.jADIe6/live-companhia-desktop.png`
  - `/private/tmp/wepac-public-qa.jADIe6/live-companhia-mobile.png`
- Fonte local inspecionada no release `8eb9034`, apenas para confirmar intenção, links, ordem e copy; o live foi tratado como verdade de apresentação.
- O browser integrado não arrancou nesta sessão por uma limitação do runtime anterior à abertura de páginas. As capturas foram produzidas com o Playwright do projeto; não são atribuídas ao browser integrado.
- As grandes áreas vazias das capturas full-page resultam de componentes `FadeIn` ainda fora do viewport durante a captura. Não foram contabilizadas como defeito de navegação sem um teste de scroll fiel.
- Não foram submetidos formulários, efetuados logins, aceites cookies, feitos uploads ou produzidas alterações externas.
- **Risco residual:** esta auditoria confirma o que o site publica; não confirma capacidade, calendário, vagas, resultados ou operação corrente de Academy, Easy Peasy, Wessex, Arte à Capela ou Upgraded Backpack. Qualquer claim de disponibilidade deve passar por confirmação operacional antes de entrar no hero.
