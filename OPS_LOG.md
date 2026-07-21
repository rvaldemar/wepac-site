# Ops Log

Histórico de problemas, decisões e soluções em produção. Consultado pelo Claude CLI antes de diagnosticar bugs ou fazer deploy.

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
