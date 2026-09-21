---
name: tailwind-design-system
description: Sistema de design baseado em Tailwind CSS, tokens semânticos, layouts Bento Grid, estética Quiet Chrome e transições fluidas.
---

# Skill — Tailwind Design System

## Quando usar
- Ao configurar `tailwind.config.ts`, `globals.css` ou criar bibliotecas de componentes reutilizáveis.
- Ao desenhar dashboards, vitrines de produtos ou painéis SaaS com identidade visual consistente.

## Princípios Fundamentais

1. **Tokens Semânticos sobre Valores Hardcoded**:
   - Usar variáveis CSS mapeadas para o Tailwind (ex: `var(--primary-color)`).
   - Isso permite suporte nativo a temas multi-tenant, white-label e dark mode sem refatorar componentes.

2. **Estética "Quiet Chrome"**:
   - Reduzir ruído visual: evitar bordas escuras grossas e sombras agressivas.
   - Usar bordas suaves de alta precisão (`border border-slate-200/80` ou `border-zinc-200/70`).
   - Usar sombras difusas (`shadow-xs`, `shadow-soft`, `shadow-card-hover`).

3. **Layouts Bento Grid**:
   - Organizar métricas, filtros e conteúdos em módulos retangulares e quadrados proporcionais (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`).
   - Evitar tabelas e listas verticais desordenadas em telas de visão geral.

4. **Consistência de Arredondamento (Border Radius)**:
   - Manter consistência: botões e inputs (`rounded-xl`), cards e modais (`rounded-2xl` ou `rounded-3xl`), badges e pills (`rounded-full`).

## Diretrizes de Implementação

### Tokens Recomendados (`tailwind.config.ts`)
```typescript
theme: {
  extend: {
    colors: {
      primary: 'var(--primary-color, #10b981)',
      secondary: 'var(--secondary-color, #047857)',
    },
    boxShadow: {
      soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      card: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      'card-hover': '0 0 0 1px rgba(0, 0, 0, 0.08), 0 12px 28px -4px rgba(0, 0, 0, 0.12)',
    }
  }
}
```

### Animações Essenciais (`globals.css`)
- Suporte a animações suaves de entrada:
  - `animate-fade-in`: `opacity` de 0 a 1 em 200ms.
  - `animate-scale-in`: `scale` de 0.96 a 1 em 200ms para modais.
  - `animate-slide-up`: transição de `translateY(10px)` para 0 em gavetas e cards.

### Badges e Status
- Badges de sucesso: `bg-emerald-50 text-emerald-800 border border-emerald-200`.
- Badges de alerta/baixo estoque: `bg-amber-50 text-amber-800 border border-amber-200`.
- Badges de erro/esgotado: `bg-rose-50 text-rose-800 border border-rose-200`.
- Badges de informação/ordem: `bg-slate-100 text-slate-700 border border-slate-200`.

## Definition of Done (DoD)
- Nenhuma cor crítica de marca está hardcoded sem referência a token.
- Todos os cartões interativos possuem efeitos de elevação suave em `:hover` e feedback em `:active`.
- O layout não quebra em viewports de 320px até 1920px.
