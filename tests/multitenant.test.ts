import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/backend/route';
import { getLocalEngine, resetLocalEngines } from '../src/backend/engine';
import {
  normalizeHostname,
  getTenantByHostname,
  getAllTenants,
  isValidTenant,
} from '../src/lib/tenantResolver';
import type { TenantRegistry } from '../src/types';

describe('Módulo 5 — Multi-Tenant e Resolução de Domínios (src/lib/tenantResolver.ts)', () => {
  beforeEach(() => {
    resetLocalEngines();
  });
  const mockRegistry: TenantRegistry = {
    'loja-exemplo.com.br': {
      tenantId: 'loja_exemplo',
      apiUrl: 'https://script.google.com/macros/s/LOJA_EXEMPLO/exec',
      name: 'Loja Exemplo',
      domain: 'loja-exemplo.com.br',
    },
    'moda-style.com.br': {
      tenantId: 'moda_style',
      apiUrl: 'https://script.google.com/macros/s/MODA_STYLE/exec',
      name: 'Moda Style',
      domain: 'moda-style.com.br',
    },
    'loja-a.localhost': {
      tenantId: 'loja_a',
      apiUrl: 'https://script.google.com/macros/s/LOJA_A/exec',
      name: 'Loja A Local',
      domain: 'loja-a.localhost',
    },
    localhost: {
      tenantId: 'loja_exemplo',
      apiUrl: '',
      name: 'Loja Local Padrão',
      domain: 'localhost',
    },
  };

  // ============================================================
  // 1. NORMALIZAÇÃO DE HOSTNAME
  // ============================================================
  describe('normalizeHostname()', () => {
    it('deve remover portas (ex: :3000, :8080)', () => {
      expect(normalizeHostname('localhost:3000')).toBe('localhost');
      expect(normalizeHostname('loja-exemplo.com.br:8080')).toBe('loja-exemplo.com.br');
    });

    it('deve remover prefixo www. (política canônica)', () => {
      expect(normalizeHostname('www.loja-exemplo.com.br')).toBe('loja-exemplo.com.br');
      expect(normalizeHostname('www.moda-style.com.br:3000')).toBe('moda-style.com.br');
    });

    it('deve converter para letras minúsculas', () => {
      expect(normalizeHostname('LOJA-EXEMPLO.COM.BR')).toBe('loja-exemplo.com.br');
      expect(normalizeHostname('WwW.Moda-Style.Com.Br:3000')).toBe('moda-style.com.br');
    });

    it('deve lidar com hosts vazios, nulos ou indefinidos de forma segura', () => {
      expect(normalizeHostname('')).toBe('localhost');
      expect(normalizeHostname(null)).toBe('localhost');
      expect(normalizeHostname(undefined)).toBe('localhost');
    });
  });

  // ============================================================
  // 2. BUSCA E RESOLUÇÃO DE TENANTS
  // ============================================================
  describe('getTenantByHostname()', () => {
    it('deve resolver tenant válido cadastrado no registro', () => {
      const tenant = getTenantByHostname('loja-exemplo.com.br', mockRegistry);
      expect(tenant).toBeTruthy();
      expect(tenant?.tenantId).toBe('loja_exemplo');
      expect(tenant?.apiUrl).toContain('LOJA_EXEMPLO');
    });

    it('deve resolver tenant com prefixo www e porta informados', () => {
      const tenant = getTenantByHostname('www.moda-style.com.br:3000', mockRegistry);
      expect(tenant).toBeTruthy();
      expect(tenant?.tenantId).toBe('moda_style');
      expect(tenant?.apiUrl).toContain('MODA_STYLE');
    });

    it('deve resolver localhost e subdomínios locais para desenvolvimento', () => {
      const localTenant = getTenantByHostname('localhost:3000', mockRegistry);
      expect(localTenant).toBeTruthy();
      expect(localTenant?.tenantId).toBe('loja_exemplo');

      const subTenantA = getTenantByHostname('loja-a.localhost:3000', mockRegistry);
      expect(subTenantA).toBeTruthy();
      expect(subTenantA?.tenantId).toBe('loja_a');
      expect(subTenantA?.apiUrl).toContain('LOJA_A');
    });

    it('deve retornar null para domínios desconhecidos ou não cadastrados', () => {
      const unknown1 = getTenantByHostname('loja-fantasma-inexistente.com.br', mockRegistry);
      expect(unknown1).toBeNull();

      const unknown2 = getTenantByHostname('random-sub.localhost:3000', mockRegistry);
      expect(unknown2).toBeNull();
    });
  });

  // ============================================================
  // 3. SEGURANÇA & TENTATIVAS DE TENANT SPOOFING
  // ============================================================
  describe('Segurança & Prevenção contra Spoofing', () => {
    it('NUNCA deve permitir resolução de host arbitrário fornecido por invasor', () => {
      const maliciousHosts = [
        'attacker.com',
        'loja-exemplo.com.br.attacker.com',
        'fake-loja.com.br',
        'localhost.attacker.com',
      ];

      for (const host of maliciousHosts) {
        const result = getTenantByHostname(host, mockRegistry);
        expect(result).toBeNull();
      }
    });

    it('deve isolar completamente APIs entre tenants distintos', () => {
      const tenantExemplo = getTenantByHostname('loja-exemplo.com.br', mockRegistry);
      const tenantModa = getTenantByHostname('moda-style.com.br', mockRegistry);

      expect(tenantExemplo?.apiUrl).not.toBe(tenantModa?.apiUrl);
      expect(tenantExemplo?.tenantId).not.toBe(tenantModa?.tenantId);
    });

    it('isValidTenant() deve validar existências de tenantId no registro', () => {
      expect(isValidTenant('loja_exemplo', mockRegistry)).toBe(true);
      expect(isValidTenant('moda_style', mockRegistry)).toBe(true);
      expect(isValidTenant('hacker_id_invalido', mockRegistry)).toBe(false);
      expect(isValidTenant('', mockRegistry)).toBe(false);
    });
  });

  // ============================================================
  // 4. TESTE DE ISOLAMENTO DE DADOS ENTRE DOIS TENANTS FICTÍCIOS
  // ============================================================
  describe('Isolamento de Dados Ponta a Ponta entre Tenants Fictícios (loja_a vs loja_b)', () => {
    it('deve garantir que produtos e categorias de loja_a NUNCA apareçam no catálogo de loja_b', async () => {
      // 1. Popula tenant A (loja-a.localhost)
      const engineA = getLocalEngine('loja_a');
      const loginA = engineA.doPost({ action: 'login', password: 'admin123' });
      const tokenA = (loginA.data as any).token;
      const catResA = engineA.doPost({
        action: 'createCategory',
        token: tokenA,
        category: { nome: 'Calçados Alpha', ativo: true, ordem: 1 },
      });
      const catA = catResA.data as any;
      engineA.doPost({
        action: 'createProduct',
        token: tokenA,
        product: {
          categoriaId: catA.id,
          nome: 'Tênis Runner Alpha',
          preco: 299.9,
          estoque: 10,
          ativo: true,
        },
      });

      // 2. Popula tenant B (loja-b.localhost)
      const engineB = getLocalEngine('loja_b');
      const loginB = engineB.doPost({ action: 'login', password: 'admin123' });
      const tokenB = (loginB.data as any).token;
      const catResB = engineB.doPost({
        action: 'createCategory',
        token: tokenB,
        category: { nome: 'Esportes Beta', ativo: true, ordem: 1 },
      });
      const catB = catResB.data as any;
      engineB.doPost({
        action: 'createProduct',
        token: tokenB,
        product: {
          categoriaId: catB.id,
          nome: 'Camisa DryFit Beta',
          preco: 129.9,
          estoque: 25,
          ativo: true,
        },
      });

      // 3. Consulta Catálogo da Loja A via hostname
      const reqA = new NextRequest('http://loja-a.localhost:3000/api/backend?action=all', {
        headers: { host: 'loja-a.localhost:3000' },
      });
      const resA = await GET(reqA);
      const jsonA = await resA.json();

      expect(jsonA.success).toBe(true);
      expect(jsonA.data.store.store_id).toBe('loja_a');

      const productNamesA = jsonA.data.products.map((p: any) => p.nome);
      expect(productNamesA).toContain('Tênis Runner Alpha');
      expect(productNamesA).not.toContain('Camisa DryFit Beta');

      const categoryNamesA = jsonA.data.categories.map((c: any) => c.nome);
      expect(categoryNamesA).toContain('Calçados Alpha');
      expect(categoryNamesA).not.toContain('Esportes Beta');

      // 4. Consulta Catálogo da Loja B via hostname
      const reqB = new NextRequest('http://loja-b.localhost:3000/api/backend?action=all', {
        headers: { host: 'loja-b.localhost:3000' },
      });
      const resB = await GET(reqB);
      const jsonB = await resB.json();

      expect(jsonB.success).toBe(true);
      expect(jsonB.data.store.store_id).toBe('loja_b');

      const productNamesB = jsonB.data.products.map((p: any) => p.nome);
      expect(productNamesB).toContain('Camisa DryFit Beta');
      expect(productNamesB).not.toContain('Tênis Runner Alpha');

      const categoryNamesB = jsonB.data.categories.map((c: any) => c.nome);
      expect(categoryNamesB).toContain('Esportes Beta');
      expect(categoryNamesB).not.toContain('Calçados Alpha');
    });
  });
});
