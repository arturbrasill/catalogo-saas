import { describe, it, expect } from 'vitest';
import {
  normalizePrice,
  normalizePromotionalPrice,
  normalizeImages,
  normalizeVariations,
  normalizeProduct,
  DEFAULT_PRODUCT_IMAGE_FALLBACK,
} from '@/lib/sheetNormalization';

describe('Sheet Normalization QA & Resilience', () => {
  describe('normalizePrice', () => {
    it('deve converter string com formato brasileiro R$ 19,90 para 19.9', () => {
      expect(normalizePrice('R$ 19,90')).toBe(19.9);
      expect(normalizePrice('R$ 0,00')).toBe(0);
      expect(normalizePrice('R$ 125,50')).toBe(125.5);
    });

    it('deve converter string com virgula simples 19,90 para 19.9', () => {
      expect(normalizePrice('19,90')).toBe(19.9);
      expect(normalizePrice('29,99')).toBe(29.99);
    });

    it('deve tratar separador de milhar brasileiro 1.499,90 para 1499.9', () => {
      expect(normalizePrice('1.499,90')).toBe(1499.9);
      expect(normalizePrice('R$ 2.500,00')).toBe(2500);
    });

    it('deve aceitar número float puro sem modificações indesejadas', () => {
      expect(normalizePrice(29.9)).toBe(29.9);
      expect(normalizePrice(150)).toBe(150);
    });

    it('NUNCA deve gerar NaN para strings vazias, nulos ou caracteres inválidos', () => {
      expect(normalizePrice('')).toBe(0);
      expect(normalizePrice(null)).toBe(0);
      expect(normalizePrice(undefined)).toBe(0);
      expect(normalizePrice('invalido')).toBe(0);
      expect(normalizePrice(NaN)).toBe(0);
      expect(normalizePrice(-50)).toBe(0);
    });
  });

  describe('normalizePromotionalPrice', () => {
    it('deve retornar preco promocional valido se menor que o preco normal', () => {
      expect(normalizePromotionalPrice('15,90', 25.0)).toBe(15.9);
      expect(normalizePromotionalPrice(19.9, 30.0)).toBe(19.9);
    });

    it('deve retornar null se o preco promocional for maior ou igual ao normal', () => {
      expect(normalizePromotionalPrice('35,00', 25.0)).toBe(null);
      expect(normalizePromotionalPrice(25.0, 25.0)).toBe(null);
    });

    it('deve retornar null para valores vazios ou zero', () => {
      expect(normalizePromotionalPrice('', 25.0)).toBe(null);
      expect(normalizePromotionalPrice(null, 25.0)).toBe(null);
      expect(normalizePromotionalPrice('0', 25.0)).toBe(null);
    });
  });

  describe('normalizeImages', () => {
    it('deve retornar fallback elegante se o campo de foto vier em branco ou nulo', () => {
      const emptyResult = normalizeImages('');
      expect(emptyResult.length).toBe(1);
      expect(emptyResult[0]).toBe(DEFAULT_PRODUCT_IMAGE_FALLBACK);

      const nullResult = normalizeImages(null);
      expect(nullResult.length).toBe(1);
      expect(nullResult[0]).toBe(DEFAULT_PRODUCT_IMAGE_FALLBACK);
    });

    it('deve manter URLs validas informadas em array', () => {
      const urls = ['https://exemplo.com/foto1.jpg', 'https://exemplo.com/foto2.jpg'];
      expect(normalizeImages(urls)).toEqual(urls);
    });

    it('deve suportar JSON string de imagens', () => {
      const jsonStr = JSON.stringify(['https://exemplo.com/item.png']);
      expect(normalizeImages(jsonStr)).toEqual(['https://exemplo.com/item.png']);
    });

    it('deve suportar URLs separadas por virgula ou quebra de linha', () => {
      const text = 'https://exemplo.com/1.jpg, https://exemplo.com/2.jpg';
      expect(normalizeImages(text)).toEqual([
        'https://exemplo.com/1.jpg',
        'https://exemplo.com/2.jpg',
      ]);
    });
  });

  describe('normalizeVariations', () => {
    it('deve fazer parse de JSON string de variacoes', () => {
      const json = JSON.stringify([{ tipo: 'Tamanho', opcoes: ['P', 'M', 'G'] }]);
      const res = normalizeVariations(json);
      expect(res).toEqual([{ tipo: 'Tamanho', opcoes: ['P', 'M', 'G'] }]);
    });

    it('deve fazer parse de texto formatado com barra e dois pontos', () => {
      const text = 'Tamanho: P, M, G | Cor: Preto, Azul';
      const res = normalizeVariations(text);
      expect(res).toEqual([
        { tipo: 'Tamanho', opcoes: ['P', 'M', 'G'] },
        { tipo: 'Cor', opcoes: ['Preto', 'Azul'] },
      ]);
    });

    it('deve fazer parse de texto simples com virgulas ou barras', () => {
      const text = 'P, M, G, GG';
      const res = normalizeVariations(text);
      expect(res).toEqual([{ tipo: 'Opção', opcoes: ['P', 'M', 'G', 'GG'] }]);
    });

    it('deve retornar array vazio para entradas nulas ou vazias', () => {
      expect(normalizeVariations('')).toEqual([]);
      expect(normalizeVariations(null)).toEqual([]);
      expect(normalizeVariations(undefined)).toEqual([]);
    });
  });

  describe('normalizeProduct', () => {
    it('deve blindar produtos com propriedades ausentes da planilha', () => {
      const raw = {
        nome: 'Camisa Polo',
        preco: 'R$ 79,90',
        precoPromocional: '59,90',
        imagens: '',
        variacoes: 'Tamanho: M, G',
      };
      const product = normalizeProduct(raw);
      expect(product.nome).toBe('Camisa Polo');
      expect(product.preco).toBe(79.9);
      expect(product.precoPromocional).toBe(59.9);
      expect(product.imagens[0]).toBe(DEFAULT_PRODUCT_IMAGE_FALLBACK);
      expect(product.variacoes).toEqual([{ tipo: 'Tamanho', opcoes: ['M', 'G'] }]);
      expect(product.ativo).toBe(true);
    });
  });
});
