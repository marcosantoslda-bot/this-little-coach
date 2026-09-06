# Roadmap e sugestões

## Estado da Fase 1 (MVP)

| Módulo                               | Estado |
| ------------------------------------ | ------ |
| Esquema de dados + migrações         | feito  |
| Contratos partilhados (Zod)          | feito  |
| Catálogo de exercícios (seed)        | feito  |
| Motor gerador de treinos + testes    | feito  |
| API NestJS (auth, perfis, treinos, sessões, progresso) | feito |
| App Expo (auth, onboarding, gerador, player, progresso) | feito (typecheck e export web verdes), por testar em dispositivo |
| Protótipo PWA a preto e branco       | feito  |
| PWA com regras científicas por perfil (mulher 40+, adulto, jovem) e 3 pessoas | feito |
| Deploy (Dockerfile API, EAS)         | por fazer |
| Testes E2E em dispositivo            | por fazer |

## Nota de contexto

A app é para uso pessoal de uma família (3 pessoas). A PWA em `index.html`
é o produto; a API e a app Expo ficam como base para uma versão futura com
sincronização entre telemóveis. As sugestões abaixo valem para as duas.

## O que sugiro a seguir, por ordem de valor

1. **Importar o histórico do protótipo.** Um botão "Importar da app antiga"
   que lê o JSON exportado pelo protótipo (`expData`) e cria sessões, pesos e
   perfil na nova base de dados. Sem isto, quem já usa o protótipo perde meses
   de dados ao mudar.
2. **Modo casal (Household).** O protótipo foi feito para duas pessoas. Na
   app nova: um "agregado" com 2+ utilizadores, treino a dois (o gerador
   produz duas versões do mesmo treino, uma por nível), e um resumo semanal
   partilhado. Nenhuma app grande faz isto bem.
3. **Motor adaptativo (Fase 2), versão regras.** Já temos o sinal por série
   (alvo vs. real, RPE, motivo). Primeira versão sem ML: se 2 sessões seguidas
   marcam "fácil" num exercício, avança para a variante mais difícil; se
   "difícil" ou "dor", recua e reduz volume 20 %. Explicável e testável.
4. **Ajuste em tempo real durante o treino.** Quando o utilizador marca
   "difícil" numa série, o player propõe logo baixar as reps das rondas
   seguintes ou trocar pela variante mais fácil.
5. **Nutrição simples (Fase 3), migrando as fórmulas do protótipo.** BMR,
   alvo de kcal, proteína, água, e a lista de alimentos portugueses já
   existente. Registo por "prato" e por "mão", como no protótipo, mas a preto
   e branco e em dois toques.
6. **Wearables.** Apple Health e Health Connect para importar peso, passos e
   frequência cardíaca; exportar as sessões como treinos.
7. **Gamificação sóbria.** Streaks semanais (não diárias, para não punir
   descanso), recordes pessoais e "marcos" de progressão (passar de flexões
   inclinadas para flexões normais é uma conquista). Sem moedas nem confetes.
8. **Conteúdo.** Vídeos curtos (5 s, loop) para cada exercício. Até lá,
   ilustrações de linha a preto e branco, coerentes com o design.
9. **Deploy e observabilidade.** Dockerfile da API, Sentry na app e na API,
   analytics de produto mínimos (funil onboarding → primeiro treino → segunda
   semana).

## Métrica que importa

Percentagem de utilizadores que completam **3 treinos na segunda semana**.
Tudo no roadmap acima deve ser avaliado por esse número.
