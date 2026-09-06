# apps/mobile — This Little Coach (Expo / React Native)

> Ainda não inicializado. Será criado com `create-expo-app` (Expo SDK + Expo Router + TypeScript)
> no módulo "Autenticação e onboarding".

Estrutura prevista (feature-first):

```
apps/mobile/
├── app/                      # rotas (Expo Router): (auth)/, (tabs)/, workout/[id], session/[id]
├── src/
│   ├── features/
│   │   ├── auth/             # ecrãs + hooks de login/registo (Supabase Auth)
│   │   ├── onboarding/       # perfil progressivo (objetivo, nível, equipamento, tempo)
│   │   ├── workout-generator/# "gera-me um treino para hoje"
│   │   ├── session-player/   # execução guiada: timer, séries, feedback por série
│   │   └── history/          # calendário, estatísticas, recordes
│   ├── components/ui/        # design system (botões, cards, timers) — tema do protótipo
│   ├── lib/                  # api client (React Query), supabase client, storage offline
│   └── stores/               # estado global leve (Zustand)
└── app.json
```

Princípios: offline-first para a execução de treinos (uma sessão nunca se perde
sem rede), tipos partilhados com a API via `@tlc/shared`.
