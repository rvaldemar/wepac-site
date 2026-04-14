# WEPAC — Companhia de Artes

Site institucional e plataforma **Artista Alpha** da WEPAC. Programa de desenvolvimento artístico integral com mentoria, avaliações e planeamento estratégico.

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
│   ├── artists/alpha/   # Plataforma Artista Alpha (protegida)
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

## Plataforma Artista Alpha

Sistema multi-role (artista, mentor, admin) com:

- **Onboarding** — welcome, agreement, assessment (obrigatório)
- **Avaliação** — auto + mentor, 6 dimensões, 3 momentos
- **Planeamento** — plano de vida, plano estratégico, goals, ações mensais
- **Sessões** — individuais/grupo com mentor
- **Messaging** — conversas artista-mentor
- **Tasks** — origem (plan, session, mentor, self), status tracking
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

- UI em Português (PT-PT)
- Cores: `#000`, `#FFF`, `#DEE0DB`
- Tipografia: Barlow Bold (títulos), Inter (corpo)
- Código, commits e comentários em inglês
