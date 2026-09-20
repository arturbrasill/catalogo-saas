# Notas de Lançamento da Versão 1.0.0 (Release Notes)

**Data do Release**: 20 de Setembro de 2026  
**Versão**: `v1.0.0-production`  
**Status**: Estável e Homologado para Produção  

---

## 🌟 Destaques do Lançamento

A versão 1.0.0 marca o lançamento oficial do **SaaS de Catálogo Digital Multi-Tenant**, uma solução completa, ágil e de custo operacional quase nulo voltada para o comércio local. A plataforma permite que centenas de empresas locais operem seus próprios catálogos digitais responsivos com domínio próprio, fechamento direto no WhatsApp e gerenciamento simplificado via Google Sheets.

---

## 📦 Módulos e Funcionalidades Entregues

### 1. Backend Serverless (Google Apps Script + Google Sheets)
- **Persistência Sem Custos**: Cada loja física possui sua própria planilha no Google Sheets (`config`, `categorias`, `produtos`).
- **Bloqueio Atômico de Concorrência**: `LockService` com timeout de 30 segundos prevenindo corrupção de dados em gravações concorrentes.
- **Segurança de Segredos**: Hashes de senha SHA-256 com salt exclusivo da plataforma (`CATALOGO_SAAS_SALT_v1_`). Chaves sensíveis nunca são expostas em endpoints públicos.
- **Auditoria com Soft Delete**: Itens deletados são preservados na planilha com `ativo = false` e timestamp `deletedAt`, mantendo a integridade referencial de pedidos históricos.

### 2. Painel Administrativo do Lojista (`/admin`)
- **Autenticação Segura**: Fluxo completo de login, validação de tokens temporários em `sessionStorage` e proteção de rotas com `ProtectedRoute`.
- **Gestão Completa de Catálogo**: Cadastro, edição, duplicação e desativação de produtos e categorias com validação Zod.
- **Variation Builder Interativo**: Interface para criação dinâmica de variações (ex.: Tamanhos, Cores, Voltagens).
- **Upload de Fotos Desacoplado**: Integração com Cloudinary via *Unsigned Upload Presets* e fallback local, impedindo armazenamento de arquivos pesados na planilha.
- **Customização de Identidade Visual**: Alteração de nome fantasia, telefone de atendimento, cores primária e secundária.

### 3. Vitrine Pública Mobile-First (`/`)
- **Tema Dinâmico**: Injeção automática das cores da marca do lojista (`--primary-color`, `--secondary-color`).
- **Busca e Filtros Instantâneos**: Busca textual varrendo nome e descrição em tempo real, combinada com carrossel horizontal de categorias.
- **Modal de Detalhes do Produto**: Visualização de múltiplas fotos em carrossel e **exigência obrigatória de seleção de variações**.
- **Sacola de Compras Persistente**: Gerenciada por React Context e sincronizada com `localStorage`.
- **Estados Visuais Robustos**: Skeletons de carregamento fluidos, tratamento de erros com tentativa de reconexão e empty states explicativos.

### 4. Motor de Conversão do WhatsApp (`src/lib/whatsapp.ts`)
- **Biblioteca TypeScript Pura**: Sem acoplamento com React ou APIs de navegador.
- **Precisão Centesimal**: Subtotais e totalização com arredondamento monetário estrito, prevenindo falhas de ponto flutuante.
- **Destaque Promocional**: Formatação automática exibindo o valor de oferta ao lado do valor original riscado (`~R$ 100,00~ por R$ 80,00`).
- **Codificação Wa.me**: Aplicação mandatória de `encodeURIComponent` garantindo que quebras de linha, acentos e emojis cheguem perfeitamente formatados ao aplicativo do lojista.

### 5. Multi-Tenant de Borda & Domínios Personalizados
- **Roteamento Inteligente**: Middleware Edge normaliza o hostname (remoção de portas e `www.`) e consulta o registro estrito em `tenants.json`.
- **Isolamento de Dados Estrito**: Cada loja consome exclusivamente sua própria API; zero risco de contaminação cruzada de catálogo entre clientes.
- **Gateway Proxy Serverless (`/api/backend`)**: Elimina restrições de CORS e segue redirecionamentos HTTP 302 do Apps Script com total transparência.
- **Página 404 Amigável (`/tenant-not-found`)**: Exibição informativa caso um domínio não registrado tente acessar a plataforma.

### 6. Infraestrutura, Deploy & Onboarding
- **Procedimento Operacional Padrão (POP)**: Guia passo a passo para colocar uma nova loja no ar em **menos de 10 minutos** ([`docs/ONBOARDING.md`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/docs/ONBOARDING.md)).
- **Deploy Facilitado na Vercel**: Integração contínua com certificados SSL/TLS gratuitos emitidos e renovados automaticamente.
- **Manual de DNS**: Instruções mastigadas para apontamento de domínios no Registro.br e Cloudflare ([`docs/DNS.md`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/docs/DNS.md)).
- **Estratégia de Backup e DR**: Histórico nativo de versões do Google Drive aliado a script de cópia diária automatizada ([`docs/BACKUP.md`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/docs/BACKUP.md)).

---

## 🛡️ Segurança & Auditoria Técnica

- **Prevenção de SSRF**: Removida qualquer confiança em cabeçalhos de URL injetados pelo cliente no gateway proxy. As saídas são restritas ao domínio `script.google.com`.
- **Prevenção de XSS**: Sanitização estrita de protocolos de imagem (`https://`, `http://`, `data:image/`) e do parâmetro `host` na tela de erro.
- **Imutabilidade de Chaves Críticas**: Tentativas de alterar `store_id`, `api_token` ou `admin_password_hash` via API administrativa são sumariamente bloqueadas com erro `FORBIDDEN_MODIFICATION`.
- **Zero Segredos no Bundle**: Auditoria completa de variáveis de ambiente comprovando a inexistência de tokens privados com prefixo `NEXT_PUBLIC_`.

---

## 📊 Métricas de Qualidade do Código

- **Testes Automatizados**: **112 testes passando em 7 suítes (100% de sucesso)**.
- **Compilação TypeScript**: 0 erros no modo estrito (`strict: true`).
- **Linter (ESLint)**: 0 erros e 0 advertências.
- **Build de Produção**: 11 rotas compiladas e otimizadas sem falhas de prerendering ou hidratação.
- **Responsividade Atestada**: 320px, 375px, 390px, 430px, 768px, 1024px e 1440px.

---

## 🚀 Próximos Passos (Roadmap v1.1+)

1. **Edge Config / Cloudflare KV**: Migrar o mapeamento de domínios de `tenants.json` para armazenamento chave-valor na borda, permitindo cadastrar novas lojas via API sem necessidade de rebuild da aplicação.
2. **Dashboard de Métricas Globais**: Painel unificado para o operador do SaaS acompanhar o volume de pedidos gerados em todas as lojas.
3. **Múltiplos Idiomas e Moedas**: Suporte nativo completo a catálogos internacionais (USD, EUR, PYG).
