# Manual Operacional de Onboarding de Novas Lojas (v1.0.0)

Este manual é o **Procedimento Operacional Padrão (POP)** para cadastrar e ativar uma nova loja no SaaS em menos de **10 minutos**. Qualquer membro da equipe técnica ou de suporte consegue executar o processo seguindo este roteiro.

---

## Tempo Estimado: 8 a 10 minutos por loja

```text
[1. Planilha Template] ➔ [2. Inicializar DB] ➔ [3. Configurar Loja] ➔ [4. Publicar Web App]
                                                                               │
[8. Entregar Acesso]  [7. Testar Pedido]  [6. Apontar DNS]  [5. Registrar no SaaS]
```

---

## Passo 1 — Duplicar o Template da Planilha (1 min)

1. Acesse a planilha modelo oficial da plataforma (ou crie uma em branco em [sheets.new](https://sheets.new)).
2. Clique em **Arquivo** > **Fazer uma cópia**.
3. Defina o nome: `[Catálogo] Nome do Cliente` (ex.: `[Catálogo] Bella Boutique`).
4. Salve em uma pasta organizada do Google Drive do SaaS (ex.: `/Clientes-Ativos`).

---

## Passo 2 — Abrir o Apps Script e Inserir o Código (2 min)

1. Na nova planilha, acesse o menu **Extensões** > **Apps Script**.
2. Apague qualquer código existente no arquivo `Code.gs`.
3. Abra o arquivo [`backend/Code.gs`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/backend/Code.gs) deste repositório, copie todo o conteúdo e cole no editor.
4. Clique no ícone de **Salvar** (disquete) ou pressione `Ctrl + S`.
5. Na barra superior, certifique-se de que a função selecionada é **`initDatabase`** e clique em **Executar** (`Run`).
6. Conceda as permissões de acesso solicitadas pelo Google:
   - *Revisar permissões* ➔ Escolha sua conta ➔ *Avançado* ➔ *Acessar projeto (não seguro)* ➔ *Permitir*.
7. O script confirmará no log: `"Banco de dados inicializado com sucesso!"`.
8. Volte à planilha e observe as 3 abas criadas: `config`, `categorias` e `produtos`.

---

## Passo 3 — Configurar os Dados Iniciais da Loja (1 min)

Abra a aba **`config`** na planilha e preencha a Coluna B com os dados fornecidos pelo cliente:

| Chave (Coluna A) | Valor a preencher (Coluna B) | Exemplo |
| :--- | :--- | :--- |
| `store_id` | Identificador curto e único (sem espaços) | `bella_boutique` |
| `store_name` | Nome fantasia da loja | `Bella Boutique Moda Feminina` |
| `logo_url` | Link da logo (se houver, senão use o padrão) | `https://cdn.example.com/logo.png` |
| `primary_color` | Cor predominante da marca do cliente | `#ec4899` (Rosa) |
| `secondary_color` | Cor secundária da marca | `#be185d` |
| `whatsapp` | Número oficial com DDI (55) e DDD (somente dígitos) | `5511998887766` |
| `domain` | Domínio ou subdomínio contratado | `bellaboutique.com.br` |

---

## Passo 4 — Publicar a Web App e Copiar a URL (1 min)

1. No editor do Apps Script, clique no botão azul **Implantar** (`Deploy`) no topo direito ➔ **Nova implantação** (`New deployment`).
2. Clique na engrenagem ➔ Selecione **App da Web** (`Web app`).
3. Configure as opções:
   - **Descrição**: `Produção v1.0`
   - **Executar como**: **Eu (seu-email@gmail.com)**
   - **Quem tem acesso**: **Qualquer pessoa**
4. Clique em **Implantar** (`Deploy`).
5. **Copie a URL da Aplicação Web** gerada:
   `https://script.google.com/macros/s/AKfycb.../exec`
6. *(Teste rápido)*: Cole a URL em uma nova aba do navegador com `?action=store`. Se carregar o JSON com o nome da loja, a API está ativa.

---

## Passo 5 — Registrar o Tenant no Frontend (1 min)

1. No repositório do SaaS, abra o arquivo [`src/lib/tenants.json`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/src/lib/tenants.json).
2. Adicione a chave do novo domínio no registro:
   ```json
   "bellaboutique.com.br": {
     "tenantId": "bella_boutique",
     "apiUrl": "https://script.google.com/macros/s/AKfycb.../exec",
     "name": "Bella Boutique",
     "domain": "bellaboutique.com.br"
   }
   ```
3. Faça commit e push para o branch `main`:
   ```bash
   git add src/lib/tenants.json
   git commit -m "feat(onboarding): adiciona loja Bella Boutique"
   git push origin main
   ```
4. A Vercel/Cloudflare fará o deploy automático em menos de 1 minuto.

---

## Passo 6 — Cadastrar o Domínio no Provedor de Hospedagem (1 min)

1. Acesse o painel da **Vercel** > Seu Projeto > **Settings** > **Domains**.
2. Digite o domínio do cliente: `bellaboutique.com.br`.
3. Adicione também a versão com `www`: `www.bellaboutique.com.br`.
4. A Vercel exibirá as instruções de DNS necessárias.

---

## Passo 7 — Orientar o Lojista no Apontamento de DNS (1 min)

Envie a mensagem padrão para o lojista configurar a zona de DNS onde comprou o domínio (Registro.br, GoDaddy, Hostinger ou Cloudflare):

> Olá! Seguem as instruções para ativar seu catálogo no seu domínio:
>
> 1. Acesse o painel onde registrou seu domínio e entre na **Edição de DNS** (Zona de DNS);
> 2. Crie os 2 registros abaixo:
>    - **Tipo A**: Nome `@` (ou em branco) apontando para o IP: `76.76.21.21`
>    - **Tipo CNAME**: Nome `www` apontando para o destino: `cname.vercel-dns.com`
> 3. Salve as alterações.
> 
> *(Atenção: NUNCA aponte o domínio diretamente para o Google Sheets ou script do Google).*

Consulte o guia completo em [`docs/DNS.md`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/docs/DNS.md) para detalhes sobre cada provedor.

---

## Passo 8 — Testar a Operação Completa (2 min)

Assim que o DNS propagar:

1. **Acesse a Vitrine**: `https://bellaboutique.com.br`
   - Verifique se a logo, nome da loja e cores do tema carregam perfeitamente.
2. **Teste a Sacola**:
   - Abra um produto de exemplo;
   - Selecione as variações e adicione à sacola;
   - Clique em **Finalizar Pedido no WhatsApp**;
   - Confirme se o WhatsApp Web/App abre direcionando para o número correto do cliente (`5511...`) com a mensagem formatada.
3. **Teste o Painel Administrativo**:
   - Acesse `https://bellaboutique.com.br/admin`;
   - Faça login com a senha padrão inicial: `admin123`.

---

## Passo 9 — Redefinir a Senha do Lojista (1 min)

1. No `/admin`, acesse **Configurações**.
2. Ou na aba `config` da planilha, gere um novo hash SHA-256 com o salt da plataforma para a senha definitiva do comerciante:
   ```text
   Hash = SHA256("CATALOGO_SAAS_SALT_v1_" + nova_senha)
   ```
3. Salve a nova senha no campo `admin_password_hash`.

---

## Passo 10 — Entregar o Catálogo e Credenciais ao Cliente

Envie o kit de boas-vindas ao comerciante:

> 🎉 **Parabéns! Seu Catálogo Digital está no ar!**
> 
> 🌐 **Link da sua vitrine para clientes:**
> https://bellaboutique.com.br
> 
> ⚙️ **Painel de Controle para gerenciar produtos:**
> https://bellaboutique.com.br/admin
> - **Senha:** *(sua senha informada)*
> 
> 💡 **Dicas para começar:**
> 1. Cadastre suas primeiras categorias no menu lateral;
> 2. Adicione seus produtos com boas fotos e descrições claras;
> 3. Compartilhe o link no seu Instagram, Google Meu Negócio e Status do WhatsApp!
