# Ops Log

Histórico de problemas, decisões e soluções em produção. Consultado pelo Claude CLI antes de diagnosticar bugs ou fazer deploy.

---

## 2026-07-22 (4) — WEPAC Society: entrada em `/society` e Universidade de Verão

27º deploy. Release em produção a partir de `feat/arte-a-capela-base`. Sem migrations aplicadas em prod nesta release (a nova migration de candidaturas segue no código e aplica-se no próximo `migrate deploy`; ver abaixo).

**Reestruturação decidida pelo Rui durante a sessão.** O produto é **um só: WEPAC Society**. Uma pessoa candidata-se à Society, a ser **WEPACker**. Academia, Care, RH, casa, aldeia e afins são **agregadores do menu lateral** da plataforma — organização interna para quem já é membro, não ofertas separadas com páginas próprias. O que se dirigirá a públicos diferentes são **campanhas**, organizadas pelas dimensões da vida das pessoas. Isto corrigiu um modelo errado a meio do trabalho (ver "retiradas" abaixo).

- **`/society` (nova, pública):** a entrada. Escrita a partir do livro-manifesto do Rui — abre em "E tu?" com o argumento de que seja qual for a porta o convite é o mesmo, passa pelo "já és um packer, falta-te o WE", pelo retrato concreto do que é ser WEPACker à segunda-feira de manhã, e pela equação autonomia/serviço. Prova social real e publicamente consentida (Álvaro Luís, André Vítor, Alex Florindo, Jotta Pê), enquadrada como pessoas que a WEPAC apoia — **nunca** como ex-participantes de um programa. Entrada gratuita e primeiro Life Map gratuito ditos sem rodeios.
- **`/wepacker` deixa de ser landing** e redireciona para `/wepacker/login`. Tudo o resto sob `/wepacker/*` intocado.
- **`/society/universidade-verao` (nova, pública):** Universidade de Verão WEPAC Society. Tese do Rui: transformar energia potencial em energia. Idades 18-26, um fim de semana residencial, local e programa secretos até à convocação, candidaturas até **10 de agosto de 2026**. Seis factos por decidir (data, teto de custo, lugares financiados, número de lugares, data de resposta, mentores) estão a `null` no ficheiro de dados: **as secções não renderizam e nenhum número foi inventado**. CTA de candidatura desativado até o funil estar pronto.
- **Candidaturas passam a ser únicas por (email, oferta)** em vez de por pessoa. `beta_signups.email @unique` → `@@unique([email, packSlug])`. Sem isto, o primeiro WEPACker a candidatar-se à Universidade **apagava silenciosamente** a sua candidatura à Society. `acceptInvite` também assumia uma candidatura por email e foi corrigido. Migration validada numa base descartável (30 migrations) e segura por construção: a constraint antiga é estritamente mais forte que a nova.

**Retiradas deliberadamente do lote, com o trabalho preservado em branch:**
- **Clínica WEPAC** (`feat/clinica-landing`, 568f8cd) — página completa, com board de ética clínica. **Não vai a produção** enquanto estiverem abertos 5 bloqueadores legais documentados no topo de `src/data/clinica.ts`: registo/licenciamento ERS, equipa com cédulas e diretor técnico identificado, morada da V1, identificação legal do operador no rodapé, e parecer jurídico de direito da saúde. Decisão do Rui: por agora não há "clínica"; a área passa a chamar-se **Care** e é descrita sem vocabulário de saúde.
- **Academia** (`feat/academia-landing`, 1f59b12) — página completa. Retirada por contradizer o modelo de produto único: uma página `/academia` apresenta como oferta autónoma o que é um agregador interno. Serve de base a uma campanha quando os públicos estiverem definidos.

**Gate:** tsc limpo, build compila, vitest **237/238** (a única falha é o red pré-existente em `hub-debrief-engine.test.ts`, do lote hub-debrief). Smoke: `/society` e `/society/universidade-verao` a 200, `/academia` e `/clinica` a 404 como esperado, `/wepacker` a 307, serviço active, sem overflow horizontal, e grep de "clínica/terapia/saúde mental" na página da Society devolve vazio.

**Pendente do Rui:** os seis factos da Universidade de Verão (o board recomenda **publicar a data** — a data secreta não filtra por compromisso, filtra por quem tem agosto livre, e garante desistências depois da seleção); confirmar se "A Travessia" fica como nome desta edição; e o teto de custo, sem o qual a página não pode falar de dinheiro.

---

## 2026-07-22 (3) — Fidelidade de design da Arte à Capela + remoção de conteúdo fictício

23º a 26º deploy (quatro releases no mesmo ciclo; a última é `/var/www/wepac/releases/20260722180947`). Sem migrations em nenhuma.

**Conteúdo fictício removido de produção.** A página anunciava, sob "Próximo evento", um concerto chamado "Catedrais Interiores" com "António Cortez — Violoncelo" e um programa de Bach/Duport/Popper. Tudo isso era conteúdo de mockup transcrito do Figma do designer, não um concerto real. O fallback passa a dizer "Ainda não há concerto marcado." e a apontar para a bilheteira; o programa estático foi removido de vez (não há coluna no schema para o suportar). O evento continua no seed de desenvolvimento, agora com um comentário a marcar a origem. **Por confirmar com o Rui: se "António Cortez" é uma pessoa real, o nome esteve publicado associado a um concerto inexistente.**

**Board de comparação Figma vs. entregue (4 lentes, medições reais).** Veredicto: "é o mesmo design, desenhado à escala errada" — face, paleta, sistema de labels, ordem das secções e a quebra romano→itálico sobreviveram; a proporção não. Aplicados os nove gaps: banda da citação com hierarquia invertida (199px no board, 415px entregues, estatísticas a 36px a gritar sobre a citação que deviam seguir); hero a metade do brilho do board com um vinhetado inexistente no design (luminância média 18,7 contra 34,8); banda letterbox a 21:9 quando o board tem 4,18:1; duo em `aspect-square` quando o board tem paisagem 1,53:1, o que agravava o upscale do único asset de baixa resolução; split da galeria; escada tipográfica; contraste dos labels de 11px no lado escuro (3,79:1) e dos eyebrows vermelhos (3,52:1). **Dois erros da própria transcrição em `docs/design/arte-a-capela-figma-spec.md` corrigidos** (linhas 98 e 145) — eram a origem de dois dos gaps e seriam re-herdados.

**Lição de processo, registada porque custou.** Três agentes seguidos mediram contraste com métodos cada vez mais sofisticados (simulação do gradiente em Python/Pillow, extração da fonte real do build para medir glifos, Playwright a amostrar píxeis compostos) e nenhum viu que o scrim da coluna direita estava a ser pintado **por cima** do headline: `-inset-x-[150px]` invadia a coluna do título e o `<h1>` não tinha `z-index`. Cada elemento medido isoladamente passava, porque o scrim está atrás de tudo o que foi amostrado — e à frente do único elemento já dado como resolvido. Pior: **o bug estava a inflacionar a própria medição** (o headline media 4,98:1 com o scrim por cima; o valor real era 3,9:1). Só se viu olhando para um screenshot. **Regra: em trabalho visual, a inspeção visual vem antes da medição, não depois.**

Estado final medido em Chromium real, contra o limiar correto de cada elemento (4,5:1 texto, 3:1 não-texto): headline 5,47:1 · parágrafo 5,53:1 · CTA primário 5,62:1 · CTA secundário label 9,04:1 · borda do CTA secundário 3,90:1 (uma borda a 25% de branco tem um teto matemático de ~2,3:1 contra qualquer fundo — foi subida para 50%). Luminância média da metade direita da foto: 27,4, ainda muito acima dos 18,7 da versão sobre-escurecida.

**Smoke:** serviço active, `/`, `/arte-a-capela`, `/wepacker`, `/bilheteira` a 200, zero erros no journal. Verificação visual feita a 1384px: headline nítido de ponta a ponta, galeria com o split medido, banda da citação compacta, duo em paisagem sem barras.

**Estado pós-ciclo (2026-07-22, fecho).** `MENTORSHIP_WRITES_ENABLED=true` aplicado em `/var/www/wepac/shared/.env.production` e confirmado no ambiente do processo em execução (`/proc/<MainPID>/environ`), não apenas no ficheiro — era o ship blocker da landing WEPACKER e está resolvido.

**Stripe fica em modo de teste, por decisão do Rui.** Sem risco imediato: `/bilheteira` mostra "Sem eventos publicados neste momento", portanto não há nada à venda e nenhuma compra pode falhar. **GATILHO: o flip para live tem de acontecer ANTES de publicar o primeiro evento**, não depois. No momento em que um evento for publicado no admin, a Arte à Capela passa a mostrar tiers com botões de compra e um comprador com cartão real recebe erro do Stripe em modo de teste — uma página de venda que não vende. Ordem correta: flip → publicar evento.

---

## 2026-07-22 (2) — Arte à Capela LP + landing WEPACKER reescrita + funil de candidaturas

22º deploy. Release `/var/www/wepac/releases/20260722160842`, a partir de `feat/arte-a-capela-base` (28 commits sobre `origin/main` 6054535, worktree isolada). **Sem migrations** — `prisma migrate deploy` reportou "No pending migrations to apply" sobre as 29 existentes, portanto o rollback é apenas repor o symlink para `releases/20260722003145` e reiniciar.

- **Arte à Capela (`/arte-a-capela`):** rota top-level nova, irmã de `/wessex`, com identidade própria (Cormorant Garamond, creme #F0EDE6, vermelho #C2301F) construída a partir do Figma do designer. Assets extraídos do próprio ficheiro Figma. O navbar WEPAC passa a apontar aqui; `/projetos/arte-a-capela` mantém-se e ganha canonical para a rota nova.
- **Bilheteira, não duplicada:** o Figma desenhava um checkout inline. Board de 5 lentes rejeitou — todas as tiers Capela são pagas e o comprador vai para o Stripe de qualquer forma, portanto o form inline não poupava navegação nenhuma e criava uma segunda superfície de dinheiro. A LP mostra **todas** as tiers (a de mecenato estava escondida) e faz deep-link para `/bilheteira/[slug]?tier=<id>`, que pré-seleciona a tier.
- **Bilheteira endurecida:** `backPath` passa a ser construído a partir do `event.slug` da base e não do input do utilizador; `seats` é validado 1-10 em vez de sofrer clamp silencioso a 20 (um POST com 50 comprava 20); aviso de recolha de dados junto ao formulário. O `returnPath` com allowlist chegou a ser construído e foi **removido** por decisão do board quando o form inline caiu.
- **Landing WEPACKER (`/wepacker`):** reescrita. Era o modelo de dados publicado como marketing — Assessment/Method/Disciplines/Six Pillars/My Journey como títulos de secção, e o Assessment vendido como passo 01 quando o onboarding real é welcome→agreement. Agora: WEPAC Society, imaginário backpacker, entrada gratuita e primeiro PPV gratuito em destaque, o que a plataforma **não** é, e os quatro percursos dos fundadores. Página passou a estática (deixou de fazer fetch de packs).
- **Funil de candidaturas corrigido:** o `upsert` por email nunca repunha `status`, portanto uma recandidatura de alguém marcado `rejected`/`contacted` recebia o email de confirmação e **nunca reaparecia na fila do admin**. Passa a voltar a `pending` com registo em notas; `packSlug` específico deixa de ser esmagado pelo sentinela genérico; rate limit por IP reutilizando o limitador do Wessex com contadores próprios.
- **Correções de conteúdo:** três handles de redes sociais inventados no rodapé da Capela (contas inexistentes) substituídos por `wepac.oficial`, verificado; seed deixa de prometer "pagamento à porta" numa tier cobrada por Stripe; `.env.example` documenta as duas chaves Stripe realmente usadas.

**Gate:** build standalone e TypeScript verdes; unit 235/236 (a única falha é o baseline pré-existente em `hub-debrief-engine.test.ts`, que pertence ao lote hub-debrief em curso). QA visual empírica em browser, desktop e mobile, com os deep-links de tier verificados a sério. Gate técnico de 8 lentes deu VETO com 6 must-fix, todos corrigidos antes do deploy.

**E2E: 1/4, com delta zero contra `origin/main`.** Os três testes que falham dependem de login e falham por `UntrustedHost` do NextAuth no ambiente local — provado correndo a mesma suite, na mesma base descartável e com as mesmas variáveis, contra `origin/main`, com resultado idêntico. O único fluxo E2E que este lote toca — candidatura pública — é o que passa. **Follow-up P1: o gate E2E está cego em 3 de 4 fluxos nesta máquina**; enquanto não for corrigido não serve de gate para superfícies autenticadas.

**Smoke pós-deploy:** `wepac.service` active; `/`, `/arte-a-capela`, `/wepacker`, `/bilheteira`, `/projetos/arte-a-capela`, `/sitemap.xml` todos 200; navbar a apontar para `/arte-a-capela`; zero erros no journal desde o restart. `/arte-a-capela` está no estado fallback porque **não há evento Arte à Capela futuro publicado na base de produção** — para mostrar o concerto real é preciso criá-lo no admin da bilheteira.

**Por fazer, com impacto:** `MENTORSHIP_WRITES_ENABLED` continua **ausente** de `/var/www/wepac/shared/.env.production`, logo as escritas de mentoria estão desligadas e a landing promete um mentor que ainda não pode ser atribuído. Stripe continua em modo de teste.

---

## 2026-07-22 — Domain Graph v2 foundation: additive/default-off em produção

21º deploy. A PR #4 foi retirada de draft, mergeada em `main` no commit `4e3e3d5d8f0a19a4d10767853350327897e82c4f` e lançada como `/var/www/wepac/releases/20260722003145` (BUILD_ID `UaQZKYbF4UarHWDtsImXK`). Esta é uma foundation de expansão, não o cutover completo do domínio: os novos writes continuam desligados e os modelos legacy permanecem operacionais.

- **Domain Graph v2:** estrutura aditiva para `Mentorship`, `PersonConnection`, `CommunityPack`/membership, `Cycle` edges, `StagePlacement` e `CareConnection`, alinhada com a linguagem English-first (`WEPACker`, `My Journey`, `Stage`, `Life Map`, `Trail`, `Cycle`, `Pack`, `Connection`, `Mentorship`). Não houve rename, remoção, backfill nem inferência de relações a partir dos dados legacy.
- **My Journey + Sessions:** artefactos pessoais deixaram de exigir membership legacy; Sessions passam a reconhecer Mentorship ativa quando existir, mantendo fallback legacy medido e attendees explícitos. `MENTORSHIP_WRITES_ENABLED` ficou ausente/não-`true` tanto na configuração como no processo em execução.
- **Transcript attachment:** o Session Workspace aceita `.txt`, `.md`, `.vtt` e `.srt` UTF-8; só guarda texto normalizado, não o ficheiro original. Leitura/escrita/debrief são organizer-only, substituição é atómica e `transcriptRevision` protege gerações concorrentes. Consentimento e retenção continuam gates antes de uso amplo.
- **Preview attendee view:** preview Session-scoped, read-only e `no-store`, construído a partir da projeção member-safe; não troca JWT/cookies nem oferece ações. Um Person-wide `View as` continua bloqueado até existirem Artifact Grants e audit/break-glass.
- **Dados:** migrations `20260721210000_add_domain_graph_v2_foundation` e `20260721220000_add_session_transcript_revision` aplicadas; produção em 29/29, zero falhadas. As contagens legacy permaneceram `users=7`, `packs=1`, `cohorts=1`, `cohort_memberships=2`, `sessions=1`, `session_attendees=1`; as sete tabelas novas ficaram vazias e nenhuma Session recebeu `mentorshipId` por backfill.
- **Release gate:** replay limpo das 29 migrations, build + TypeScript, suite crítica 68/68, E2E 4/4, backup fresco com restore drill e gates independentes de integração/privacidade verdes. O full unit mantém um baseline pré-existente em `hub-debrief-engine.test.ts` (220/221) e o lint global mantém o falso positivo pré-existente no fixture E2E; nenhum toca esta release.
- **Produção:** `wepac.service` active/running, BUILD_ID local/remoto igual, cinco smokes públicos `200`, redirects apex/legacy corretos, auth session `200` e zero erros Prisma, missing-column, unhandled ou journal error desde o restart. Rollback de aplicação: repor o symlink para `/var/www/wepac/releases/20260721211257` e reiniciar; não reverter as migrations aditivas.

---

## 2026-07-21 (14) — Sessões pessoais sem membership: seletor e acesso corrigidos

20º deploy. Um utilizador `member` sem `CohortMembership` (caso real: Alexandre Florindo) não aparecia no seletor de participantes, apesar de `SessionAttendee` já ligar diretamente ao `User` e de `Session.cohortId` ser opcional. O mesmo utilizador também ficava bloqueado na sua página de sessões pelo gate antigo de Journey.

- **Picker:** admin vê todos os outros utilizadores, incluindo pessoas sem membership; mentor vê apenas membros ativos das cohorts que acompanha. Nome + email desambiguam contas homónimas.
- **Autorização:** sessões associadas a cohort aceitam apenas memberships `member` ativas e nunca o próprio mentor/admin; sessões pessoais revalidam no servidor a mesma população mostrada no picker.
- **Acesso do participante:** `getMySessions`, `getNextSession` e `/wepacker/sessions` passaram a exigir apenas o `User` autenticado, mantendo a query limitada a `SessionAttendee.userId`; participar/ver uma sessão pessoal deixou de depender de membership.
- **Privacidade do calendário:** cada destinatário recebe agora um `.ics` próprio cujo único `ATTENDEE` é o próprio destinatário; convites e cancelamentos de grupo deixam de expor nomes/emails dos restantes participantes.
- **Âmbito:** sem migração e sem alteração do modelo de dados. A revisão conceptual de Pack/Stage/Journey discutida separadamente não faz parte deste hotfix.

Suite unit 147/147; E2E contra build 4/4 numa PostgreSQL local descartável; build standalone, TypeScript, ESLint focado e diff-check verdes. A primeira configuração E2E foi corretamente recusada por não apontar a localhost; o gate final usou uma base Docker isolada e removida após a execução. Revisão independente: SHIP.

---

## 2026-07-21 (13) — Lote resiliência FECHADO: backups em produção + suite E2E

19º deploy (último do ciclo). O lote correu com board CISO+CTO no design dos backups (2 blocking fixes do board incorporados antes de qualquer código: restore-validation no plaintext pré-encriptação em vez de drill de decrypt automatizado com chave no servidor; alerting self-testing + dead-man-switch externo na Fase 1).

- **Backups da BD de prod: ATIVOS no servidor.** Repo `~/Documents/code/rvs-backups` (parametrizado por tenant desde o dia 1); no 77.42.82.10: timer diário 03:15 UTC + healthcheck 6/6h, retenção 7 diários + 4 semanais (hardlinks), pg_dump -Z6 nice/ionice, prova real verificada pelo QA no journal do servidor: dump → pg_restore --list (227 entradas) → restore em BD scratch → paridade de contagens → cleanup. Zero segredos em repo/logs (só DATABASE_URL parseado, nunca o env inteiro). Caminhos negativos testados (env inválido, dump truncado, heartbeat envelhecido → CRITICAL). Pendentes de sign-off do Rui (fora do âmbito, por design): encriptação age (gate de custódia de chave), offsite Storage Box, extensão às outras 3 BDs do servidor, conta healthchecks.io.
- **Suite E2E Playwright:** 4 fluxos críticos (login→dashboard, gate de onboarding, mentor cria sessão→transcrição→workspace, candidatura pública), verificada 3× estável pelo QA; `npm run test:e2e` / `test:e2e:build` documentados no CLAUDE.md como gate pré-deploy para superfícies críticas. Bónus da equipa: bug live real corrigido no onboarding (agreement `update({})`) + `generateMeetingUrl` extraído para módulo próprio (exigência do "use server"). **Nota de setup local:** o guard da suite recusa correr contra a BD local por ela se chamar `wepac_production` — para usar a suite nesta máquina, criar/renomear uma BD dev com nome de dev (a suite reseeda!).

Suite unit 127/127. Smoke 200. Merge teve 2 conflitos triviais (CLAUDE.md, session.ts imports) resolvidos pelo CoS.

---

## 2026-07-21 (12) — Wessex seam+rate-limit, member-value wave, Cal.com PR #3

Deploys 17-18. Drenagem das waves em voo (zero frentes novas por ordem do Rui):

- **Wessex (17º):** seam `WESSEX_ENGINE=direct|hub` (default direct intacto) + rate limit por visitante (10/10min, 30/dia). **QA NO-SHIP → fix → verde**: o limiter lia o 1º entry do X-Forwarded-For, que o nosso próprio nginx passa do cliente — furável com header rotativo; agora prefere X-Real-IP (não-falsificável) com fallback ao entry acrescentado pelo proxy. Nota operacional: motor hub v1 não dispara save_lead — decidir antes de cutover.
- **Member-value (18º):** painel "Preparação" no workspace do mentor (radar resumido, último combinado, histórico e tarefas de sessão POR participante — 2 ressalvas do QA fechadas: o painel degrada em vez de derrubar o workspace, e o histórico/tarefas limitam-se às sessões do próprio mentor, nunca de outros); notificações email best-effort ao membro (nova tarefa de mentor, nota partilhada publicada, nova mensagem com debounce 30min — conteúdo sensível nunca no corpo, só aviso+link); CLAUDE.md sincronizado à realidade (QA amostrou 19 claims contra o código). Suite 127/127.
- **Cal.com: PR #3 aberto (pronto-a-mergear, decisão do Rui)** — webhook env-gated com HMAC timing-safe + idempotência P2002 + guard de relação mentor↔attendee reimposta pelo board (a assinatura prova origem, não consentimento); infra em ~/Documents/code/rvs-cal preparada e NÃO aplicada; go-live gates (OAuth/RoPA/scopes/retention/RESCHEDULED) documentados no board.

Em voo: lote resiliência (backups com board + suite E2E).

---

## 2026-07-21 (11) — Wave dos parqueados: Basecamp, restore do Life Plan, nits do ics

16º deploy (mandato do Rui: lançar tudo o que estava parado, em paralelo):

- **Página Basecamp** (`/wepacker/basecamp`): visão geral com 3 cards (Life Plan, Plano Estratégico, Trails) via actions guardadas existentes; item "Visão geral" no grupo Basecamp do sidebar (exact-match). QA SHIP.
- **Restore de versões do Life Plan**: semântica append-only (restaurar snapshotta o atual para o histórico via o upsert normal — nada se perde). **QA NO-SHIP → fix → verde**: o guard inicial (assertUserAccess) deixaria um mentor reverter o Life Plan de um membro; corrigido para assertUserOwner (igual ao upsert), com teste a afirmar o guard certo e a exclusão do errado.
- **Nits do ics fechados**: mudança de meetingUrl em sessão agendada reenvia o convite (prioridade cancel > reschedule > link, um email por mudança); SEQUENCE estritamente crescente. QA SHIP.

Suite 95/95. Smoke 200. Em voo ainda: lote resiliência (backups+E2E) e epic Cal.com (board+build).

---

## 2026-07-21 (10) — Calendário Fase 1: convites .ics + vista de calendário

15º deploy. Decisão de arquitetura: Fase 1 sem infra nova (ics + UI própria); Cal.com self-hosted fica como Fase 2 com gatilho claro (mais mentores / self-service booking).

- **Convites .ics:** criação/remarcação de sessão envia email aos participantes com evento anexo (RFC 5545 gerado à mão, sem dependências novas; UID estável, method REQUEST/CANCEL; cancelamento remove o evento do calendário deles); LOCATION = sala meet.rvs.solutions; best-effort (falha de email nunca quebra a action). 2 fixes de gate aplicados sobre achados MEDIUM do QA: logs sem PII (bounces SMTP embutem endereços — agora só classe de erro + código SMTP) e ORGANIZER = mailbox de envio (Exchange/Outlook validam iMIP sender e descartavam o convite; mentor fica como attendee). Nits para backlog: mudança de meetingUrl não re-convida; SEQUENCE com granularidade de 1s.
- **Vista de calendário:** toggle Lista|Calendário nas sessões (membro e mentor) — grid mensal próprio ~190 linhas, zero dependências (decisão documentada vs FullCalendar), kinds por glifo/cor, dark wepac-*. QA SHIP limpo.

Suite 86/86. Smoke 200.

---

## 2026-07-21 (9) — meet.rvs.solutions LIVE; WEPACKER migrado para vídeo próprio

Jitsi Meet self-hosted em produção no servidor existente 77.42.82.10 (decisão do Rui: sem VPS novo — preflight confirmou folga: 8 cores, 24GB livres; custo adicional €0). Config como código no repo novo `~/Documents/code/rvs-meet` (compose oficial, nginx vhost, install.sh idempotente). Segurança: web/jicofo só em 127.0.0.1 (nginx faz TLS), secure domain (conta host "mentor", credenciais só em /opt/rvs-meet/host-credentials.txt chmod 600 no servidor), sem Jibri/gravação. Certbot com renovação automática. Colisões resolvidas em código: colibri 8080→8081; auth interna Prosody = meet.jitsi. Os 8 vhosts existentes verificados 200 após reload.

`MEETING_BASE_URL=https://meet.rvs.solutions` aplicado ao .env.production do wepac + restart — sessões novas nascem com salas na infra própria. Smoke: meet 200, wepac 200. Password do host: `cat /opt/rvs-meet/host-credentials.txt` no servidor (o Rui precisa dela para abrir salas como host).

---

## 2026-07-21 (8) — Cliente Hub real + link no workspace de detalhe

14º deploy. `HubDebriefEngine` deixou de ser stub: cliente real do playbook W01 do Hub (submit + polling + mapeamento para DebriefResult), atrás de `DEBRIEF_ENGINE` (default `anthropic` — impossível ativar hub sem env explícita; fail-loud se faltar config, nunca fallback silencioso). QA confirmou o contrato HTTP contra o código real do Hub. Heurísticas v1 documentadas com TODO (sinal 'watch' uniforme por área; sugestões duplicadas em grupo — W01 sem split por attendee); 3 notas de interop enviadas ao Hub no canal. Migração para o Hub no futuro = definir 4 env vars no servidor. Também: link "Entrar na chamada"+"Copiar link" no workspace de detalhe da sessão (gap da frente anterior). Suite 64/64.

---

## 2026-07-21 (7) — Videochamada nas Sessões

13º deploy. Cada sessão nova nasce com sala de vídeo própria: `Session.meetingUrl` (migration aditiva) gerado como `MEETING_BASE_URL/wepac-<token>` — token crypto-random 64-bit (nunca o id da sessão), base configurável por env (default meet.jit.si; migra para instância própria mudando a env var). Mentor: "Entrar na chamada" + "Copiar link" + substituição manual (Zoom/Teams) no card; membro: link no card e na linha de próxima ação do dashboard. QA SHIP: select default-deny do membro intacto (transcript/privateNote continuam excluídos), links com rel seguro, 55/55 testes. Gotcha de integração registado: `prisma generate` tem de correr na árvore principal após merge de branch com migration (o generate da worktree não a cobre).

Pedido ao Hub registado no canal: primitivo genérico "audio transcription step executor" (Whisper local, W01 ganha step 0 áudio→texto; Bergano herda reunião→ata). Media plane (Jitsi próprio) = infra gerida RVS, fora do Hub — aguarda decisão de VPS do Rui.

---

## 2026-07-21 (6) — Motor de debrief calibrado por juízo de fidelidade (pronto para a sessão 2)

12º deploy. Validação por regeneração cega: o motor reproduziu o documento da sessão 1 do Alex só a partir da transcrição + template, e um juiz opus comparou com o original — veredicto **APTO-COM-AJUSTES** (estrutura perfeita, zero contradições factuais em 15+ amostras, voz sustentada, honestidade exemplar; falhas: largou uma leitura crítica do mentor e cravou factos hesitantes). Os 5 ajustes do juiz foram aplicados ao `resultDocumentSystemPrompt()` (extração exaustiva das leituras do mentor, herança de hedges, exemplos sensíveis marcados [a rever pelo mentor], honestidade como regra dura, metáforas ancoradas às teses) e deployados. Suite 51/51. O caminho direto está calibrado e pronto para a transcrição da sessão 2.

---

## 2026-07-21 (5) — PR #2 mergeado e deployado; decisões do Rui registadas

11º deploy. PR #2 (Stripe money-path S1/S2/S3) mergeado por autorização direta do Rui ("merge já, live mode fica para depois") — fixes em produção, Stripe continua TEST mode; flip para live é decisão separada com o runbook do board. Suite 51/51.

Decisões do Rui (perguntadas via AskUserQuestion): LLM da org WEPAC = subscription Claude do Hub JÁ (com exigência nossa de gdpr_restricted + allowed_providers=[anthropic] na config); aprovador HITL = Rui confirmado; entrega ao membro EM REVISÃO (até definição, mantém-se release-ao-mentor); comparação de fidelidade dos documentos do Alex delegada ao juiz da fábrica (em curso).

---

## 2026-07-21 (4) — Follow-ups: gate de assessment, AA final, check-in hardening; PR #2 Stripe aberto

Deploys 9 e 10 do ciclo (fábrica: dev-teams em worktrees + QA opus por frente):

- **Gate de assessment (loophole M1):** submitSelf/MentorEvaluation recusam packs sem indicadores dedicados (fresh-read anti-TOCTOU); página de assessment mostra estado bloqueado amigável; convites/membership deliberadamente NÃO gateados (montar cohort pré-lançamento é workflow legítimo). QA SHIP.
- **AA final:** orcamento page /40→/50; hierarquia do Footer recuperada por escala tipográfica (Login WEPACKER → text-xs), sem cores novas. QA SHIP com ratios verificados.
- **Check-in hardening:** API rejeita bilhetes cancelled (409, sem TicketCheckLog) em check-in E check-out; QA falsificou empiricamente o guard (removeu → 2 testes vermelhos → repôs). QA SHIP. Suite 40/40.
- **PR #2 aberto (Tier 3, decisão do Rui):** `fix/stripe-async-fulfillment-board-s1s3` — S1/S2/S3 do board de receita; QA: "no unpaid-Multibanco path produces a scannable ticket. Verified impossible." Merge + flip live mode = Rui.

Canal Hub: achado deles confirmado (managed sem enforcement de provider → sem garantia Anthropic-only hoje); posição WEPAC registada — sessão 2 corre no caminho direto do wepac-site, migração ao W01 espera BYOK-para-W01 ou enforcement. Fixture sintética entregue (derivado de sessão real foi produzido e APAGADO — re-identificável com n=1; ver canal).

---

## 2026-07-21 (3) — Member experience (contraste AA, mensagens list-first, gate de packs) + board de receita

Oitavo deploy do ciclo (fábrica: 4 leads → reconciliador de ownership → 3 dev-teams → QA opus; board CFO/CISO/CTO só no epic de dinheiro):

- **Contraste AA:** text-wepac-white/30 e /40 → /50 em contacto, PricingCalculator e Footer (ratios verificados: 2.46-3.77:1 → 5.28-5.33:1, passa AA 4.5:1). QA SHIP.
- **Mensagens:** mobile abre na lista (list-first via useLayoutEffect pós-mount, sem hydration mismatch); desktop mantém seleção automática. Prop morta `avatarUrl` removida do profile e do select de getMyContext (coluna fica na BD). QA SHIP c/ ressalvas não-bloqueantes.
- **Gate de packs:** `hasDedicatedIndicators()` em types.ts; createPack força active:false; updatePack/updateCohortStatus recusam ativação de packs sem indicadores próprios (fresh-read anti-TOCTOU); admin recebe erro PT-PT claro; Pack Artista intacto. Teste novo pack-activation-gate. QA SHIP, 29/29.
- **Board de receita (Stripe live mode): go_with_constraints.** Defeito CRÍTICO confirmado no source: caminho Multibanco fulfila bilhete válido/scanável em checkout.session.completed com payment_status unpaid e nunca revoga se não pagar. 3 stories must-fix (S1 payment_status gate no webhook; S2 cancelar Ticket em async_failed/expired; S3 anti phantom sold-out com age-filter de pendings + cleanup de Payment órfão) — em construção PR-ready em worktree; **merge e flip para live mode são decisão do Rui (Tier 3)**. Arquitetura de resto sólida: assinatura webhook obrigatória, idempotência por @unique paymentId, preço server-side. Unit economics sãs (Stripe PT ~1.5%+€0.25).

Smoke 3/3. Follow-ups em construção paralela: orcamento page AA + hierarquia tipográfica do Footer; gate de assessment para packs sem indicadores (loophole M1).

---

## 2026-07-21 (2) — Debrief de sessão por IA: DEPLOYED (epic session-intelligence, fábrica completa)

Sexto deploy do ciclo. Epic construído pela fábrica completa: 2 specs de leads → board 3 lentes opus (CISO/CTO/CPO, 3 vetos iniciais convertidos pelo Chair em constraints vinculativos) → builds em worktrees → QA gatekeepers (2× SHIP-WITH-RESERVATIONS, 0 bloqueadores) → integração CoS. Migration `20260720233529_session_debrief` aplicada em prod.

**Verificação pós-deploy:** smoke local do caminho de falha VERDE (401 com key placeholder → erro PT-PT limpo, log sem qualquer conteúdo — só sessionId/status/contagens). Caminho feliz contra a API real NÃO verificado ainda: o `.env.local` de dev tem key placeholder e o servidor não recebe `src/` (build standalone), por isso a primeira geração real é a verificação — que o board já exige que seja com o Rui a validar registo/fidelidade do documento (HITL gate). Nota: o prompt do documento de resultado pode agora ser afinado com o template canónico extraído (`WHPH/WEPAC/WEPACKER/wepac-session-result-template-v1.html`), que o build não conseguiu ler (OneDrive timeout no worktree).

Detalhe do que foi construído (nota original do build):

- **Schema (migration aditiva única `20260720233529_session_debrief`):** `Session` ganha `transcript`/`transcriptUploadedAt`/`transcriptUploadedById` (mentor-only); novo modelo `SessionDebrief` (status ready/failed only — sem lock de "geração em curso", sem `reviewedAt`/`reviewedByUserId`, conforme trim do board).
- **Fix de leak confirmado pelo board:** `ownAttendeeSessionInclude` usava `include` (todos os scalars da Session, incluindo os futuros `transcript*`) em vez de `select` — convertido para `select` explícito default-deny em `getMySessions`/`getNextSession`. Regressão coberta em teste.
- **GDPR:** `clearSessionTranscript` apaga transcrição E o `SessionDebrief` associado (suggestions/avaliação/documento são dados pessoais derivados, possivelmente de menor) — não existe "guardar debrief, apagar transcrição".
- **Motor (`src/lib/wepacker/debrief/`):** seam `DebriefEngine` com `AnthropicDebriefEngine` (chamada estruturada JSON via `output_config.format` para sugestões + avaliação interna; chamada separada em streaming para o documento de resultado, só para sessões individuais) e `HubDebriefEngine` (stub, TODO playbook `wepac-session-debrief`). Nunca loga transcrição/prompt/payload — só sessionId/status/contagens de caracteres (coberto por teste de grep).
- **HITL gate NÃO resolvido:** o ficheiro de referência `WHPH/WEPAC/ppv-sessao-1-alex-resultado-2026-07-17.html` (16 secções) está em OneDrive e não foi possível ler a partir deste ambiente de build isolado (timeout a materializar o ficheiro cloud-only). O prompt da Call-B (documento de resultado) foi escrito só com o vocabulário já existente no produto (SESSION_KIND_LABELS, AREA_LABELS, imaginário do trilho) — **não foi validado contra o ficheiro de referência real**. Antes de confiar neste caminho ou o expor além do mentor: ler o ficheiro (localmente, fora deste worktree) e ajustar `resultDocumentSystemPrompt()` em `src/lib/wepacker/debrief/anthropic.ts` conforme a estrutura verificada.
- **Sandboxing:** preview do documento de resultado só em `<iframe sandbox="">` (sem `allow-same-origin`), nunca `URL.createObjectURL` numa tab; download via `data:` URI.
- Tasks a partir de sugestões do debrief usam `createTaskFromSession`, agora idempotente por (sessionId, membershipId, title) — dedup coberto em teste.


## 2026-07-21 — Imaginário no produto: SessionKind + Trilho da Expedição

Quinto deploy do ciclo. A metáfora da montanha entra na UI:

- **SessionKind** (novo enum, separado do formato individual/grupo): `checkpoint` ("Acompanhamento regular no trilho", default), `recon` ("Reconhecimento — mapear o terreno"), `basecamp` ("Planear a próxima etapa"), `rescue` ("Resgate — apoio num momento difícil"), `summit` ("Cume — fecho e celebração de ciclo"). Migration aditiva `20260720230316` com default. Seletor no form do mentor, badge no card do membro.
- **Trilho da Expedição** (`ExpeditionTrail.tsx`): visualização no topo do dashboard do membro — linha de trilho a subir com waypoints reais (sessões por kind com glifos próprios: bandeira/tenda/cruz/pico), "Estás aqui", próxima sessão destacada, cume à direita; linha de próxima ação por baixo (sessão > tarefa urgente > CTA mentor) — resolve o P1 "dashboard mede mas não orienta". Estado vazio: "A tua expedição começa em breve".

Smoke 2/2; migrations up to date. Pipeline "transcrição→resultado" para sessões de mentoria: pedido de serviço enviado ao Agents Hub (playbook wepac-session-debrief, tenant WEPAC GDPR-restricted Anthropic-only, HITL do mentor) — ver sessão CoS; até lá corre manual (referência canónica: WHPH/WEPAC/ppv-sessao-1-alex-resultado-2026-07-17.html).

---

## 2026-07-20 (7) — Sessão repensada (Modelo A): notas/outcome per-pessoa + loop sessão→tarefa

Quarto deploy do dia. Redesign da Sessão para o ecossistema pessoa-cêntrico (proposta completa com 3 modelos avaliados na sessão CoS; Modelo A "Sessão = Encontro" escolhido; acoplamento a Trail deliberadamente adiado até Trails terem uso real — GTM-first):

- **Schema:** `SessionAttendee` ganha `privateNote` (só mentor), `sharedNote` + `sharedNotePublished` (por pessoa), `outcome` ("o que ficou combinado"); `Task.sourceSessionId` (FK SetNull). Migrations aditivas `20260720224156` + `20260720225121` aplicadas em prod. Campos legacy da Session (notes/notesPublished/discussionPoints) mantidos read-only.
- **Privacidade (2 fixes de gate):** paths de leitura do membro nunca selecionam `privateNote` (excluído na query Prisma, não filtrado em JS) e devolvem só a própria row de attendee; notas legacy não publicadas agora mascaradas no servidor (antes atravessavam a rede e dependiam do cliente — achado do juiz).
- **Authz (NO-SHIP → fix → re-judge SHIP):** `createTaskFromSession` inicial permitia escalada cross-cohort (task a aterrar em membership de cohort que o mentor não mentora). Corrigido: membership scoped ao cohort da sessão; sessões pessoais passam por `assertMembershipAccess`. Validação server-side 1–5 também adicionada às avaliações (achado do juiz do assessment).
- **UI mentor:** notas privada/partilhada + outcome por attendee, publicação por pessoa, "Criar tarefa" a partir do outcome (origin=session + sourceSessionId — ativa o enum `TaskOrigin.session` que existia morto desde sempre).
- **UI membro:** card de sessão mostra "O que ficou combinado" e a nota partilhada do mentor.

Smoke 3/3; `migrate status` up to date. Decisão metodológica em aberto (não bloqueante): tipos semânticos de sessão (check-in/diagnóstico/crise/fecho) — é metodologia WEPAC, não código. Nit UX registado: attendee com membership não-ativa (ex. completed) não pode receber task de sessão.

---

## 2026-07-20 (6) — Waves 2+3: placeholders honestos, a11y, tasks, contacto, L2, termos legacy

Terceiro deploy do dia. Site institucional deixou de "parecer inacabado" e a base de a11y subiu:

- **Placeholders honestos:** `/media` → redirect 308 para `/programacao` (fora do sitemap); menu "Wessex" aponta para `/wessex` (landing completa) em vez de `/servicos`; `/impacto` sem claims sem prova ("Impacto que queremos criar" + compromisso de medir); metadata de `/sobre` sem "equipa" (dataset vazio).
- **A11y:** skip link global + `:focus-visible` (alvo é `div#main` — `<main>` aninhado seria inválido, fix de gate); menus mobile (Header + sidebar WEPACKER) com `aria-expanded`/dialog, trap de foco, Escape e scroll lock via hook partilhado `useMobileDrawer`.
- **Assessment onboarding:** radios nativos com fieldset/legend, legenda 1–5 visível antes de selecionar, rascunho em localStorage (restaurado, limpo só no sucesso), resumo de indicadores em falta com salto/foco, retry sem perda. Juiz opus: SHIP. Fix de gate adicional: validação server-side 1–5 nos submits self e mentor (gap pré-existente).
- **Tasks:** `input type=date`, erros visíveis persistentes, ordenação atrasadas→pendentes→concluídas.
- **Contacto:** sucesso honesto (lead na BD é canónico; erro só quando ambos os backends falham, com contacto alternativo) + expectativa de resposta.
- **L2:** histórico de versões read-only na página Life Plan (guard igual a getLifePlan).
- **Termos legacy:** 7 ocorrências "Programa Artistas" atualizadas para terminologia WEPACKER (todas eram referências ao produto/funil live; privacidade só levou renames de labels, sem alterar significado legal).
- **Lint baseline: 0 erros** (CookieConsent refeito com useSyncExternalStore).

Smoke: 6/6 páginas 200. Em curso: redesign da Sessão (Modelo A — notas/outcome per-attendee; proposta na sessão CoS).

---

## 2026-07-20 (5) — Remodelação Fase 1+2: sidebar agrupado, Life Plan versioning, microcopy, lint

Segunda leva do dia (blueprint da remodelação → execução), deploy com migration:

- **Sidebar WEPACKER reestruturado:** grupos "Basecamp" (Life Plan, Plano, Trails) e "Dia a dia" (Tarefas, Sessões, Mensagens, Perfil); "Dashboard"→"Home" (label apenas, rota `/wepacker/dashboard` inalterada); active state por prefixo (subrotas mantêm contexto de nav) com exact-match no item raiz do mentor. Grupo "Explore" NÃO criado — sem conteúdo que o justifique (decisão registada no blueprint; conceito não existe nos docs canónicos).
- **Life Plan versioning:** tabela nova `life_plan_versions` (append-only, snapshot dos 5 campos antes de cada upsert, transacional). Migration `20260720222148_life_plan_versioning` aditiva, aplicada em prod via deploy. UI de histórico fica para fase seguinte.
- **Landing:** "Percursos"→"Packs" + assinatura "From packers to WEPACkers." no footer.
- **Lint baseline:** 5× `any` (mentor pages, helper `serialize` genérico) e 2× setState-in-effect (contacto, event form) corrigidos. Resta 1 erro conhecido: CookieConsent (story própria).
- Blueprint completo com stories/DoR: scratchpad da sessão aa016bc1 (`wepacker-remodel-blueprint.md`). Decisões pendentes do Rui: hub Basecamp como página, rename da rota dashboard, reversão de versões do Life Plan, rota canónica Wessex, termos legacy no site institucional.

Smoke: 3/3 páginas públicas 200; `migrate status` no servidor: "Database schema is up to date" (21 migrations).

---

## 2026-07-20 (4) — Correções P0 da auditoria UX/UI

Aplicados os três P0 do relatório `reports/auditoria-site-ux-ui-2026-07-20.html` (agora commitado no repo) e feito deploy:

- **Dashboard pós-avaliação:** a legenda do radar identifica o momento real ("Avaliação inicial/intermédia/final") em vez de "Actual/Anterior" — o fix estrutural (último momento disponível em vez de `mid` hardcoded) já tinha aterrado em `d80d85f`.
- **Mensagens em mobile:** master/detail abaixo de `lg` — lista ou conversa em ecrã inteiro com "← Voltar"; desktop inalterado. Nota: em mobile abre na primeira conversa por default (detail-first) — aceitável, candidato a polish.
- **Candidatura:** labels persistentes associados (htmlFor/id), obrigatórios marcados (visual + aria-required), erros por campo (aria-describedby + role="alert"), nota de privacidade com link a `/privacidade` antes do submit. Contrato do server action inalterado. Follow-up de backlog: o servidor (`application.ts`) continua sem validação de formato de email (pré-existente).

Smoke pós-deploy: `/`, `/wepacker`, `/wepacker/artist/candidatura` → 200. Baseline de lint com 8 erros pré-existentes (5× `any` em mentor pages, 3× setState-in-effect) — housekeeping pendente, não é regressão.

---

## 2026-07-20 (3) — Inbox central de leads

`/wepacker/admin/leads` passou a inbox única: leads Wessex (chat + formulário de eventos), submissões do `/contacto` e candidaturas WEPACKER, ordenadas cronologicamente com badge de origem, funil unificado (Novas/Em contacto/Ganhas/Perdidas) e ações por pipeline (estados próprios, notas e CTA de convite nas candidaturas, histórico de conversa nas leads de chat). O `/contacto` agora grava na tabela `leads` (novo valor de enum `LeadSource.contact`, migração aditiva `20260720160000`) além do email formsubmit — sucesso se um dos dois passar. `/wepacker/admin/applications` é redirect para a inbox; sidebar perdeu a entrada "Candidaturas".

---

## 2026-07-20 (2) — Rebrand display "WEPAC" + copy do manifesto

- Marca de display passou a ser só **"WEPAC"** em todo o site (metadata, footer, hero, bilheteira, chat Wessex, emails); subtítulos de marca usam "Cultura que transforma". Nome legal completo mantém-se na política de privacidade e nos dados históricos do Sem Nome.
- Copy da plataforma corrigida pelo manifesto (`WHPH/WEPAC/livro.md`): WEPACKER é modo de vida de desenvolvimento humano integral, não "programa de desenvolvimento artístico". Níveis de progressão em PT: Semente → Crescimento → Assinatura → Parceiro (`LEVEL_LABELS`).
- **Gotcha de build:** o build incremental do Turbopack serviu HTML prerendered com copy antiga apesar do source alterado — páginas estáticas de `/wepacker` (login/welcome) foram para prod desatualizadas. Fix: `rm -rf .next` antes do build de deploy. Considerar adicionar ao `deploy.sh`.
- Bootstrap prod adicional: membership `member` do Rui na cohort Alpha (experiência WEPACKER; vista mentor coberta pela role admin — a constraint unique impede member+mentor na mesma cohort).

---

## 2026-07-20 — WEPACKER: rebuild completo da plataforma (substitui Artista Alpha)

A área `/artists/alpha` foi reconstruída do zero como plataforma multi-pack **WEPACKER** em `/wepacker`. Leads e candidaturas (tabelas `leads` e `beta_signups`) preservadas — dados reais intocados.

**Arquitetura nova:**

- **Schema:** models `Pack` / `Cohort` / `CohortMembership`; artefactos de desenvolvimento (avaliações, planos, tarefas, sessões) pendurados na membership, não no user — uma pessoa pode pertencer a vários packs. `UserRole` passa a `member|mentor|admin`; 7ª área do radar é `domain`, com label por pack (`Pack.domainLabel`). `beta_signups` ganha coluna aditiva `packSlug` (default `artist`). Migração: `20260720120000_wepacker_platform_rebuild` — **esvazia as tabelas da plataforma (dados de teste) antes de alterar; leads/beta_signups só levam o ADD COLUMN**.
- **Segurança (fix do defeito conhecido):** todas as server actions novas em `src/lib/wepacker/actions/` verificam sessão e ownership via guards centrais (`src/lib/wepacker/guards.ts`). Nenhuma action aceita userId/membershipId do cliente sem validação de acesso (owner, mentor da cohort ou admin). As actions antigas sem auth foram eliminadas com a área antiga.
- **Rotas:** `/wepacker` (landing pública), `/wepacker/[pack]/candidatura` (pública, alimenta pipeline beta_signups), login/invite/password, onboarding (welcome/agreement/assessment), área member (dashboard/diagnosis/ppv/plan/tasks/sessions/messages/profile), mentor (`/wepacker/mentor/*`, detalhe por membershipId em `members/[id]`), admin (users, cohorts, applications, leads, settings). Redirects 308 de `/artists/alpha/*` para os equivalentes novos no middleware.
- **Onboarding fix:** o callback jwt agora refaz role/onboarded da BD quando o cliente chama `useSession().update()` — o fluxo antigo deixava o utilizador preso com JWT `onboarded=false` após aceitar o acordo.
- **Seed:** Pack `artist` ("Pack Artista") + cohort "Alpha" + users de teste (ana/pedro/maria/joao @example.com, ricardo@wepac.pt mentor, admin@wepac.pt — password123).

**Deploy (2026-07-20, concluído):** `deploy.sh` correu migração + generate + restart. Bootstrap manual da BD de prod via psql (o seed NÃO corre em prod — apagaria dados): Pack `artist`, cohort `Alpha` (active) e utilizador admin `admin@wepac.pt` com invite token (Rui define a password via link de convite). Verificado em prod: landing, candidatura, login, redirects legacy, site público e bilheteira todos OK. Nota aprendida: a landing `/wepacker` é prerendered no build com a BD local — ficou com `revalidate = 300` para refletir alterações aos packs sem rebuild. Em `next start` o Auth.js exige `NEXTAUTH_SECRET`/`AUTH_SECRET` e host confiável — prod já tem ambiente configurado.

**Validação local:** build verde (53 páginas), vitest 11/11, smoke test HTTP autenticado com os 3 perfis (member/mentor/admin) tudo 200, gates de role e redirects legacy confirmados.

---

## 2026-06-18 — Bilheteira: check-in/check-out com histórico + scanner QR + QR de acesso por bilhete

Implementação completa do sistema de check-in para uso em porta de concertos.

**O que foi adicionado:**

- **`TicketCheckLog` (Prisma)** — nova tabela que regista cada check-in e check-out com timestamp e adminId. Migração: `20260618_add_ticket_check_log`.
- **API route `POST/GET /api/bilheteira/checkin`** — endpoint JSON autenticado por cookie de sessão. GET faz lookup por ticket ID ou serial (BT-xxx). POST executa checkin/checkout e regista no log.
- **Página `/bilheteira/admin/events/[id]/checkin`** — página dedicada para o porteiro. Mostra contador de admitidos, botão de câmara (QR scanner via `qr-scanner` 1.4.2), input manual de serial como fallback. Auto check-in ao ler QR, resultado com feedback imediato (verde = admitido, laranja = já admitido, vermelho = inválido). Histórico do bilhete visível no resultado. Auto-reset após 4 segundos.
- **Botão "Modo Check-in"** no painel admin do evento — acesso rápido à página de porta.
- **Coluna QR na tabela de bilhetes** — QR code 48×48 inline por bilhete, para o admin mostrar ao cliente no ecrã e o cliente digitalizar para aceder ao bilhete no telemóvel.
- **Histórico inline por bilhete** na tabela do admin — linha extra abaixo de cada bilhete com log de check-ins/check-outs (hora exacta, tipo de acção).
- **`checkInTicketAction` actualizada** — agora também regista no `TicketCheckLog` (para toggling via botão Admitir/Anular da página admin).

**Fluxo na porta:** porteiro acede a `/bilheteira/admin/events/[id]/checkin` no telemóvel → liga câmara → lê QR do bilhete do cliente → sistema faz check-in automático → mostra nome, tier, lugares e estado. Se bilhete já admitido, mostra aviso laranja. Sempre possível anular a admissão com botão "Anular admissão".

---

## 2026-05-07 — Bilheteira admin: client-side exception em /events/[id]

Sintoma: editar um evento em `https://wepac.pt/bilheteira/admin/events/<id>` mostrava "Application error: a client-side exception has occurred" em vez do formulário. Sem entrada nos logs do servidor (puramente cliente).

Causa: hydration mismatch nos `<input type="datetime-local">`. O `toLocalDateTimeInput` usa `getHours()`/`getMinutes()` que devolvem hora **local**. Servidor está em `Etc/UTC`, browser do utilizador em Europe/Lisbon (UTC+1 em Maio com DST). React 19 rejeita o mismatch e levanta CSE.

O commit anterior (668b2c5, 4 Maio) "fixed" o caso em que a função recebia uma string em vez de Date — mas isso na prática mascarava o problema porque crashava silenciosamente e os campos ficavam vazios. Com o fix, ambos os lados produzem datas válidas mas em fuso diferente, expondo a mismatch.

Fix (172b3ba): renderizar inputs vazios no SSR e popular via `useEffect` com refs depois do mount. Server e client renderizam o mesmo (vazio), client preenche ao montar com a hora local correcta.

Lição: sempre que um valor renderizado depende do timezone do utilizador (`Date.prototype.getHours` etc), tem de ser computado client-side ou usar UTC em ambos os lados. Próxima vez verificar também a página pública do bilhete (`/bilheteira/ticket/[id]`) — actualmente mostra hora UTC ao utilizador, o que é UX bug mas não CSE porque é server component.

---

## 2026-04-21 — Sem Nome: scanner iOS + lista imprimível (dia do evento)

Preparação para a porta do concerto privado "Sem Nome" (21 ABR, 19h, Aquiraz).

- **Scanner QR trocado de `BarcodeDetector` para `qr-scanner` (1.4.2).** O `BarcodeDetector` nativo não funciona em Safari iOS — o iPhone à porta não lia os QR. `qr-scanner` usa canvas + worker e funciona em iOS/Android/desktop.
  - Worker copiado para `public/qr-scanner-worker.min.js` e `QrScanner.WORKER_PATH` apontado aí (método directo e previsível em Next 16 com build standalone).
  - UX peek+confirm mantida em `/sn-porta-56c6bdc4cdf7`: PIN → scan (ou input manual) → mostra nome/lugares/estado → botão "Admitir".
- **Input manual expandido.** Aceita URL completa (`.../bilhete/<id>`), `SN-001`, ou só o número. Útil quando o QR não lê ou o bilhete é visualizado em papel.
  - `/api/sn/status` e `/api/sn/checkin` agora resolvem por `token` **ou** por `serial`.
- **Nova página `/sn-admin-c027ea95daf3/imprimir`** com lista completa de convidados (serial, nome, lugares, admitido?), ordenada por serial. Botão "Imprimir / Guardar PDF" chama `window.print()`. CSS `@media print` optimizado para A4. Serve de backup offline à porta (papel ou PDF).
- **Quick links no admin** (`/sn-admin-c027ea95daf3`): "Porta · Dar baixa" → `/sn-porta-56c6bdc4cdf7`, "Lista · Imprimir / PDF" → `/sn-admin-c027ea95daf3/imprimir`. Abrem em tab nova.

**Env vars já existentes** (não requer alterações):
- `SN_ADMIN_KEY` — admin
- `SN_PORTA_PIN` — PIN de porta (digitado no início da sessão do scanner)

---

## 2026-04-18 — Signup bilheteira falhava: Hetzner bloqueia SMTP 465

Signup admin bilheteira criava o user mas o email de verificação nunca chegava. Logs mostravam `ETIMEDOUT` a conectar `smtp.zoho.eu:465`.

Causa: Hetzner bloqueia outbound nas portas 25 e 465 por defeito (anti-spam). Só 587 (STARTTLS) passa. O código hardcoded `port 465` + `secure: true`.

Fix:
- `src/lib/email.ts` e `src/lib/bilheteira/ticket-email.ts`: default passa a 587, `secure` derivado da porta (`secure: port === 465`).
- `.env.production` no servidor: `SMTP_PORT=465` → `587`.

Regra: em Hetzner usar sempre porta 587 com STARTTLS para SMTP outbound.

---

## 2026-04-17 — Bilheteira: Stripe payments

Pagamento online via Stripe Checkout (test-mode primeiro, depois live).

- Stripe SDK instalado (`stripe` npm). API version `2026-03-25.dahlia`.
- Novo model `Payment` com enum `PaymentStatus` (pending, completed, failed, refunded, expired). `Ticket.paymentId` opcional one-to-one.
- `reserveAction` agora bifurca:
  - Tier grátis (0€) → cria Ticket imediatamente + envia email (como antes).
  - Tier paga → cria `Payment(pending)` + Stripe Checkout Session (cards + Multibanco, locale pt) + redirect para Stripe.
- Webhook: `POST /api/bilheteira/stripe/webhook` valida signature, trata `checkout.session.completed` (cria Ticket idempotente + envia email), `checkout.session.expired` (marca Payment expired).
- Success: `/bilheteira/checkout/success?session_id=X` procura Payment + Ticket; se pronto redireciona, senão mostra página "a processar" com auto-refresh 3s.
- Cancel: redireciona para `/bilheteira/[slug]?cancelled=1` com banner.
- Capacidade/quantity agora contam também pagamentos pendentes para evitar oversell durante checkout.
- Amigo WEPAC corrigido para 25€ (tier patrono, não gratuita). Migration backfill em prod.
- Aviso IVA no bilhete + email: "Isento de IVA ao abrigo do art.º 9.º do CIVA." (WEPAC como associação cultural sem fins lucrativos).
- Admin do evento mostra nova secção "Pagamentos": receita Stripe, pendentes, lista completa com estado.

**Env vars necessárias em prod:**
- `STRIPE_SECRET_KEY` (sk_live_... ou sk_test_...)
- `STRIPE_PUBLISHABLE_KEY` (pk_live_... — ainda não usado no back, mas conveniente para futuro)
- `STRIPE_WEBHOOK_SECRET` (whsec_... — obter no dashboard Stripe ao criar o endpoint)

**Configurar webhook na Stripe:**
1. Dashboard Stripe → Developers → Webhooks → Add endpoint
2. URL: `https://wepac.pt/api/bilheteira/stripe/webhook`
3. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `checkout.session.async_payment_failed`
4. Copiar o signing secret (`whsec_...`) para `STRIPE_WEBHOOK_SECRET` em `.env.production`
5. Activar Multibanco em Stripe → Settings → Payment methods (pode requerer activação da conta PT)

Testes: 95/95 local (subiu de 80). Cobre: path grátis, path pago, webhook signature rejection, success page com sessão conhecida/desconhecida, cancel banner, UI admin de pagamentos.

---

## 2026-04-17 — Bilheteira: email verification + admin delete

Addições à bilheteira:
- Verificação de email obrigatória no signup. Token de 32 bytes, TTL 24h. Login bloqueia contas não verificadas. Página `/bilheteira/verify-sent` com botão de reenvio.
- Verificação feita em **route handler** (`app/bilheteira/verify/[token]/route.ts`) — em Next 16 só route handlers e server actions podem setar cookies. Redireciona para `/bilheteira/verify-invalid` em erro.
- Página `/bilheteira/admin/admins` — lista todos os admins com badge Verificado/Pendente. Qualquer admin pode apagar outro, excepto:
  - A própria conta (auto-protecção).
  - O último admin verificado (evita lock-out).
- `Event.createdById` agora nullable com `ON DELETE SET NULL` — eliminar um admin preserva os eventos que criou.
- Migration: `20260417230000_add_admin_email_verification_and_nullable_creator`. Backfill: admins pré-existentes ficam com `emailVerifiedAt=NOW()` para manterem acesso.

---

## 2026-04-17 — Bilheteira WEPAC (v1)

Sistema de bilheteira digital para eventos WEPAC, paralelo ao Artista Alpha e ao Sem Nome. Pagamento à entrada (v1) — online fica para próxima iteração.

**Estrutura:**
- Models Prisma: `TicketingAdmin`, `Department`, `Brand`, `Event`, `TicketTier`, `Ticket` (enums `EventStatus`, `TicketStatus`).
- Migration: `20260417211130_add_bilheteira_wepac`.
- Seed idempotente no `prisma/seed.ts` cria departamentos (Wessex, Easy Peasy, Arte à Capela), marca Capela Viva, evento "A Voz da Ibéria Antiga" (Ananda Roda, 23 Abril 2026) com 2 tiers: Bilhete (12€) e Amigo WEPAC (grátis). Admin seed: `admin@wepac.pt` / `password123`.

**Auth admin:**
- Sistema separado do NextAuth (Artista Alpha). Cookie HMAC `bilheteira_session` assinado com `NEXTAUTH_SECRET`.
- Signup restrito a emails `@wepac.pt`. Todos os admins têm as mesmas permissões.
- Ficheiro: `src/lib/bilheteira/session.ts` + `src/lib/bilheteira/auth-actions.ts`.

**Rotas:**
- `/bilheteira` — listagem pública de eventos publicados.
- `/bilheteira/[slug]` — página de evento + formulário de reserva.
- `/bilheteira/ticket/[id]` — bilhete digital com QR.
- `/bilheteira/login`, `/bilheteira/signup` — auth admin.
- `/bilheteira/admin` — dashboard (lista de eventos).
- `/bilheteira/admin/events/new` — criar evento.
- `/bilheteira/admin/events/[id]` — gerir evento (editar, tiers, bilhetes, check-in).

**Email:** `src/lib/bilheteira/ticket-email.ts` envia o link do bilhete via Nodemailer (reutiliza config SMTP existente).

**Deploy — checklist:**
1. Correr `./deploy/deploy.sh` (inclui `prisma migrate deploy` + Prisma generate Linux + restart).
2. **Não correr `prisma db seed`** em prod — o seed principal é destrutivo (apaga utilizadores do Artista Alpha). Em alternativa:
   ```
   ssh deploy@77.42.82.10 "set -a && source /var/www/wepac/shared/.env.production && set +a && cd /var/www/wepac/current && npx tsx scripts/seed-bilheteira.ts"
   ```
   Este script é idempotente e só insere dados de bilheteira (departments, brand, admin bootstrap se não existir nenhum, evento Ananda + tiers).
3. Signup do primeiro admin real em `https://wepac.pt/bilheteira/signup` (email @wepac.pt).
4. Alterar password ou apagar admin bootstrap (`admin@wepac.pt`) após registar contas reais.

**Env vars necessárias:**
- `NEXTAUTH_SECRET` (já existente — reutilizado para assinar cookie da bilheteira).
- `APP_URL` (já existente — usado nos URLs do bilhete e email).
- SMTP_* (já existentes).

**Notas:**
- O modelo SemNome (`SemNomeTicket`) continua intocado.
- Preços guardados em cêntimos (Int). Formatação PT-PT.
- Status do ticket: `pending` → `checked_in` (`cancelled` disponível para uso futuro).
- Capacidade do evento e limite por tier validados na reserva.

---

## 2026-03-24 — Login não funciona em prod

**Sintoma:** Login em https://wepac.pt/artists/alpha/login não faz nada, erro silencioso.

**Causa 1 — AUTH_TRUST_HOST:**
- NextAuth v5 (Auth.js) atrás de reverse proxy (nginx) requer `AUTH_TRUST_HOST=true`
- Sem esta variável, rejeita todos os pedidos com `UntrustedHost`
- Fix: adicionado `AUTH_TRUST_HOST=true` a `/var/www/wepac/shared/.env.production`

**Causa 2 — Prisma binary mismatch:**
- Prisma client gerado localmente (darwin-arm64) não funciona no servidor (debian-openssl-3.0.x)
- Erro: `PrismaClientInitializationError: Prisma Client could not locate the Query Engine for runtime "debian-openssl-3.0.x"`
- Fix: correr `npx prisma@6.19.2 generate` no servidor para gerar o engine Linux
- **Nota:** isto tem de ser feito após cada deploy que copie node_modules do Mac

**Lições:**
- Após deploy, sempre regenerar Prisma no servidor
- Verificar logs com `journalctl -u wepac --since '5 minutes ago' --no-pager -q`

---

## 2026-03-23 — Primeiro deploy

- Setup do servidor: Node 20, PostgreSQL 16, systemd + nginx
- Deploy via `deploy/deploy.sh` (build local + rsync + symlink)
- Migrations com `npx prisma@6.19.2 migrate deploy` no servidor
- Seed com users de teste (ana, pedro, maria, joao, ricardo, admin)
