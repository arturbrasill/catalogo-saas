# SaaS Catálogo Digital Multi-Tenant

Plataforma white-label multi-tenant de catálogo digital para empresas locais com arquitetura de baixo custo, alta velocidade e fechamento de pedidos direto no WhatsApp.

---

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript estrito, Tailwind CSS, Lucide Icons.
- **Roteamento Edge**: Next.js Middleware para resolução dinâmica de tenants por hostname.
- **Persistência**: Google Sheets (uma planilha isolada por tenant).
- **Backend API**: Google Apps Script Web App com bloqueio atômico de concorrência (`LockService`).
- **Checkout & Conversão**: WhatsApp oficial da loja via links estruturados `wa.me` com `encodeURIComponent`.
- **Hospedagem de Mídia**: Provedor externo com CDN (Cloudinary / Unsigned Presets).
- **Deploy**: Vercel (Edge Serverless) com emissão automática de SSL/TLS para domínios próprios.

---

## 📚 Documentação Técnica e Operacional

| Documento | Descrição |
| :--- | :--- |
| [`docs/DEPLOY.md`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/docs/DEPLOY.md) | Guia passo a passo de deploy do frontend (Vercel) e backend (Google Sheets/GAS). |
| [`docs/ONBOARDING.md`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/docs/ONBOARDING.md) | Procedimento Operacional Padrão (POP) para cadastrar uma nova loja em menos de 10 minutos. |
| [`docs/DNS.md`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/docs/DNS.md) | Configuração de domínios no Registro.br e Cloudflare (A, CNAME, HTTPS, propagação). |
| [`docs/SECURITY.md`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/docs/SECURITY.md) | Política de segurança, proteção de segredos, SHA-256 + salt e prevenção de spoofing. |
| [`docs/BACKUP.md`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/docs/BACKUP.md) | Procedimentos de backup automatizado diário e plano de recuperação de desastres (DR). |
| [`docs/TROUBLESHOOTING.md`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/docs/TROUBLESHOOTING.md) | Matriz de diagnóstico rápido e resolução dos erros mais comuns da operação. |
| [`docs/INTEGRATION_TESTS.md`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/docs/INTEGRATION_TESTS.md) | Relatório da suíte de 96 testes cobrindo os 4 fluxos operacionais completos. |
| [`docs/API_CONTRACT.md`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/docs/API_CONTRACT.md) | Especificação estrita de todos os endpoints GET/POST e códigos de erro. |
| [`docs/DATA_MODEL.md`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/docs/DATA_MODEL.md) | Schema das abas do Google Sheets (`config`, `categorias`, `produtos`). |
| [`docs/ARCHITECTURE.md`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/docs/ARCHITECTURE.md) | Diagrama de arquitetura, subsistemas e isolamento físico de dados. |

---

## 🛠️ Comandos de Desenvolvimento e Testes

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Executar suíte completa de testes automatizados (96 testes)
npm test

# Executar checagem estrita de tipos TypeScript
npm run typecheck

# Executar linter de código
npm run lint

# Executar build de produção Next.js
npm run build
```

---

## 🧪 Como Testar Múltiplos Tenants Localmente

Navegadores modernos resolvem `*.localhost` diretamente para `127.0.0.1`:

1. Inicie o servidor: `npm run dev`.
2. Acesse no navegador:
   - `http://localhost:3000` ➔ Loja padrão configurada.
   - `http://loja-a.localhost:3000` ➔ Loja A (Boutique Elegance).
   - `http://loja-b.localhost:3000` ➔ Loja B (Esportes Radicais).
   - `http://inexistente.localhost:3000` ➔ Tela amigável de "Loja Não Encontrada" (404).

---

## 🔒 Segurança em Primeiro Lugar

- **Zero Segredos no Frontend**: Senhas e tokens de API nunca são expostos em variáveis públicas (`NEXT_PUBLIC_`) ou bundles cliente.
- **Hash com Salt**: Hashes SHA-256 com salt fixo da plataforma garantem armazenamento protegido na planilha.
- **Isolamento de Dados**: Cada loja possui sua própria planilha física e Web App do Google Apps Script; não há compartilhamento de tabelas entre clientes.
- **LockService**: Controle atômico de concorrência para gravações simultâneas.
