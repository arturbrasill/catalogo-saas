import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractTenantSettings,
  serializeTenantSettings,
  cleanNotesForDisplay,
} from '@/lib/supabase';
import { normalizeCatalogInitialData } from '@/lib/sheetNormalization';
import { updateTenantSubscription, findTenant } from '@/lib/tenantStore';
import { BackendEngine } from '@/backend/engine';

describe('Sincronização do Badge de Anúncio do Topo (Admin -> Vitrine)', () => {
  it('deve serializar e extrair configurações de anúncio nos notes do tenant sem corromper texto original', () => {
    const originalNotes = 'Loja criada via Onboarding (Cosméticos & Beleza)';
    const settings = {
      announcement_enabled: true,
      announcement_text: 'PROMOÇÃO DE INVERNO: 50% OFF EM TODO O SITE!',
      announcement_bg_color: '#dc2626',
      announcement_text_color: '#ffffff',
      catalog_layout: 'list' as const,
      theme_preset: 'bold' as const,
    };

    const serialized = serializeTenantSettings(originalNotes, settings);
    expect(serialized).toContain('Loja criada via Onboarding (Cosméticos & Beleza)');
    expect(serialized).toContain('<!--STORE_SETTINGS:');
    expect(serialized).toContain('PROMOÇÃO DE INVERNO: 50% OFF EM TODO O SITE!');

    // Extrai de volta
    const extracted = extractTenantSettings(serialized);
    expect(extracted).not.toBeNull();
    expect(extracted?.announcement_enabled).toBe(true);
    expect(extracted?.announcement_text).toBe('PROMOÇÃO DE INVERNO: 50% OFF EM TODO O SITE!');
    expect(extracted?.announcement_bg_color).toBe('#dc2626');
    expect(extracted?.announcement_text_color).toBe('#ffffff');
    expect(extracted?.catalog_layout).toBe('list');
    expect(extracted?.theme_preset).toBe('bold');

    // cleanNotesForDisplay deve remover a tag técnica
    const display = cleanNotesForDisplay(serialized);
    expect(display).toBe('Loja criada via Onboarding (Cosméticos & Beleza)');
    expect(display).not.toContain('<!--STORE_SETTINGS:');
  });

  it('deve normalizar announcement_enabled mesmo quando retornado como string "false" de planilhas/APIs', () => {
    // Caso 1: String "false"
    const dataFalseString = normalizeCatalogInitialData({
      store: {
        store_id: 'test_store',
        store_name: 'Minha Loja',
        announcement_enabled: 'false',
        announcement_text: 'Aviso de teste',
      },
    });
    expect(dataFalseString.store?.announcement_enabled).toBe(false);

    // Caso 2: Booleano false
    const dataFalseBool = normalizeCatalogInitialData({
      store: {
        store_id: 'test_store',
        store_name: 'Minha Loja',
        announcement_enabled: false,
        announcement_text: 'Aviso de teste',
      },
    });
    expect(dataFalseBool.store?.announcement_enabled).toBe(false);

    // Caso 3: String "true"
    const dataTrueString = normalizeCatalogInitialData({
      store: {
        store_id: 'test_store',
        store_name: 'Minha Loja',
        announcement_enabled: 'true',
        announcement_text: 'Aviso de teste',
      },
    });
    expect(dataTrueString.store?.announcement_enabled).toBe(true);

    // Caso 4: Booleano true
    const dataTrueBool = normalizeCatalogInitialData({
      store: {
        store_id: 'test_store',
        store_name: 'Minha Loja',
        announcement_enabled: true,
        announcement_text: 'Aviso de teste',
      },
    });
    expect(dataTrueBool.store?.announcement_enabled).toBe(true);
  });

  it('deve preservar texto e cores personalizadas do anúncio na normalização', () => {
    const customText = 'Frete Grátis para todo o Nordeste acima de R$ 99!';
    const customBg = '#4f46e5';
    const customTextCol = '#fef08a';

    const normalized = normalizeCatalogInitialData({
      store: {
        store_id: 'test_store',
        store_name: 'Minha Loja',
        announcement_enabled: true,
        announcement_text: customText,
        announcement_bg_color: customBg,
        announcement_text_color: customTextCol,
      },
    });

    expect(normalized.store?.announcement_enabled).toBe(true);
    expect(normalized.store?.announcement_text).toBe(customText);
    expect(normalized.store?.announcement_bg_color).toBe(customBg);
    expect(normalized.store?.announcement_text_color).toBe(customTextCol);
  });

  it('deve sincronizar tenantStore com announcement_enabled, announcement_text e cores ao chamar updateTenantSubscription', () => {
    const updated = updateTenantSubscription({
      tenantId: 'loja_exemplo',
      announcement_enabled: false,
      announcement_text: 'Super Saldão de Inauguração!',
      announcement_bg_color: '#b91c1c',
      announcement_text_color: '#fef3c7',
    });

    expect(updated).not.toBeNull();
    expect(updated?.announcement_enabled).toBe(false);
    expect(updated?.announcement_text).toBe('Super Saldão de Inauguração!');
    expect(updated?.announcement_bg_color).toBe('#b91c1c');
    expect(updated?.announcement_text_color).toBe('#fef3c7');

    const fresh = findTenant('loja_exemplo');
    expect(fresh?.announcement_enabled).toBe(false);
    expect(fresh?.announcement_text).toBe('Super Saldão de Inauguração!');
    expect(fresh?.announcement_bg_color).toBe('#b91c1c');
    expect(fresh?.announcement_text_color).toBe('#fef3c7');
    expect(fresh?.notes).toContain('<!--STORE_SETTINGS:');
  });

  it('BackendEngine deve persistir e refletir modificações na barra de anúncios', () => {
    const engine = new BackendEngine({ store_id: 'loja_exemplo' });
    const saved = engine.handleSaveConfig({
      announcement_enabled: false,
      announcement_text: 'Ofertas válidas até durarem os estoques!',
      announcement_bg_color: '#1e293b',
      announcement_text_color: '#38bdf8',
    });

    expect(saved.announcement_enabled).toBe(false);
    expect(saved.announcement_text).toBe('Ofertas válidas até durarem os estoques!');
    expect(saved.announcement_bg_color).toBe('#1e293b');
    expect(saved.announcement_text_color).toBe('#38bdf8');

    const publicConfig = engine.getPublicStoreConfig();
    expect(publicConfig.announcement_enabled).toBe(false);
    expect(publicConfig.announcement_text).toBe('Ofertas válidas até durarem os estoques!');
  });
});
