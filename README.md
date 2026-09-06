# This Little Coach

App de treino, alimentação e progresso para a família. Preto e branco, sem
distrações, com regras baseadas em evidência para cada pessoa (adulto, mulher
40+, jovem).

## A app que se usa: a PWA

O ficheiro **`index.html`** é a app. É uma Progressive Web App num só ficheiro,
sem servidor: instala-se no telemóvel a partir do browser e os dados ficam no
próprio telemóvel. Publicada via GitHub Pages a partir do ramo `main`.

- Regras de treino e nutrição por perfil: [`docs/SCIENCE.md`](docs/SCIENCE.md)
- Decisão de design: [`docs/adr/0002-design-monochrome.md`](docs/adr/0002-design-monochrome.md)
- Os ficheiros `index-1.html` a `index-5.html` são versões antigas, mantidas
  por segurança.

Para partilhar dados entre telemóveis usa-se o export/import de JSON na tab
"Mais".

## O resto do repositório: base para uma versão futura com servidor

Não é necessário para uso pessoal. Fica guardado como ponto de partida se um
dia quiseres sincronização automática entre telemóveis ou uma app nas lojas.

```
apps/api            API NestJS (auth Supabase, treinos, sessões, progresso)
apps/mobile         App Expo / React Native
packages/database   Esquema Prisma + migrações + seed (130 exercícios)
packages/shared     Contratos Zod + motor gerador de treinos (testado)
docs/               arquitetura, ADRs, setup, roadmap, ciência
```

Para pôr isso a correr: [`docs/SETUP.md`](docs/SETUP.md). Arquitetura:
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

```bash
corepack enable && corepack prepare pnpm@10 --activate
pnpm install
pnpm --filter @tlc/shared test
```
