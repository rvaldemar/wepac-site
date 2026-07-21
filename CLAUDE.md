# CLAUDE.md

## Projeto

WEPAC — Companhia de Artes. Site institucional + plataforma WEPACKER para desenvolvimento humano integral. O target domain graph é centrado na Person/WEPACker; `docs/architecture/domain-graph-v2.md` é a referência canónica. As tabelas físicas `Pack`, `Cohort` e `CohortMembership` são legacy delivery durante a migração e não podem ser relabeladas como Community Pack, Cycle/Enrollment ou Discipline sem mapping revisto.

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
npm run test:e2e          # E2E rápido (next dev) — loop local
npm run test:e2e:build    # E2E contra build+start — gate antes de deploy
```

Gotcha de worktrees: depois de fazer merge de uma branch com migration Prisma para a árvore principal, corre `npx prisma generate` na árvore principal — o `generate` que corre dentro de uma worktree isolada não cobre a árvore principal.

Corre `npm run test:e2e:build` antes de qualquer deploy que toque em auth,
onboarding, sessões/debrief ou candidatura pública — os 4 fluxos cobertos
pela suite Playwright (`e2e/`). A suite reseeda a DB dev local (`prisma db
seed`, que já limpa e recria as tabelas da plataforma WEPACKER) antes de
correr — nunca correr com `DATABASE_URL` apontado a staging/produção.

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
- Onboarding universal: welcome → agreement; legacy Assessment is optional and never inferred as a gate
- Person/My Journey: dashboard, Basecamp, Life Map (`ppv` physical legacy route), Strategic Plan, Trails, Sessions, Mentorships, explicit Messages, profile; legacy Assessment/Tasks are labelled as such
- Mentor workspace: Mentorships + authorized Sessions. Legacy member/evaluate/tasks/messages routes are Admin-only until artifact-specific grants exist
- Admin: `/wepacker/admin/{users,cohorts,applications,leads,settings}`
- Legacy: `/artists/alpha/*` redireciona 308 para os equivalentes novos

**API:** `/api/auth/[...nextauth]`, `/api/wessex/chat`, `/api/bilheteira/{checkin,stripe/webhook,uploads/[filename]}`, `/api/sn/{create,list,update,delete,checkin,status}` (bilheteira/check-in de eventos — produto próprio dentro do repo, ver `src/app/bilheteira/*` e `src/app/bilhete/*`)

## Features produto

- **Target architecture:** Person/WEPACker at the centre; one whole-life My Journey containing current Stage, Life Map, Trails and historical evidence. Independent edges: Connection, directed Mentorship, Community Pack Membership, Cycle Enrollment and Cycle Facilitator. See the accepted ADR.
- **Legacy architecture:** physical `Pack → Cohort → CohortMembership` remains only for compatibility. It must stay visibly labelled legacy until explicit mapping/cutover.
- **Roles:** `member`, `mentor`, `admin` remain account-access implementation values, not Person identities or relationship proof. Only an accepted directed Mentorship authorizes discovery + explicit Sessions in the first slice.
- **Onboarding:** welcome → agreement. Assessment is not a universal gate.
- **Assessment:** the existing instrument is explicitly legacy and delivery-based. The target has Six Pillars (Physical, Emotional, Character, Spiritual, Intellectual, Social), calibrated by verified Stage and optionally Discipline; it is not yet implemented as a target write flow.
- **Legacy delivery gates:** `hasDedicatedIndicators(packSlug)` protects activation and Assessment writes on legacy track/cohort rows. These checks do not make those rows target Discipline/Cycle records.
- **Planeamento:** plano de vida (Life Plan), plano estratégico trimestral, goals, ações mensais. `LifePlanVersion` guarda histórico append-only (snapshot do estado anterior antes de cada overwrite); restore disponível só para o próprio dono (`assertUserOwner`, nunca mentor) — restaurar não apaga nada, só faz upsert do snapshot escolhido, que por sua vez gera nova versão do estado atual
- **Sessions:** explicit attendees; no Pack/Cycle required. Cohortless scheduling is authorized by a fully accepted active Mentorship, with a measured active legacy-cohort fallback. Optional `cohortId` remains legacy context; exact active participation is revalidated. `Session.mentorshipId` scopes direct sessions to organizer/Admin. Calendar emails use one `.ics` per recipient to avoid attendee PII disclosure.
- **Trilho da Expedição:** componente `ExpeditionTrail` no dashboard — traço horizontal em perfil de montanha que plota cronologicamente as sessões do membro (posição atual, próxima sessão, histórico)
- **Trails:** entidade `Trail` — jornada de transformação pessoal definida pelo próprio WEPACker (título, propósito, porquê agora, o que seria progresso real, áreas de desenvolvimento tocadas), autónoma de Cohort/Journey; uma pessoa pode ter vários Trails ao longo da vida (`/wepacker/trails`)
- **Basecamp:** `/wepacker/basecamp` — visão geral com Life Plan, Plano Estratégico e Trails num só ecrã, reaproveitando as actions guardadas existentes
- **Messaging:** existing explicit Conversation participants can read/send. Shared Cohort, Mentorship or Admin access does not create contact/read permission; new contact discovery/start is disabled until a dedicated grant exists.
- **Tasks:** physical legacy membership-scoped feature. Owner-only; Mentorship, Sessions and Admin access do not grant Task access or cross-person creation.
- **Leads:** formulário + chat → backoffice admin, com status pipeline
- **Chat Wessex:** integração Claude API
- **Candidaturas:** formulário público por pack em `/wepacker/[pack]/intake` (`candidatura` é alias legacy) → pipeline `beta_signups` (com `packSlug`) no backoffice admin
- **Bilheteira:** produto de bilhética/check-in de eventos dentro do mesmo repo (`src/app/bilheteira/*`, `src/app/bilhete/*`, `/api/bilheteira/*`, `/api/sn/*`) — Stripe checkout, upload de capa, QR check-in/check-out

## Convenções

- Canonical product/domain terms: English. Supporting UI prose may remain PT-PT.
- Cores: preto (#000), branco (#FFF), accent (#DEE0DB)
- Tipografia: Barlow Bold (títulos), Inter (corpo)
- Código/commits/comentários: inglês
