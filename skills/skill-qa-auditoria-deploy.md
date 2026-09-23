```markdown
---
name: qa-auditoria-integridade
description: Auditor técnico focado em resiliência de dados do Google Sheets, sanitização e encode do WhatsApp, isolamento multi-tenant de LocalStorage e homologação pré-produção.
tools:
  - code_editor
  - terminal
  - file_writer
---

# SKILL: AUDITORIA TÉCNICA TOTAL, RESILIÊNCIA E BLINDAGEM DE PRODUÇÃO

## 1. OBJETIVO OPERACIONAL
Inspecionar, testar e corrigir cada linha de lógica do sistema para eliminar falhas silenciosas, travamentos de tela por dados malformatados e problemas na transição do pedido para o WhatsApp.

## 2. VETORES OBRIGATÓRIOS DE INSPEÇÃO E BLINDAGEM

### A. Validação de Dados do Google Sheets
- **Preços**: Tratar tanto strings brasileiras (`"29,90"`, `"R$ 29,90"`) quanto valores numéricos (`29.9`). Nunca permitir renderização de `NaN`.
- **Imagens ausentes**: Se o link da foto estiver vazio ou inválido, substituir automaticamente por URL de placeholder moderna com cantos arredondados.
- **Campos vazios**: Produtos sem descrição, sem categoria ou sem variações devem renderizar normalmente sem erros de `undefined.map()`.

### B. Serialização do WhatsApp
- **Sanitização de Telefone**: Remover todo caractere não numérico (`/\D/g`). Inserir prefixo do país (`55`) caso o número tenha apenas 10 ou 11 dígitos.
- **Codificação de URL**: Utilizar `encodeURIComponent()` na mensagem completa montada. Quebras de linha estruturadas com `%0A` ou `\n`.
- **Formatação**:
  - Título da loja em negrito.
  - Cada item com quantidade, nome, variações escolhidas indentadas e subtotal.
  - Total geral formatado em Real (`R$ 0,00`).

### C. Isolamento Multi-Tenant no Navegador
- **LocalStorage**: O carrinho deve ser indexado pelo identificador único ou domínio da loja: `cart_items_${tenantId}`. O carrinho da Loja A não pode aparecer na Loja B caso o mesmo cliente visite ambas.
- **Validação de Estoque/Ativo**: Se um produto no carrinho for desativado na planilha, o carrinho deve lidar com o item graciosamente ou removê-lo com aviso.

### D. Tratamento de Latência e Falhas
- **Estado de Carregamento**: Skeleton animado pulsante na grade de produtos durante o tempo de resposta do Google Sheets.
- **Timeout/Erro de Conexão**: Exibir alerta amigável com botão "Tentar Novamente" em vez de página em branco.

## 3. PROTOCOLO DE ACEITE (GO-LIVE)
Nenhuma versão é considerada aprovada sem passar por:
1. Simulação com produto contendo caracteres especiais (`&`, `%`, `+`, `"`, `'`).
2. Teste de clique de envio do pedido em dispositivo móvel (abrindo app nativo) e em navegador desktop (abrindo WhatsApp Web).
3. Teste com 3 produtos adicionados, 1 com variações, 2 sem variações.