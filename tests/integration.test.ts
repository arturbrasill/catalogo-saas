/**
 * Testes de Integração Completa do SaaS de Catálogo Digital Multi-Tenant
 *
 * Cobre os 4 fluxos fundamentais:
 * - FLUXO 1: Consumidor (Jornada ponta a ponta na vitrine até o WhatsApp)
 * - FLUXO 2: Lojista (Painel administrativo, mutações, ciclo de vida de produtos e impacto na vitrine)
 * - FLUXO 3: Multi-Tenant (Isolamento estrito entre Tenant A e Tenant B)
 * - FLUXO 4: Motor do WhatsApp (Carrinho real, cálculos, formatação e URL encoding)
 * - CONTRATOS & SEGURANÇA: Respeito estrito aos contratos da API e proteção contra vazamento de segredos
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  BackendEngine,
  getLocalEngine,
  resetLocalEngines,
} from '../src/backend/engine';
import {
  getTenantByHostname,
  normalizeHostname,
  isValidTenant,
} from '../src/lib/tenantResolver';
import {
  formatCurrency,
  formatVariation,
  formatCartItem,
  calculateSubtotal,
  calculateCartTotal,
  normalizePhoneNumber,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
} from '../src/lib/whatsapp';
import type {
  Product,
  Category,
  CartItem,
  TenantRegistry,
  CreateProductInput,
} from '../src/types';

describe('INTEGRAÇÃO COMPLETA — TODOS OS MÓDULOS', () => {
  beforeEach(() => {
    resetLocalEngines();
  });

  // ============================================================
  // FLUXO 1 — CONSUMIDOR (Jornada Ponta a Ponta)
  // ============================================================
  describe('FLUXO 1 — CONSUMIDOR: Vitrine, Busca, Filtro, Sacola e WhatsApp', () => {
    let engine: BackendEngine;
    let token: string;
    let catVestuarioId: string;
    let catAcessoriosId: string;
    let prodPolo: Product;
    let prodRelogio: Product;
    let prodBone: Product;

    beforeEach(() => {
      engine = new BackendEngine({
        store_id: 'loja_exemplo',
        store_name: 'Minha Loja Digital',
        whatsapp: '5511999999999',
        currency: 'BRL',
      });

      // Login administrativo para semear dados de teste
      const loginRes = engine.doPost({ action: 'login', password: 'admin123' });
      token = (loginRes.data as { token: string }).token;

      // 1. Criar Categorias
      const catVestRes = engine.doPost({
        action: 'createCategory',
        token,
        category: { nome: 'Vestuário', ordem: 1, ativo: true },
      });
      catVestuarioId = (catVestRes.data as Category).id;

      const catAcesRes = engine.doPost({
        action: 'createCategory',
        token,
        category: { nome: 'Acessórios', ordem: 2, ativo: true },
      });
      catAcessoriosId = (catAcesRes.data as Category).id;

      // 2. Criar Produtos com variações e promoções
      const prodPoloRes = engine.doPost({
        action: 'createProduct',
        token,
        product: {
          categoriaId: catVestuarioId,
          nome: 'Camisa Polo Confort',
          slug: 'camisa-polo-confort',
          descricao: 'Polo 100% algodão piquet com toque macio.',
          preco: 100.0,
          precoPromocional: 80.0,
          imagens: ['https://cdn.example.com/polo.jpg'],
          variacoes: [
            { tipo: 'Tamanho', opcoes: ['P', 'M', 'G'] },
            { tipo: 'Cor', opcoes: ['Azul', 'Branco'] },
          ],
          estoque: 20,
          ativo: true,
        },
      });
      prodPolo = prodPoloRes.data as Product;

      const prodRelogioRes = engine.doPost({
        action: 'createProduct',
        token,
        product: {
          categoriaId: catAcessoriosId,
          nome: 'Relógio Esportivo Sport',
          slug: 'relogio-esportivo-sport',
          descricao: 'Relógio resistente à água com pulseira de silicone.',
          preco: 250.0,
          precoPromocional: null,
          imagens: ['https://cdn.example.com/relogio.jpg'],
          variacoes: [],
          estoque: 10,
          ativo: true,
        },
      });
      prodRelogio = prodRelogioRes.data as Product;

      const prodBoneRes = engine.doPost({
        action: 'createProduct',
        token,
        product: {
          categoriaId: catVestuarioId,
          nome: 'Boné Trucker Vintage',
          slug: 'bone-trucker-vintage',
          descricao: 'Boné com aba curva e ajuste snapback.',
          preco: 60.0,
          precoPromocional: 50.0,
          imagens: ['https://cdn.example.com/bone.jpg'],
          variacoes: [{ tipo: 'Cor', opcoes: ['Preto', 'Cinza'] }],
          estoque: 15,
          ativo: true,
        },
      });
      prodBone = prodBoneRes.data as Product;
    });

    it('Etapa 1 a 5: Resolve domínio, carrega loja, categorias e produtos ativos', () => {
      // 1. Acessa domínio
      const rawDomain = 'loja-exemplo.com.br';
      // 2. Resolve tenant
      const tenant = getTenantByHostname(rawDomain);
      expect(tenant).not.toBeNull();
      expect(tenant?.tenantId).toBe('loja_exemplo');

      // 3. Carrega payload consolidado da loja
      const initRes = engine.doGet({ action: 'all' });
      expect(initRes.success).toBe(true);
      const initData = initRes.data as {
        store: { store_name: string; whatsapp: string };
        categories: Category[];
        products: Product[];
      };

      expect(initData.store.store_name).toBe('Minha Loja Digital');
      expect(initData.store.whatsapp).toBe('5511999999999');

      // 4. Categorias ativas
      expect(initData.categories.length).toBeGreaterThanOrEqual(2);
      const categoryNames = initData.categories.map((c) => c.nome);
      expect(categoryNames).toContain('Vestuário');
      expect(categoryNames).toContain('Acessórios');

      // 5. Produtos ativos
      expect(initData.products.length).toBe(3);
      const prodNames = initData.products.map((p) => p.nome);
      expect(prodNames).toContain('Camisa Polo Confort');
      expect(prodNames).toContain('Relógio Esportivo Sport');
      expect(prodNames).toContain('Boné Trucker Vintage');
    });

    it('Etapa 6 e 7: Simula pesquisa textual e filtro por categoria', () => {
      const allProducts = (engine.doGet({ action: 'products' }).data as Product[]);

      // Busca por "Polo"
      const searchPolo = allProducts.filter(
        (p) =>
          p.nome.toLowerCase().includes('polo') ||
          p.descricao.toLowerCase().includes('polo')
      );
      expect(searchPolo).toHaveLength(1);
      expect(searchPolo[0]?.nome).toBe('Camisa Polo Confort');

      // Busca por "resistente" (na descrição)
      const searchDesc = allProducts.filter(
        (p) =>
          p.nome.toLowerCase().includes('resistente') ||
          p.descricao.toLowerCase().includes('resistente')
      );
      expect(searchDesc).toHaveLength(1);
      expect(searchDesc[0]?.nome).toBe('Relógio Esportivo Sport');

      // Filtro por categoria "Vestuário"
      const filterVestuario = allProducts.filter(
        (p) => p.categoriaId === catVestuarioId
      );
      expect(filterVestuario).toHaveLength(2);

      // Filtro por categoria "Acessórios"
      const filterAcessorios = allProducts.filter(
        (p) => p.categoriaId === catAcessoriosId
      );
      expect(filterAcessorios).toHaveLength(1);
      expect(filterAcessorios[0]?.nome).toBe('Relógio Esportivo Sport');
    });

    it('Etapa 8 a 15: Seleciona variações, adiciona à sacola, altera quantidade, verifica totais e gera WhatsApp', () => {
      // 8. Abre produto com variações
      expect(prodPolo.variacoes).toHaveLength(2);

      // 9. Seleciona variações obrigatórias
      const selectedPoloVars = { Tamanho: 'M', Cor: 'Azul' };

      // Validação: todas as variações definidas no produto foram selecionadas
      const requiredTypes = prodPolo.variacoes.map((v) => v.tipo);
      const allSelected = requiredTypes.every((t) => Boolean(selectedPoloVars[t as keyof typeof selectedPoloVars]));
      expect(allSelected).toBe(true);

      // 10. Adiciona à sacola (2 unidades da Polo com desconto de 80.00)
      const poloSubtotal = calculateSubtotal(
        prodPolo.preco,
        2,
        prodPolo.precoPromocional
      );
      expect(poloSubtotal).toBe(160.0);

      const cartItems: CartItem[] = [
        {
          productId: prodPolo.id,
          name: prodPolo.nome,
          image: prodPolo.imagens[0] || '',
          unitPrice: prodPolo.preco,
          promotionalPrice: prodPolo.precoPromocional,
          quantity: 2,
          variations: selectedPoloVars,
          subtotal: poloSubtotal,
        },
      ];

      // 11. Altera quantidade da Polo de 2 para 3 unidades
      cartItems[0]!.quantity = 3;
      cartItems[0]!.subtotal = calculateSubtotal(
        prodPolo.preco,
        3,
        prodPolo.precoPromocional
      );
      expect(cartItems[0]!.subtotal).toBe(240.0);

      // Adiciona também 1 unidade do Relógio (sem promoção: 250.00)
      const relogioSubtotal = calculateSubtotal(
        prodRelogio.preco,
        1,
        prodRelogio.precoPromocional
      );
      cartItems.push({
        productId: prodRelogio.id,
        name: prodRelogio.nome,
        image: prodRelogio.imagens[0] || '',
        unitPrice: prodRelogio.preco,
        promotionalPrice: prodRelogio.precoPromocional,
        quantity: 1,
        variations: {},
        subtotal: relogioSubtotal,
      });

      // 12. Abre sacola e verifica contagem de itens
      expect(cartItems).toHaveLength(2);
      const totalUnits = cartItems.reduce((acc, itm) => acc + itm.quantity, 0);
      expect(totalUnits).toBe(4);

      // 13. Verifica subtotal de cada item
      expect(cartItems[0]!.subtotal).toBe(240.0);
      expect(cartItems[1]!.subtotal).toBe(250.0);

      // 14. Verifica total geral consolidado
      const cartTotal = calculateCartTotal(cartItems);
      expect(cartTotal).toBe(490.0);

      // 15. Gera pedido no WhatsApp
      const storeRes = engine.doGet({ action: 'store' });
      const storeData = storeRes.data as { store_name: string; whatsapp: string; currency: string };

      const message = buildWhatsAppMessage(storeData, cartItems);
      const whatsappUrl = buildWhatsAppUrl(storeData, cartItems);

      // Verificações da mensagem
      expect(message).toContain('🛍️ *NOVO PEDIDO — MINHA LOJA DIGITAL*');
      expect(message).toContain('*3x Camisa Polo Confort*');
      expect(message).toContain('_Tamanho: M | Cor: Azul_');
      expect(message).toContain('~R$ 100,00~ por R$ 80,00');
      expect(message).toContain('Subtotal: *R$ 240,00*');
      expect(message).toContain('*1x Relógio Esportivo Sport*');
      expect(message).toContain('Subtotal: *R$ 250,00*');
      expect(message).toContain('💰 *TOTAL DO PEDIDO: R$ 490,00*');
      expect(message).toContain('📦 *Quantidade total de itens:* 4');

      // Verificações da URL wa.me
      expect(whatsappUrl).toContain('https://wa.me/5511999999999?text=');
      // Garante encoding seguro: nenhum caractere sensível sem codificação
      expect(whatsappUrl).not.toContain('\n');
      expect(whatsappUrl).not.toContain(' ');

      // Ao decodificar a URL, o texto deve ser perfeitamente idêntico à mensagem gerada
      const urlTextParam = whatsappUrl.split('?text=')[1]!;
      const decodedMessage = decodeURIComponent(urlTextParam);
      expect(decodedMessage).toBe(message);
    });
  });

  // ============================================================
  // FLUXO 2 — LOJISTA (Ciclo Completo Administrativo)
  // ============================================================
  describe('FLUXO 2 — LOJISTA: Autenticação, CRUD, Soft Delete e Configurações', () => {
    let engine: BackendEngine;

    beforeEach(() => {
      engine = new BackendEngine({
        store_id: 'loja_exemplo',
        store_name: 'Moda Original',
        whatsapp: '5511911111111',
      });
    });

    it('Ciclo completo: login, criação, edição, soft delete, alteração de WhatsApp e impacto na vitrine', () => {
      // 1. Acesso ao /admin e Login incorreto
      const badLogin = engine.doPost({ action: 'login', password: 'senha_errada' });
      expect(badLogin.success).toBe(false);
      expect(badLogin.error?.code).toBe('INVALID_CREDENTIALS');

      // 2. Login correto
      const goodLogin = engine.doPost({ action: 'login', password: 'admin123' });
      expect(goodLogin.success).toBe(true);
      const token = (goodLogin.data as { token: string }).token;
      expect(token).toBeTruthy();

      // 3. Dashboard inicial (verifica categorias existentes)
      const initialCats = (engine.doGet({ action: 'categories' }).data as Category[]);
      expect(initialCats.length).toBeGreaterThanOrEqual(1);

      // 4. Criar Categoria "Coleção Verão"
      const newCatRes = engine.doPost({
        action: 'createCategory',
        token,
        category: { nome: 'Coleção Verão', ordem: 2, ativo: true },
      });
      expect(newCatRes.success).toBe(true);
      const newCat = newCatRes.data as Category;
      expect(newCat.slug).toBe('colecao-verao');

      // 5. Criar Produto com Variações e Imagens
      const newProdRes = engine.doPost({
        action: 'createProduct',
        token,
        product: {
          categoriaId: newCat.id,
          nome: 'Vestido Estampado Tropical',
          slug: 'vestido-estampado-tropical',
          descricao: 'Vestido longo em viscose premium.',
          preco: 199.90,
          precoPromocional: 169.90,
          imagens: ['https://cdn.example.com/vestido1.jpg', 'https://cdn.example.com/vestido2.jpg'],
          variacoes: [
            { tipo: 'Tamanho', opcoes: ['P', 'M', 'G'] },
            { tipo: 'Estampa', opcoes: ['Floral', 'Folhagem'] },
          ],
          estoque: 12,
          ativo: true,
        },
      });
      expect(newProdRes.success).toBe(true);
      const newProd = newProdRes.data as Product;
      expect(newProd.id).toBeTruthy();
      expect(newProd.variacoes).toHaveLength(2);
      expect(newProd.imagens).toHaveLength(2);

      // 6. Confirma que o novo produto aparece imediatamente na vitrine pública
      const publicProdsBefore = (engine.doGet({ action: 'products' }).data as Product[]);
      const foundInVitrine = publicProdsBefore.find((p) => p.id === newProd.id);
      expect(foundInVitrine).toBeDefined();
      expect(foundInVitrine?.nome).toBe('Vestido Estampado Tropical');
      expect(foundInVitrine?.preco).toBe(199.90);

      // 7. Editar Produto (altera preço e estoque)
      const updateProdRes = engine.doPost({
        action: 'updateProduct',
        token,
        product: {
          id: newProd.id,
          preco: 189.90,
          estoque: 8,
        },
      });
      expect(updateProdRes.success).toBe(true);
      const updatedProd = updateProdRes.data as Product;
      expect(updatedProd.preco).toBe(189.90);
      expect(updatedProd.estoque).toBe(8);

      // 8. Desativar produto via Soft Delete (deleteProduct)
      const deleteProdRes = engine.doPost({
        action: 'deleteProduct',
        token,
        id: newProd.id,
      });
      expect(deleteProdRes.success).toBe(true);
      expect((deleteProdRes.data as { deleted: boolean }).deleted).toBe(true);

      // 9. Confirma que o produto foi removido da vitrine pública
      const publicProdsAfter = (engine.doGet({ action: 'products' }).data as Product[]);
      const deletedInVitrine = publicProdsAfter.find((p) => p.id === newProd.id);
      expect(deletedInVitrine).toBeUndefined();

      // 10. Atualizar Configuração da Loja (Nome e WhatsApp)
      const saveConfigRes = engine.doPost({
        action: 'saveConfig',
        token,
        config: {
          store_name: 'Moda Verão Atualizada',
          whatsapp: '5511988887777',
          primary_color: '#8b5cf6',
        },
      });
      expect(saveConfigRes.success).toBe(true);

      // 11. Segurança: tentativa de alterar campos imutáveis é rejeitada
      const attackConfig = engine.doPost({
        action: 'saveConfig',
        token,
        config: {
          store_id: 'hacker_store',
          api_token: 'tok_hacked',
        },
      });
      expect(attackConfig.success).toBe(false);
      expect(attackConfig.error?.code).toBe('FORBIDDEN_MODIFICATION');

      // 12. Impacto na Vitrine: nova configuração refletida para os clientes
      const publicStore = (engine.doGet({ action: 'store' }).data as {
        store_name: string;
        whatsapp: string;
        primary_color: string;
      });
      expect(publicStore.store_name).toBe('Moda Verão Atualizada');
      expect(publicStore.whatsapp).toBe('5511988887777');
      expect(publicStore.primary_color).toBe('#8b5cf6');
    });
  });

  // ============================================================
  // FLUXO 3 — MULTI-TENANT (Isolamento Estrito)
  // ============================================================
  describe('FLUXO 3 — MULTI-TENANT: Isolamento Estrito Entre Lojas', () => {
    it('Garante isolamento absoluto de dados entre Tenant A e Tenant B', () => {
      // Configura dois engines isolados
      const engineA = getLocalEngine('loja_a');
      const engineB = getLocalEngine('loja_b');

      // Login em cada tenant
      const tokenA = (engineA.doPost({ action: 'login', password: 'admin123' }).data as { token: string }).token;
      const tokenB = (engineB.doPost({ action: 'login', password: 'admin123' }).data as { token: string }).token;

      // Tenant A cria categoria "Boutique Feminina" e produto "Vestido de Festa"
      const catARes = engineA.doPost({
        action: 'createCategory',
        token: tokenA,
        category: { nome: 'Boutique Feminina', ordem: 1, ativo: true },
      });
      const catAId = (catARes.data as Category).id;

      engineA.doPost({
        action: 'createProduct',
        token: tokenA,
        product: {
          categoriaId: catAId,
          nome: 'Vestido Seda Pura',
          slug: 'vestido-seda-pura',
          descricao: 'Vestido exclusivo de seda pura francesa.',
          preco: 590.0,
          precoPromocional: null,
          estoque: 5,
          ativo: true,
        },
      });

      // Tenant B cria categoria "Equipamentos de Treino" e produto "Kettlebell 16kg"
      const catBRes = engineB.doPost({
        action: 'createCategory',
        token: tokenB,
        category: { nome: 'Equipamentos de Treino', ordem: 1, ativo: true },
      });
      const catBId = (catBRes.data as Category).id;

      engineB.doPost({
        action: 'createProduct',
        token: tokenB,
        product: {
          categoriaId: catBId,
          nome: 'Kettlebell 16kg Ferro Fundido',
          slug: 'kettlebell-16kg-ferro-fundido',
          descricao: 'Kettlebell para treino funcional e crossfit.',
          preco: 180.0,
          precoPromocional: 159.90,
          estoque: 20,
          ativo: true,
        },
      });

      // CONSULTA VITRINE TENANT A
      const prodsVitrineA = (engineA.doGet({ action: 'products' }).data as Product[]);
      const namesA = prodsVitrineA.map((p) => p.nome);

      expect(namesA).toContain('Vestido Seda Pura');
      // NUNCA deve conter produto do Tenant B
      expect(namesA).not.toContain('Kettlebell 16kg Ferro Fundido');

      // CONSULTA VITRINE TENANT B
      const prodsVitrineB = (engineB.doGet({ action: 'products' }).data as Product[]);
      const namesB = prodsVitrineB.map((p) => p.nome);

      expect(namesB).toContain('Kettlebell 16kg Ferro Fundido');
      // NUNCA deve conter produto do Tenant A
      expect(namesB).not.toContain('Vestido Seda Pura');

      // VERIFICA CONFIGURAÇÕES ISOLADAS
      const storeA = (engineA.doGet({ action: 'store' }).data as { store_id: string; store_name: string; whatsapp: string });
      const storeB = (engineB.doGet({ action: 'store' }).data as { store_id: string; store_name: string; whatsapp: string });

      expect(storeA.store_id).toBe('loja_a');
      expect(storeB.store_id).toBe('loja_b');
      expect(storeA.whatsapp).not.toBe(storeB.whatsapp);
      expect(storeA.store_name).not.toBe(storeB.store_name);
    });

    it('Rejeita hosts não cadastrados e previne spoofing de domínios', () => {
      const mockRegistry: TenantRegistry = {
        'loja-a.com.br': { tenantId: 'loja_a', apiUrl: 'https://gas/loja_a' },
        'loja-b.com.br': { tenantId: 'loja_b', apiUrl: 'https://gas/loja_b' },
      };

      // Resoluções válidas
      expect(getTenantByHostname('loja-a.com.br', mockRegistry)?.tenantId).toBe('loja_a');
      expect(getTenantByHostname('www.loja-b.com.br:8080', mockRegistry)?.tenantId).toBe('loja_b');

      // Tentativas de invasão / spoofing
      expect(getTenantByHostname('hacker.com', mockRegistry)).toBeNull();
      expect(getTenantByHostname('loja-a.com.br.attacker.com', mockRegistry)).toBeNull();
      expect(isValidTenant('loja_inexistente', mockRegistry)).toBe(false);
    });
  });

  // ============================================================
  // FLUXO 4 — MOTOR DE WHATSAPP (Carrinho Real, Cálculos e Encoding)
  // ============================================================
  describe('FLUXO 4 — MOTOR DE WHATSAPP: Cálculos Precisos, Variações e Encoding', () => {
    it('Calcula subtotais com precisão monetária e formata carrinho real', () => {
      // 1. Item com preço promocional
      const subtotal1 = calculateSubtotal(120.0, 2, 99.90);
      expect(subtotal1).toBe(199.80);

      // 2. Item com preço regular
      const subtotal2 = calculateSubtotal(49.50, 3, null);
      expect(subtotal2).toBe(148.50);

      // 3. Item unitário simples
      const subtotal3 = calculateSubtotal(15.0, 1, undefined);
      expect(subtotal3).toBe(15.0);

      const items: CartItem[] = [
        {
          productId: 'prod_1',
          name: 'Camisa Linho Nobre',
          image: '',
          unitPrice: 120.0,
          promotionalPrice: 99.90,
          quantity: 2,
          variations: { Tamanho: 'G', Cor: 'Azul Petróleo' },
          subtotal: subtotal1,
        },
        {
          productId: 'prod_2',
          name: 'Calça Chino Casual',
          image: '',
          unitPrice: 49.50,
          promotionalPrice: null,
          quantity: 3,
          variations: { Tamanho: '42' },
          subtotal: subtotal2,
        },
        {
          productId: 'prod_3',
          name: 'Meias Algodão Par',
          image: '',
          unitPrice: 15.0,
          quantity: 1,
          variations: {},
          subtotal: subtotal3,
        },
      ];

      // Total geral: 199.80 + 148.50 + 15.00 = 363.30
      const total = calculateCartTotal(items);
      expect(total).toBe(363.30);

      // Validação de formatações individuais
      const formattedItem1 = formatCartItem(items[0]!, 1);
      expect(formattedItem1).toContain('1. *2x Camisa Linho Nobre*');
      expect(formattedItem1).toContain('_Tamanho: G | Cor: Azul Petróleo_');
      expect(formattedItem1).toContain('~R$ 120,00~ por R$ 99,90');
      expect(formattedItem1).toContain('Subtotal: *R$ 199,80*');

      const formattedItem3 = formatCartItem(items[2]!, 3);
      expect(formattedItem3).toContain('3. *1x Meias Algodão Par*');
      expect(formattedItem3).toContain('Subtotal: *R$ 15,00*');
      // Não deve ter variações nem preço riscado
      expect(formattedItem3).not.toContain('~');
    });

    it('Sanitiza números de telefone e valida URL wa.me com encodeURIComponent', () => {
      // Testes de sanitização de telefone
      expect(normalizePhoneNumber('+55 (11) 98888-7777')).toBe('5511988887777');
      expect(normalizePhoneNumber('55 21 99999-0000')).toBe('5521999990000');

      // Telefones inválidos disparam erro
      expect(() => normalizePhoneNumber('123')).toThrow('Número de WhatsApp inválido');
      expect(() => normalizePhoneNumber('')).toThrow('Número de WhatsApp não fornecido');

      const store = {
        store_name: 'Ótica & Relojoaria Visão',
        whatsapp: '+55 (11) 97777-6666',
        currency: 'BRL',
      };

      const cartItem: CartItem = {
        productId: 'prod_oculos',
        name: 'Óculos de Sol Polarizado — Edição Especial & Limitada',
        image: '',
        unitPrice: 350.0,
        quantity: 1,
        variations: { Armação: 'Dourada / Preto' },
        subtotal: 350.0,
      };

      const url = buildWhatsAppUrl(store, [cartItem]);

      // Valida domínio base
      expect(url.startsWith('https://wa.me/5511977776666?text=')).toBe(true);

      // Garante ausência de caracteres não codificados
      expect(url).not.toContain(' ');
      expect(url).not.toContain('\n');
      expect(url).not.toContain('—');

      // Decodificação exata sem corrupção de acentos ou caracteres especiais
      const encodedQuery = url.split('?text=')[1]!;
      const decoded = decodeURIComponent(encodedQuery);
      expect(decoded).toContain('ÓTICA & RELOJOARIA VISÃO');
      expect(decoded).toContain('Óculos de Sol Polarizado — Edição Especial & Limitada');
      expect(decoded).toContain('Armação: Dourada / Preto');
      expect(decoded).toContain('TOTAL DO PEDIDO: R$ 350,00');
    });
  });

  // ============================================================
  // CONTRATOS, TRATAMENTO DE ERROS E SEGURANÇA
  // ============================================================
  describe('CONTRATOS & SEGURANÇA: Respeito Estrito à Especificação e Tratamento de Erros', () => {
    let engine: BackendEngine;
    let token: string;

    beforeEach(() => {
      engine = new BackendEngine();
      const loginRes = engine.doPost({ action: 'login', password: 'admin123' });
      token = (loginRes.data as { token: string }).token;
    });

    it('NUNCA expõe senhas ou tokens em endpoints públicos (GET store / GET all)', () => {
      const storeRes = engine.doGet({ action: 'store' });
      const storeData = storeRes.data as Record<string, unknown>;
      expect(storeData['admin_password_hash']).toBeUndefined();
      expect(storeData['api_token']).toBeUndefined();

      const allRes = engine.doGet({ action: 'all' });
      const allStore = (allRes.data as { store: Record<string, unknown> }).store;
      expect(allStore['admin_password_hash']).toBeUndefined();
      expect(allStore['api_token']).toBeUndefined();
    });

    it('Rejeita mutações sem token ou com token inválido com erro UNAUTHORIZED', () => {
      const resNoToken = engine.doPost({
        action: 'createCategory',
        category: { nome: 'Teste Inválido' },
      });
      expect(resNoToken.success).toBe(false);
      expect(resNoToken.error?.code).toBe('UNAUTHORIZED');

      const resBadToken = engine.doPost({
        action: 'createCategory',
        token: 'token_falso_hacker',
        category: { nome: 'Teste Inválido' },
      });
      expect(resBadToken.success).toBe(false);
      expect(resBadToken.error?.code).toBe('UNAUTHORIZED');
    });

    it('Rejeita criação de produto com categoria inexistente ou inativa', () => {
      const res = engine.doPost({
        action: 'createProduct',
        token,
        product: {
          categoriaId: 'cat_inexistente_999',
          nome: 'Produto Órfão',
          slug: 'produto-orfao',
          descricao: 'Sem categoria válida.',
          preco: 50.0,
          estoque: 10,
        },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('NOT_FOUND');
    });

    it('Valida integridade de regras de negócio: preço promocional >= preço normal é rejeitado', () => {
      const catRes = engine.doPost({
        action: 'createCategory',
        token,
        category: { nome: 'Geral', ordem: 1 },
      });
      const catId = (catRes.data as Category).id;

      const badPriceRes = engine.doPost({
        action: 'createProduct',
        token,
        product: {
          categoriaId: catId,
          nome: 'Preço Inválido',
          slug: 'preco-invalido',
          descricao: 'Desc',
          preco: 100.0,
          precoPromocional: 120.0, // Erro: promoção mais cara que o original
          estoque: 10,
        },
      });
      expect(badPriceRes.success).toBe(false);
      expect(badPriceRes.error?.code).toBe('VALIDATION_ERROR');
    });

    it('Estrutura de resposta uniforme: todas as respostas seguem APIResponse<T>', () => {
      // Sucesso
      const okRes = engine.doGet({ action: 'store' });
      expect(okRes).toHaveProperty('success', true);
      expect(okRes).toHaveProperty('data');
      expect(okRes).toHaveProperty('error', null);

      // Erro
      const errRes = engine.doGet({ action: 'acao_completamente_desconhecida' });
      expect(errRes).toHaveProperty('success', false);
      expect(errRes).toHaveProperty('data', null);
      expect(errRes).toHaveProperty('error');
      expect(errRes.error).toHaveProperty('code');
      expect(errRes.error).toHaveProperty('message');
    });
  });
});
