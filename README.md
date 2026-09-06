# This Little Coach

Super app de fitness com treino adaptativo por IA. Treino, nutrição e
recuperação num só lugar, a crescer contigo.

- Plano de arquitetura: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Decisões técnicas: [`docs/adr/`](docs/adr/)
- Modelo de dados: [`packages/database/prisma/schema.prisma`](packages/database/prisma/schema.prisma)

## Estrutura

```
apps/mobile      Expo / React Native
apps/api         NestJS
packages/database  Prisma + migrações
packages/shared    domínio partilhado (Zod, gerador de treinos)
packages/config    tsconfig / eslint / prettier
docs/              arquitetura e ADRs
index*.html        protótipos PWA originais
```

## Começar

```bash
corepack enable && corepack prepare pnpm@10 --activate
pnpm install
cp .env.example .env      # preencher com as credenciais do Supabase
pnpm db:generate
pnpm db:migrate
```

Requer Node 22 (ver `.nvmrc`).
