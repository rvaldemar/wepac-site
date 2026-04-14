# CLAUDE.md

## Projeto

WEPAC — Companhia de Artes. Site institucional + plataforma "Artista Alpha" (programa de desenvolvimento artístico integral com mentoria, avaliações e planeamento estratégico).

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

**Artista Alpha** (`/artists/alpha/`):
- Públicas: login, password reset, invite
- Onboarding: welcome → agreement → assessment
- Core: dashboard, plan, ppv, tasks, messages, sessions, diagnosis, profile
- Mentor: `/mentor/*`
- Admin: `/admin/settings`, `/admin/leads`

**API:** `/api/auth/[...nextauth]`, `/api/wessex/chat`

## Features produto

- **Roles:** artist, mentor, admin (middleware protege rotas por role)
- **Onboarding:** welcome → agreement → assessment (gate obrigatória)
- **Avaliação:** auto + mentor, 6 áreas (física, emocional, carácter, espiritual, intelectual, social), em 3 momentos (entrada, meio, saída)
- **Planeamento:** plano de vida, plano estratégico trimestral, goals, ações mensais
- **Sessões:** individuais/grupo com mentor, tracking de presença
- **Messaging:** conversas entre artistas e mentores
- **Tasks:** com origem (plan, session, mentor, self) e status tracking
- **Leads:** formulário + chat → backoffice admin, com status pipeline
- **Chat Wessex:** integração Claude API
- **Beta signup:** pipeline de inscrições

## Convenções

- Língua da UI: Português (PT-PT)
- Cores: preto (#000), branco (#FFF), accent (#DEE0DB)
- Tipografia: Barlow Bold (títulos), Inter (corpo)
- Código/commits/comentários: inglês
