# Guia de Desenvolvimento Local & Testes (v1.1.0)

Este documento orienta a configuração, execução e testes automatizados e manuais do backend Google Apps Script e da arquitetura do catálogo multi-tenant.

---

## 1. Pré-requisitos

- **Node.js**: >= v18 (recomendado: v20 LTS ou v24+)
- **npm**: v10+
- **Git**: Configurado

---

## 2. Execução dos Testes Automatizados

A suíte de testes com Vitest valida todas as operações do backend, autenticação, integridade referencial, soft delete, validações Zod e controle de concorrência:

```bash
# Executar todos os testes automatizados
npm test

# Executar testes em modo contínuo (watch)
npm run test:watch

# Executar verificação estrita de tipos
npm run typecheck

# Executar verificação do linter
npm run lint
```

---

## 3. Exemplos Reais de Teste com cURL / HTTP

Após publicar a Web App no Google Apps Script (`https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`), você pode validar os endpoints diretamente pelo terminal:

### 3.1 Consultar Dados Públicos da Loja (GET)
```bash
curl -L -X GET "https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?action=store"
```

### 3.2 Listar Categorias Ativas (GET)
```bash
curl -L -X GET "https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?action=categories"
```

### 3.3 Listar Produtos Ativos (GET)
```bash
curl -L -X GET "https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?action=products"
```

### 3.4 Carregar Todo o Catálogo Consolidado (GET)
```bash
curl -L -X GET "https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?action=all"
```

### 3.5 Realizar Login Administrativo (POST)
```bash
curl -L -X POST "https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec" \
  -H "Content-Type: text/plain" \
  -d '{"action":"login","password":"admin123"}'
```

### 3.6 Criar Produto com Variações (POST)
```bash
curl -L -X POST "https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec" \
  -H "Content-Type: text/plain" \
  -d '{
    "action": "createProduct",
    "token": "SEU_TOKEN_AQUI",
    "product": {
      "categoriaId": "cat_geral",
      "nome": "Camiseta Algodão Egípcio",
      "preco": 89.90,
      "precoPromocional": 69.90,
      "estoque": 20,
      "variacoes": [
        {"tipo": "Tamanho", "opcoes": ["P", "M", "G"]},
        {"tipo": "Cor", "opcoes": ["Preto", "Branco"]}
      ],
      "ativo": true
    }
  }'
```

---

## 4. Publicação e Atualização no Google Apps Script

1. Abra sua planilha do Google Sheets.
2. Acesse **Extensões** > **Apps Script**.
3. Copie o conteúdo atualizado de `backend/Code.gs` e cole no editor do Apps Script.
4. Clique no ícone de disquete (**Salvar**).
5. Se for a primeira execução:
   - Selecione a função `initDatabase` no topo e clique em **Executar**.
   - Conceda as permissões necessárias na sua conta Google.
6. Para publicar ou atualizar a versão em produção:
   - Clique em **Implantar** > **Gerenciar implantações**.
   - Clique no ícone de lápis (**Editar**).
   - Em **Versão**, selecione **Nova versão**.
   - Clique em **Implantar**.
   - Copie a URL do aplicativo da Web.
