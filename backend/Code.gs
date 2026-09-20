/**
 * ============================================================================
 * CATÁLOGO SAAS MULTI-TENANT — BACKEND GOOGLE APPS SCRIPT (v1.1.0)
 * ============================================================================
 * 
 * Backend completo para execução no Google Apps Script acoplado ao Google Sheets.
 * Arquitetura NoSQL/Relacional sobre abas de planilha com controle de concorrência.
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

// Chaves sensíveis que NUNCA devem ser retornadas em consultas públicas
var SENSITIVE_CONFIG_KEYS = ['admin_password_hash', 'api_token'];

// Chaves protegidas que não podem ser alteradas arbitrariamente via saveConfig
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
      case 'catalog':
      case 'getCatalog':
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
 * Ponto de entrada para requisições HTTP POST (Ações administrativas protegidas)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var lockAcquired = false;

  try {
    var payloadResult = parsePostPayload(e);
    if (!payloadResult.success) {
      return createJsonResponse(false, null, 'INVALID_PAYLOAD', payloadResult.error);
    }

    var payload = payloadResult.data;
    if (!payload || !payload.action) {
      return createJsonResponse(false, null, 'INVALID_PAYLOAD', 'Payload ausente ou sem campo "action".');
    }

    var action = payload.action;

    // Ação pública de login (não requer token prévio e não requer lock de planilha)
    if (action === 'login') {
      var loginResult = handleLogin(payload.password);
      return createJsonResponse(true, loginResult, null, null);
    }

    // Todas as operações de mutação exigem bloqueio contra concorrência
    lockAcquired = lock.tryLock(30000); // aguarda até 30 segundos
    if (!lockAcquired) {
      return createJsonResponse(false, null, 'LOCK_TIMEOUT', 'O servidor de dados está ocupado. Tente novamente em alguns segundos.');
    }

    // Validação de autorização para ações administrativas
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
      case 'createCategory':
        result = handleCreateCategory(payload.category);
        break;
      case 'updateCategory':
        result = handleUpdateCategory(payload.category);
        break;
      case 'deleteCategory':
        result = handleDeleteCategory(payload.id);
        break;
      case 'saveConfig':
        result = handleSaveConfig(payload.config);
        break;
      default:
        return createJsonResponse(false, null, 'UNKNOWN_ACTION', 'Ação POST desconhecida: ' + action);
    }

    return createJsonResponse(true, result, null, null);
  } catch (error) {
    var errorMsg = error.message || String(error);
    var errorCode = 'INTERNAL_ERROR';
    var match = errorMsg.match(/^([A-Z_]+):\s*(.+)$/);
    if (match) {
      errorCode = match[1];
      errorMsg = match[2];
    }
    return createJsonResponse(false, null, errorCode, errorMsg);
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
 * Cria abas, define cabeçalhos, formata e insere dados padrão caso vazias.
 * Execute manualmente no editor do Apps Script ao configurar uma nova loja.
 */
function initDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Configurar Aba 'config'
  var configSheet = getOrCreateSheet(ss, SHEET_CONFIG);
  if (configSheet.getLastRow() === 0) {
    configSheet.appendRow(['chave', 'valor']);
    configSheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    configSheet.setFrozenRows(1);

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
    catSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    catSheet.setFrozenRows(1);

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
    prodSheet.getRange(1, 1, 1, 14).setFontWeight('bold');
    prodSheet.setFrozenRows(1);
  }

  Logger.log('Banco de dados do Catálogo SaaS inicializado com sucesso!');
}

// ============================================================================
// CONSULTAS PÚBLICAS (GET HANDLERS)
// ============================================================================

/**
 * Retorna as configurações públicas da loja excluindo qualquer dado sensível.
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
 * Retorna lista de categorias ativas ordenadas pelo campo 'ordem'.
 */
function getActiveCategories() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_CATEGORIES);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var categories = [];
  // Linha 0: cabeçalho. Linhas 1..N: dados
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var id = String(row[0] || '').trim();
    if (!id) continue;

    var ativo = row[3] === true || String(row[3]).toUpperCase() === 'TRUE';
    if (ativo) {
      categories.push({
        id: id,
        nome: String(row[1] || '').trim(),
        slug: String(row[2] || '').trim(),
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

  var activeCategoriesMap = getActiveCategoriesMap();
  var products = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var id = String(row[0] || '').trim();
    if (!id) continue;

    var ativo = row[10] === true || String(row[10]).toUpperCase() === 'TRUE';
    var deletedAt = row[13] ? String(row[13]).trim() : '';

    // Filtrar produtos excluídos via soft delete ou inativos
    if (!ativo || deletedAt !== '') {
      continue;
    }

    var categoriaId = String(row[1] || '').trim();

    // Integridade: garantir que a categoria vinculada também esteja ativa
    if (!activeCategoriesMap[categoriaId]) {
      continue;
    }

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
      nome: String(row[2] || '').trim(),
      slug: String(row[3] || '').trim(),
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
 * Retorna payload consolidado para carregamento de alta velocidade da vitrine.
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
 * Autentica o administrador através de comparação de hash SHA-256 com salt.
 */
function handleLogin(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('MISSING_PASSWORD: A senha é obrigatória.');
  }

  var configs = getAllConfigsMap();
  var storedHash = configs['admin_password_hash'];
  var apiToken = configs['api_token'];

  if (!storedHash) {
    throw new Error('CONFIG_ERROR: Senha administrativa não configurada na planilha.');
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
 * Cria um novo produto na planilha com validação completa.
 */
function handleCreateProduct(productData) {
  if (!productData || typeof productData !== 'object') {
    throw new Error('VALIDATION_ERROR: Dados do produto ausentes ou inválidos.');
  }

  if (!productData.nome || typeof productData.nome !== 'string' || productData.nome.trim().length < 2) {
    throw new Error('VALIDATION_ERROR: Nome do produto deve ter no mínimo 2 caracteres.');
  }

  if (!productData.categoriaId || typeof productData.categoriaId !== 'string') {
    throw new Error('VALIDATION_ERROR: ID da categoria é obrigatório.');
  }

  // Integridade referencial: validar se a categoria existe
  assertCategoryExists(productData.categoriaId.trim());

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
    if (precoPromocional >= preco) {
      throw new Error('VALIDATION_ERROR: O preço promocional deve ser estritamente menor que o preço original.');
    }
  }

  // Validação de estoque (número inteiro >= -1)
  if (productData.estoque === undefined || productData.estoque === null || productData.estoque === '') {
    throw new Error('VALIDATION_ERROR: O estoque é obrigatório.');
  }
  var estoqueNum = Number(productData.estoque);
  if (!Number.isInteger(estoqueNum) || estoqueNum < -1) {
    throw new Error('VALIDATION_ERROR: O estoque deve ser um número inteiro maior ou igual a -1.');
  }

  // Validação do formato das variações
  var validatedVariations = validateVariations(productData.variacoes);

  // Validação de imagens
  var validatedImagens = validateImages(productData.imagens);

  var id = 'prod_' + generateUuid().replace(/-/g, '').substring(0, 12);
  var slug = productData.slug ? String(productData.slug).trim() : generateSlug(productData.nome);
  var descricao = productData.descricao ? String(productData.descricao).trim() : '';
  var ativo = productData.ativo !== false;
  var nowIso = new Date().toISOString();

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, SHEET_PRODUCTS);

  sheet.appendRow([
    id,
    productData.categoriaId.trim(),
    productData.nome.trim(),
    slug,
    descricao,
    preco,
    precoPromocional !== null ? precoPromocional : '',
    JSON.stringify(validatedImagens),
    JSON.stringify(validatedVariations),
    estoqueNum,
    ativo,
    nowIso,
    nowIso,
    '' // deletedAt vazio
  ]);

  return {
    id: id,
    categoriaId: productData.categoriaId.trim(),
    nome: productData.nome.trim(),
    slug: slug,
    descricao: descricao,
    preco: preco,
    precoPromocional: precoPromocional,
    imagens: validatedImagens,
    variacoes: validatedVariations,
    estoque: estoqueNum,
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
    if (String(data[i][0]).trim() === String(productData.id).trim()) {
      targetRowIndex = i + 1; // 1-indexed
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error('NOT_FOUND: Produto não encontrado com ID: ' + productData.id);
  }

  var currentRow = data[targetRowIndex - 1];
  var nowIso = new Date().toISOString();

  var updatedCategoriaId = currentRow[1];
  if (productData.categoriaId !== undefined) {
    var catId = String(productData.categoriaId).trim();
    assertCategoryExists(catId);
    updatedCategoriaId = catId;
  }

  var updatedNome = productData.nome !== undefined ? String(productData.nome).trim() : currentRow[2];
  if (productData.nome !== undefined && updatedNome.length < 2) {
    throw new Error('VALIDATION_ERROR: Nome do produto deve ter no mínimo 2 caracteres.');
  }

  var updatedSlug = productData.slug !== undefined ? String(productData.slug).trim() : currentRow[3];
  var updatedDescricao = productData.descricao !== undefined ? String(productData.descricao).trim() : currentRow[4];

  var updatedPreco = parseFloat(currentRow[5]);
  if (productData.preco !== undefined) {
    var p = parseFloat(productData.preco);
    if (isNaN(p) || p <= 0) throw new Error('VALIDATION_ERROR: O preço deve ser um número positivo.');
    updatedPreco = p;
  }

  var updatedPrecoPromocional = currentRow[6] !== '' && currentRow[6] !== null ? parseFloat(currentRow[6]) : null;
  if (productData.precoPromocional !== undefined) {
    if (productData.precoPromocional === null || productData.precoPromocional === '') {
      updatedPrecoPromocional = null;
    } else {
      var pp = parseFloat(productData.precoPromocional);
      if (isNaN(pp) || pp <= 0) throw new Error('VALIDATION_ERROR: O preço promocional deve ser maior que zero.');
      if (pp >= updatedPreco) {
        throw new Error('VALIDATION_ERROR: O preço promocional deve ser estritamente menor que o preço original.');
      }
      updatedPrecoPromocional = pp;
    }
  }

  var updatedImagens = currentRow[7];
  if (productData.imagens !== undefined) {
    updatedImagens = JSON.stringify(validateImages(productData.imagens));
  }

  var updatedVariacoes = currentRow[8];
  if (productData.variacoes !== undefined) {
    updatedVariacoes = JSON.stringify(validateVariations(productData.variacoes));
  }

  var updatedEstoque = currentRow[9];
  if (productData.estoque !== undefined) {
    var est = Number(productData.estoque);
    if (!Number.isInteger(est) || est < -1) {
      throw new Error('VALIDATION_ERROR: O estoque deve ser um número inteiro maior ou igual a -1.');
    }
    updatedEstoque = est;
  }

  var updatedAtivo = productData.ativo !== undefined ? (productData.ativo === true) : currentRow[10];

  // Gravação atômica dos valores atualizados
  sheet.getRange(targetRowIndex, 2).setValue(updatedCategoriaId);
  sheet.getRange(targetRowIndex, 3).setValue(updatedNome);
  sheet.getRange(targetRowIndex, 4).setValue(updatedSlug);
  sheet.getRange(targetRowIndex, 5).setValue(updatedDescricao);
  sheet.getRange(targetRowIndex, 6).setValue(updatedPreco);
  sheet.getRange(targetRowIndex, 7).setValue(updatedPrecoPromocional !== null ? updatedPrecoPromocional : '');
  sheet.getRange(targetRowIndex, 8).setValue(updatedImagens);
  sheet.getRange(targetRowIndex, 9).setValue(updatedVariacoes);
  sheet.getRange(targetRowIndex, 10).setValue(updatedEstoque);
  sheet.getRange(targetRowIndex, 11).setValue(updatedAtivo);
  sheet.getRange(targetRowIndex, 13).setValue(nowIso);

  return {
    id: String(productData.id).trim(),
    categoriaId: updatedCategoriaId,
    nome: updatedNome,
    slug: updatedSlug,
    descricao: updatedDescricao,
    preco: updatedPreco,
    precoPromocional: updatedPrecoPromocional,
    imagens: parseJsonSafe(updatedImagens, []),
    variacoes: parseJsonSafe(updatedVariacoes, []),
    estoque: updatedEstoque,
    ativo: updatedAtivo,
    updatedAt: nowIso
  };
}

/**
 * Realiza exclusão lógica (soft delete) do produto.
 */
function handleDeleteProduct(productId) {
  if (!productId || typeof productId !== 'string') {
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
    if (String(data[i][0]).trim() === String(productId).trim()) {
      targetRowIndex = i + 1;
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error('NOT_FOUND: Produto não encontrado com ID: ' + productId);
  }

  var nowIso = new Date().toISOString();
  // Marca inativo e preenche data de exclusão
  sheet.getRange(targetRowIndex, 11).setValue(false);
  sheet.getRange(targetRowIndex, 13).setValue(nowIso);
  sheet.getRange(targetRowIndex, 14).setValue(nowIso);

  return {
    id: productId.trim(),
    deleted: true,
    deletedAt: nowIso
  };
}

/**
 * Cria uma nova categoria.
 */
function handleCreateCategory(categoryData) {
  if (!categoryData || typeof categoryData !== 'object') {
    throw new Error('VALIDATION_ERROR: Dados da categoria ausentes.');
  }

  if (!categoryData.nome || typeof categoryData.nome !== 'string' || categoryData.nome.trim().length < 2) {
    throw new Error('VALIDATION_ERROR: Nome da categoria deve ter no mínimo 2 caracteres.');
  }

  var id = 'cat_' + generateUuid().replace(/-/g, '').substring(0, 8);
  var slug = categoryData.slug ? String(categoryData.slug).trim() : generateSlug(categoryData.nome);
  var ativo = categoryData.ativo !== false;
  var ordem = Number.isInteger(Number(categoryData.ordem)) ? Number(categoryData.ordem) : 0;
  var nowIso = new Date().toISOString();

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, SHEET_CATEGORIES);

  sheet.appendRow([id, categoryData.nome.trim(), slug, ativo, ordem, nowIso, nowIso]);

  return {
    id: id,
    nome: categoryData.nome.trim(),
    slug: slug,
    ativo: ativo,
    ordem: ordem,
    createdAt: nowIso,
    updatedAt: nowIso
  };
}

/**
 * Atualiza uma categoria existente.
 */
function handleUpdateCategory(categoryData) {
  if (!categoryData || !categoryData.id) {
    throw new Error('VALIDATION_ERROR: ID da categoria é obrigatório.');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_CATEGORIES);
  if (!sheet) throw new Error('NOT_FOUND: Planilha de categorias não encontrada.');

  var data = sheet.getDataRange().getValues();
  var targetRowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(categoryData.id).trim()) {
      targetRowIndex = i + 1;
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error('NOT_FOUND: Categoria não encontrada com ID: ' + categoryData.id);
  }

  var currentRow = data[targetRowIndex - 1];
  var updatedNome = categoryData.nome !== undefined ? String(categoryData.nome).trim() : currentRow[1];
  if (categoryData.nome !== undefined && updatedNome.length < 2) {
    throw new Error('VALIDATION_ERROR: Nome da categoria deve ter no mínimo 2 caracteres.');
  }

  var updatedSlug = categoryData.slug !== undefined ? String(categoryData.slug).trim() : currentRow[2];
  var updatedAtivo = categoryData.ativo !== undefined ? Boolean(categoryData.ativo) : currentRow[3];
  var updatedOrdem = categoryData.ordem !== undefined ? Number(categoryData.ordem) || 0 : currentRow[4];
  var nowIso = new Date().toISOString();

  sheet.getRange(targetRowIndex, 2).setValue(updatedNome);
  sheet.getRange(targetRowIndex, 3).setValue(updatedSlug);
  sheet.getRange(targetRowIndex, 4).setValue(updatedAtivo);
  sheet.getRange(targetRowIndex, 5).setValue(updatedOrdem);
  sheet.getRange(targetRowIndex, 7).setValue(nowIso);

  return {
    id: String(categoryData.id).trim(),
    nome: updatedNome,
    slug: updatedSlug,
    ativo: updatedAtivo,
    ordem: updatedOrdem,
    updatedAt: nowIso
  };
}

/**
 * Desativa categoria (soft delete).
 */
function handleDeleteCategory(categoryId) {
  if (!categoryId) {
    throw new Error('VALIDATION_ERROR: ID da categoria é obrigatório.');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_CATEGORIES);
  if (!sheet) throw new Error('NOT_FOUND: Planilha de categorias não encontrada.');

  var data = sheet.getDataRange().getValues();
  var targetRowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(categoryId).trim()) {
      targetRowIndex = i + 1;
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error('NOT_FOUND: Categoria não encontrada com ID: ' + categoryId);
  }

  var nowIso = new Date().toISOString();
  sheet.getRange(targetRowIndex, 4).setValue(false); // ativo = false
  sheet.getRange(targetRowIndex, 7).setValue(nowIso);

  return {
    id: String(categoryId).trim(),
    deleted: true,
    deletedAt: nowIso
  };
}

/**
 * Salva configurações da loja com proteção contra alteração de campos sensíveis.
 */
function handleSaveConfig(newConfigs) {
  if (!newConfigs || typeof newConfigs !== 'object') {
    throw new Error('VALIDATION_ERROR: Objeto de configuração inválido.');
  }

  // Bloqueio mandatória de chaves de segurança
  for (var i = 0; i < IMMUTABLE_CONFIG_KEYS.length; i++) {
    var forbiddenKey = IMMUTABLE_CONFIG_KEYS[i];
    if (newConfigs.hasOwnProperty(forbiddenKey)) {
      throw new Error('FORBIDDEN_MODIFICATION: A chave protegida "' + forbiddenKey + '" não pode ser alterada via API.');
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

  var allowedKeys = ['store_name', 'logo_url', 'primary_color', 'secondary_color', 'whatsapp', 'domain', 'currency', 'timezone'];

  for (var prop in newConfigs) {
    if (newConfigs.hasOwnProperty(prop) && allowedKeys.indexOf(prop) !== -1) {
      var val = String(newConfigs[prop]).trim();
      if (prop === 'whatsapp') {
        var digits = val.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 15) {
          throw new Error('VALIDATION_ERROR: O campo "whatsapp" deve conter entre 10 e 15 dígitos.');
        }
        val = digits;
      } else if (prop === 'primary_color' || prop === 'secondary_color') {
        if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(val)) {
          throw new Error('VALIDATION_ERROR: O campo "' + prop + '" deve ser uma cor hexadecimal válida (ex: #10b981).');
        }
      }

      if (existingKeysMap[prop]) {
        sheet.getRange(existingKeysMap[prop], 2).setValue(val);
      } else {
        sheet.appendRow([prop, val]);
      }
    }
  }

  return getPublicStoreConfig();
}

// ============================================================================
// VALIDAÇÃO, SEGURANÇA E AUXILIARES
// ============================================================================

/**
 * Valida o schema de variações rigorosamente.
 */
function validateVariations(variacoes) {
  if (variacoes === undefined || variacoes === null) {
    return [];
  }
  if (!Array.isArray(variacoes)) {
    throw new Error('VALIDATION_ERROR: O campo "variacoes" deve ser um array.');
  }

  for (var i = 0; i < variacoes.length; i++) {
    var v = variacoes[i];
    if (!v || typeof v !== 'object' || Array.isArray(v)) {
      throw new Error('VALIDATION_ERROR: Cada variação deve ser um objeto.');
    }
    if (!v.tipo || typeof v.tipo !== 'string' || v.tipo.trim().length === 0) {
      throw new Error('VALIDATION_ERROR: O "tipo" da variação é obrigatório e não pode ser vazio.');
    }
    if (!Array.isArray(v.opcoes) || v.opcoes.length === 0) {
      throw new Error('VALIDATION_ERROR: O campo "opcoes" da variação "' + v.tipo + '" deve ser um array com pelo menos 1 item.');
    }
    for (var j = 0; j < v.opcoes.length; j++) {
      if (typeof v.opcoes[j] !== 'string' || v.opcoes[j].trim().length === 0) {
        throw new Error('VALIDATION_ERROR: As opções da variação "' + v.tipo + '" devem ser strings não vazias.');
      }
    }
  }

  return variacoes;
}

/**
 * Valida a lista de imagens.
 */
function validateImages(imagens) {
  if (imagens === undefined || imagens === null) {
    return [];
  }
  if (!Array.isArray(imagens)) {
    throw new Error('VALIDATION_ERROR: O campo "imagens" deve ser um array de URLs.');
  }

  for (var i = 0; i < imagens.length; i++) {
    var urlStr = String(imagens[i]).trim();
    if (
      urlStr.indexOf('https://') !== 0 &&
      urlStr.indexOf('http://') !== 0 &&
      urlStr.indexOf('data:image/') !== 0
    ) {
      throw new Error('VALIDATION_ERROR: Cada imagem deve possuir protocolo válido (https://, http:// ou data:image/).');
    }
  }

  return imagens;
}

/**
 * Garante que a categoria informada existe e está ativa na aba 'categorias'.
 */
function assertCategoryExists(categoriaId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_CATEGORIES);
  if (!sheet) throw new Error('NOT_FOUND: Aba de categorias não encontrada.');

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][0]).trim();
    if (id === categoriaId) {
      var ativo = data[i][3] === true || String(data[i][3]).toUpperCase() === 'TRUE';
      if (!ativo) {
        throw new Error('VALIDATION_ERROR: A categoria informada (' + categoriaId + ') está desativada.');
      }
      return true;
    }
  }

  throw new Error('NOT_FOUND: A categoria informada não existe: ' + categoriaId);
}

/**
 * Retorna um mapa de categorias ativas { id: true }.
 */
function getActiveCategoriesMap() {
  var categories = getActiveCategories();
  var map = {};
  for (var i = 0; i < categories.length; i++) {
    map[categories[i].id] = true;
  }
  return map;
}

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

  return null;
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
      var rawVal = data[i][1];
      map[k] = (rawVal !== null && rawVal !== undefined) ? String(rawVal).trim() : '';
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
 * Extrai e valida o payload JSON do evento doPost com proteção contra JSON malformado.
 */
function parsePostPayload(e) {
  if (!e) return { success: false, error: 'Evento de requisição vazio.' };
  try {
    if (e.postData && e.postData.contents) {
      return { success: true, data: JSON.parse(e.postData.contents) };
    }
    if (e.parameter && e.parameter.payload) {
      return { success: true, data: JSON.parse(e.parameter.payload) };
    }
    return { success: false, error: 'Corpo da requisição ausente.' };
  } catch (err) {
    return { success: false, error: 'Payload JSON inválido ou malformado: ' + err.message };
  }
}

/**
 * Formata a resposta padrão da API em JSON uniforme.
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
 * Parse seguro de JSON com fallback garantido.
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
 * Gera slug limpo e normalizado a partir de texto com caracteres latinos.
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
