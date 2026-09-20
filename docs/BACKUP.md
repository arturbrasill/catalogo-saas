# Política de Backup e Recuperação de Desastres (v1.0.0)

Este documento descreve a estratégia de cópias de segurança (backup), integridade de dados e procedimentos de recuperação de desastres (*Disaster Recovery - DR*) do **SaaS de Catálogo Digital Multi-Tenant**.

---

## 1. Objetivos de Recuperação

- **RPO (Recovery Point Objective)**: **< 24 horas** (perda máxima aceitável de dados em caso de falha catastrófica; na prática, o histórico contínuo do Google Drive oferece RPO de poucos minutos).
- **RTO (Recovery Time Objective)**: **< 15 minutos** (tempo necessário para restaurar uma loja ou tenant completo).

---

## 2. Níveis de Armazenamento e Backup

A arquitetura do catálogo protege dados em 3 camadas complementares:

```text
[Camada 1: Histórico Nativo Google Drive] ➔ Restauração contínua com 1 clique
[Camada 2: Script Automático de Backup]   ➔ Cópia diária para pasta de arquivo
[Camada 3: Versionamento Git do SaaS]     ➔ Código-fonte e registro de tenants
```

---

## 3. Camada 1: Histórico de Versões do Google Sheets (Nativo)

O Google Sheets salva revisões incrementais automaticamente a cada alteração feita por usuários ou pelo script:

1. **Como consultar**:
   - Na planilha do lojista, acesse **Arquivo** > **Histórico de versões** > **Ver histórico de versões** (ou atalho `Ctrl + Alt + Shift + H`).
2. **Como restaurar**:
   - Selecione a versão anterior desejada no painel lateral direito;
   - Clique em **Restaurar esta versão**;
   - A planilha retorna imediatamente ao estado daquele momento sem afetar a URL da Web App.

---

## 4. Camada 2: Script de Backup Automático Diário

Para proteger contra exclusão acidental da planilha ou corrupção grave, é recomendado configurar um trigger de backup automatizado no Apps Script do tenant.

### 4.1 Código da Função de Backup (Google Apps Script)

Adicione a função abaixo ao final do arquivo `Code.gs` no editor do Apps Script:

```javascript
/**
 * Cria uma cópia da planilha ativa na pasta de backups do Google Drive.
 * Executada automaticamente uma vez ao dia via acionador temporal.
 */
function scheduledDailyBackup() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const spreadsheetFile = DriveApp.getFileById(spreadsheet.getId());
    
    // Nome da pasta de destino no Google Drive
    const backupFolderName = "Backups_Catalogo_SaaS";
    const folders = DriveApp.getFoldersByName(backupFolderName);
    
    let targetFolder;
    if (folders.hasNext()) {
      targetFolder = folders.next();
    } else {
      targetFolder = DriveApp.createFolder(backupFolderName);
    }
    
    // Nome da cópia com data formatada
    const now = new Date();
    const dateStr = Utilities.formatDate(now, "America/Sao_Paulo", "yyyy-MM-dd_HHmm");
    const backupName = `[BKP ${dateStr}] ${spreadsheet.getName()}`;
    
    spreadsheetFile.makeCopy(backupName, targetFolder);
    Logger.log(`Backup criado com sucesso: ${backupName}`);
  } catch (error) {
    Logger.log(`Falha ao gerar backup: ${error.toString()}`);
  }
}
```

### 4.2 Como Ativar o Acionador (Trigger Diário)

1. No editor do Apps Script, acesse o menu lateral esquerdo **Acionadores** (ícone de relógio).
2. Clique em **Adicionar acionador** (canto inferior direito).
3. Configure os parâmetros:
   - **Escolha a função a ser executada**: `scheduledDailyBackup`
   - **Escolha a implantação**: `Head`
   - **Selecione a fonte do evento**: `Baseado em tempo`
   - **Selecione o tipo de acionador**: `Temporizador diário`
   - **Selecione a hora do dia**: `Entre meia-noite e 1h` (madrugada)
4. Clique em **Salvar**. A partir desse momento, uma cópia completa da planilha será gerada diariamente.

---

## 5. Camada 3: Versionamento de Configurações e Domínios (Git)

- O arquivo [`src/lib/tenants.json`](file:///C:/Users/artur/Downloads/catalogo_saas_antigravity_kit/src/lib/tenants.json) armazena o catálogo mestre de tenants e URLs de API.
- Todo histórico de alterações, inclusões e exclusões de lojas fica registrado no Git.
- Caso um commit indevido seja realizado, basta executar:
  ```bash
  git revert <hash_do_commit>
  git push origin main
  ```

---

## 6. Procedimento de Restauração (Runbook de Emergência)

Em caso de incidente crítico (ex.: lojista apagou linhas da planilha por engano):

### Cenário A: Planilha ainda existe, mas dados foram adulterados
1. Abra a planilha do lojista no Google Drive;
2. Pressione `Ctrl + Alt + Shift + H` para abrir o **Histórico de versões**;
3. Localize o momento anterior ao incidente;
4. Clique em **Restaurar esta versão**;
5. Acesse a vitrine pública e confirme que os produtos reapareceram.
6. *Tempo de recuperação*: **< 3 minutos**.

### Cenário B: Planilha foi deletada da lixeira do Google Drive
1. Acesse a pasta `Backups_Catalogo_SaaS` no Google Drive;
2. Localize a cópia mais recente da loja;
3. Clique com o botão direito ➔ **Fazer uma cópia** e renomeie para `[Catálogo] Nome da Loja`;
4. Abra a planilha ➔ **Extensões** ➔ **Apps Script**;
5. Publique uma nova Web App (**Implantar** ➔ **Nova implantação**);
6. Copie a nova URL gerada;
7. Atualize o arquivo `src/lib/tenants.json` com a nova `apiUrl` do tenant correspondente;
8. Realize o commit e push para o Git.
9. *Tempo de recuperação*: **< 10 minutos**.
