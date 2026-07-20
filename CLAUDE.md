# CLAUDE.md

## Projeto

WEPAC — Companhia de Artes. Site institucional + plataforma "WEPACKER" (desenvolvimento humano integral multi-pack — mentoria, avaliações, planeamento estratégico e comunidade; o Pack Artista substitui o antigo programa "Artista Alpha").

## Stack

- **Framework:** Next.js 16.1.6, React 19.2.3, TypeScript
- **Styling:** Tailwind CSS v4, Framer Motion
- **Auth:** NextAuth v5 (beta.30), Credentials provider, JWT sessions
- **DB:** PostgreSQL 16, Prisma 6.19.2
- **AI:** Anthropic SDK (chat Wessex)
- **Email:** Nodemailer (convites, reset password, notificações leads)

## Ops Log

Antes de diagnosticar bugs em prod ou fazer deploy, consultar `OPS_LOG.md`. Após resolver problemas ou fazer alterações relevantes, atualizar o `OPS_LOG.md`.

## Dev

```bash
npm install
npx prisma migrate dev    # criar/atualizar DB local
npx prisma db seed        # seed com users de teste
npm run dev               # http://localhost:3000
```

## Env vars

Ver `.env.example`. Variáveis obrigatórias:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — secret para sessões JWT (32+ chars)
- `NEXTAUTH_URL` — URL base para callbacks auth
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` — configuração email
- `APP_URL` — URL pública da app
- `ANTHROPIC_API_KEY` — para o chat Wessex (opcional em dev)

## Deploy

- Script: `deploy/deploy.sh` (build local + rsync para servidor)
- Servidor: `deploy@77.42.82.10`, app em `/var/www/wepac/current`
- Serviço: `sudo systemctl restart wepac`
- Logs: `journalctl -u wepac --no-pager -q`
- Após deploy: correr `npx prisma@6.19.2 generate` no servidor (o build local gera engines para macOS, o servidor precisa de Linux)

## Rotas

**Site público** (`(site)/`): `/`, `/sobre`, `/parcerias`, `/impacto`, `/contacto`, `/privacidade`, `/programacao`, `/projetos`, `/servicos`, `/media`, `/artist`

**WEPACKER** (`/wepacker/`):
- Públicas: landing `/wepacker`, candidatura `/wepacker/[pack]/candidatura`, login, password reset, invite
- Onboarding: welcome → agreement → assessment
- Member: dashboard, diagnosis, ppv, plan, tasks, sessions, messages, profile
- Mentor: `/wepacker/mentor/*` (detalhe por membershipId em `members/[id]`)
- Admin: `/wepacker/admin/{users,cohorts,applications,leads,settings}`
- Legacy: `/artists/alpha/*` redireciona 308 para os equivalentes novos

**API:** `/api/auth/[...nextauth]`, `/api/wessex/chat`

## Features produto

- **Arquitetura:** Pack → Cohort → CohortMembership; artefactos de desenvolvimento pendurados na membership (multi-pack por pessoa). 7ª área de avaliação é o domínio do pack (`Pack.domainLabel`).
- **Roles:** member, mentor, admin (middleware + guards por action protegem por role e ownership — ver `src/lib/wepacker/guards.ts`)
- **Onboarding:** welcome → agreement → assessment (gate obrigatória)
- **Avaliação:** auto + mentor, 7 áreas (física, emocional, carácter, espiritual, intelectual, social + domínio do pack), em 3 momentos (entrada, meio, saída)
- **Planeamento:** plano de vida, plano estratégico trimestral, goals, ações mensais
- **Sessões:** individuais/grupo com mentor, tracking de presença
- **Messaging:** conversas entre membros e mentores (contactos limitados a quem partilha cohort + admins)
- **Tasks:** com origem (plan, session, mentor, self) e status tracking
- **Leads:** formulário + chat → backoffice admin, com status pipeline
- **Chat Wessex:** integração Claude API
- **Candidaturas:** formulário público por pack → pipeline `beta_signups` (com `packSlug`) no backoffice admin

## Convenções

- Língua da UI: Português (PT-PT)
- Cores: preto (#000), branco (#FFF), accent (#DEE0DB)
- Tipografia: Barlow Bold (títulos), Inter (corpo)
- Código/commits/comentários: inglês
