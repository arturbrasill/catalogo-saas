# Regras do Projeto — Catalogo SaaS White-Label

Este projeto possui regras mandatórias que devem ser rigorosamente seguidas por qualquer agente ou desenvolvedor.

## 1. Regra Universal Obrigatória: Deploy Automático em Produção (Vercel & Ferramentas)
Consulte e aplique integralmente as diretrizes do arquivo `REGRA_UNIVERSAL_DEPLOY.md`:
- **Nenhuma alteração aprovada permanece somente local.**
- Todo ciclo de trabalho aprovado deve passar por:
  1. `npm run test` (todos os testes passando)
  2. `npm run typecheck` (zero erros de TypeScript)
  3. `npm run lint` (zero erros de linter)
  4. `npm run build` (build Next.js de produção aprovado)
- **Deploy imediato:** Executar `git add .`, commit semântico e `git push origin main` para atualizar automaticamente a Vercel e o link real em produção.
- **Sincronização de ecossistema:** Atualizar `.env.example`, Google Apps Script (`backend/*.gs`), banco KV/Upstash e registrar instruções operacionais.

## 2. Regras Arquiteturais e de Segurança
- Seguir as regras descritas em `AGENTS.md`.
- Mobile-first, acessibilidade (WCAG), TypeScript estrito.
- Nunca commitar arquivos `.env` ou segredos reais.
- Isolamento multi-tenant por domínio/subdomínio e permissões restritas em planilhas Google.
