---
name: frontend-design
description: Padrões avançados de UI/UX para criar interfaces ricas, personalizadas e humanizadas, eliminando o visual genérico de IA.
---

# Skill — Frontend Design Master

## Quando usar
- Ao criar ou refatorar páginas, layouts, componentes visuais, vitrines de produtos ou painéis administrativos.
- Ao transformar especificações de requisitos em interfaces visuais de alto padrão (*consumer-grade* e *enterprise-grade*).

## Princípios Fundamentais

1. **Fuga do Genérico (*Anti-AI Slop*)**:
   - Evitar layouts previsíveis: títulos pretos com subtítulo cinza centralizado, 3 cartões brancos idênticos e botões roxos com gradientes clichês.
   - Todo design deve ter identidade, ritmo visual e sensação de produto feito sob medida.

2. **Hierarquia Visual Intencional**:
   - O olho do usuário deve entender o elemento principal da página em menos de 1 segundo.
   - Estabelecer contraste por escala de tamanho, peso da fonte e saturação de cor, não apenas cor pura.

3. **Micro-interações e Retorno Háptico**:
   - Cada ação (clique, hover, foco, toggle) deve fornecer feedback tátil e suave (`active:scale-95`, `transition-all duration-200`).
   - Evitar transições duras ou demoradas (> 300ms causa sensação de lentidão).

4. **Tratamento dos 4 Estados Obrigatórios**:
   Toda tela ou componente de dados deve possuir design explícito para:
   - **Loading State**: Skeletons elegantes que espelham o layout final (nunca apenas um spinner solto).
   - **Success State**: Conteúdo rico e legível com espaçamento equilibrado.
   - **Empty State**: Ilustração sutil ou ícone sem contorno agressivo, explicação clara e botão de ação primária (CTA).
   - **Error State**: Mensagem amigável com opção clara de tentar novamente.

## Diretrizes de Implementação

### Tipografia
- Usar escala proporcional (`text-xs`, `text-sm`, `text-base`, `text-xl`, `text-2xl`, `text-4xl`).
- Aplicar `-webkit-font-smoothing: antialiased` globalmente.
- Títulos expressivos devem usar `tracking-tight` ou `tracking-tighter` para evitar sensação de espaçamento frouxo.
- Rótulos e pequenas legendas devem usar `uppercase tracking-wider text-[11px] font-bold`.

### Cores e Superfícies
- Não usar cinza neutro puro `#808080`. Preferir escalas contemporâneas como **Slate** (`#0f172a`, `#64748b`, `#f8fafc`) ou **Zinc**.
- O fundo da aplicação deve ter um tom sutil (`bg-slate-50` ou `bg-zinc-50`), reservando o branco puro (`bg-white`) para cartões e áreas interativas elevadas.
- Usar transparências com desfoque de fundo (`backdrop-blur-md bg-white/90`) para barras de navegação fixas.

### Proporções e Imagens
- Contêineres de imagens de produtos devem ter `aspect-ratio` fixo (`aspect-square` ou `aspect-[4/3]`) com `object-cover`.
- Sempre prover fallback visual suave (ícone estilizado com fundo neutro) para imagens quebradas ou ausentes (`onError`).

## Definition of Done (DoD)
- A interface é responsiva (*mobile-first*), acessível por toque e teclado.
- Não existem quebras de texto desajeitadas (`truncate` ou `line-clamp` aplicados).
- Os 4 estados de dados (Loading, Empty, Error, Success) foram implementados e testados visualmente.
