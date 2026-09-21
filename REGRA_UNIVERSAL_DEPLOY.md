# REGRA UNIVERSAL OBRIGATÓRIA: DEPLOY CONTÍNUO EM PRODUÇÃO (VERCEL & FERRAMENTAS)

> **Status:** Ativo e Mandatório  
> **Escopo:** Todas as alterações, melhorias, correções de bugs, refatorações e novas funcionalidades aprovadas neste repositório.  
> **Destinatários:** Agentes de IA, Desenvolvedores, Mantenedores e Equipe de QA.

---

## 1. Princípio Fundamental

**Nenhuma alteração aprovada deve permanecer restrita ao ambiente local ou em rascunho.**  
Toda e qualquer alteração de código, layout, banco de dados ou integração que for finalizada e aprovada deve ser **imediatamente validada, commitada e enviada para o repositório remoto (`origin/main`)**, acionando o pipeline automático da **Vercel** para que o link real de produção e todas as ferramentas conectadas fiquem 100% atualizadas e operacionais em nuvem.

---

## 2. Pipeline Obrigatório de Pré-Deploy (Portão de Qualidade)

Antes de executar o envio para a nuvem, é terminantemente obrigatório rodar e obter sucesso (código 0) nas 4 verificações de integridade:

```bash
# 1. Suíte completa de testes automatizados
npm run test

# 2. Checagem estrita de tipos TypeScript
npm run typecheck

# 3. Linter sem erros de formatação ou boas práticas
npm run lint

# 4. Build de produção do Next.js
npm run build
```

Se qualquer um dos passos falhar:
1. O deploy **não** pode ser realizado.
2. O erro deve ser diagnosticado e corrigido imediatamente.
3. O pipeline deve ser executado novamente até que 100% dos testes e o build passem.

---

## 3. Procedimento de Atualização Automática no Vercel (Produção)

Assim que o pipeline de qualidade for aprovado, o agente/desenvolvedor deve executar automaticamente:

```bash
# 1. Adicionar arquivos modificados
git add .

# 2. Criar commit semântico claro (feat, fix, refactor, chore, docs)
git commit -m "tipo: descrição clara da alteração aprovada"

# 3. Enviar para a branch principal vinculada à Vercel
git push origin main
```

O `git push origin main` aciona instantaneamente o webhook da Vercel, que:
- Inicia o build em nuvem;
- Publica a nova versão no domínio de produção;
- Atualiza as Edge Functions e Serverless Routes do Next.js.

---

## 4. Sincronização Obrigatória com Demais Ferramentas do Ecossistema

O sistema depende de componentes de nuvem interconectados. Toda alteração aprovada deve garantir a sincronização com as seguintes ferramentas:

### 4.1 Google Apps Script & Google Drive (`backend/`)
- Arquivos: `backend/Code.gs` e `backend/MasterProvisioner.gs`.
- Se houver alteração em payloads, ações ou endpoints do Apps Script, a documentação de implantação deve ser atualizada.
- A compatibilidade retroativa com planilhas existentes deve ser rigorosamente mantida.
- As instruções de reimplantação de versão da Web App devem ser fornecidas ao usuário sempre que o código `.gs` for modificado.

### 4.2 Persistência Multi-Tenant em Nuvem (Google Sheets Mestre & Vercel KV / Upstash)
- Todas as operações do catálogo e painel administrativo devem estar sincronizadas com:
  - Planilha Mestre de Controle (`SaaS - Planilha Mestre de Controle`);
  - Planilhas Privadas de cada loja na pasta `"SaaS - Planilhas das Lojas"` do Google Drive;
  - Banco Upstash Redis / Vercel KV (caso configurado).
- Nenhuma alteração pode corromper ou perder o mapeamento de domínios, slugs ou planos dos clientes.

### 4.3 Variáveis de Ambiente (`.env.example` e Vercel Dashboard)
- Sempre que uma nova chave ou variável for adicionada ao sistema:
  1. Atualizar obrigatoriamente o arquivo `.env.example` com comentários e exemplos seguros.
  2. Notificar o usuário sobre o nome exato da variável que precisa ser adicionada na aba **Settings ➔ Environment Variables** da Vercel.
  3. **Nunca commitar arquivos `.env` ou `.env.local` contendo segredos reais**.

### 4.4 Gateway de Pagamento (Asaas) e WhatsApp
- Validar se os endpoints de webhook (`/api/asaas/webhook`) e checkout (`/api/asaas/checkout`) continuam compatíveis com as chamadas em produção.
- Garantir que a montagem de links `wa.me` preserve formatação internacional (código do país + DDD + número).

---

## 5. Critério de Conclusão de Qualquer Tarefa

Uma tarefa só pode ser marcada como concluída se:

1. [x] O código foi implementado seguindo arquitetura limpa e regras do projeto;
2. [x] Testes unitários e de integração cobrindo a mudança foram criados/executados;
3. [x] `npm run typecheck`, `npm run lint` e `npm run build` passaram sem erros;
4. [x] O commit foi realizado e enviado para `origin/main` via `git push`;
5. [x] O usuário foi informado do commit e dos links reais para verificação imediata em produção.

---

*Regra instituída em conformidade com as diretrizes do projeto Catalogo SaaS Antigravity Kit.*
