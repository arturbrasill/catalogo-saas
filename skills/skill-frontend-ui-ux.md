---
name: frontend-ui-ux-polisher
description: Especialista em design system white-label, microinterações, carrossel de banners e refatoração visual mobile-first para catálogos digitais e painéis administrativos.
tools:
  - code_editor
  - file_writer
---

# SKILL: UI/UX DESIGN & POLIMENTO DE FRONTEND WHITE-LABEL

## 1. OBJETIVO OPERACIONAL
Transformar a interface visual do catálogo digital e do painel administrativo (/admin) em um produto de alto padrão estético (nível Shopify/iFood/Stripe), garantindo:
- Responsividade total e fluidez em telas mobile (360px a 430px) e desktops.
- Suporte a personalização de cores por loja via variáveis CSS dinâmicas.
- Manutenção e valorização dos banners no topo com carrossel responsivo.
- Componentes táteis com microinterações claras (feedback de clique, estados vazios, skeletons de carregamento).

## 2. REGRAS DE DESIGN SYSTEM (ESTRUTURA OBRIGATÓRIA)

### A. Paleta e Variáveis Dinâmicas
Injetar no cabeçalho ou layout raiz:
```css
:root {
  --brand-primary: #16a34a;
  --brand-primary-hover: #15803d;
  --brand-contrast: #ffffff;
  --brand-surface: #f8fafc;
  --brand-card: #ffffff;
  --brand-border: #e2e8f0;
  --brand-text-main: #0f172a;
  --brand-text-muted: #64748b;
  --radius-card: 1rem;
}