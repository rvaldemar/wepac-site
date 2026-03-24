# Ops Log

Histórico de problemas, decisões e soluções em produção. Consultado pelo Claude CLI antes de diagnosticar bugs ou fazer deploy.

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
