---
name: accessibility-wcag
description: Requisitos e implementação prática de acessibilidade web (WCAG 2.1 AA), navegação por teclado e compatibilidade com leitores de tela.
---

# Skill — Acessibilidade & WCAG 2.1 AA

## Quando usar
- Ao construir qualquer componente interativo (botões com ícones, modais, gavetas/drawers, formulários e listas de navegação).
- Ao realizar auditorias de QA e testes de conformidade com padrões internacionais de acessibilidade.

## Princípios Fundamentais

1. **Acessibilidade Não é Opcional**:
   - É um requisito funcional de software moderno e exigência legal (EAA / WCAG 2.1).
   - Todo usuário deve conseguir navegar, comprar ou gerenciar o sistema utilizando apenas o teclado.

2. **Botões de Ícone Sem Texto Visível**:
   - Todo botão que contenha apenas um ícone (ex: `X` de fechar, lixeira, coração de favoritos, sacola) DEVE obrigatoriamente possuir um atributo `aria-label` descritivo.
   - Exemplo: `<button aria-label="Remover produto da sacola">` (nunca `<button>` vazio).

3. **Gerenciamento de Foco e Modais**:
   - Modais e gavetas (drawers) devem:
     - Fechar imediatamente ao pressionar a tecla `Escape`.
     - Travar a rolagem do fundo (`document.body.style.overflow = 'hidden'`).
     - Restaurar a rolagem ao desmontar.
     - Ter foco visível claro (`focus:outline-none focus:ring-2 focus:ring-emerald-500`).

4. **Contraste Mínimo de Cores**:
   - Texto padrão deve atingir no mínimo a proporção de contraste **4.5:1** contra o plano de fundo.
   - Evitar texto cinza claro (`text-slate-300` ou `text-gray-400`) sobre fundos brancos para informações legíveis.

## Diretrizes de Implementação

### Elementos Semânticos
- Usar tags HTML nativas antes de criar `<div>` clicáveis:
  - Usar `<button type="button">` para ações.
  - Usar `<a href="...">` para navegação entre rotas.
  - Usar `<header>`, `<main>`, `<footer>`, `<nav>` para estrutura geral da página.

### Formulários Acessíveis
- Todo `<input>` deve possuir um `<label>` associado via `htmlFor` ou envolvido diretamente.
- Mensagens de erro de validação devem ter `aria-live="polite"` ou `role="alert"` para que sejam anunciadas por leitores de tela.

### Exemplo de Modal Acessível
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [onClose]);
```

## Definition of Done (DoD)
- Nenhum botão interativo carece de rótulo acessível (`aria-label`).
- É possível fechar modais e drawers utilizando a tecla `ESC`.
- A navegação com a tecla `Tab` segue uma ordem lógica sem armadilhas de foco.
- Os contrastes de texto respeitam a proporção mínima de 4.5:1.
