# Guia Completo de Deploy em Produção (v1.0.0)

Este manual orienta o deploy completo da plataforma **SaaS de Catálogo Digital Multi-Tenant** com foco em **baixo custo de infraestrutura**, **alta disponibilidade**, **segurança rigorosa** e **extrema simplicidade operacional**.

---

## 1. Arquitetura de Infraestrutura

A infraestrutura é dividida em dois componentes complementares e desacoplados:

1. **Frontend & Roteador Edge (Next.js)**: Hospedado na **Vercel** (ou **Cloudflare Pages**). Responsável por receber o tráfego de todos os domínios dos lojistas, resolver o tenant e renderizar a vitrine/admin.
2. **Backend & Persistência (Google Apps Script + Google Sheets)**: Cada tenant possui sua própria planilha no Google Drive e sua própria Web App publicada no Google Apps Script (custo zero de banco de dados).

---

## 2. Deploy do Frontend (Vercel)

A Vercel é o ambiente recomendado devido ao suporte nativo ao Next.js App Router, middleware na borda e gerenciamento automático de certificados SSL/TLS para múltiplos domínios customizados.

### 2.1 Passo a Passo de Configuração

1. **Importar Repositório Git**:
   - Acesse o painel da [Vercel](https://vercel.com) e clique em **Add New...** > **Project**.
   - Conecte sua conta do GitHub/GitLab e selecione o repositório do catálogo.

2. **Configuração de Build e Framework**:
   - **Framework Preset**: Next.js (detectado automaticamente).
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

3. **Configuração de Variáveis de Ambiente (Environment Variables)**:
   Configure as variáveis conforme documentado no arquivo `.env.example`:

   | Nome da Variável | Tipo | Exemplo de Valor | Descrição |
   | :--- | :--- | :--- | :--- |
   | `NEXT_PUBLIC_APP_URL` | Pública | `https://numclick.vercel.app` | Domínio canônico da aplicação |
   | `NEXT_PUBLIC_DEFAULT_TENANT` | Pública | `loja_exemplo` | Tenant padrão para fallback |
   | `NEXT_PUBLIC_IMAGE_UPLOAD_PROVIDER` | Pública | `cloudinary` | Provedor de upload externo |
   | `NEXT_PUBLIC_IMAGE_UPLOAD_CLOUD_NAME` | Pública | `seu-cloud-name` | Nome da conta no Cloudinary |
   | `NEXT_PUBLIC_IMAGE_UPLOAD_PRESET` | Pública | `catalogo_unsigned_preset` | Preset sem chave privada |
   | `NODE_ENV` | Sistema | `production` | Ambiente de execução |

   > [!IMPORTANT]
   > NUNCA insira tokens de API, hashes ou credenciais de banco em variáveis com prefixo `NEXT_PUBLIC_`. Todas as URLs dos tenants residem em `src/lib/tenants.json` ou variáveis server-side.

4. **Deploy Inicial**:
   - Clique em **Deploy**. O processo dura menos de 2 minutos.
   - Ao concluir, você receberá a URL de produção (ex.: `numclick.vercel.app`).

### 2.2 Configuração de Domínios Customizados na Vercel

1. Acesse o projeto na Vercel > **Settings** > **Domains**.
2. Adicione os domínios raiz e subdomínios dos clientes (ex.: `loja-exemplo.com.br` e `www.loja-exemplo.com.br`).
3. Para atender dezenas de lojas sob subdomínios de uma marca central (ex.: `loja1.seusaas.com.br`, `loja2.seusaas.com.br`), adicione um domínio coringa:
   - `*.seusaas.com.br`
4. A Vercel emite e renova os certificados SSL/TLS automaticamente via Let's Encrypt / DigiCert.

---

## 3. Deploy Alternativo: Cloudflare Pages

Caso opte por hospedar o frontend na Cloudflare:

1. Acesse o painel da Cloudflare > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Selecione o repositório.
3. Configure o Build:
   - **Framework Preset**: Next.js.
   - **Build command**: `npx @cloudflare/next-on-pages` (ou `npm run build`).
   - **Output directory**: `.vercel/output/static` (ou dependendo da versão do adapter).
   - **Environment Variables**: `NODE_VERSION = 18` (ou 20) e `NODE_ENV = production`.
4. Configure os domínios customizados na aba **Custom domains** do projeto Pages.

---

## 4. Deploy do Backend (Google Apps Script & Sheets)

Cada loja física atendida pelo SaaS terá sua própria planilha e seu próprio script.

### 4.1 Passo a Passo de Instalação

1. **Criar a Planilha no Google Drive**:
   - Acesse o [Google Sheets](https://sheets.new) e crie uma planilha em branco.
   - Renomeie a planilha para: `[Catálogo] Nome da Loja`.

2. **Abrir o Editor do Google Apps Script**:
   - No menu superior da planilha, clique em **Extensões** > **Apps Script**.
   - Renomeie o projeto do script para `Backend - Nome da Loja`.

3. **Inserir o Código**:
   - Abra o arquivo `Code.gs` no editor do Apps Script.
   - Substitua o conteúdo pelo código presente em [`backend/Code.gs`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/backend/Code.gs).
   - (Opcional) No menu lateral, acesse as configurações do projeto e habilite "Mostrar arquivo de manifesto `appsscript.json`", colando o conteúdo de [`backend/appsscript.json`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/backend/appsscript.json).

4. **Inicializar a Estrutura da Planilha**:
   - Na barra de ferramentas superior do editor, selecione a função **`initDatabase`** na lista suspensa de funções.
   - Clique em **Executar** (`Run`).
   - O Google solicitará permissão de acesso à planilha:
     - Clique em *Revisar permissões*;
     - Escolha sua conta do Google;
     - Clique em *Avançado* > *Acessar Backend (não seguro)*;
     - Clique em *Permitir*.
   - O script criará automaticamente as abas `config`, `categorias` e `produtos`, já com cabeçalhos formatados em negrito, linhas congeladas e fórmulas de segurança.

5. **Configurar os Dados Iniciais da Loja**:
   - Volte à planilha e abra a aba `config`.
   - Ajuste os valores da Coluna B para a loja do cliente:
     - `store_name`: Nome fantasia da empresa.
     - `whatsapp`: Número com DDI e DDD (ex.: `5511999999999`).
     - `primary_color`: Cor principal em hexadecimal (ex.: `#10b981`).
     - `secondary_color`: Cor secundária (ex.: `#047857`).
     - `domain`: Domínio próprio do cliente (ex.: `loja-cliente.com.br`).

6. **Publicar como Web App**:
   - No canto superior direito do editor, clique em **Implantar** (`Deploy`) > **Nova implantação** (`New deployment`).
   - Clique no ícone de engrenagem ao lado de "Selecionar tipo" e escolha **App da Web** (`Web app`).
   - Preencha as configurações rigorosamente:
     - **Descrição**: `v1.0.0 Produção`
     - **Executar como**: **Eu (seu-email@gmail.com)** *(Execute as me)*
     - **Quem tem acesso**: **Qualquer pessoa** *(Anyone)*
   - Clique em **Implantar** (`Deploy`).
   - **COPIE A URL DA APLICAÇÃO WEB** gerada:
     `https://script.google.com/macros/s/AKfycbx.../exec`

7. **Teste Rápido de Saúde (Health Check)**:
   - Abra uma nova aba no navegador e cole a URL seguida de `?action=store`:
     ```text
     https://script.google.com/macros/s/AKfycbx.../exec?action=store
     ```
   - O retorno deve ser um JSON com `success: true` e os dados públicos da loja.

### 4.2 Como Atualizar o Backend sem Quebrar a Loja (Zero Downtime)

Quando você fizer melhorias no código `Code.gs`:

1. Cole o novo código no editor do Apps Script.
2. Clique em **Implantar** > **Gerenciar implantações** (`Manage deployments`).
3. Clique no ícone de **Lápis** (Editar) na implantação ativa da Web App.
4. No campo **Versão**, selecione **Nova versão** (`New version`).
5. Clique em **Implantar** (`Deploy`).
6. A URL da Web App **permanece a mesma**, garantindo atualização instantânea sem necessidade de alterar o frontend!

---

## 5. Vinculação do Tenant no Frontend

Com a URL da Web App em mãos:

1. No repositório do frontend, abra o arquivo [`src/lib/tenants.json`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/src/lib/tenants.json).
2. Adicione a entrada do lojista:
   ```json
   "loja-cliente.com.br": {
     "tenantId": "loja_cliente",
     "apiUrl": "https://script.google.com/macros/s/AKfycbx.../exec",
     "name": "Nome da Loja Cliente",
     "domain": "loja-cliente.com.br"
   }
   ```
3. Realize o commit e push para o branch `main`. A Vercel/Cloudflare fará o deploy automático em menos de 60 segundos.

---

## 6. Checklist Pré-Produção

Antes de divulgar o catálogo ao público:

- [ ] `npm test` executado e 100% aprovado.
- [ ] `npm run typecheck` executado sem erros.
- [ ] `npm run lint` sem advertências.
- [ ] `npm run build` executado e compilado com êxito.
- [ ] Domínio e subdomínio `www` configurados no DNS conforme [`docs/DNS.md`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/docs/DNS.md).
- [ ] Certificado HTTPS ativo e sem erros no navegador.
- [ ] Pedido de teste realizado na vitrine chegando corretamente no WhatsApp oficial do lojista.
- [ ] Painel `/admin` acessado com sucesso pelo lojista e senha padrão alterada.
