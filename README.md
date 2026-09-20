# Catálogo SaaS Multi-Tenant — Kit Google Antigravity

Este kit contém os prompts operacionais, skills e contratos necessários para um agente de desenvolvimento construir o sistema completo de catálogo digital multi-tenant.

## Objetivo

Construir uma plataforma white-label para empresas locais:

- vitrine pública por domínio;
- painel `/admin`;
- Google Sheets como persistência;
- Google Apps Script como API;
- produtos, categorias, variações e estoque;
- upload externo de imagens;
- sacola;
- fechamento via WhatsApp;
- resolução multi-tenant;
- deploy serverless de baixo custo.

## Como usar

1. Coloque este kit na raiz do projeto.
2. Leia `AGENTS.md` antes de iniciar.
3. O agente deve executar `prompts/00-master-orchestrator.md`.
4. O agente deve seguir a ordem dos prompts:
   - 01 backend
   - 02 admin
   - 03 catálogo
   - 04 WhatsApp
   - 05 multi-tenant
   - 06 deploy
   - 07 testes
   - 08 segurança
   - 09 QA
5. Após cada etapa, rode os testes e faça uma revisão antes de continuar.
6. Nunca avance ignorando erros críticos.

## Regra principal

O agente deve produzir código real, executável e testável. Não deve entregar pseudocódigo quando uma implementação concreta for possível.

## Princípio arquitetural

O frontend é uma aplicação única multi-tenant. Cada loja possui sua própria planilha e sua própria API Apps Script, enquanto o domínio determina qual tenant deve ser carregado.

## Aviso

Google Sheets/Apps Script é uma escolha de baixo custo e simplicidade, não uma substituição universal para um banco de dados de alta escala. O projeto deve manter as interfaces desacopladas para permitir migração futura.
