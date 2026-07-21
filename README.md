# WEPAC — Companhia de Artes

Site institucional e plataforma **WEPACKER** de desenvolvimento humano integral. O target domain graph é Person-centred; see [`docs/architecture/domain-graph-v2.md`](docs/architecture/domain-graph-v2.md). `Pack`, `Cohort` and `CohortMembership` remain legacy delivery tables during the additive migration and are not target community/Cycle semantics.

**Departamentos:** Wessex (performance), Easy Peasy (educação artística), Arte à Capela (património/espaços sagrados).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4, Framer Motion |
| Auth | NextAuth v5 (Credentials, JWT) |
| Database | PostgreSQL 16, Prisma ORM |
| AI | Anthropic SDK (Claude) |
| Email | Nodemailer |

## Setup local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar environment
cp .env.example .env.local
# Editar .env.local com valores locais (DATABASE_URL, NEXTAUTH_SECRET, etc.)

# 3. Base de dados
npx prisma migrate dev
npx prisma db seed

# 4. Correr
npm run dev
```

A app fica disponível em `http://localhost:3000`.

## Estrutura

```
src/
├── app/
│   ├── (site)/          # Site público (home, sobre, serviços, projetos, ...)
│   ├── wepacker/        # WEPACKER platform
│   ├── artists/alpha/   # Legacy redirects
│   └── api/             # API routes (auth, wessex chat)
├── components/          # React components
├── lib/                 # Auth, DB, email, server actions, types
└── middleware.ts        # Route protection por role
prisma/
├── schema.prisma        # Schema da base de dados
├── seed.ts              # Seed com users de teste
└── migrations/          # Histórico de migrations
deploy/
└── deploy.sh            # Build local + rsync para servidor
```

## WEPACKER

- **My Journey** — one whole-life view per Person/WEPACker
- **Stage** — Easy Peasy, Step Up or YUP; never inferred without verified data
- **Life Map and Trails** — Person-owned private artifacts
- **Mentorship** — directed, bilateral and independent from Packs/Cycles
- **Sessions** — explicit attendees; direct active Mentorship supports cohortless scheduling
- **Packs** — target communities only; separate from legacy `Pack` rows
- **Cycles** — time-bounded delivery with separate Enrollment and Facilitator edges
- **Privacy** — Mentorship grants Session capability only; no implicit Life Map, Assessment, Task or Message access
- **Legacy Assessment/Tasks** — visibly contained until target Stage-calibrated flows are implemented
- **Leads** — pipeline de contactos (formulário + chat)
- **Admin** — gestão de settings e leads

## Deploy

Build local + rsync para servidor via `deploy/deploy.sh`. Ver `OPS_LOG.md` para histórico de problemas em produção.

```bash
./deploy/deploy.sh
# Após deploy, no servidor:
npx prisma@6.19.2 generate
sudo systemctl restart wepac
```

## Convenções

- Canonical product/domain terms in English; supporting prose may be PT-PT
- Cores: `#000`, `#FFF`, `#DEE0DB`
- Tipografia: Barlow Bold (títulos), Inter (corpo)
- Código, commits e comentários em inglês
