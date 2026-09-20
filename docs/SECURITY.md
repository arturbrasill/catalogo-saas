# Política e Arquitetura de Segurança Operacional (v1.0.0)

Este documento estabelece as diretrizes e mecanismos de segurança cibernética aplicados na concepção, operação e manutenção da plataforma **SaaS de Catálogo Digital Multi-Tenant**.

---

## 1. Princípios Fundamentais

1. **Defesa em Profundidade**: Múltiplas camadas de proteção (Edge Middleware, Next.js Proxy Gateway, Apps Script Engine, Planilhas Isoladas).
2. **Menor Privilégio (*Least Privilege*)**: O frontend nunca recebe credenciais com permissão irrestrita.
3. **Nunca Confiar na Entrada do Usuário**: Validação estrita de tipos e schemas antes de qualquer mutação.
4. **Zero Vazamento de Dados (*Zero Data Leakage*)**: Isolamento físico e lógico absoluto entre tenants.
5. **Nenhum Segredo no Frontend**: Hashes, senhas e chaves privadas nunca são embutidos em pacotes JavaScript do cliente.

---

## 2. Matriz de Segurança por Camada

### 2.1 Camada de Domínio e Transporte (Edge / HTTPS)

- **HTTPS Obrigatório**: Todo o tráfego HTTP é redirecionado automaticamente para HTTPS (cifras TLS 1.3 / 1.2 modernas).
- **HSTS (HTTP Strict Transport Security)**: Habilitado por padrão nas plataformas Edge (Vercel / Cloudflare).
- **Prevenção contra Tenant Spoofing**:
  - O middleware Edge normaliza o hostname (`Host` header) e busca exclusivamente contra o registro estrito em `tenants.json`.
  - Headers arbitrários ou tentativas de injeção de parâmetros via query string são desconsiderados. Domínios não cadastrados recebem 404 instantâneo.
  - O lojista ou cliente jamais pode apontar ou forçar uma API de outro tenant.

### 2.2 Camada de Autenticação e Gestão de Senhas

- **Armazenamento de Senhas**:
  - Senhas **NUNCA** são armazenadas em texto puro.
  - É utilizado o algoritmo de hash criptográfico **SHA-256 com Salt dinâmico exclusivo**:
    ```text
    admin_password_hash = SHA256("CATALOGO_SAAS_SALT_v1_" + senha)
    ```
  - O cálculo do hash ocorre exclusivamente no ambiente seguro do backend (Google Apps Script / Node.js server-side), nunca no browser.
- **Proteção dos Endpoints Públicos**:
  - Os endpoints de leitura pública (`GET ?action=store` e `GET ?action=all`) omitem os campos `admin_password_hash` e `api_token`.
- **Sessão Administrativa**:
  - O token gerado no login é mantido temporariamente em `sessionStorage` no navegador do lojista, sendo descartado ao fechar a janela ou ao clicar em "Sair" (logout).

### 2.3 Camada de Aplicação e Proteção de Imutabilidade

- **Chaves de Sistema Imutáveis**:
  - A ação `saveConfig` protege as configurações estruturais do tenant.
  - Tentativas de enviar ou alterar `store_id`, `api_token` ou `admin_password_hash` via API são bloqueadas com código de erro `FORBIDDEN_MODIFICATION`.
- **Validação de Entrada com Zod e TypeScript Estrito**:
  - Schemas rigorosos validam todas as entradas em [`src/lib/schemas.ts`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/src/lib/schemas.ts):
    - Preço > 0;
    - Preço promocional estritamente menor que o preço base;
    - Estoque inteiro >= -1;
    - Variações obrigatoriamente com tipo e array não-vazio de opções;
    - Nomes e categorias sanitizados contra XSS básico.

### 2.4 Camada de Upload de Imagens

- **Sem Binários no Banco / Planilha**: Arquivos de imagem nunca são trafegados ou gravados no Google Sheets ou no Google Apps Script.
- **Provedor Externo Seguro (Cloudinary)**:
  - Utilização exclusiva de **Unsigned Upload Presets** restritos à pasta de imagens;
  - A chave privada (`API Secret`) do Cloudinary **NUNCA** é exposta no frontend;
  - Limite máximo estrito de tamanho: **5 MB por imagem**;
  - Whitelist restrita de MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.

### 2.5 Camada de Persistência e Concorrência (Google Apps Script)

- **Controle Atômico de Concorrência**:
  - Toda operação de escrita (`doPost`) é envolvida pelo `LockService.getScriptLock().tryLock(30000)`.
  - Garante que escritas simultâneas na planilha sejam enfileiradas sem corrupção ou perda de linhas.
  - O lock é invocado em bloco `try...finally` garantindo liberação imediata.
- **Auditoria e Soft Delete**:
  - A exclusão de produtos e categorias nunca apaga fisicamente as linhas da planilha.
  - Utiliza marcação de exclusão lógica (`ativo = false`, `deletedAt = timestamp ISO 8601`), permitindo auditoria contínua e rastreabilidade de pedidos antigos fechados no WhatsApp.

---

## 3. Prevenção de Ataques Comuns (OWASP Top 10)

| Vetor de Ataque | Mecanismo de Defesa Implementado |
| :--- | :--- |
| **Cross-Site Scripting (XSS)** | React escapa strings por padrão; sanitização de inputs; sem uso de `dangerouslySetInnerHTML`. |
| **SQL / NoSQL Injection** | Não utiliza banco relacional ou NoSQL clássico; motor em memória e Google Sheets utilizam acesso por índice/coluna indexada. |
| **CORS Misconfiguration** | Rotas do frontend chamam o Next.js Route Handler `/api/backend` no servidor, eliminando cabeçalhos de preflight expostos. |
| **Broken Access Control** | Ações de escrita (`createProduct`, `updateProduct`, `deleteProduct`, `saveConfig`) exigem validação de `token` no Apps Script. |
| **Tenant Cross-Contamination** | Cada tenant possui uma planilha física separada e uma Web App isolada. Não há compartilhamento de tabelas. |
| **Brute Force em Senhas** | Rate limiting na borda (Vercel / Cloudflare) e tempo de resposta de 302 do Apps Script desestimula ataques volumétricos. |

---

## 4. Checklist Periódico de Segurança

Revisão trimestral obrigatória:

- [ ] Verificar auditoria de dependências: `npm audit`.
- [ ] Garantir que `.env` e chaves privadas permanecem fora do versionamento Git.
- [ ] Validar que nenhum commit recente introduziu `process.env.NEXT_PUBLIC_` com dados sensíveis.
- [ ] Testar se requisições manuais com `Host` desconhecido são adequadamente bloqueadas com 404.
- [ ] Conferir permissões da pasta de planilhas no Google Drive (acesso restrito apenas à conta de serviço/administrador).
