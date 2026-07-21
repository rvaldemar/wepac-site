# CLAUDE.md

## Projeto

WEPAC — Companhia de Artes. Site institucional + plataforma "WEPACKER" (desenvolvimento humano integral multi-pack — mentoria, avaliações, planeamento estratégico e comunidade; o Pack Artista substitui o antigo programa "Artista Alpha").

## Stack

- **Framework:** Next.js 16.1.6, React 19.2.3, TypeScript
- **Styling:** Tailwind CSS v4, Framer Motion
- **Auth:** NextAuth v5 (beta.30), Credentials provider, JWT sessions
- **DB:** PostgreSQL 16, Prisma 6.19.2
- **AI:** Anthropic SDK (chat Wessex; debrief de sessões via seam `anthropic`/`hub` — ver Features)
- **Email:** Nodemailer (convites, reset password, notificações leads, convites `.ics` de sessão)

## Ops Log

Antes de diagnosticar bugs em prod ou fazer deploy, consultar `OPS_LOG.md`. Após resolver problemas ou fazer alterações relevantes, atualizar o `OPS_LOG.md`.

## Dev

```bash
npm install
npx prisma migrate dev    # criar/atualizar DB local
npx prisma db seed        # seed com users de teste
npm run dev               # http://localhost:3000
npm run test              # vitest run
```

Gotcha de worktrees: depois de fazer merge de uma branch com migration Prisma para a árvore principal, corre `npx prisma generate` na árvore principal — o `generate` que corre dentro de uma worktree isolada não cobre a árvore principal.

## Env vars

Ver `.env.example`. Variáveis obrigatórias:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — secret para sessões JWT (32+ chars)
- `NEXTAUTH_URL` — URL base para callbacks auth
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` — configuração email
- `APP_URL` — URL pública da app
- `ANTHROPIC_API_KEY` — para o chat Wessex (opcional em dev)
- `UPLOAD_DIR` — diretório persistente para uploads da bilheteira (capas de eventos); em prod aponta para fora da release dir para sobreviver a deploys
- `MEETING_BASE_URL` — base para as salas de vídeo auto-geradas das sessões (`generateMeetingUrl` em `src/lib/wepacker/actions/session.ts`); default `https://meet.jit.si` se não definida. **Em produção está definida para `https://meet.rvs.solutions`** (Jitsi self-hosted, servidor 77.42.82.10 — ver `OPS_LOG.md` 2026-07-21 (9))
- `DEBRIEF_ENGINE` — motor do debrief AI de sessões: `anthropic` (default, chama a API Anthropic diretamente) ou `hub` (routa via playbook "wepac-session-debrief"/W01 do Agents Hub); seam em `src/lib/wepacker/debrief/engine.ts`
- `HUB_API_URL`, `HUB_API_KEY`, `HUB_DEBRIEF_PLAYBOOK_ID` — só obrigatórias quando `DEBRIEF_ENGINE="hub"`; o `HubDebriefEngine` falha alto (fail-loud) no construtor se faltar alguma, nunca faz fallback silencioso para o Anthropic direto

## Deploy

- Script: `deploy/deploy.sh` (build local + rsync para servidor)
- Servidor: `deploy@77.42.82.10`, app em `/var/www/wepac/current`
- Serviço: `sudo systemctl restart wepac`
- Logs: `journalctl -u wepac --no-pager -q`
- Após deploy: correr `npx prisma@6.19.2 generate` no servidor (o build local gera engines para macOS, o servidor precisa de Linux)

## Rotas

**Site público** (`(site)/`): `/`, `/sobre`, `/parcerias`, `/impacto`, `/contacto`, `/privacidade`, `/programacao`, `/projetos`, `/servicos`, `/servicos/orcamento`, `/metodologia`, `/media`, `/artist`

**WEPACKER** (`/wepacker/`):
- Públicas: landing `/wepacker`, candidatura `/wepacker/[pack]/intake` (formulário público por pack; `/wepacker/[pack]/candidatura` é alias legacy que redireciona para `/intake`), login, password reset, invite
- Onboarding: welcome → agreement → assessment (gate obrigatória antes de `onboarded=true`)
- Member: dashboard, diagnosis, basecamp (visão geral de Life Plan + Plano Estratégico + Trails), ppv (Life Plan), plan, trails (`/wepacker/trails/[id]`), tasks, sessions, messages, profile
- Mentor: `/wepacker/mentor/*` — painel, `evaluate/[id]`, `members/[id]` (detalhe por membershipId), `sessions` e `sessions/[id]` (workspace de detalhe com debrief AI), `tasks`, `messages`
- Admin: `/wepacker/admin/{users,cohorts,applications,leads,settings}`
- Legacy: `/artists/alpha/*` redireciona 308 para os equivalentes novos

**API:** `/api/auth/[...nextauth]`, `/api/wessex/chat`, `/api/bilheteira/{checkin,stripe/webhook,uploads/[filename]}`, `/api/sn/{create,list,update,delete,checkin,status}` (bilheteira/check-in de eventos — produto próprio dentro do repo, ver `src/app/bilheteira/*` e `src/app/bilhete/*`)

## Features produto

- **Arquitetura:** Pack → Cohort → CohortMembership; artefactos de desenvolvimento pendurados na membership (multi-pack por pessoa). Life Plan, Plano Estratégico, Avaliação e Sessões já não estão presos a uma membership/pack — pendurados no `User` (histórico único de vida da pessoa através de vários packs); só as candidaturas/inscrições (`packSlug`) e cohorts permanecem pack-scoped.
- **Roles:** member, mentor, admin (middleware + guards por action protegem por role e ownership — ver `src/lib/wepacker/guards.ts`)
- **Onboarding:** welcome → agreement → assessment (gate obrigatória)
- **Avaliação:** auto + mentor, 6 áreas universais de desenvolvimento (física, emocional, carácter, espiritual, intelectual, social), em 3 momentos (entrada, meio, saída). A 7ª área "domínio do pack" (`Pack.domainLabel`) foi removida do modelo — a disciplina de um pack (ex.: arte/cultura) é uma prática que o pack escolhe, já não uma dimensão universal da pessoa
- **Gates de packs/avaliação:** `hasDedicatedIndicators(packSlug)` (`src/lib/wepacker/types.ts`) decide se um pack tem o seu próprio conjunto de indicadores por área ou cai no `DEFAULT_INDICATORS` genérico. Um pack/Journey só pode ser ativado (`updatePack`/`updateCohortStatus`) se o pack tiver indicadores dedicados; sem eles, submeter auto-avaliação ou avaliação de mentor (`submitSelfEvaluation`/`submitMentorEvaluation`) é recusado com erro PT-PT claro
- **Planeamento:** plano de vida (Life Plan), plano estratégico trimestral, goals, ações mensais. `LifePlanVersion` guarda histórico append-only (snapshot do estado anterior antes de cada overwrite); restore disponível só para o próprio dono (`assertUserOwner`, nunca mentor) — restaurar não apaga nada, só faz upsert do snapshot escolhido, que por sua vez gera nova versão do estado atual
- **Sessões:** individuais/grupo com mentor, tracking de presença. Já não exigem Journey/Pack — `Session.cohortId` é opcional e `SessionAttendee` liga-se ao `User` (não à `CohortMembership`), para sessões de mentoria pessoal fora de qualquer cohort (`assertMentorOfUsers`). Cada sessão nasce com sala de vídeo própria (`Session.meetingUrl`, ver `MEETING_BASE_URL`); convites/remarcações/cancelamentos enviam email com evento `.ics` anexo (RFC 5545, UID estável, `SEQUENCE` crescente, `ORGANIZER` = mailbox de envio); vista Lista/Calendário (grid mensal próprio, zero dependências); `SessionKind` categoriza o propósito da sessão no imaginário de montanha (`checkpoint`, `recon`, `basecamp`, `rescue`, `summit` — ortogonal ao `SessionType` individual/grupo); debrief AI pós-sessão via `DebriefEngine` (seam `anthropic`/`hub`, ver Env vars)
- **Trilho da Expedição:** componente `ExpeditionTrail` no dashboard — traço horizontal em perfil de montanha que plota cronologicamente as sessões do membro (posição atual, próxima sessão, histórico)
- **Trails:** entidade `Trail` — jornada de transformação pessoal definida pelo próprio WEPACker (título, propósito, porquê agora, o que seria progresso real, áreas de desenvolvimento tocadas), autónoma de Cohort/Journey; uma pessoa pode ter vários Trails ao longo da vida (`/wepacker/trails`)
- **Basecamp:** `/wepacker/basecamp` — visão geral com Life Plan, Plano Estratégico e Trails num só ecrã, reaproveitando as actions guardadas existentes
- **Messaging:** conversas entre membros e mentores (contactos limitados a quem partilha cohort + admins)
- **Tasks:** com origem (plan, session, mentor, self) e status tracking
- **Leads:** formulário + chat → backoffice admin, com status pipeline
- **Chat Wessex:** integração Claude API
- **Candidaturas:** formulário público por pack em `/wepacker/[pack]/intake` (`candidatura` é alias legacy) → pipeline `beta_signups` (com `packSlug`) no backoffice admin
- **Bilheteira:** produto de bilhética/check-in de eventos dentro do mesmo repo (`src/app/bilheteira/*`, `src/app/bilhete/*`, `/api/bilheteira/*`, `/api/sn/*`) — Stripe checkout, upload de capa, QR check-in/check-out

## Convenções

- Língua da UI: Português (PT-PT)
- Cores: preto (#000), branco (#FFF), accent (#DEE0DB)
- Tipografia: Barlow Bold (títulos), Inter (corpo)
- Código/commits/comentários: inglês
