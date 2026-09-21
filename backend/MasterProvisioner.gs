/**
 * ============================================================================
 * CATÁLOGO SAAS MULTI-TENANT — PROVISIONADOR MESTRE EM NUVEM (Google Apps Script)
 * ============================================================================
 * 
 * Este script roda na conta Google do DONO DO SAAS (SuperAdmin).
 * Quando uma nova loja é criada na plataforma, este Web App é chamado automaticamente para:
 * 
 * 1. Criar uma nova Planilha Google Sheets dedicada para a loja.
 * 2. Mover a planilha para a pasta privada "SaaS - Planilhas das Lojas" no Google Drive do dono.
 * 3. Garantir privacidade absoluta: Apenas a conta Google do dono do SaaS é proprietária do arquivo.
 * 4. Configurar as abas obrigatórias: 'config', 'categorias', 'produtos'.
 * 5. Preencher com dados iniciais, senha do lojista criptografada, cores e status da loja.
 * 6. Registrar a nova loja na "Planilha Mestre de Controle do SaaS", permitindo monitorar
 *    todas as lojas, status e links direto pelo celular ou pelo painel web (/saas-admin).
 * 
 * INSTRUÇÕES DE INSTALAÇÃO:
 * 1. Acesse https://script.google.com/home e clique em "Novo Projeto".
 * 2. Nomeie o projeto como "SaaS Master Provisioner".
 * 3. Cole todo o código deste arquivo no editor.
 * 4. Clique em "Implantar" > "Nova implantação".
 * 5. Tipo: "App da Web".
 * 6. Executar como: "Eu" (Sua conta Google).
 * 7. Quem pode acessar: "Qualquer pessoa" (ou Qualquer pessoa com a chave).
 * 8. Copie a URL do Web App gerada e configure no Next.js (.env / Vercel):
 *    GOOGLE_MASTER_PROVISIONER_URL=https://script.google.com/macros/s/.../exec
 */

var SAAS_FOLDER_NAME = "SaaS - Planilhas das Lojas";
var MASTER_SHEET_NAME = "SaaS - Planilha Mestre de Controle";
var MASTER_AUTH_TOKEN = "master_saas_antigravity_2026"; // Token de segurança compartilhado

/**
 * Ponto de entrada POST — Provisionamento de nova loja
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000); // 25s de trava de concorrência

    var postData = null;
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = null;
      }
    }

    if (!postData) {
      return jsonResponse({ success: false, error: "Dados inválidos no corpo da requisição." }, 400);
    }

    // Valida token se fornecido
    if (postData.token && postData.token !== MASTER_AUTH_TOKEN) {
      return jsonResponse({ success: false, error: "Acesso não autorizado ao provisionador mestre." }, 401);
    }

    var action = postData.action || 'provisionStore';

    switch (action) {
      case 'provisionStore':
        return jsonResponse(handleProvisionStore(postData));
      
      case 'syncMaster':
      case 'listStores':
        return jsonResponse(handleListStores());

      default:
        return jsonResponse({ success: false, error: "Ação desconhecida: " + action }, 400);
    }
  } catch (err) {
    return jsonResponse({ success: false, error: "Erro interno no provisionador: " + err.toString() }, 500);
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

/**
 * Ponto de entrada GET — Consultas rápidas e lista de lojas
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || 'ping';

    if (action === 'ping') {
      return jsonResponse({
        success: true,
        message: "SaaS Master Provisioner ativo e operante!",
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'listStores' || action === 'sync') {
      return jsonResponse(handleListStores());
    }

    return jsonResponse({ success: false, error: "Ação GET não suportada." }, 400);
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() }, 500);
  }
}

/**
 * Cria a planilha da loja no Google Drive do Dono e a configura
 */
function handleProvisionStore(data) {
  var storeName = (data.storeName || data.name || "Minha Loja Digital").toString().trim();
  var slug = (data.slug || slugify(storeName)).toString().trim().toLowerCase();
  var tenantId = (data.tenantId || slug.replace(/-/g, '_')).toString().trim();
  var whatsapp = (data.whatsapp || "").toString().replace(/\D/g, '');
  var ownerEmail = (data.ownerEmail || "").toString().trim();
  var niche = (data.niche || "Geral").toString().trim();
  var primaryColor = data.primaryColor || "#10b981";
  var secondaryColor = data.secondaryColor || "#047857";
  var adminPassword = data.password || "admin123";
  var plan = data.plan || "trial_30d";

  // 1. Obtém ou cria a pasta privada do SaaS no Google Drive
  var folder = getOrCreatePrivateFolder();

  // 2. Cria a nova planilha dedicada da loja
  var fileName = storeName + " — Catálogo Digital [" + slug + "]";
  var spreadsheet = SpreadsheetApp.create(fileName);
  var file = DriveApp.getFileById(spreadsheet.getId());

  // Move para a pasta privada do dono
  file.moveTo(folder);

  // 3. Prepara a aba 'config'
  var sheetConfig = spreadsheet.getActiveSheet();
  sheetConfig.setName('config');
  sheetConfig.getRange("A1:B1").setValues([["chave", "valor"]]).setFontWeight("bold").setBackground("#e2e8f0");

  var passwordHash = hashPassword(adminPassword);
  var apiToken = "tok_" + Utilities.getUuid().replace(/-/g, '');

  var configRows = [
    ["store_id", tenantId],
    ["store_name", storeName],
    ["whatsapp", whatsapp],
    ["primary_color", primaryColor],
    ["secondary_color", secondaryColor],
    ["background_color", "#f8fafc"],
    ["text_color", "#0f172a"],
    ["currency", "BRL"],
    ["timezone", "America/Sao_Paulo"],
    ["is_open", "true"],
    ["business_hours", "Seg a Sáb: 09h às 20h"],
    ["pix_key", whatsapp],
    ["pix_key_type", "Celular"],
    ["banners", "[]"],
    ["admin_password_hash", passwordHash],
    ["api_token", apiToken]
  ];
  sheetConfig.getRange(2, 1, configRows.length, 2).setValues(configRows);

  // 4. Prepara a aba 'categorias'
  var sheetCategories = spreadsheet.insertSheet('categorias');
  sheetCategories.getRange("A1:G1").setValues([[
    "id", "nome", "slug", "ativo", "ordem", "createdAt", "updatedAt"
  ]]).setFontWeight("bold").setBackground("#e2e8f0");
  
  var nowIso = new Date().toISOString();
  sheetCategories.getRange(2, 1, 1, 7).setValues([[
    "cat_geral", "Geral", "geral", "TRUE", 1, nowIso, nowIso
  ]]);

  // 5. Prepara a aba 'produtos'
  var sheetProducts = spreadsheet.insertSheet('produtos');
  sheetProducts.getRange("A1:N1").setValues([[
    "id", "categoriaId", "nome", "slug", "descricao", "preco", 
    "precoPromocional", "imagens", "variacoes", "estoque", "ativo", 
    "createdAt", "updatedAt", "deletedAt"
  ]]).setFontWeight("bold").setBackground("#e2e8f0");

  var spreadsheetUrl = spreadsheet.getUrl();
  var spreadsheetId = spreadsheet.getId();

  // 6. Registra na Planilha Mestre do SaaS
  var masterUrl = registerStoreInMasterSheet({
    tenantId: tenantId,
    storeName: storeName,
    slug: slug,
    whatsapp: whatsapp,
    ownerEmail: ownerEmail,
    niche: niche,
    plan: plan,
    status: plan === 'trial_30d' ? 'trial' : 'active',
    spreadsheetId: spreadsheetId,
    spreadsheetUrl: spreadsheetUrl,
    createdAt: nowIso
  });

  return {
    success: true,
    tenant: {
      tenantId: tenantId,
      name: storeName,
      slug: slug,
      whatsapp: whatsapp,
      ownerEmail: ownerEmail,
      plan: plan,
      subscriptionStatus: plan === 'trial_30d' ? 'trial' : 'active',
      spreadsheetId: spreadsheetId,
      spreadsheetUrl: spreadsheetUrl,
      createdAt: nowIso
    },
    spreadsheetId: spreadsheetId,
    spreadsheetUrl: spreadsheetUrl,
    masterSheetUrl: masterUrl
  };
}

/**
 * Obtém ou cria a pasta privada no Drive do Dono
 */
function getOrCreatePrivateFolder() {
  var folders = DriveApp.getFoldersByName(SAAS_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(SAAS_FOLDER_NAME);
}

/**
 * Registra a loja na Planilha Mestre de Controle do SaaS
 */
function registerStoreInMasterSheet(info) {
  var masterSheet = getOrCreateMasterSheet();
  var sheet = masterSheet.getSheetByName("Lojas");
  if (!sheet) {
    sheet = masterSheet.insertSheet("Lojas");
  }

  // Verifica se o cabeçalho existe
  if (sheet.getLastRow() === 0) {
    sheet.getRange("A1:K1").setValues([[
      "Data Criação", "Tenant ID", "Nome da Loja", "Slug", "WhatsApp", 
      "Email do Lojista", "Nicho", "Plano", "Status", "ID Planilha", "URL Planilha Google Sheets"
    ]]).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
  }

  sheet.appendRow([
    info.createdAt,
    info.tenantId,
    info.storeName,
    info.slug,
    info.whatsapp,
    info.ownerEmail,
    info.niche,
    info.plan,
    info.status,
    info.spreadsheetId,
    info.spreadsheetUrl
  ]);

  return masterSheet.getUrl();
}

/**
 * Obtém ou cria a Planilha Mestre do SaaS
 */
function getOrCreateMasterSheet() {
  var folder = getOrCreatePrivateFolder();
  var files = folder.getFilesByName(MASTER_SHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  var newMaster = SpreadsheetApp.create(MASTER_SHEET_NAME);
  var file = DriveApp.getFileById(newMaster.getId());
  file.moveTo(folder);
  return newMaster;
}

/**
 * Lê todas as lojas cadastradas na Planilha Mestre do SaaS
 */
function handleListStores() {
  var masterSheet = getOrCreateMasterSheet();
  var sheet = masterSheet.getSheetByName("Lojas");
  if (!sheet || sheet.getLastRow() <= 1) {
    return {
      success: true,
      masterSheetUrl: masterSheet.getUrl(),
      stores: []
    };
  }

  var data = sheet.getDataRange().getValues();
  var stores = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[1]) { // tenantId
      stores.push({
        createdAt: row[0],
        tenantId: row[1],
        name: row[2],
        slug: row[3],
        whatsapp: row[4],
        ownerEmail: row[5],
        niche: row[6],
        plan: row[7],
        subscriptionStatus: row[8],
        spreadsheetId: row[9],
        spreadsheetUrl: row[10],
        domain: row[3] ? (row[3] + ".localhost") : ""
      });
    }
  }

  return {
    success: true,
    masterSheetUrl: masterSheet.getUrl(),
    total: stores.length,
    stores: stores
  };
}

/**
 * Criptografia SHA-256 para senhas
 */
function hashPassword(password) {
  var salt = 'CATALOGO_SAAS_SALT_v1_';
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + password);
  var hexString = '';
  for (var i = 0; i < rawHash.length; i++) {
    var byte = rawHash[i];
    if (byte < 0) byte += 256;
    var byteStr = byte.toString(16);
    if (byteStr.length === 1) byteStr = '0' + byteStr;
    hexString += byteStr;
  }
  return hexString;
}

/**
 * Helper de Slug
 */
function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resposta JSON formatada com CORS
 */
function jsonResponse(payload, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
