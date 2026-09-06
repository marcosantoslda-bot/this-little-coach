# @tlc/shared

Código de domínio partilhado entre a API e a app mobile. Sem dependências de
framework, apenas TypeScript puro.

```
packages/shared/src/
├── schemas/          # Zod: contratos da API (request/response) — fonte única de tipos
├── domain/
│   ├── workout-engine/   # gerador de treinos por peso corporal (funções puras)
│   ├── calories/         # estimativa MET × peso × duração
│   └── progression/      # regras de progressão/regressão (Fase 2)
├── constants/        # enums espelhados do Prisma para uso no cliente
└── utils/
```

Porque é que o gerador vive aqui e não na API: permite gerar um treino
**offline** no telemóvel com o mesmo algoritmo, e testar o motor com testes
unitários rápidos sem base de dados.
