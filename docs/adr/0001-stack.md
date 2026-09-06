# ADR-0001 — Escolha da stack tecnológica

- Estado: proposto
- Data: 2026-09-06

## Contexto

Precisamos de uma app iOS/Android com backend próprio, base de dados relacional
e espaço para um motor de IA. A equipa é pequena e quer velocidade sem
comprometer a capacidade de evoluir para a "super app" (nutrição, social,
wearables).

## Decisão

| Área         | Decisão                         | Alternativa considerada | Motivo da escolha                                                                 |
| ------------ | ------------------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| Mobile       | Expo (React Native), TypeScript | Flutter                 | Partilha de tipos e lógica com o backend em TS; OTA updates; contratação mais fácil |
| Backend      | NestJS                          | FastAPI                 | Um só runtime e um só modelo de tipos; IA da Fase 1–2 não exige Python            |
| BD           | PostgreSQL + Prisma             | TypeORM                 | Migrações declarativas, tipos gerados, DX superior                                 |
| BaaS         | Supabase                        | Firebase                | Postgres nativo (sem duplicar dados), Auth com Apple/Google, Realtime, EU region   |
| Cache        | Redis (a partir da Fase 2)      | —                       | Não é necessário no MVP                                                             |
| Monorepo     | pnpm + Turborepo                | Nx                      | Mais leve; suficiente para 2 apps + 3 pacotes                                       |

## Consequências

- Todo o domínio partilhado (Zod, gerador de treinos) vive em `packages/shared`.
- Se surgir necessidade de ML próprio (modelos treinados com os dados de
  `SessionSet`), adiciona-se `services/ai-engine` em Python sem tocar no resto.
- A app mobile nunca fala diretamente com a base de dados; o Supabase é usado
  para Auth (e Realtime mais tarde), a API é a única porta para os dados.
