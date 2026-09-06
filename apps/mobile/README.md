# apps/mobile — This Little Coach (Expo / React Native)

App mobile da Fase 1: autenticação, onboarding, "treino de hoje", player de
sessão offline-first, histórico e progresso. Expo SDK 57, Expo Router (rotas
por ficheiro), TypeScript estrito, contratos partilhados via `@tlc/shared`.

Design: monocromático e funcional (ver `docs/adr/0002-design-monochrome.md`).
Todos os tokens vivem em `src/theme.ts`; o modo escuro é a inversão exata.

## Pôr a correr

Pré-requisitos: Node 22, pnpm 10 (`corepack enable`), a API a correr
(`pnpm --filter @tlc/api dev`) e um projeto Supabase com Email ligado.

```bash
pnpm install                                  # na raiz do monorepo
cp apps/mobile/.env.example apps/mobile/.env  # e preencher
pnpm --filter @tlc/mobile start               # abre o Metro / QR code
```

Variáveis (`apps/mobile/.env`, todas com prefixo `EXPO_PUBLIC_`):

| Variável                        | Valor                                                                 |
| ------------------------------- | --------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`           | URL da API. No telemóvel, o IP da máquina na rede local (`http://192.168.1.10:3000`), nunca `localhost`. |
| `EXPO_PUBLIC_SUPABASE_URL`      | *Project Settings → API → Project URL*                                |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | *Project Settings → API → anon public*                                |

Depois: instala a app **Expo Go** no telemóvel e lê o QR code (mesma rede
Wi-Fi). Para web, `pnpm --filter @tlc/mobile web`.

### Autenticação: é preciso um Supabase real

O `AUTH_DEV_BYPASS` da API (cabeçalho `x-dev-user-email`) **não existe na
app**: o cliente HTTP envia sempre `Authorization: Bearer <token Supabase>`.
Para testar no telemóvel é obrigatório um projeto Supabase (o plano gratuito
chega) com o provider Email ativo e a API configurada com o mesmo
`SUPABASE_URL` / `SUPABASE_JWT_SECRET`.

Fluxos suportados em `app/(auth)/`:

- Email + palavra-passe (`signInWithPassword` / `signUp`).
- Link por email (magic link, `signInWithOtp`). O link abre a app pelo scheme
  `thislittlecoach://auth-callback` e é tratado em `src/lib/auth-links.ts`
  (PKCE `code` ou `access_token`/`refresh_token`). Como no Expo Go os deep
  links são pouco fiáveis, o ecrã aceita também o **código de 6 dígitos** do
  email (`verifyOtp`). Para o código aparecer, inclui `{{ .Token }}` no
  template *Magic Link* do Supabase.
- Se o projeto exigir confirmação de email, o registo mostra "Confirma o email".

Em *Authentication → URL Configuration* adiciona `thislittlecoach://**` aos
*Redirect URLs*.

## Scripts

```bash
pnpm --filter @tlc/mobile start        # expo start
pnpm --filter @tlc/mobile typecheck    # tsc --noEmit (deve passar a zero)
pnpm --filter @tlc/mobile doctor       # expo-doctor
npx expo export --platform web         # bundle web (valida Metro + imports)
```

## Estrutura

```
apps/mobile/
├── app/                         # rotas (Expo Router)
│   ├── _layout.tsx              # providers + porta: (auth) → (onboarding) → (tabs)
│   ├── (auth)/sign-in.tsx, sign-up.tsx
│   ├── (onboarding)/goal | level | equipment | time   # 4 passos → POST /me/onboarding
│   ├── (tabs)/index.tsx         # Hoje: check-in → POST /workouts/generate
│   ├── (tabs)/workouts.tsx      # Treinos: lista + filtros (foco, ≤ min)
│   ├── (tabs)/progress.tsx      # Progresso: semana, peso (gráfico SVG), recordes, histórico
│   ├── workout/[id].tsx         # pré-visualização → POST /sessions
│   ├── session/[id].tsx         # player (um exercício de cada vez, timer, feedback, fim)
│   ├── history/[id].tsx         # detalhe de sessão passada (séries)
│   ├── settings.tsx             # modal: perfil, modo, equipamento, sair, apagar conta
│   └── auth-callback.tsx        # destino dos links de email
├── src/
│   ├── theme.ts                 # tokens monocromáticos (claro/escuro)
│   ├── components/ui/           # Button, Text, Screen, Row, Chip, Segmented, Stepper,
│   │                            # Timer, ProgressBar, Sheet, Field, Card, Scale, State
│   ├── features/                # auth, onboarding, today, player, progress, settings
│   ├── lib/
│   │   ├── api.ts               # fetch + Bearer token + ApiError + validação Zod
│   │   ├── supabase.ts          # cliente com AsyncStorage
│   │   ├── auth-links.ts        # deep links de auth
│   │   ├── queries/             # hooks React Query por recurso (me, exercises, workouts, sessions, progress)
│   │   ├── labels.ts            # etiquetas pt-PT ainda não existentes em @tlc/shared
│   │   └── format.ts            # datas, alvos ("12 reps"/"40 s"), kg, dificuldade "●●○○○"
│   ├── stores/
│   │   ├── session-store.ts     # sessão ativa + fila offline de séries (zustand + AsyncStorage)
│   │   └── onboarding-store.ts  # rascunho dos 4 passos
│   └── hooks/use-auth-session.ts
├── metro.config.js              # monorepo pnpm: watchFolders + nodeModulesPaths
├── babel.config.js              # babel-preset-expo (transpila @tlc/shared a partir do .ts)
└── tsconfig.json                # extends expo/tsconfig.base, strict, alias @/* → src/*
```

## Como funciona o offline no player

1. Cada série recebe um UUID v4 no cliente (`expo-crypto`) e entra na fila do
   `session-store` (persistida em AsyncStorage) antes de qualquer pedido.
2. A fila é enviada em lotes de até 50 para `POST /sessions/:id/sets`, com
   nova tentativa ao registar a série seguinte, ao voltar à app e ao concluir.
3. `POST /sessions/:id/complete` inclui as séries ainda não sincronizadas; a
   API é idempotente por `id`, por isso reenviar é seguro.
4. Se a app fechar a meio, o ecrã Hoje mostra "Continuar treino" na posição
   guardada (incluindo exercícios trocados).

## Contratos (`@tlc/shared`)

Os pedidos são validados com os schemas Zod antes de sair e as respostas são
validadas ao chegar (`schema.parse`). Se a API mudar um contrato, o erro
aparece como `ApiError` com `code: INVALID_RESPONSE`.

Etiquetas que faltam em `packages/shared/src/constants/labels.pt.ts` e por
isso vivem temporariamente em `src/lib/labels.ts`: `Sex`, `TrainingLocation`,
`RecordMetric`. O botão "Apagar conta" chama `DELETE /me`, endpoint ainda não
previsto na API.
