# Guia de Diagnóstico e Resolução de Problemas (Troubleshooting)

Este documento reúne os erros mais frequentes na operação da plataforma **SaaS de Catálogo Digital Multi-Tenant**, explicando suas causas raízes e fornecendo passos claros de resolução.

---

## Índice Rápido de Problemas

1. [Tela de "Loja Não Encontrada" (404 / /tenant-not-found)](#1-tela-de-loja-não-encontrada-404---tenant-not-found)
2. [Erro 502 / GATEWAY_ERROR na Vitrine ou Admin](#2-erro-502--gateway_error-na-vitrine-ou-admin)
3. [Erro de Preflight CORS no Navegador](#3-erro-de-preflight-cors-no-navegador)
4. [Falha de Login no /admin (INVALID_CREDENTIALS)](#4-falha-de-login-no-admin-invalid_credentials)
5. [Alterações Realizadas não Aparecem na Vitrine](#5-alterações-realizadas-não-aparecem-na-vitrine)
6. [Falha no Upload de Imagens no Painel Administrativo](#6-falha-no-upload-de-imagens-no-painel-administrativo)
7. [WhatsApp Abre com Número Incorreto ou Mensagem Estranha](#7-whatsapp-abre-com-número-incorreto-ou-mensagem-estranha)
8. [Erro de Concorrência: LOCK_TIMEOUT](#8-erro-de-concorrência-lock_timeout)
9. [Como Inspecionar Logs de Execução no Google Apps Script](#9-como-inspecionar-logs-de-execução-no-google-apps-script)

---

## 1. Tela de "Loja Não Encontrada" (404 / /tenant-not-found)

### Sintoma:
Ao abrir o domínio do lojista (ex.: `https://loja-cliente.com.br`), a aplicação exibe a tela amarela com ícone de alerta e mensagem *"Loja Não Encontrada"*.

### Causas Possíveis:
1. O domínio acessado não foi cadastrado no arquivo `src/lib/tenants.json`;
2. Erro de digitação no hostname (ex.: `.com` em vez de `.com.br`);
3. O deploy do arquivo `tenants.json` ainda não terminou na Vercel/Cloudflare;
4. O DNS acabou de ser alterado e ainda está propagando.

### Como Resolver:
1. Abra o arquivo `src/lib/tenants.json` no repositório;
2. Verifique se a chave exata do domínio está presente (em letras minúsculas, sem `https://` e sem barra no final);
3. Verifique se o commit foi enviado para o branch `main` e se o deploy na Vercel está com status **Ready**;
4. Limpe o cache do navegador ou teste em aba anônima.

---

## 2. Erro 502 / GATEWAY_ERROR na Vitrine ou Admin

### Sintoma:
O catálogo exibe mensagem de erro de rede ou o console do navegador mostra `POST /api/backend 502 (Bad Gateway)`.

### Causas Possíveis:
1. A URL da Web App no `tenants.json` está incorreta, incompleta ou aponta para um script deletado;
2. A Web App do Google Apps Script foi publicada com permissão restrita em vez de *"Qualquer pessoa"* (*Anyone*);
3. Limite diário de chamadas do Google Apps Script atingido na conta gratuita do Google.

### Como Resolver:
1. Abra a planilha do lojista ➔ **Extensões** ➔ **Apps Script**;
2. Clique em **Implantar** ➔ **Gerenciar implantações**;
3. Confirme se **Quem tem acesso** está definido como **Qualquer pessoa** (*Anyone*). Se estiver "Somente eu", edite e altere;
4. Copie a URL exata da Web App terminada em `/exec`;
5. Cole a URL no navegador com `?action=store`. Se o Google solicitar login ou retornar erro 403, a permissão na Web App está errada;
6. Atualize a URL no `tenants.json`.

---

## 3. Erro de Preflight CORS no Navegador

### Sintoma:
Console exibe erro: `Access to fetch at 'https://script.google.com/...' from origin 'https://...' has been blocked by CORS policy: Response to preflight request doesn't pass access control check`.

### Causa Raiz:
O frontend tentou fazer uma requisição `fetch` diretamente para `script.google.com` a partir do navegador utilizando headers customizados. O Google Apps Script **não suporta o método HTTP OPTIONS**.

### Como Resolver:
- A arquitetura da plataforma já resolve isso: **todas as requisições do frontend devem passar pelo gateway proxy `/api/backend`** do Next.js.
- Verifique se o componente está chamando `api.ts` (que consome `/api/backend`) e nunca a URL crua do Google Apps Script no browser.

---

## 4. Falha de Login no /admin (INVALID_CREDENTIALS)

### Sintoma:
Lojista digita a senha no `/admin/login` e recebe o alerta *"Senha incorreta"*.

### Causas Possíveis:
1. Senha digitada incorretamente;
2. O hash cadastrado na aba `config` da planilha não corresponde à senha esperada com o salt da plataforma.

### Como Redefinir a Senha do Lojista:
1. Abra a planilha do lojista no Google Sheets;
2. Vá até a aba **`config`**;
3. Localize a linha da chave `admin_password_hash`;
4. Para redefinir a senha para a padrão temporária `admin123`:
   - Cole o seguinte hash SHA-256 no campo de valor correspondente:
     ```text
     e2b694c9ad2ab7eb723dc2a27863bf476f7f6f8742db51a2a1a8c081e60055cb
     ```
5. Oriente o lojista a logar com `admin123` e alterar sua senha.

---

## 5. Alterações Realizadas não Aparecem na Vitrine

### Sintoma:
O lojista cadastrou um novo produto na planilha ou no `/admin`, mas ele não aparece na vitrine pública.

### Causas Possíveis:
1. O produto foi cadastrado com `ativo = FALSE`;
2. A categoria à qual o produto pertence está com `ativo = FALSE`;
3. O produto foi marcado com soft delete (`deletedAt` preenchido);
4. O `estoque` foi definido como `0` e o catálogo oculta produtos sem estoque.

### Como Resolver:
1. Abra a aba `produtos` na planilha;
2. Localize a linha do produto;
3. Verifique se a Coluna K (`ativo`) está como `TRUE`;
4. Verifique se a Coluna N (`deletedAt`) está vazia;
5. Abra a aba `categorias` e confirme se a categoria do produto também está com `ativo = TRUE`.

---

## 6. Falha no Upload de Imagens no Painel Administrativo

### Sintoma:
Ao selecionar uma foto no `/admin/produtos`, o upload não conclui ou exibe erro de provedor.

### Causas Possíveis:
1. A imagem ultrapassa o limite de **5 MB**;
2. O arquivo não é uma imagem válida (formatos aceitos: JPG, PNG, WEBP, GIF);
3. As variáveis `NEXT_PUBLIC_IMAGE_UPLOAD_CLOUD_NAME` e `NEXT_PUBLIC_IMAGE_UPLOAD_PRESET` não foram configuradas nas variáveis de ambiente da Vercel;
4. O preset no Cloudinary foi criado como *Signed* em vez de *Unsigned*.

### Como Resolver:
1. No painel do [Cloudinary](https://cloudinary.com), acesse **Settings** ➔ **Upload**;
2. Role até **Upload presets** e confirme se o preset utilizado está configurado como **Unsigned**;
3. Verifique se o nome do Cloud Name e Preset conferem com os valores no `.env` e nas Environment Variables da Vercel.

---

## 7. WhatsApp Abre com Número Incorreto ou Mensagem Estranha

### Sintoma:
Ao clicar em "Finalizar no WhatsApp", o aplicativo diz que o número de telefone não existe ou a mensagem chega sem quebras de linha.

### Causas Possíveis:
1. O número foi cadastrado sem código do país (DDI 55 para o Brasil) ou sem o DDD local;
2. O número contém caracteres especiais soltos na planilha que não puderam ser sanitizados.

### Como Resolver:
1. Abra a aba `config` da planilha do lojista;
2. Na linha `whatsapp`, insira apenas números incluindo DDI e DDD:
   - Exemplo correto: `5511999999999` (DDI 55 + DDD 11 + 9 dígitos).
   - Exemplo incorreto: `(11) 99999-9999` ou `99999-9999`.
3. Recarregue o catálogo e teste novamente.

---

## 8. Erro de Concorrência: LOCK_TIMEOUT

### Sintoma:
Resposta da API com `{ "error": { "code": "LOCK_TIMEOUT", "message": "A planilha está ocupada processando outra gravação..." } }`.

### Causa Raiz:
Duas operações de escrita (ex.: cadastro em lote de produtos) ocorreram simultaneamente e o `LockService` ultrapassou o teto de 30 segundos de espera.

### Como Resolver:
- O `LockService` previne corrupção de dados e perda de linhas.
- Basta o lojista aguardar alguns instantes e tentar salvar novamente.

---

## 9. Como Inspecionar Logs de Execução no Google Apps Script

Caso encontre um comportamento anômalo no backend:

1. Acesse a planilha do lojista ➔ **Extensões** ➔ **Apps Script**;
2. No menu lateral esquerdo, clique em **Execuções** (ícone de lista com play);
3. Você verá o histórico de cada chamada `doGet` e `doPost` recebida;
4. Clique na execução que falhou (status vermelho) para ler a mensagem exata de erro e a linha do script onde ocorreu o problema.
