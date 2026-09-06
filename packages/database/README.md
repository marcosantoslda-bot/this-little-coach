# @tlc/database

Esquema Prisma, migrações SQL e cliente partilhado de base de dados (PostgreSQL via Supabase).

## Estrutura

```
packages/database/
├── prisma/
│   ├── schema.prisma          # fonte da verdade do modelo de dados
│   ├── migrations/            # migrações SQL versionadas (geradas pelo Prisma Migrate)
│   └── seed.ts                # (próximo passo) catálogo inicial de exercícios
├── src/index.ts               # singleton PrismaClient + re-export dos tipos
└── prisma.config.ts
```

## Comandos

| Comando                  | O que faz                                                     |
| ------------------------ | ------------------------------------------------------------- |
| `pnpm db:generate`       | gera o cliente TypeScript a partir do esquema                 |
| `pnpm db:migrate`        | cria/aplica migrações em desenvolvimento (`prisma migrate dev`) |
| `pnpm db:deploy`         | aplica migrações pendentes em staging/produção                |
| `pnpm db:studio`         | abre o Prisma Studio                                          |

`DATABASE_URL` deve apontar para o pooler (pgbouncer) do Supabase e `DIRECT_URL`
para a ligação direta. Ver `.env.example` na raiz.

## Convenções

- Tabelas e colunas em `snake_case` (via `@map`), modelos e campos em `camelCase`.
- UUID como chave primária em todas as tabelas.
- Datas em UTC; `DateTime @db.Date` apenas quando a hora é irrelevante.
- Apagar um utilizador é *soft-delete* (`deleted_at`); o histórico de sessões é
  apagado em cascata apenas quando o RGPD o exigir (job dedicado).
- Nunca editar ficheiros em `migrations/` à mão; alterar o `schema.prisma` e correr `pnpm db:migrate`.
