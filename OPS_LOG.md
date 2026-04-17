# Ops Log

Histórico de problemas, decisões e soluções em produção. Consultado pelo Claude CLI antes de diagnosticar bugs ou fazer deploy.

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
