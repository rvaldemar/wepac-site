# CLAUDE.md

## Projeto

WEPAC — Companhia de Artes. Site institucional + plataforma "Artista Alpha" (Next.js 15, Prisma, PostgreSQL, NextAuth v5).

## Ops Log

Antes de diagnosticar bugs em prod ou fazer deploy, consultar `OPS_LOG.md` para histórico de problemas e soluções anteriores. Após resolver problemas ou fazer alterações relevantes em prod/infra, atualizar o `OPS_LOG.md` com a entrada correspondente.

## Deploy

- Script: `deploy/deploy.sh` (build local + rsync para servidor)
- Servidor: `deploy@77.42.82.10`, app em `/var/www/wepac/current`
- Serviço: `sudo systemctl restart wepac`
- Logs: `journalctl -u wepac --no-pager -q`
- Após deploy: correr `npx prisma@6.19.2 generate` no servidor (o build local gera engines para macOS, o servidor precisa de Linux)

## Convenções

- Língua da UI: Português (PT)
- Cores: preto (#000), branco (#FFF), accent (#DEE0DB)
- Tipografia: Barlow Bold (títulos), Inter (corpo)
