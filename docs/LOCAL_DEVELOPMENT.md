# Guia de Desenvolvimento Local

Este documento orienta a configuração, execução e testes do SaaS Catálogo Multi-Tenant no ambiente local.

---

## 1. Pré-requisitos de Sistema

- **Node.js**: >= v18 (recomendado: v20 LTS ou v24+)
- **Gerenciador de Pacotes**: `npm` (v10+)
- **Git**: Configurado para versionamento local
- **Navegador Web**: Chrome, Edge, Firefox ou Safari atualizado

---

## 2. Instalação do Projeto

Clone ou acesse o repositório e instale as dependências:

```bash
# Instalar pacotes declarados no package.json
npm install
```

---

## 3. Variáveis de Ambiente

Copie o arquivo de exemplo para criar a sua configuração local:

```bash
cp .env.example .env.local
```

Conteúdo padrão de `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_TENANT=loja_exemplo
IMAGE_UPLOAD_PROVIDER=cloudinary
IMAGE_UPLOAD_PRESET=catalogo_unsigned_preset
IMAGE_UPLOAD_CLOUD_NAME=sua-cloud-name
```

---

## 4. Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento Next.js em `http://localhost:3000` |
| `npm run build` | Compila o bundle otimizado para produção |
| `npm run start` | Executa o servidor de produção localmente |
| `npm run lint` | Executa o linter ESLint |
| `npm run typecheck` | Executa o verificador de tipos do TypeScript (`tsc --noEmit`) |
| `npm test` | Executa a suíte de testes automatizados com Vitest |
| `npm run test:watch`| Executa os testes em modo observador (watch) |

---

## 5. Estrutura de Diretórios

```text
catalogo_saas_antigravity_kit/
├── backend/                  # Código e deploy do Google Apps Script
│   ├── Code.gs               # Script executável do backend Apps Script
│   └── appsscript.json       # Manifesto de permissões do Google Apps Script
├── docs/                     # Documentação técnica e especificações
│   ├── API_CONTRACT.md       # Contrato formal da API REST
│   ├── DATA_MODEL.md         # Esquema das abas do Google Sheets
│   └── LOCAL_DEVELOPMENT.md  # Este guia de ambiente local
├── prompts/                  # Protocolos operacionais de cada módulo
├── skills/                   # Guias de competência por módulo
├── src/
│   ├── app/                  # Rotas e layouts do Next.js App Router
│   ├── components/           # Componentes de interface reutilizáveis
│   ├── lib/                  # Utilitários, regras de negócio e clientes HTTP
│   └── types/                # Definições estritas de tipos TypeScript
├── templates/                # Arquivos base de configuração e mock
└── tests/                    # Suíte de testes unitários e de integração
```

---

## 6. Configuração e Publicação do Google Apps Script

Para implantar o backend no Google Sheets de uma loja:

1. Crie uma nova planilha no [Google Sheets](https://sheets.new).
2. Acesse o menu **Extensões** > **Apps Script**.
3. Substitua o conteúdo do arquivo `Código.gs` pelo código presente em `backend/Code.gs`.
4. No editor do Apps Script, selecione a função `initDatabase` e clique em **Executar** para criar as abas e cabeçalhos automaticamente.
5. Clique em **Implantar** (Deploy) > **Nova implantação**.
6. Selecione o tipo **Aplicativo da Web** (Web App):
   - **Descrição**: `API v1 Catálogo`
   - **Executar como**: `Eu (seu e-mail)`
   - **Quem pode acessar**: `Qualquer pessoa` (permite que o catálogo público carregue produtos)
7. Copie a URL gerada (`https://script.google.com/macros/s/.../exec`).
8. Cadastre essa URL no arquivo `templates/tenants.example.json` ou no seu tenant registry.

---

## 7. Como Executar os Testes

Para garantir integridade antes de qualquer commit ou avanço de módulo:

```bash
# Verificação de tipos
npm run typecheck

# Verificação de linter
npm run lint

# Execução de testes automatizados
npm test
```
