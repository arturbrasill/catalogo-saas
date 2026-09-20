/**
 * Suíte de Testes de Segurança e Blindagem contra Vulnerabilidades
 *
 * Validações implementadas após a Auditoria de Segurança:
 * - Prevenção contra SSRF e injeção de URL de API
 * - Prevenção contra Tenant Spoofing e vazamento entre tenants
 * - Bloqueio de esquemas maliciosos em imagens (javascript:)
 * - Validação estrita de cores e telefones em saveConfig
 * - Garantia de não-exposição de segredos (hashes, tokens)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../src/app/api/backend/route';
import { BackendEngine, getLocalEngine, resetLocalEngines } from '../src/backend/engine';
import { getTenantByHostname } from '../src/lib/tenantResolver';
import type { TenantRegistry } from '../src/types';

describe('MÓDULO DE SEGURANÇA — TESTES DE BLINDAGEM E AUDITORIA', () => {
  beforeEach(() => {
    resetLocalEngines();
  });

  // ============================================================
  // 1. PREVENÇÃO DE SSRF E INJEÇÃO DE CABEÇALHOS
  // ============================================================
  describe('SSRF & Header Injection em /api/backend (SEC-01)', () => {
    it('NUNCA deve confiar no cabeçalho x-tenant-api-url enviado por invasor', async () => {
      // Invasor envia cabeçalho tentando redirecionar tráfego para seu servidor
      const maliciousUrl = 'https://attacker.com/steal-credentials';
      const req = new NextRequest('http://localhost:3000/api/backend?action=store', {
        headers: {
          'x-tenant-api-url': maliciousUrl,
          host: 'localhost:3000',
        },
      });

      const res = await GET(req);
      const json = await res.json();

      // Deve responder usando o engine local seguro de localhost, sem jamais acessar attacker.com
      expect(json.success).toBe(true);
      expect(json.data.store_name).toBe('Minha Loja Digital');
    });

    it('NUNCA deve confiar no cabeçalho x-tenant-id para contaminar tenant', async () => {
      // Requisição vem de loja_a, mas invasor envia header tentando forçar loja_b
      const req = new NextRequest('http://loja-a.localhost:3000/api/backend?action=store', {
        headers: {
          'x-tenant-id': 'loja_b',
          host: 'loja-a.localhost:3000',
        },
      });

      const res = await GET(req);
      const json = await res.json();

      expect(json.success).toBe(true);
      // Deve resolver estritamente para loja_a com base no Host, ignorando o header injetado
      expect(json.data.store_id).toBe('loja_a');
      expect(json.data.store_id).not.toBe('loja_b');
    });

    it('Deve rejeitar requisições de domínios não autorizados/não registrados com 404', async () => {
      const req = new NextRequest('http://loja-fantasma-hacker.com/api/backend?action=store', {
        headers: {
          host: 'loja-fantasma-hacker.com',
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('TENANT_NOT_FOUND');
    });
  });

  // ============================================================
  // 2. VALIDAÇÃO DE PROTOCOLOS E ESQUEMAS MALICIOSOS (XSS)
  // ============================================================
  describe('Validação de Imagens e Esquemas de URL (SEC-02)', () => {
    let engine: BackendEngine;
    let token: string;

    beforeEach(() => {
      engine = new BackendEngine();
      const loginRes = engine.doPost({ action: 'login', password: 'admin123' });
      token = (loginRes.data as { token: string }).token;
    });

    it('Deve rejeitar URLs de imagem com esquema javascript: ou malicioso', () => {
      expect(() => {
        engine.validateImages(['javascript:alert(document.cookie)']);
      }).toThrow('VALIDATION_ERROR: Cada imagem deve possuir protocolo válido');

      expect(() => {
        engine.validateImages(['vbscript:msgbox(1)']);
      }).toThrow('VALIDATION_ERROR: Cada imagem deve possuir protocolo válido');
    });

    it('Deve aceitar imagens válidas com https://, http:// ou data:image/', () => {
      const validImages = [
        'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        'http://example.com/foto.png',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      ];

      const validated = engine.validateImages(validImages);
      expect(validated).toHaveLength(3);
    });
  });

  // ============================================================
  // 3. HARDENING DE CONFIGURAÇÃO (SAVECONFIG)
  // ============================================================
  describe('Proteção e Sanitização em saveConfig (SEC-03)', () => {
    let engine: BackendEngine;
    let token: string;

    beforeEach(() => {
      engine = new BackendEngine();
      const loginRes = engine.doPost({ action: 'login', password: 'admin123' });
      token = (loginRes.data as { token: string }).token;
    });

    it('Deve rejeitar cor hexadecimal inválida em primary_color', () => {
      const res = engine.doPost({
        action: 'saveConfig',
        token,
        config: {
          primary_color: 'not-a-color-injection',
        },
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION_ERROR');
    });

    it('Deve validar e sanitizar telefone de WhatsApp', () => {
      // WhatsApp com poucos dígitos (< 10)
      const resBad = engine.doPost({
        action: 'saveConfig',
        token,
        config: {
          whatsapp: '12345',
        },
      });
      expect(resBad.success).toBe(false);
      expect(resBad.error?.code).toBe('VALIDATION_ERROR');

      // WhatsApp válido com pontuação é sanitizado para apenas dígitos
      const resGood = engine.doPost({
        action: 'saveConfig',
        token,
        config: {
          whatsapp: '+55 (11) 98888-7777',
        },
      });
      expect(resGood.success).toBe(true);
      expect((resGood.data as { whatsapp: string }).whatsapp).toBe('5511988887777');
    });

    it('NUNCA permite alteração de chaves protegidas (store_id, api_token, admin_password_hash)', () => {
      const forbiddenAttempts = [
        { store_id: 'loja_trocada' },
        { api_token: 'token_hacker' },
        { admin_password_hash: 'hash_trocado' },
      ];

      for (const attempt of forbiddenAttempts) {
        const res = engine.doPost({
          action: 'saveConfig',
          token,
          config: attempt,
        });
        expect(res.success).toBe(false);
        expect(res.error?.code).toBe('FORBIDDEN_MODIFICATION');
      }
    });
  });

  // ============================================================
  // 4. PREVENÇÃO DE VAZAMENTO DE SEGREDOS
  // ============================================================
  describe('Vazamento de Segredos e Privacidade (SEC-04)', () => {
    it('Respostas públicas de store e all NUNCA incluem hashes ou tokens', () => {
      const engine = new BackendEngine();

      const storeRes = engine.doGet({ action: 'store' });
      const storeData = storeRes.data as Record<string, unknown>;
      expect(storeData['admin_password_hash']).toBeUndefined();
      expect(storeData['api_token']).toBeUndefined();

      const allRes = engine.doGet({ action: 'all' });
      const allData = allRes.data as { store: Record<string, unknown> };
      expect(allData.store['admin_password_hash']).toBeUndefined();
      expect(allData.store['api_token']).toBeUndefined();
    });
  });
});
