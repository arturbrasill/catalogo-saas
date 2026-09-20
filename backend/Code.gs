/**
 * ============================================================================
 * CATÁLOGO SAAS MULTI-TENANT — BACKEND GOOGLE APPS SCRIPT (v1.0.0)
 * ============================================================================
 * 
 * Este arquivo contém o backend completo executado no Google Apps Script.
 * Integração: Google Sheets como banco de dados NoSQL/Relacional simplificado.
 * 
 * ABAS DA PLANILHA:
 * 1. config      -> chave | valor
 * 2. categorias  -> id | nome | slug | ativo | ordem | createdAt | updatedAt
 * 3. produtos    -> id | categoriaId | nome | slug | descricao | preco | 
 *                   precoPromocional | imagens | variacoes | estoque | ativo | 
 *                   createdAt | updatedAt | deletedAt
 */

// Constantes de Configuração das Abas
var SHEET_CONFIG = 'config';
var SHEET_CATEGORIES = 'categorias';
var SHEET_PRODUCTS = 'produtos';

// Chaves sensíveis que NUNCA devem ser retornadas em requisições públicas
var SENSITIVE_CONFIG_KEYS = ['admin_password_hash', 'api_token'];

// Chaves que não podem ser alteradas arbitrariamente via saveConfig
var IMMUTABLE_CONFIG_KEYS = ['store_id', 'api_token', 'admin_password_hash'];

/**
 * Ponto de entrada para requisições HTTP GET (Consultas públicas)
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || 'store';
    var response;

    switch (action) {
      case 'store':
        response = getPublicStoreConfig();
        break;
      case 'categories':
        response = getActiveCategories();
        break;
      case 'products':
        var categoryId = params.categoryId || null;
        response = getActiveProducts(categoryId);
        break;
      case 'all':
        response = getInitialCatalogData();
        break;
      default:
        return createJsonResponse(false, null, 'UNKNOWN_ACTION', 'Ação GET desconhecida: ' + action);
    }

    return createJsonResponse(true, response, null, null);
  } catch (error) {
    return createJsonResponse(false, null, 'INTERNAL_ERROR', error.message || String(error));
  }
}

/**
 * Ponto de entrada para requisições HTTP POST (Ações administrativas com Lock)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var lockAcquired = false;

  try {
    var payload = parsePostPayload(e);
    if (!payload || !payload.action) {
      return createJsonResponse(false, null, 'INVALID_PAYLOAD', 'Payload ausente ou sem campo "action".');
    }

    var action = payload.action;

    // Ação pública de login (não requer token prévio)
    if (action === 'login') {
      var loginResult = handleLogin(payload.password);
      return createJsonResponse(true, loginResult, null, null);
    }

    // Todas as operações de mutação exigem bloqueio contra concorrência
    lockAcquired = lock.tryLock(30000); // aguarda até 30 segundos
    if (!lockAcquired) {
      return createJsonResponse(false, null, 'LOCK_TIMEOUT', 'O servidor de dados está ocupado. Tente novamente em alguns segundos.');
    }

    // Validação de autorização em ações administrativas
    var authError = validateAuthorization(payload.token);
    if (authError) {
      return createJsonResponse(false, null, 'UNAUTHORIZED', authError);
    }

    var result;
    switch (action) {
      case 'createProduct':
        result = handleCreateProduct(payload.product);
        break;
      case 'updateProduct':
        result = handleUpdateProduct(payload.product);
        break;
      case 'deleteProduct':
        result = handleDeleteProduct(payload.id);
        break;
      case 'saveConfig':
        result = handleSaveConfig(payload.config);
        break;
      default:
        return createJsonResponse(false, null, 'UNKNOWN_ACTION', 'Ação POST desconhecida: ' + action);
    }

    return createJsonResponse(true, result, null, null);
  } catch (error) {
    return createJsonResponse(false, null, 'INTERNAL_ERROR', error.message || String(error));
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
    }
  }
}

// ============================================================================
// INICIALIZAÇÃO E MIGRAÇÃO DO BANCO (SHEETS)
// ============================================================================

/**
 * Cria abas, define cabeçalhos e insere dados padrão caso a planilha seja nova.
 * Execute manualmente no editor do Apps Script ao configurar uma nova loja.
 */
function initDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Configurar Aba 'config'
  var configSheet = getOrCreateSheet(ss, SHEET_CONFIG);
  if (configSheet.getLastRow() === 0) {
    configSheet.appendRow(['chave', 'valor']);
    var defaultPasswordHash = hashPassword('admin123');
    var defaultApiToken = 'tok_' + generateUuid().replace(/-/g, '').substring(0, 24);

    var defaultConfigs = [
      ['store_id', 'loja_exemplo'],
      ['store_name', 'Minha Loja Digital'],
      ['logo_url', ''],
      ['primary_color', '#10b981'],
      ['secondary_color', '#047857'],
      ['whatsapp', '5511999999999'],
      ['admin_password_hash', defaultPasswordHash],
      ['api_token', defaultApiToken],
      ['domain', 'localhost:3000'],
      ['currency', 'BRL'],
      ['timezone', 'America/Sao_Paulo']
    ];

    for (var i = 0; i < defaultConfigs.length; i++) {
      configSheet.appendRow(defaultConfigs[i]);
    }
  }

  // 2. Configurar Aba 'categorias'
  var catSheet = getOrCreateSheet(ss, SHEET_CATEGORIES);
  if (catSheet.getLastRow() === 0) {
    catSheet.appendRow(['id', 'nome', 'slug', 'ativo', 'ordem', 'createdAt', 'updatedAt']);
    var catId = 'cat_' + generateUuid().substring(0, 8);
    var nowIso = new Date().toISOString();
    catSheet.appendRow([catId, 'Geral', 'geral', true, 1, nowIso, nowIso]);
  }

  // 3. Configurar Aba 'produtos'
  var prodSheet = getOrCreateSheet(ss, SHEET_PRODUCTS);
  if (prodSheet.getLastRow() === 0) {
    prodSheet.appendRow([
      'id', 'categoriaId', 'nome', 'slug', 'descricao', 'preco', 
      'precoPromocional', 'imagens', 'variacoes', 'estoque', 'ativo', 
      'createdAt', 'updatedAt', 'deletedAt'
    ]);
  }

  Logger.log('Banco de dados da loja inicializado com sucesso!');
}

// ============================================================================
// CONSULTAS PÚBLICAS (GET HANDLERS)
// ============================================================================

/**
 * Retorna as configurações da loja excluindo qualquer informação sensível.
 */
function getPublicStoreConfig() {
  var configs = getAllConfigsMap();
  var publicConfig = {};

  for (var key in configs) {
    if (configs.hasOwnProperty(key)) {
      if (SENSITIVE_CONFIG_KEYS.indexOf(key) === -1) {
        publicConfig[key] = configs[key];
      }
    }
  }

  return publicConfig;
}

/**
 * Retorna lista de categorias ativas ordenadas por 'ordem'.
 */
function getActiveCategories() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_CATEGORIES);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var categories = [];
  // Cabeçalhos na linha 0: id(0), nome(1), slug(2), ativo(3), ordem(4), createdAt(5), updatedAt(6)
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var ativo = row[3] === true || String(row[3]).toUpperCase() === 'TRUE';
    if (ativo) {
      categories.push({
        id: String(row[0]),
        nome: String(row[1]),
        slug: String(row[2]),
        ativo: true,
        ordem: Number(row[4]) || 0,
        createdAt: row[5] ? String(row[5]) : '',
        updatedAt: row[6] ? String(row[6]) : ''
      });
    }
  }

  categories.sort(function(a, b) {
    return a.ordem - b.ordem;
  });

  return categories;
}

/**
 * Retorna lista de produtos ativos (não excluídos logicamente).
 */
function getActiveProducts(filterCategoryId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_PRODUCTS);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var products = [];
  // Colunas: id(0), categoriaId(1), nome(2), slug(3), descricao(4), preco(5),
  // precoPromocional(6), imagens(7), variacoes(8), estoque(9), ativo(10),
  // createdAt(11), updatedAt(12), deletedAt(13)
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var id = String(row[0] || '');
    if (!id) continue;

    var ativo = row[10] === true || String(row[10]).toUpperCase() === 'TRUE';
    var deletedAt = row[13] ? String(row[13]).trim() : '';

    // Filtrar soft delete e inativos
    if (!ativo || deletedAt !== '') {
      continue;
    }

    var categoriaId = String(row[1] || '');
    if (filterCategoryId && categoriaId !== filterCategoryId) {
      continue;
    }

    var preco = parseFloat(row[5]) || 0;
    var precoPromocional = row[6] !== '' && row[6] !== null ? parseFloat(row[6]) : null;
    var imagens = parseJsonSafe(row[7], []);
    var variacoes = parseJsonSafe(row[8], []);
    var estoque = parseInt(row[9], 10);
    if (isNaN(estoque)) estoque = 0;

    products.push({
      id: id,
      categoriaId: categoriaId,
      nome: String(row[2] || ''),
      slug: String(row[3] || ''),
      descricao: String(row[4] || ''),
      preco: preco,
      precoPromocional: precoPromocional,
      imagens: Array.isArray(imagens) ? imagens : [],
      variacoes: Array.isArray(variacoes) ? variacoes : [],
      estoque: estoque,
      ativo: true,
      createdAt: row[11] ? String(row[11]) : '',
      updatedAt: row[12] ? String(row[12]) : '',
      deletedAt: null
    });
  }

  return products;
}

/**
 * Retorna payload agregado completo para inicialização rápida da vitrine.
 */
function getInitialCatalogData() {
  return {
    store: getPublicStoreConfig(),
    categories: getActiveCategories(),
    products: getActiveProducts(null)
  };
}

// ============================================================================
// MUTATOR ACTIONS (POST HANDLERS)
// ============================================================================

/**
 * Autentica o administrador através da senha e retorna confirmação com token.
 */
function handleLogin(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('MISSING_PASSWORD: A senha é obrigatória.');
  }

  var configs = getAllConfigsMap();
  var storedHash = configs['admin_password_hash'];
  var apiToken = configs['api_token'];

  if (!storedHash) {
    throw new Error('CONFIG_ERROR: Senha administrativa não configurada.');
  }

  var inputHash = hashPassword(password);
  if (inputHash !== storedHash) {
    throw new Error('INVALID_CREDENTIALS: Senha incorreta.');
  }

  return {
    authenticated: true,
    token: apiToken
  };
}

/**
 * Cria um novo produto na planilha.
 */
function handleCreateProduct(productData) {
  if (!productData) {
    throw new Error('VALIDATION_ERROR: Dados do produto ausentes.');
  }

  if (!productData.nome || typeof productData.nome !== 'string' || productData.nome.trim().length < 2) {
    throw new Error('VALIDATION_ERROR: Nome do produto deve ter no mínimo 2 caracteres.');
  }

  if (!productData.categoriaId) {
    throw new Error('VALIDATION_ERROR: ID da categoria é obrigatório.');
  }

  var preco = parseFloat(productData.preco);
  if (isNaN(preco) || preco <= 0) {
    throw new Error('VALIDATION_ERROR: O preço deve ser um número positivo.');
  }

  var precoPromocional = null;
  if (productData.precoPromocional !== undefined && productData.precoPromocional !== null && productData.precoPromocional !== '') {
    precoPromocional = parseFloat(productData.precoPromocional);
    if (isNaN(precoPromocional) || precoPromocional <= 0) {
      throw new Error('VALIDATION_ERROR: O preço promocional deve ser maior que zero.');
    }
  }

  var id = 'prod_' + generateUuid().substring(0, 12);
  var slug = productData.slug ? String(productData.slug).trim() : generateSlug(productData.nome);
  var descricao = productData.descricao ? String(productData.descricao) : '';
  var imagensJson = JSON.stringify(Array.isArray(productData.imagens) ? productData.imagens : []);
  var variacoesJson = JSON.stringify(Array.isArray(productData.variacoes) ? productData.variacoes : []);
  var estoque = parseInt(productData.estoque, 10);
  if (isNaN(estoque)) estoque = 0;
  var ativo = productData.ativo !== false;
  var nowIso = new Date().toISOString();

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, SHEET_PRODUCTS);

  sheet.appendRow([
    id,
    productData.categoriaId,
    productData.nome.trim(),
    slug,
    descricao,
    preco,
    precoPromocional !== null ? precoPromocional : '',
    imagensJson,
    variacoesJson,
    estoque,
    ativo,
    nowIso,
    nowIso,
    '' // deletedAt vazio
  ]);

  return {
    id: id,
    categoriaId: productData.categoriaId,
    nome: productData.nome.trim(),
    slug: slug,
    descricao: descricao,
    preco: preco,
    precoPromocional: precoPromocional,
    imagens: Array.isArray(productData.imagens) ? productData.imagens : [],
    variacoes: Array.isArray(productData.variacoes) ? productData.variacoes : [],
    estoque: estoque,
    ativo: ativo,
    createdAt: nowIso,
    updatedAt: nowIso,
    deletedAt: null
  };
}

/**
 * Atualiza campos de um produto existente.
 */
function handleUpdateProduct(productData) {
  if (!productData || !productData.id) {
    throw new Error('VALIDATION_ERROR: ID do produto é obrigatório para atualização.');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_PRODUCTS);
  if (!sheet) {
    throw new Error('NOT_FOUND: Planilha de produtos não encontrada.');
  }

  var data = sheet.getDataRange().getValues();
  var targetRowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(productData.id)) {
      targetRowIndex = i + 1; // +1 porque getRange é 1-indexed
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error('NOT_FOUND: Produto não encontrado com ID: ' + productData.id);
  }

  var currentRow = data[targetRowIndex - 1];
  var nowIso = new Date().toISOString();

  var updatedCategoriaId = productData.categoriaId !== undefined ? productData.categoriaId : currentRow[1];
  var updatedNome = productData.nome !== undefined ? String(productData.nome).trim() : currentRow[2];
  var updatedSlug = productData.slug !== undefined ? String(productData.slug).trim() : currentRow[3];
  var updatedDescricao = productData.descricao !== undefined ? String(productData.descricao) : currentRow[4];
  
  var updatedPreco = currentRow[5];
  if (productData.preco !== undefined) {
    var p = parseFloat(productData.preco);
    if (isNaN(p) || p <= 0) throw new Error('VALIDATION_ERROR: Preço deve ser positivo.');
    updatedPreco = p;
  }

  var updatedPrecoPromocional = currentRow[6];
  if (productData.precoPromocional !== undefined) {
    if (productData.precoPromocional === null || productData.precoPromocional === '') {
      updatedPrecoPromocional = '';
    } else {
      var pp = parseFloat(productData.precoPromocional);
      if (isNaN(pp) || pp <= 0) throw new Error('VALIDATION_ERROR: Preço promocional deve ser positivo.');
      updatedPrecoPromocional = pp;
    }
  }

  var updatedImagens = productData.imagens !== undefined ? JSON.stringify(productData.imagens) : currentRow[7];
  var updatedVariacoes = productData.variacoes !== undefined ? JSON.stringify(productData.variacoes) : currentRow[8];
  
  var updatedEstoque = currentRow[9];
  if (productData.estoque !== undefined) {
    var est = parseInt(productData.estoque, 10);
    if (isNaN(est)) throw new Error('VALIDATION_ERROR: Estoque deve ser um número inteiro.');
    updatedEstoque = est;
  }

  var updatedAtivo = productData.ativo !== undefined ? (productData.ativo === true) : currentRow[10];

  // Escrever valores atualizados mantendo id (col 1), createdAt (col 12) e deletedAt (col 14)
  sheet.getRange(targetRowIndex, 2).setValue(updatedCategoriaId);
  sheet.getRange(targetRowIndex, 3).setValue(updatedNome);
  sheet.getRange(targetRowIndex, 4).setValue(updatedSlug);
  sheet.getRange(targetRowIndex, 5).setValue(updatedDescricao);
  sheet.getRange(targetRowIndex, 6).setValue(updatedPreco);
  sheet.getRange(targetRowIndex, 7).setValue(updatedPrecoPromocional);
  sheet.getRange(targetRowIndex, 8).setValue(updatedImagens);
  sheet.getRange(targetRowIndex, 9).setValue(updatedVariacoes);
  sheet.getRange(targetRowIndex, 10).setValue(updatedEstoque);
  sheet.getRange(targetRowIndex, 11).setValue(updatedAtivo);
  sheet.getRange(targetRowIndex, 13).setValue(nowIso);

  return {
    id: productData.id,
    categoriaId: updatedCategoriaId,
    nome: updatedNome,
    slug: updatedSlug,
    descricao: updatedDescricao,
    preco: parseFloat(updatedPreco),
    precoPromocional: updatedPrecoPromocional !== '' ? parseFloat(updatedPrecoPromocional) : null,
    imagens: parseJsonSafe(updatedImagens, []),
    variacoes: parseJsonSafe(updatedVariacoes, []),
    estoque: updatedEstoque,
    ativo: updatedAtivo,
    updatedAt: nowIso
  };
}

/**
 * Executa exclusão lógica (soft delete) do produto.
 */
function handleDeleteProduct(productId) {
  if (!productId) {
    throw new Error('VALIDATION_ERROR: ID do produto é obrigatório.');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_PRODUCTS);
  if (!sheet) {
    throw new Error('NOT_FOUND: Planilha de produtos não encontrada.');
  }

  var data = sheet.getDataRange().getValues();
  var targetRowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(productId)) {
      targetRowIndex = i + 1;
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error('NOT_FOUND: Produto não encontrado com ID: ' + productId);
  }

  var nowIso = new Date().toISOString();
  // Coluna 11 = ativo -> FALSE
  sheet.getRange(targetRowIndex, 11).setValue(false);
  // Coluna 13 = updatedAt -> nowIso
  sheet.getRange(targetRowIndex, 13).setValue(nowIso);
  // Coluna 14 = deletedAt -> nowIso
  sheet.getRange(targetRowIndex, 14).setValue(nowIso);

  return {
    id: productId,
    deleted: true,
    deletedAt: nowIso
  };
}

/**
 * Salva configurações da loja impedindo modificação de chaves imutáveis.
 */
function handleSaveConfig(newConfigs) {
  if (!newConfigs || typeof newConfigs !== 'object') {
    throw new Error('VALIDATION_ERROR: Objeto de configuração inválido.');
  }

  // Verificar se há tentativa de alterar chaves proibidas
  for (var i = 0; i < IMMUTABLE_CONFIG_KEYS.length; i++) {
    var forbiddenKey = IMMUTABLE_CONFIG_KEYS[i];
    if (newConfigs.hasOwnProperty(forbiddenKey)) {
      throw new Error('FORBIDDEN_MODIFICATION: A chave "' + forbiddenKey + '" não pode ser alterada via API.');
    }
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, SHEET_CONFIG);
  var data = sheet.getDataRange().getValues();
  var existingKeysMap = {};

  for (var j = 1; j < data.length; j++) {
    var key = String(data[j][0]).trim();
    if (key) {
      existingKeysMap[key] = j + 1; // 1-indexed row number
    }
  }

  for (var prop in newConfigs) {
    if (newConfigs.hasOwnProperty(prop)) {
      var val = String(newConfigs[prop]);
      if (existingKeysMap[prop]) {
        // Atualiza linha existente
        sheet.getRange(existingKeysMap[prop], 2).setValue(val);
      } else {
        // Adiciona nova linha de configuração
        sheet.appendRow([prop, val]);
      }
    }
  }

  return getPublicStoreConfig();
}

// ============================================================================
// FUNÇÕES AUXILIARES, SEGURANÇA E PARSING
// ============================================================================

/**
 * Valida o token de autorização administrativo.
 */
function validateAuthorization(token) {
  if (!token || typeof token !== 'string') {
    return 'Token de autorização ausente ou inválido.';
  }

  var configs = getAllConfigsMap();
  var storedToken = configs['api_token'];

  if (!storedToken || token.trim() !== storedToken.trim()) {
    return 'Token de autorização inválido ou expirado.';
  }

  return null; // Autorizado
}

/**
 * Lê todas as chaves e valores da aba 'config'.
 */
function getAllConfigsMap() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_CONFIG);
  if (!sheet) return {};

  var data = sheet.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < data.length; i++) {
    var k = String(data[i][0]).trim();
    if (k) {
      map[k] = data[i][1];
    }
  }
  return map;
}

/**
 * Gera hash SHA-256 com salt fixo do sistema.
 */
function hashPassword(password) {
  var salt = 'CATALOGO_SAAS_SALT_v1_';
  var rawBytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    salt + password,
    Utilities.Charset.UTF_8
  );

  var hashStr = '';
  for (var i = 0; i < rawBytes.length; i++) {
    var byteVal = rawBytes[i];
    if (byteVal < 0) byteVal += 256;
    var hex = byteVal.toString(16);
    if (hex.length === 1) hex = '0' + hex;
    hashStr += hex;
  }
  return hashStr;
}

/**
 * Extrai o payload JSON do evento doPost com suporte a text/plain e application/json.
 */
function parsePostPayload(e) {
  if (!e) return null;
  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  if (e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }
  return null;
}

/**
 * Formata a resposta padrão da API em JSON.
 */
function createJsonResponse(success, data, errorCode, errorMessage) {
  var output = {
    success: success,
    data: success ? data : null,
    error: success ? null : {
      code: errorCode || 'UNKNOWN_ERROR',
      message: errorMessage || 'Ocorreu um erro na requisição.'
    }
  };

  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Parse seguro de JSON com fallback.
 */
function parseJsonSafe(jsonString, fallbackValue) {
  if (!jsonString) return fallbackValue;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return fallbackValue;
  }
}

/**
 * Gera um UUID seguro v4.
 */
function generateUuid() {
  return Utilities.getUuid();
}

/**
 * Gera um slug a partir de uma string.
 */
function generateSlug(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Obtém ou cria uma aba por nome na planilha.
 */
function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}
