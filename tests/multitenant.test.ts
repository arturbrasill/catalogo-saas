import { describe, it, expect } from 'vitest';
import {
  normalizeHostname,
  getTenantByHostname,
  getAllTenants,
  isValidTenant,
} from '../src/lib/tenantResolver';
import type { TenantRegistry } from '../src/types';

describe('Módulo 5 — Multi-Tenant e Resolução de Domínios (src/lib/tenantResolver.ts)', () => {
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
});
