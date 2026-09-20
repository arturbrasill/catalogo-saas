# Plano de Testes e Estratégia de Garantia de Qualidade (v1.0.0)

Este documento estabelece a estratégia integral de testes automatizados e manuais do **SaaS de Catálogo Digital Multi-Tenant**, cobrindo testes unitários, testes de integração, testes end-to-end simulados, testes de segurança e validação de casos de borda (*edge cases*).

---

## 1. Pirâmide e Estratégia de Testes

```text
               ▲
              / \
             /E2E\       (Simulação Completa de Fluxos de Negócio)
            /─────\
           / INTEG \     (API, Gateway Proxy, Multi-Tenant, LockService)
          /─────────\
         / UNITÁRIOS \   (Cálculos, Formatações, Schemas, Resolvers)
        /─────────────\
```

### Tecnologias:
- **Runner**: Vitest v2.1.9 (execução ultra-rápida em TypeScript nativo).
- **Tipagem**: TypeScript 5.9.3 (modo strict com checagem de tipos estrita).
- **Linter**: ESLint 8.57.1 com regras Next.js Core Web Vitals.
- **Simulador de Backend**: `BackendEngine` in-memory com paridade funcional ao Google Apps Script.

---

## 2. Matriz de Cobertura por Arquivo de Teste

| Arquivo de Teste | Camada / Módulo | Casos de Teste | Foco Principal |
| :--- | :--- | :--- | :--- |
| [`tests/backend.test.ts`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/tests/backend.test.ts) | Módulo 1 (Backend GAS & Sheets) | 29 | CRUD, LockService, soft delete, hashes SHA-256 com salt, erros padronizados. |
| [`tests/admin.test.ts`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/tests/admin.test.ts) | Módulo 2 (Painel /admin) | 15 | Autenticação, Zod schemas, VariationBuilder, UploadService, imutabilidade de config. |
| [`tests/catalog.test.ts`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/tests/catalog.test.ts) | Módulo 3 (Vitrine Pública) | 16 | Busca, filtros de categoria, modal de variações, sacola, responsividade (320px a 1440px). |
| [`tests/whatsapp.test.ts`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/tests/whatsapp.test.ts) | Módulo 4 (Motor de WhatsApp) | 19 | Cálculos decimais, promoções, emojis, formatação markdown, sanitização e encodeURIComponent. |
| [`tests/multitenant.test.ts`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/tests/multitenant.test.ts) | Módulo 5 (Multi-Tenant & DNS) | 11 | Normalização de host, remoção de porta/www, localhost, prevenção de spoofing. |
| [`tests/integration.test.ts`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/tests/integration.test.ts) | Integração Completa | 13 | Fluxo ponta a ponta: Consumidor, Lojista, Multi-Tenant paralelo, WhatsApp real. |
| [`tests/security.test.ts`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/tests/security.test.ts) | Módulo 8 (Segurança) | 9 | Prevenção de SSRF, bloqueio de javascript:, sanitização de saveConfig e não-vazamento de tokens. |
| **TOTAL** | **7 Suítes Automatizadas** | **112 Testes** | **100% de Aprovação (0 Falhas)** |

---

## 3. Casos de Borda Validados (*Edge Cases*)

1. **Produto sem imagem**:
   - Card e modal exibem placeholder com ícone visual neutro (`Package`) sem quebrar layout.
2. **Produto sem variações**:
   - Permite adição direta à sacola sem exibir seletores vazios ou travar checkout.
3. **Estoque Zero / Esgotado**:
   - Exibe badge de "Esgotado", desabilita botão de adicionar à sacola e impede checkout.
4. **Preço Promocional Incoerente**:
   - Se `precoPromocional >= preco` ou `<= 0`, o schema Zod e o backend rejeitam com `VALIDATION_ERROR`.
5. **Acentuação, Caracteres Especiais e Emojis no WhatsApp**:
   - Termos como `Óculos Polarizado — Edição Especial & Limitada` e emojis `🛍️`, `💰`, `📦` preservados sem corrupção após decodificação.
6. **Sacola Vazia**:
   - `buildWhatsAppMessage` e drawer rejeitam checkout vazio com mensagem amigável ao usuário.
7. **Domínio Desconhecido ou Invasor**:
   - Roteador e API interceptam e retornam tela 404 de "Loja Não Encontrada", sem expor dados internos ou endpoints.
8. **Concorrência Simultânea de Gravação**:
   - `LockService.tryLock(30000)` enfileira escritas atômicas e retorna `LOCK_TIMEOUT` em caso de saturação.

---

## 4. Matriz de Validação Responsiva

A arquitetura do frontend foi projetada no padrão Mobile-First e validada nos seguintes viewports:

| Viewport | Dispositivo Referência | Colunas no Grid | Comportamento do Modal |
| :--- | :--- | :--- | :--- |
| **320px** | iPhone SE (1ª geração) | 2 colunas (`gap-2.5`) | Padding reduzido (`p-2.5 sm:p-4`), galeria empilhada |
| **375px** | iPhone SE (2ª/3ª geração) / iPhone 8 | 2 colunas (`gap-3.5`) | Fluido, preços com ajuste tipográfico |
| **390px** | iPhone 12 / 13 / 14 | 2 colunas | Altura máxima com scroll vertical suave (`max-h-[92vh]`) |
| **430px** | iPhone 14 / 15 Pro Max | 2 colunas | Exibição espaçada e confortável |
| **768px** | iPad Mini / Air (Retrato) | 3 colunas (`sm:grid-cols-3`) | Modal dividido em 2 colunas (Imagem à esquerda, dados à direita) |
| **1024px** | iPad Pro / MacBook Air | 4 colunas (`lg:grid-cols-4`) | Grade expandida, header com busca e sacola alinhados |
| **1440px** | Monitor Desktop Full HD / 2K | 4 colunas (`max-w-7xl`) | Contido em container centralizado com margens generosas |
