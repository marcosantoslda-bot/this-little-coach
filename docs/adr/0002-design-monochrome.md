# ADR-0002 — Design monocromático e funcional

- Estado: aceite
- Data: 2026-09-06

## Contexto

O protótipo PWA usa pastéis, gradientes, emoji como ícones e cinco tabs com
páginas de mais de 2 000 px de scroll e dezenas de secções colapsáveis. O
feedback do fundador foi direto: preto e branco é mais prático, e a app está
confusa.

## Decisão

1. **Paleta monocromática.** Fundo branco, texto preto, cinzas para
   secundário e bordas. Modo escuro é a inversão exata. Nenhuma cor transmite
   estado; o estado transmite-se por peso tipográfico, bordas e texto.
2. **Hierarquia por tamanho, não por cor.** Um número grande por ecrã (o que
   importa hoje), corpo a 17 px, títulos de secção a 12 px em maiúsculas.
3. **Três tabs no máximo** na app nova: Hoje, Treinos, Progresso. Definições
   atrás de um ícone. No protótipo PWA, a tab "Guia" passa a "Mais".
4. **Uma ação primária por ecrã**, botão preto a toda a largura, fixo em baixo.
5. **Sem emoji, sem ilustrações, sem gradientes, sem sombras.** Ícones de
   contorno, pretos, só quando substituem texto.
6. **Páginas curtas.** Tudo o que não é a ação principal fica colapsado ou
   noutro ecrã. O conteúdo principal cabe acima da dobra num ecrã de 390×844.

## Consequências

- O design system da app mobile (`apps/mobile/src/theme.ts`) tem um único
  conjunto de tokens; adicionar cor mais tarde é uma decisão explícita.
- O protótipo PWA foi reestilizado sem alterar a lógica nem os dados guardados.
- Gráficos desenham-se a preto e cinza; séries distinguem-se por traço
  (sólido, tracejado) e não por cor.
