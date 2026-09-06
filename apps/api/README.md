# apps/api — This Little Coach API (NestJS)

> Ainda não inicializado. Será criado com `nest new` no módulo "Autenticação e perfis".

Arquitetura modular (um módulo Nest por bounded context), com camadas
controller → service → repository (Prisma) e DTOs validados com Zod.

```
apps/api/src/
├── main.ts
├── app.module.ts
├── common/                  # guards (Supabase JWT), filtros, interceptors, pipes Zod
├── modules/
│   ├── users/               # /me, perfil, onboarding
│   ├── exercises/           # catálogo, pesquisa, traduções
│   ├── workouts/            # templates, gerador (usa @tlc/shared/workout-engine)
│   ├── sessions/            # iniciar/terminar sessão, registar séries, feedback
│   └── progress/            # histórico, recordes, medições
└── infra/
    ├── prisma/              # PrismaService (wrapper do @tlc/database)
    ├── supabase/            # verificação de JWT
    └── cache/               # Redis (Fase 2)
```

Regra de ouro: a lógica de domínio (ex.: algoritmo do gerador) vive em
`packages/shared` como funções puras e testáveis; o NestJS só orquestra.
