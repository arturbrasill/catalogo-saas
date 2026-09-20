# Guia de Configuração de DNS & Domínios Personalizados (v1.0.0)

Este documento orienta a equipe de suporte e os lojistas sobre como apontar domínios próprios para a plataforma multi-tenant de catálogo digital.

---

## 1. Princípio Arquitetural Obrigatório

> [!CAUTION]
> **REGRA FUNDAMENTAL**: Um domínio personalizado **NUNCA** deve ser apontado diretamente para as URLs do Google Apps Script (`script.google.com`).
> 
> Todo o tráfego público flui exclusivamente através do frontend Next.js (hospedado na Vercel ou Cloudflare Pages). O middleware Edge do Next.js analisa o cabeçalho `Host`, resolve o tenant correspondente e conecta-se de forma segura à API dedicada da loja.

---

## 2. Conceitos Essenciais de DNS

- **Registro A**: Aponta um nome de domínio para um endereço IPv4 numérico (ex.: `76.76.21.21`). Utilizado tipicamente para o domínio raiz (Apex Domain).
- **Registro CNAME (Canonical Name)**: Aponta um subdomínio para outro nome de host (ex.: `cname.vercel-dns.com` ou `lojas.seudominio.com`). É a forma recomendada para subdomínios e para o prefixo `www`.
- **TTL (Time to Live)**: Tempo (em segundos) que os servidores de DNS pelo mundo mantêm os registros em cache. Recomendamos TTL padrão de `3600` (1 hora) ou `Auto` na Cloudflare.
- **Propagação de DNS**: Período necessário para que as alterações se propagem globalmente (tipicamente entre 15 minutos e 24 horas).
- **HTTPS / SSL Automático**: O frontend Next.js provisiona e renova automaticamente os certificados SSL/TLS gratuitos (via Let's Encrypt / DigiCert) assim que o apontamento de DNS é detectado.

---

## 3. Política de Domínio: `www` vs Domínio Raiz (Apex)

A plataforma adota **padronização canônica automática**:
- Se o cliente acessar `https://www.sualoja.com.br`, o middleware normaliza internamente para `sualoja.com.br`.
- Recomendamos que o lojista configure tanto o domínio raiz (`sualoja.com.br`) quanto o subdomínio `www` (`www.sualoja.com.br`) na zona de DNS.

---

## 4. Passo a Passo por Provedor de DNS

### 4.1 Configuração no Registro.br

Para domínios nacionais `.com.br`:

1. Acesse sua conta no [Registro.br](https://registro.br) e selecione o domínio da loja.
2. Na seção **DNS**, selecione **Configurar Endereçamento** (Modo Avançado).
3. Adicione as duas entradas a seguir (exemplo apontando para a Vercel):

| Tipo | Nome / Host | Dados / Destino |
| :--- | :--- | :--- |
| **A** | *(deixe em branco para raiz)* | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

4. Clique em **Salvar**. A propagação leva em média de 30 minutos a 2 horas.

---

### 4.2 Configuração na Cloudflare

Para domínios com gerenciamento de DNS via Cloudflare:

1. Acesse o painel da [Cloudflare](https://dash.cloudflare.com) e entre na zona do domínio.
2. Acesse o menu lateral **DNS** > **Registros**.
3. Crie os registros com a opção de proxy desativada (DNS Only) inicialmente, ou proxied se usar SSL Full:

| Tipo | Nome | Conteúdo / Destino | Proxy Status | TTL |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` | DNS Only (Nuvem Cinza) | Auto |
| **CNAME** | `www` | `cname.vercel-dns.com` | DNS Only (Nuvem Cinza) | Auto |

4. Clique em **Salvar**. Na Cloudflare a atualização ocorre quase instantaneamente.

---

## 5. Como Testar Múltiplos Tenants em Desenvolvimento Local

Navegadores modernos e sistemas operacionais resolvem qualquer subdomínio de `.localhost` diretamente para `127.0.0.1` sem necessidade de alterar o arquivo `hosts`:

1. No arquivo `src/lib/tenants.json`, adicione as entradas de teste local:
   ```json
   {
     "loja-a.localhost": {
       "tenantId": "loja_a",
       "apiUrl": "https://script.google.com/macros/s/.../exec"
     },
     "loja-b.localhost": {
       "tenantId": "loja_b",
       "apiUrl": "https://script.google.com/macros/s/.../exec"
     }
   }
   ```
2. Inicie o servidor local: `npm run dev`.
3. Abra no navegador:
   - `http://loja-a.localhost:3000` -> Carrega o catálogo da Loja A.
   - `http://loja-b.localhost:3000` -> Carrega o catálogo da Loja B.
   - `http://localhost:3000` -> Carrega a loja padrão (`NEXT_PUBLIC_DEFAULT_TENANT`).
   - `http://dominio-inexistente.localhost:3000` -> Exibe a tela de "Loja Não Encontrada" (404).

---

## 6. Evolução de Escala do Tenant Registry

Atualmente, o mapeamento de domínios para tenants reside em `src/lib/tenants.json` (custo zero, deploy estático e leitura instantânea em memória).

À medida que a base crescer para centenas ou milhares de clientes, a arquitetura permite evolução transparente:
1. **Cloudflare KV / Vercel Edge Config**: Busca na borda (Edge) em sub-milissegundos via chave-valor sem rebuild da aplicação;
2. **Banco Serverless (PostgreSQL / Supabase / Turso)**: Consulta com cache de borda (Stale-While-Revalidate) com atualização instantânea ao cadastrar novos lojistas pelo painel SaaS.
