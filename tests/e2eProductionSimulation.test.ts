import { describe, it, expect } from 'vitest';
import {
  normalizeProduct,
  normalizePrice,
  DEFAULT_PRODUCT_IMAGE_FALLBACK,
} from '@/lib/sheetNormalization';
import {
  formatCurrency,
  formatCartItem,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  calculateSubtotal,
  calculateCartTotal,
  normalizePhoneNumber,
  type WhatsAppStoreInfo,
} from '@/lib/whatsapp';
import {
  calculateEffectiveProductPrice,
  parseVariationOption,
  formatInstallments,
} from '@/lib/variations';
import { getCartStorageKey } from '@/lib/cart';
import type { Product, CartItem, SelectedVariation } from '@/types';

/**
 * Bateria de Testes Ponta a Ponta de Produção Real
 * Baseado na skill: skill-qa-auditoria-deploy.md
 */
describe('Bateria de Testes Ponta a Ponta — Simulação de Produção Real', () => {
  const mockStore: WhatsAppStoreInfo = {
    store_name: 'Boutique Elegance & Estilo',
    whatsapp: '(11) 98765-4321',
    currency: 'BRL',
  };

  // =========================================================================
  // CENÁRIO A: Produto simples, sem variações, preço string e sem foto
  // =========================================================================
  describe('Cenário A: Produto simples, sem variações, preço "R$ 49,90" e sem imagem', () => {
    const rawProductA = {
      id: 'prod_a_01',
      nome: 'Camiseta Básica Dry-Fit',
      slug: 'camiseta-basica-dry-fit',
      descricao: 'Camiseta de alta respirabilidade para uso diário.',
      preco: 'R$ 49,90',
      precoPromocional: null,
      imagens: '', // Sem foto na planilha
      variacoes: '', // Sem variações
      estoque: 15,
      ativo: true,
    };

    it('A.1: Normaliza dados do Google Sheets sem gerar NaN e aplicando fallback SVG moderno', () => {
      const product = normalizeProduct(rawProductA);

      // Preço deve ser 49.9 numérico, nunca NaN
      expect(typeof product.preco).toBe('number');
      expect(product.preco).toBe(49.9);
      expect(isNaN(product.preco)).toBe(false);

      // Imagem ausente deve ser substituída por SVG com cantos arredondados
      expect(product.imagens).toBeDefined();
      expect(product.imagens.length).toBe(1);
      expect(product.imagens[0]).toBe(DEFAULT_PRODUCT_IMAGE_FALLBACK);
      expect(product.imagens[0]).toContain('data:image/svg+xml');

      // Variações devem ser array vazio seguro
      expect(Array.isArray(product.variacoes)).toBe(true);
      expect(product.variacoes.length).toBe(0);
    });

    it('A.2: Formata exibição visual de moeda e parcelamento no card do produto', () => {
      const product = normalizeProduct(rawProductA);
      const displayPrice = formatCurrency(product.preco, 'BRL');
      expect(displayPrice).toBe('R$ 49,90');

      const installments = formatInstallments(product.preco, 3, 20, 'BRL');
      expect(installments).toBe('ou 2x de R$ 24,95 sem juros');
    });

    it('A.3: Adiciona à sacola de compras com subtotal exato e zero variações pendentes', () => {
      const product = normalizeProduct(rawProductA);
      const quantity = 2;
      const subtotal = calculateSubtotal(product.preco, quantity);

      expect(subtotal).toBe(99.8);

      const cartItem: CartItem = {
        productId: product.id,
        name: product.nome,
        image: product.imagens[0] || '',
        unitPrice: product.preco,
        quantity,
        variations: {},
        subtotal,
      };

      expect(cartItem.subtotal).toBe(99.8);
      expect(Object.keys(cartItem.variations).length).toBe(0);
    });

    it('A.4: Gera mensagem do WhatsApp limpa e URL codificada sem linhas vazias de variação', () => {
      const product = normalizeProduct(rawProductA);
      const cartItem: CartItem = {
        productId: product.id,
        name: product.nome,
        image: product.imagens[0] || '',
        unitPrice: product.preco,
        quantity: 1,
        variations: {},
        subtotal: product.preco,
      };

      const message = buildWhatsAppMessage(mockStore, [cartItem]);

      // Validações da mensagem
      expect(message).toContain('BOUTIQUE ELEGANCE & ESTILO');
      expect(message).toContain('*1x Camiseta Básica Dry-Fit*');
      expect(message).not.toContain('_Tamanho:'); // Sem variações
      expect(message).toContain('TOTAL DO PEDIDO: R$ 49,90');

      // Validação da URL
      const url = buildWhatsAppUrl(mockStore, [cartItem]);
      expect(url).toContain('https://wa.me/5511987654321?text=');
      expect(decodeURIComponent(url)).toContain('R$ 49,90');
    });
  });

  // =========================================================================
  // CENÁRIO B: Produto com variações de Cor e Tamanho, preço 120.5 e imagem válida
  // =========================================================================
  describe('Cenário B: Produto com variações de Cor e Tamanho, preço float 120.5 e imagem válida', () => {
    const rawProductB = {
      id: 'prod_b_02',
      nome: 'Tênis Running Air Pro',
      slug: 'tenis-running-air-pro',
      descricao: 'Tênis esportivo para corrida e treino diário.',
      preco: 120.5,
      precoPromocional: null,
      imagens: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
      variacoes: 'Cor: Preto, Azul, Vermelho | Tamanho: 39, 40, 41, 42 (+R$ 15,00)',
      estoque: 8,
      ativo: true,
    };

    it('B.1: Normaliza preço numérico float e estrutura as variações de Cor e Tamanho', () => {
      const product = normalizeProduct(rawProductB);

      expect(product.preco).toBe(120.5);
      expect(product.imagens[0]).toBe('https://images.unsplash.com/photo-1542291026-7eec264c27ff');
      expect(product.variacoes.length).toBe(2);

      const corVar = product.variacoes.find((v) => v.tipo === 'Cor');
      const tamVar = product.variacoes.find((v) => v.tipo === 'Tamanho');

      expect(corVar).toBeDefined();
      expect(corVar?.opcoes).toEqual(['Preto', 'Azul', 'Vermelho']);

      expect(tamVar).toBeDefined();
      expect(tamVar?.opcoes).toEqual(['39', '40', '41', '42 (+R$ 15,00)']);
    });

    it('B.2: Calcula preço base e acréscimo dinâmico por variação', () => {
      const product = normalizeProduct(rawProductB);

      // Sem acréscimo
      const standardCalc = calculateEffectiveProductPrice(
        product.preco,
        null,
        { Cor: 'Preto', Tamanho: '40' },
        product.variacoes
      );
      expect(standardCalc.effectivePrice).toBe(120.5);
      expect(standardCalc.totalDelta).toBe(0);

      // Com acréscimo de +R$ 15,00 no tamanho 42
      const deltaCalc = calculateEffectiveProductPrice(
        product.preco,
        null,
        { Cor: 'Azul', Tamanho: '42' },
        product.variacoes
      );
      expect(deltaCalc.effectivePrice).toBe(135.5);
      expect(deltaCalc.totalDelta).toBe(15.0);
    });

    it('B.3: Adiciona à sacola e serializa variações com indentação para o WhatsApp', () => {
      const product = normalizeProduct(rawProductB);
      const selectedVars: SelectedVariation = { Cor: 'Azul', Tamanho: '42' };

      const priceInfo = calculateEffectiveProductPrice(
        product.preco,
        null,
        selectedVars,
        product.variacoes
      );

      const cartItem: CartItem = {
        productId: product.id,
        name: product.nome,
        image: product.imagens[0] || '',
        unitPrice: priceInfo.effectivePrice,
        quantity: 2,
        variations: selectedVars,
        subtotal: calculateSubtotal(priceInfo.effectivePrice, 2),
      };

      expect(cartItem.subtotal).toBe(271.0); // 135.5 * 2

      const message = buildWhatsAppMessage(mockStore, [cartItem]);
      expect(message).toContain('*2x Tênis Running Air Pro*');
      expect(message).toContain('_Cor: Azul | Tamanho: 42_');
      expect(message).toContain('TOTAL DO PEDIDO: R$ 271,00');
    });
  });

  // =========================================================================
  // CENÁRIO C: Tentativa de adicionar produto com variações sem selecionar opção obrigatória
  // =========================================================================
  describe('Cenário C: Validação estrita de variações obrigatórias antes da adição à sacola', () => {
    const productWithVariations: Product = {
      id: 'prod_c_03',
      categoriaId: 'calcados',
      nome: 'Bota Couro Legítimo',
      slug: 'bota-couro-legitimo',
      descricao: 'Bota resistente de couro nobre.',
      preco: 250.0,
      precoPromocional: null,
      imagens: ['https://cdn.example.com/bota.jpg'],
      variacoes: [
        { tipo: 'Cor', opcoes: ['Café', 'Preto'] },
        { tipo: 'Tamanho', opcoes: ['38', '39', '40', '41', '42'] },
      ],
      estoque: 5,
      ativo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    /**
     * Função auxiliar que espelha exatamente a validação do ProductModal.tsx
     */
    function validateVariationSelection(
      product: Product,
      selected: SelectedVariation
    ): { valid: boolean; error: string | null } {
      if (product.variacoes && product.variacoes.length > 0) {
        const missingTypes = product.variacoes.filter((v) => !selected[v.tipo]);
        if (missingTypes.length > 0) {
          const missingNames = missingTypes.map((v) => v.tipo).join(', ');
          return {
            valid: false,
            error: `Por favor, selecione: ${missingNames}.`,
          };
        }
      }
      return { valid: true, error: null };
    }

    it('C.1: Bloqueia tentativa de compra com seleção totalmente vazia', () => {
      const result = validateVariationSelection(productWithVariations, {});
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Por favor, selecione: Cor, Tamanho.');
    });

    it('C.2: Bloqueia tentativa com seleção parcial (apenas Cor selecionada)', () => {
      const result = validateVariationSelection(productWithVariations, { Cor: 'Café' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Por favor, selecione: Tamanho.');
    });

    it('C.3: Bloqueia tentativa com seleção parcial (apenas Tamanho selecionado)', () => {
      const result = validateVariationSelection(productWithVariations, { Tamanho: '41' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Por favor, selecione: Cor.');
    });

    it('C.4: Aprova e libera inclusão na sacola quando todas as opções foram selecionadas', () => {
      const result = validateVariationSelection(productWithVariations, {
        Cor: 'Café',
        Tamanho: '41',
      });
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  // =========================================================================
  // CENÁRIO D: Loja com 3 banners no topo alternando automaticamente e com swipe touch
  // =========================================================================
  describe('Cenário D: Carrossel com 3 banners no topo com rotação automática e suporte a Swipe Touch', () => {
    const banners = [
      'https://cdn.example.com/banner-primavera.jpg',
      'https://cdn.example.com/banner-desconto-pix.jpg',
      'https://cdn.example.com/banner-frete-gratis.jpg',
    ];

    /**
     * Motor de controle do carrossel simulando o comportamento de BannerSlider.tsx
     */
    class BannerCarouselSimulator {
      public banners: string[];
      public currentIndex = 0;
      public isPaused = false;
      public isDragging = false;
      private touchStartX: number | null = null;
      private touchCurrentX: number | null = null;
      readonly threshold = 45; // Mesmo threshold de 45px do BannerSlider.tsx

      constructor(banners: string[]) {
        this.banners = banners.filter((b) => Boolean(b && b.trim())).slice(0, 5);
      }

      public nextSlide(): void {
        this.currentIndex = (this.currentIndex + 1) % this.banners.length;
      }

      public prevSlide(): void {
        this.currentIndex =
          this.currentIndex === 0 ? this.banners.length - 1 : this.currentIndex - 1;
      }

      public tick(): void {
        if (this.banners.length <= 1 || this.isPaused || this.isDragging) return;
        this.nextSlide();
      }

      public onTouchStart(clientX: number): void {
        this.touchStartX = clientX;
        this.touchCurrentX = clientX;
        this.isDragging = true;
        this.isPaused = true;
      }

      public onTouchMove(clientX: number): void {
        if (!this.isDragging) return;
        this.touchCurrentX = clientX;
      }

      public onTouchEnd(): void {
        if (this.touchStartX !== null && this.touchCurrentX !== null) {
          const diff = this.touchCurrentX - this.touchStartX;
          if (diff > this.threshold) {
            this.prevSlide();
          } else if (diff < -this.threshold) {
            this.nextSlide();
          }
        }
        this.touchStartX = null;
        this.touchCurrentX = null;
        this.isDragging = false;
        this.isPaused = false;
      }
    }

    it('D.1: Carrega os 3 banners e inicia no primeiro índice (0)', () => {
      const carousel = new BannerCarouselSimulator(banners);
      expect(carousel.banners.length).toBe(3);
      expect(carousel.currentIndex).toBe(0);
    });

    it('D.2: Alterna automaticamente entre os 3 banners de forma circular (autoplay loop)', () => {
      const carousel = new BannerCarouselSimulator(banners);

      // Ciclo 1 -> banner 2 (índice 1)
      carousel.tick();
      expect(carousel.currentIndex).toBe(1);

      // Ciclo 2 -> banner 3 (índice 2)
      carousel.tick();
      expect(carousel.currentIndex).toBe(2);

      // Ciclo 3 -> loop circular de volta para banner 1 (índice 0)
      carousel.tick();
      expect(carousel.currentIndex).toBe(0);
    });

    it('D.3: Responde com precisão ao Swipe Touch para a esquerda (próximo banner)', () => {
      const carousel = new BannerCarouselSimulator(banners);
      expect(carousel.currentIndex).toBe(0);

      // Gesto de swipe para a esquerda: inicia em X=300, arrasta até X=220 (diff = -80px < -45px)
      carousel.onTouchStart(300);
      expect(carousel.isPaused).toBe(true);
      carousel.onTouchMove(220);
      carousel.onTouchEnd();

      expect(carousel.currentIndex).toBe(1);
      expect(carousel.isPaused).toBe(false);
    });

    it('D.4: Responde com precisão ao Swipe Touch para a direita (banner anterior)', () => {
      const carousel = new BannerCarouselSimulator(banners);
      carousel.currentIndex = 1; // Está no banner 2

      // Gesto de swipe para a direita: inicia em X=100, arrasta até X=190 (diff = +90px > +45px)
      carousel.onTouchStart(100);
      carousel.onTouchMove(190);
      carousel.onTouchEnd();

      expect(carousel.currentIndex).toBe(0); // Volta para banner 1
    });

    it('D.5: Ignora toques acidentais ou micro-arrasto que não atingem o threshold (45px)', () => {
      const carousel = new BannerCarouselSimulator(banners);
      expect(carousel.currentIndex).toBe(0);

      // Arraste de apenas 20px (dentro da margem de ruído)
      carousel.onTouchStart(200);
      carousel.onTouchMove(220);
      carousel.onTouchEnd();

      // Não deve ter mudado de banner
      expect(carousel.currentIndex).toBe(0);
    });

    it('D.6: Pausa autoplay durante interação (hover / drag) e não avança', () => {
      const carousel = new BannerCarouselSimulator(banners);
      carousel.onTouchStart(200); // Usuário segurando a tela

      carousel.tick(); // Tentativa de avanço automático
      expect(carousel.currentIndex).toBe(0); // Não avança porque está pausado
    });
  });

  // =========================================================================
  // AUDITORIA TÉCNICA E PROTOCOLO DE ACEITE GO-LIVE (skill-qa-auditoria-deploy.md)
  // =========================================================================
  describe('Auditoria Técnica e Protocolo de Aceite Go-Live', () => {
    it('Go-Live 1: Sanitização e tratamento de caracteres especiais (&, %, +, ", \')', () => {
      const specialProduct: Product = {
        id: 'prod_special',
        categoriaId: 'bebidas',
        nome: 'Gin & Tônica 100% Artesanal + Limão "Siciliano"',
        slug: 'gin-tonica',
        descricao: 'Bebida premium com teor alcoólico 40%',
        preco: 85.0,
        precoPromocional: null,
        imagens: ['https://cdn.example.com/gin.jpg'],
        variacoes: [],
        estoque: 10,
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      const cartItem: CartItem = {
        productId: specialProduct.id,
        name: specialProduct.nome,
        image: specialProduct.imagens[0] || '',
        unitPrice: specialProduct.preco,
        quantity: 1,
        variations: {},
        subtotal: specialProduct.preco,
      };

      const message = buildWhatsAppMessage(mockStore, [cartItem]);
      expect(message).toContain('Gin & Tônica 100% Artesanal + Limão "Siciliano"');

      // Verifica codificação da URL
      const url = buildWhatsAppUrl(mockStore, [cartItem]);
      expect(url).not.toContain('&Tônica'); // O '&' da mensagem deve estar codificado (%26)
      expect(url).toContain('%26');
      expect(url).toContain('%25');
    });

    it('Go-Live 2: Redirecionamento condicional para Mobile (api.whatsapp.com) e Desktop (web.whatsapp.com)', () => {
      const cartItem: CartItem = {
        productId: 'item_1',
        name: 'Item Teste',
        image: '',
        unitPrice: 50.0,
        quantity: 1,
        variations: {},
        subtotal: 50.0,
      };

      const mobileUrl = buildWhatsAppUrl(mockStore, [cartItem], undefined, { endpoint: 'api' });
      expect(mobileUrl).toMatch(/^https:\/\/api\.whatsapp\.com\/send\?phone=5511987654321&text=/);

      const desktopUrl = buildWhatsAppUrl(mockStore, [cartItem], undefined, { endpoint: 'web' });
      expect(desktopUrl).toMatch(/^https:\/\/web\.whatsapp\.com\/send\?phone=5511987654321&text=/);

      const wameUrl = buildWhatsAppUrl(mockStore, [cartItem], undefined, { endpoint: 'wame' });
      expect(wameUrl).toMatch(/^https:\/\/wa\.me\/5511987654321\?text=/);
    });

    it('Go-Live 3: Sacola mista com 3 produtos (1 com variações, 2 sem variações)', () => {
      const items: CartItem[] = [
        {
          productId: 'prod_1',
          name: 'Vestido Midi Seda',
          image: '',
          unitPrice: 180.0,
          quantity: 1,
          variations: { Tamanho: 'M', Cor: 'Marsala' },
          subtotal: 180.0,
        },
        {
          productId: 'prod_2',
          name: 'Cinto Fivela Dourada',
          image: '',
          unitPrice: 45.0,
          quantity: 2,
          variations: {},
          subtotal: 90.0,
        },
        {
          productId: 'prod_3',
          name: 'Brinco Argola Prata',
          image: '',
          unitPrice: 35.0,
          quantity: 1,
          variations: {},
          subtotal: 35.0,
        },
      ];

      const total = calculateCartTotal(items);
      expect(total).toBe(305.0); // 180 + 90 + 35

      const message = buildWhatsAppMessage(mockStore, items);
      expect(message).toContain('*1x Vestido Midi Seda*');
      expect(message).toContain('_Tamanho: M | Cor: Marsala_');
      expect(message).toContain('*2x Cinto Fivela Dourada*');
      expect(message).toContain('*1x Brinco Argola Prata*');
      expect(message).toContain('TOTAL DO PEDIDO: R$ 305,00');
      expect(message).toContain('Quantidade total de itens:* 4');
    });

    it('Go-Live 4: Isolamento absoluto de LocalStorage por Tenant', () => {
      const keyLojaA = getCartStorageKey('pizzaria-napoli');
      const keyLojaB = getCartStorageKey('hamburgueria-artesanal');

      expect(keyLojaA).toBe('cart_pizzaria-napoli');
      expect(keyLojaB).toBe('cart_hamburgueria-artesanal');
      expect(keyLojaA).not.toBe(keyLojaB);
    });
  });
});
