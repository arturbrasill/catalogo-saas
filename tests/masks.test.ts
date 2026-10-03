import { describe, it, expect } from 'vitest';
import {
  maskCurrency,
  unmaskCurrency,
  maskWhatsApp,
  normalizeWhatsAppToApi,
  maskCpfCnpj,
  validateCpfCnpj,
} from '@/lib/masks';

describe('Mask Utilities', () => {
  describe('maskCurrency', () => {
    it('deve formatar número direto para BRL', () => {
      expect(maskCurrency(29.9)).toContain('29,90');
      expect(maskCurrency(1500)).toContain('1.500,00');
    });

    it('deve lidar com digitação progressiva de centavos', () => {
      expect(maskCurrency('2')).toContain('0,02');
      expect(maskCurrency('29')).toContain('0,29');
      expect(maskCurrency('299')).toContain('2,99');
      expect(maskCurrency('2990')).toContain('29,90');
      expect(maskCurrency('150000')).toContain('1.500,00');
    });

    it('deve retornar string vazia para entradas nulas ou vazias', () => {
      expect(maskCurrency('')).toBe('');
      expect(maskCurrency(null as any)).toBe('');
      expect(maskCurrency(undefined as any)).toBe('');
    });
  });

  describe('unmaskCurrency', () => {
    it('deve desmascarar valor formatado para número float', () => {
      expect(unmaskCurrency('R$ 29,90')).toBe(29.9);
      expect(unmaskCurrency('R$ 1.500,50')).toBe(1500.5);
      expect(unmaskCurrency('0,00')).toBe(0);
      expect(unmaskCurrency('')).toBe(0);
    });
  });

  describe('maskWhatsApp', () => {
    it('deve formatar números de 11 dígitos com DDD', () => {
      expect(maskWhatsApp('11999998888')).toBe('(11) 99999-8888');
    });

    it('deve formatar números de 10 dígitos (fixo/antigo)', () => {
      expect(maskWhatsApp('1144445555')).toBe('(11) 4444-5555');
    });

    it('deve remover DDI 55 se o usuário colar formato internacional', () => {
      expect(maskWhatsApp('5511999998888')).toBe('(11) 99999-8888');
    });

    it('deve formatar entradas incompletas progressivamente', () => {
      expect(maskWhatsApp('1')).toBe('(1');
      expect(maskWhatsApp('11')).toBe('(11');
      expect(maskWhatsApp('119')).toBe('(11) 9');
      expect(maskWhatsApp('119999')).toBe('(11) 9999');
    });
  });

  describe('normalizeWhatsAppToApi', () => {
    it('deve adicionar 55 para números com DDD', () => {
      expect(normalizeWhatsAppToApi('(11) 99999-8888')).toBe('5511999998888');
      expect(normalizeWhatsAppToApi('11999998888')).toBe('5511999998888');
    });

    it('deve manter 55 se já fornecido', () => {
      expect(normalizeWhatsAppToApi('5511999998888')).toBe('5511999998888');
    });

    it('deve retornar vazio se não houver dígitos', () => {
      expect(normalizeWhatsAppToApi('')).toBe('');
      expect(normalizeWhatsAppToApi('abc')).toBe('');
    });
  });

  describe('maskCpfCnpj', () => {
    it('deve aplicar máscara de CPF para até 11 dígitos', () => {
      expect(maskCpfCnpj('12345678909')).toBe('123.456.789-09');
      expect(maskCpfCnpj('123')).toBe('123');
      expect(maskCpfCnpj('1234')).toBe('123.4');
      expect(maskCpfCnpj('1234567')).toBe('123.456.7');
    });

    it('deve aplicar máscara de CNPJ para 14 dígitos', () => {
      expect(maskCpfCnpj('12345678000195')).toBe('12.345.678/0001-95');
    });

    it('deve retornar vazio para entrada vazia', () => {
      expect(maskCpfCnpj('')).toBe('');
    });
  });

  describe('validateCpfCnpj', () => {
    it('deve validar CPF com dígitos verificadores corretos', () => {
      // CPF gerado válido matematicamente: 52998224725
      expect(validateCpfCnpj('529.982.247-25')).toBe(true);
      expect(validateCpfCnpj('11111111111')).toBe(false);
      expect(validateCpfCnpj('12345678900')).toBe(false);
    });

    it('deve validar CNPJ com dígitos verificadores corretos', () => {
      // CNPJ Banco do Brasil: 00.000.000/0001-91
      expect(validateCpfCnpj('00.000.000/0001-91')).toBe(true);
      expect(validateCpfCnpj('00000000000000')).toBe(false);
      expect(validateCpfCnpj('12345678000100')).toBe(false);
    });
  });
});
