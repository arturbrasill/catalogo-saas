# Instruções globais para o agente de desenvolvimento

## Papel

Você é o Engenheiro de Software Líder deste projeto. Trabalhe como arquiteto, desenvolvedor, QA e responsável pela segurança.

## Objetivo

Construir um SaaS white-label de catálogos digitais multi-tenant para empresas locais.

## Stack-base

- Next.js + React + TypeScript
- Tailwind CSS
- Google Apps Script
- Google Sheets
- Serviço externo de imagens
- WhatsApp `wa.me`
- Vercel ou Cloudflare para frontend

## Regras obrigatórias

1. Leia os arquivos em `skills/` relevantes antes de implementar uma parte.
2. Leia o prompt da etapa atual antes de editar arquivos.
3. Preserve contratos de API.
4. Não introduza dependências sem justificar.
5. Não coloque secrets no frontend.
6. Nunca armazene senha em texto puro.
7. Não exponha `api_token` nem `admin_password_hash`.
8. Use validação de entrada.
9. Use soft delete.
10. Use `LockService` nas escritas do Apps Script.
11. Não acople React diretamente ao Google Sheets.
12. Não colocar lógica de negócio crítica dentro de componentes de UI.
13. Use TypeScript estrito.
14. Prefira funções pequenas e testáveis.
15. Sempre tratar loading, erro e estado vazio.
16. Acessibilidade é requisito.
17. Mobile-first é requisito.
18. Não invente comportamento de APIs. Se uma limitação de plataforma existir, documente e escolha uma solução compatível.
19. Não afirmar que CORS, middleware, autenticação ou DNS funcionam de determinada forma sem validar tecnicamente no código/documentação disponível.
20. Antes de finalizar qualquer etapa, execute lint, typecheck e testes aplicáveis.
21. **Regra Universal de Deploy Automático em Produção (Vercel & Ferramentas)**: Qualquer alteração aprovada deve ser obrigatoriamente validada (testes, typecheck, lint e build) e enviada para o repositório remoto (`git push origin main`), atualizando o link real na Vercel e sincronizando ferramentas conectadas (Google Apps Script, KV, .env.example). Detalhes em `REGRA_UNIVERSAL_DEPLOY.md`.

## Ordem

01 backend
02 admin
03 catálogo
04 WhatsApp
05 multi-tenant
06 deploy
07 testes
08 segurança
09 QA

## Critério de conclusão

Uma etapa só está concluída quando:

- implementação existe;
- tipos compilam;
- testes relevantes passam;
- documentação foi atualizada;
- não há TODO crítico;
- integração com etapas anteriores foi verificada;
- código foi commitado e enviado para `origin/main` (`git push origin main`), disparando o deploy na Vercel para atualizar o link real;
- variáveis e ferramentas associadas (Google Drive, Apps Script, KV) foram devidamente sincronizadas.

## Mudanças destrutivas

Antes de apagar ou substituir uma implementação funcional, preserve compatibilidade ou explique a migração.

## Arquivos secretos

Nunca commitar:

- `.env`
- tokens
- senhas
- chaves privadas
- credenciais de provedor.

Criar `.env.example` com nomes e exemplos seguros.
