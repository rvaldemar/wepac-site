# Ops Log

Histórico de problemas, decisões e soluções em produção. Consultado pelo Claude CLI antes de diagnosticar bugs ou fazer deploy.

---

## 2026-07-20 — WEPACKER: rebuild completo da plataforma (substitui Artista Alpha)

A área `/artists/alpha` foi reconstruída do zero como plataforma multi-pack **WEPACKER** em `/wepacker`. Leads e candidaturas (tabelas `leads` e `beta_signups`) preservadas — dados reais intocados.

**Arquitetura nova:**

- **Schema:** models `Pack` / `Cohort` / `CohortMembership`; artefactos de desenvolvimento (avaliações, planos, tarefas, sessões) pendurados na membership, não no user — uma pessoa pode pertencer a vários packs. `UserRole` passa a `member|mentor|admin`; 7ª área do radar é `domain`, com label por pack (`Pack.domainLabel`). `beta_signups` ganha coluna aditiva `packSlug` (default `artist`). Migração: `20260720120000_wepacker_platform_rebuild` — **esvazia as tabelas da plataforma (dados de teste) antes de alterar; leads/beta_signups só levam o ADD COLUMN**.
- **Segurança (fix do defeito conhecido):** todas as server actions novas em `src/lib/wepacker/actions/` verificam sessão e ownership via guards centrais (`src/lib/wepacker/guards.ts`). Nenhuma action aceita userId/membershipId do cliente sem validação de acesso (owner, mentor da cohort ou admin). As actions antigas sem auth foram eliminadas com a área antiga.
- **Rotas:** `/wepacker` (landing pública), `/wepacker/[pack]/candidatura` (pública, alimenta pipeline beta_signups), login/invite/password, onboarding (welcome/agreement/assessment), área member (dashboard/diagnosis/ppv/plan/tasks/sessions/messages/profile), mentor (`/wepacker/mentor/*`, detalhe por membershipId em `members/[id]`), admin (users, cohorts, applications, leads, settings). Redirects 308 de `/artists/alpha/*` para os equivalentes novos no middleware.
- **Onboarding fix:** o callback jwt agora refaz role/onboarded da BD quando o cliente chama `useSession().update()` — o fluxo antigo deixava o utilizador preso com JWT `onboarded=false` após aceitar o acordo.
- **Seed:** Pack `artist` ("Pack Artista") + cohort "Alpha" + users de teste (ana/pedro/maria/joao @example.com, ricardo@wepac.pt mentor, admin@wepac.pt — password123).

**Deploy (pendente — decisão HITL):** requer no servidor (1) `npx prisma@6.19.2 migrate deploy` (a migração **apaga os users/dados de teste da plataforma em prod**; leads intactas), (2) `npx prisma@6.19.2 generate`, (3) recriar o utilizador admin (via seed completo NÃO — o seed apaga e recria tudo; criar admin à mão via psql ou correr o seed conscientemente), (4) `systemctl restart wepac`. Nota: em `next start` o Auth.js exige `NEXTAUTH_SECRET`/`AUTH_SECRET` e host confiável — prod já tem ambiente configurado.

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
