# Pôr o projeto a correr (passo a passo)

Este guia assume que nunca configuraste nada disto. Demora cerca de 30 minutos.

## 1. Criar o projeto Supabase (base de dados + autenticação)

1. Vai a https://supabase.com, cria conta e um projeto novo. Escolhe a região
   **West EU (Ireland)** e guarda a password da base de dados.
2. Em *Project Settings → Database → Connection string* copia:
   - a ligação **Transaction pooler** (porta 6543) para `DATABASE_URL`, e
     acrescenta `?pgbouncer=true&connection_limit=1` no fim;
   - a ligação **Session pooler** ou **Direct** (porta 5432) para `DIRECT_URL`.
3. Em *Project Settings → API* copia `Project URL` (→ `SUPABASE_URL`) e
   `anon public` (→ `SUPABASE_ANON_KEY`).
4. Em *Project Settings → API → JWT Settings* copia o `JWT Secret`
   (→ `SUPABASE_JWT_SECRET`).
5. Em *Authentication → Providers* deixa Email ligado. Apple e Google podem
   ser ligados mais tarde.

## 2. Preparar o computador

```bash
# Node 22 (https://nodejs.org) e pnpm
corepack enable && corepack prepare pnpm@10 --activate

git clone https://github.com/marcosantoslda-bot/this-little-coach.git
cd this-little-coach
pnpm install
cp .env.example .env        # preencher com os valores do passo 1
```

## 3. Criar as tabelas e carregar o catálogo de exercícios

```bash
pnpm db:generate
pnpm db:deploy               # aplica as migrações SQL
pnpm --filter @tlc/database seed   # ~80 exercícios + 8 treinos de sistema
```

## 4. Arrancar a API

```bash
pnpm --filter @tlc/api dev
# Swagger: http://localhost:3000/docs
```

Para testar sem login, define `AUTH_DEV_BYPASS=true` no `.env` e envia o
cabeçalho `x-dev-user-email: tu@exemplo.pt` nos pedidos (ver
`apps/api/requests.http`). Só funciona fora de produção.

## 5. Arrancar a app no telemóvel

```bash
cp apps/mobile/.env.example apps/mobile/.env   # API URL + Supabase URL/anon key
pnpm --filter @tlc/mobile start
```

Instala a app **Expo Go** no telemóvel e lê o QR code. A `EXPO_PUBLIC_API_URL`
tem de ser o IP da tua máquina na rede local (ex.: `http://192.168.1.10:3000`),
não `localhost`.

## 6. Publicar

- **API:** Railway, Render ou Fly.io (Dockerfile a acrescentar no módulo de
  deploy). Variáveis de ambiente iguais ao `.env`, `NODE_ENV=production`.
- **App:** `eas build` (Expo Application Services) para TestFlight e Google
  Play internal testing.
