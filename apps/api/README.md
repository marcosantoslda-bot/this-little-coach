# apps/api — This Little Coach API (NestJS 11 + Prisma)

API REST da Fase 1: perfis, catálogo de exercícios, treinos (curados, manuais e
gerados), sessões de treino e progresso. Os contratos de entrada/saída são os
schemas Zod de `@tlc/shared`; a lógica de domínio pura (gerador de treinos,
calorias) também vive lá — o Nest só orquestra.

## Arquitetura

```
src/
├── main.ts                        # bootstrap: CORS, filtro global de erros, Swagger em /docs
├── app.module.ts
├── config/env.ts                  # variáveis de ambiente validadas com Zod (falha cedo)
├── common/
│   ├── auth/                      # guard global (JWT Supabase via jose + bypass de dev), @CurrentUser, @Public
│   ├── zod/                       # ZodValidationPipe, @ZodBody / @ZodQuery / @ZodParam
│   ├── filters/                   # HttpExceptionFilter -> { statusCode, message, code?, details? } (apiErrorSchema)
│   ├── errors/                    # fábricas: badRequest, unauthorized, notFound, conflict, serviceUnavailable
│   ├── localization/              # tradução por locale do utilizador (fallback en-US -> nome canónico)
│   ├── mapping/primitives.ts      # Decimal -> number, Date -> ISO, YYYY-MM-DD, paginação por cursor
│   └── time/week.ts               # semanas segunda–domingo no fuso do utilizador (só Intl)
├── infra/prisma/                  # PrismaService (extends PrismaClient), módulo global
└── modules/<contexto>/            # controller (fino) · service (regras) · repository (só Prisma) · mapper · module
    ├── users/      GET|PATCH|DELETE /me, PATCH /me/profile, POST /me/onboarding
    ├── exercises/  GET /exercises, GET /exercises/:id
    ├── workouts/   GET|POST /workouts, POST /workouts/generate, GET|DELETE /workouts/:id
    ├── sessions/   POST|GET /sessions, GET /sessions/:id, POST /sessions/:id/{sets,complete,abandon}
    └── progress/   GET /progress/overview, GET|PUT /progress/measurements, GET /progress/records
```

Regras transversais:

- **Autenticação obrigatória** em tudo exceto `GET /health` (`@Public()`).
- **Propriedade:** treinos, sessões e dados de progresso de outros utilizadores
  respondem `404` (nunca `403`, para não revelar existência).
- **Erros** seguem sempre `apiErrorSchema`. Validação Zod falhada = `400` com
  `code: VALIDATION_ERROR` e `details[]`. Erros Prisma comuns são traduzidos
  (`P2025` → 404, `P2002` → 409, `P2003` → 400).
- **Localização:** `exercise.name/description/cues` vêm no `locale` do
  utilizador (`pt-PT` por defeito), com fallback `en-US` e depois nome canónico.

## Correr localmente

Pré-requisitos: Node 22+, pnpm, uma base de dados PostgreSQL com o schema
aplicado e o catálogo semeado:

```bash
pnpm install
pnpm --filter @tlc/database migrate:deploy   # ou db:migrate na raiz
pnpm --filter @tlc/database seed             # 130 exercícios, progressões, 8 treinos de sistema
```

Variáveis de ambiente (lidas de `apps/api/.env` e, em fallback, do `.env` na
raiz do monorepo — ver `.env.example`):

| Variável              | Obrigatória | Descrição                                                                  |
| --------------------- | ----------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`        | sim         | Ligação PostgreSQL usada pela aplicação (pooler).                          |
| `DIRECT_URL`          | não         | Ligação direta (só o Prisma Migrate a usa).                                |
| `SUPABASE_JWT_SECRET` | sim*        | Segredo HS256 do Supabase Auth para validar os JWT.                        |
| `SUPABASE_URL`        | sim*        | URL do projeto. Sem segredo, usa-se o JWKS em `/auth/v1/.well-known/jwks.json`; se definido, valida também o `iss`. |
| `AUTH_DEV_BYPASS`     | não         | `true` fora de produção ativa o cabeçalho `x-dev-user-email` (ver abaixo). |
| `API_PORT`            | não         | Porta HTTP (defeito `3000`).                                               |
| `NODE_ENV`            | não         | `development` (defeito) · `test` · `production`.                           |
| `CORS_ORIGINS`        | não         | Origens permitidas separadas por vírgula (defeito: qualquer origem).       |

\* É preciso `SUPABASE_JWT_SECRET` **ou** `SUPABASE_URL`, exceto se
`AUTH_DEV_BYPASS=true` fora de produção. Em produção o bypass é rejeitado no arranque.

```bash
pnpm --filter @tlc/api dev        # nest start --watch (webpack + swc), recompila ao gravar
pnpm --filter @tlc/api build      # -> dist/main.js
pnpm --filter @tlc/api start      # node dist/main.js
pnpm --filter @tlc/api typecheck
pnpm --filter @tlc/api test       # vitest (unitários, sem base de dados)
```

- Swagger UI: <http://localhost:3000/docs> (JSON em `/docs-json`). Usa
  "Authorize" com o JWT do Supabase ou com o cabeçalho de dev.
- Exemplos de todos os endpoints em [`requests.http`](./requests.http)
  (extensão REST Client do VS Code / IntelliJ HTTP Client).

### Autenticação

Pedidos normais: `Authorization: Bearer <access_token do Supabase>`. O guard
verifica a assinatura com `jose` (HS256 com o segredo, ou JWKS), exige
`aud: authenticated` e um `sub` UUID, e no primeiro pedido cria o `User` local
(+ `Profile` vazio) com o email e o nome (`user_metadata.full_name` → `name` →
prefixo do email). Se o email já existir com outro `authId` (conta recriada no
Supabase), o utilizador é religado ao novo `sub`. Contas eliminadas (`deletedAt`)
respondem `401 ACCOUNT_DELETED`.

**Bypass de desenvolvimento (sem Supabase):** com `NODE_ENV != production` e
`AUTH_DEV_BYPASS=true`, o cabeçalho `x-dev-user-email: ana@example.com`
autentica esse utilizador — criando-o se não existir. Útil para o Swagger, o
`requests.http` e a app mobile em desenvolvimento.

```bash
curl -H 'x-dev-user-email: ana@example.com' http://localhost:3000/me
```

### Notas de build

`@tlc/shared` e `@tlc/database` são pacotes de código-fonte TypeScript
(`main: src/index.ts`). Por isso o `nest build` usa o builder webpack
(`nest-cli.json` + `webpack.config.js`): o código dos workspaces é empacotado
em `dist/main.js`, as dependências reais ficam externas e a transpilação é
feita com swc (`unplugin-swc`, o mesmo dos testes). A verificação de tipos no
build é feita pelo `ForkTsCheckerWebpackPlugin` do Nest CLI; `pnpm typecheck`
corre `tsc --noEmit` sobre `src/` (que arrasta os pacotes importados).

`@prisma/client` só está instalado em `packages/database`; o bundle
referencia-o por caminho relativo (`../../../packages/database/node_modules/@prisma/client`)
enquanto não for declarado como dependência direta da API. Quando o for, o
`webpack.config.js` passa automaticamente a usar o `require('@prisma/client')` normal.

## Regras de negócio relevantes

- **Sessões:** `POST /sessions` guarda um snapshot imutável do treino
  (blocos/exercícios já localizados) ou um snapshot vazio ("Treino livre").
  Séries são enviadas em lote com `id` gerado no cliente — o upsert é
  idempotente (sincronização offline). Só sessões `IN_PROGRESS` aceitam séries,
  conclusão ou abandono (`409 SESSION_NOT_IN_PROGRESS`).
- **Concluir sessão:** grava séries pendentes, feedback e duração; estima
  calorias (`estimateSessionCalories` de `@tlc/shared`: MET do exercício × peso
  × tempo sob esforço, em que o tempo é `durationSec` ou `repsCompleted × 3 s`;
  peso = última medição → `startingWeightKg` → 70 kg) e atualiza recordes
  pessoais (`MAX_REPS`, `MAX_DURATION_SEC`, `MAX_LOAD_KG`, só quando o valor
  supera o atual). Tudo numa transação.
- **Gerar treino:** `POST /workouts/generate` carrega perfil + catálogo ativo
  (com `easierIds/harderIds` das progressões), chama `generateWorkout()` e
  persiste com `source: GENERATED`, `generatorVersion` e
  `generationInput = { params, explanation }` — a explicação é devolvida em
  `workout.explanation` em qualquer leitura posterior.
- **Progresso:** semana = segunda a domingo no `timezone` do utilizador;
  `streakWeeks` conta semanas consecutivas com ≥ 1 sessão concluída, terminando
  nesta semana ou na anterior; `weightTrend7d` = último peso − peso registado
  ~7 dias antes (±3 dias).
