import { describe, it, expect, beforeEach } from 'vitest';
import {
  THEME_PRESETS,
  getThemePresetTokens,
  generateThemeCssVariables,
  applyThemeToDocument,
} from '@/lib/themePresets';
import { SaveConfigSchema } from '@/lib/schemas';
import { BackendEngine } from '@/backend/engine';

describe('Sistema de Tokens Dinâmicos e Theme Presets', () => {
  it('deve definir corretamente os 3 temas: modern, editorial e bold', () => {
    expect(THEME_PRESETS.modern).toBeDefined();
    expect(THEME_PRESETS.editorial).toBeDefined();
    expect(THEME_PRESETS.bold).toBeDefined();

    // 1. Modern (Fonte: Inter / Plus Jakarta Sans, cantos: 1rem, sombras difusas)
    expect(THEME_PRESETS.modern.tokens.radiusCard).toBe('1rem');
    expect(THEME_PRESETS.modern.tokens.fontHeading).toContain('var(--font-plus-jakarta)');
    expect(THEME_PRESETS.modern.tokens.shadowCard).toContain('rgba(0, 0, 0, 0.05)');

    // 2. Editorial (Fonte: Playfair Display / Cormorant para títulos e Inter para textos, cantos: 0.25rem, minimalista)
    expect(THEME_PRESETS.editorial.tokens.radiusCard).toBe('0.25rem');
    expect(THEME_PRESETS.editorial.tokens.radiusBtn).toBe('0.25rem');
    expect(THEME_PRESETS.editorial.tokens.fontHeading).toContain('var(--font-playfair)');
    expect(THEME_PRESETS.editorial.tokens.fontSans).toContain('var(--font-inter)');

    // 3. Bold (Fonte: Space Grotesk / Poppins, botões pílula rounded-full, contrastes marcantes)
    expect(THEME_PRESETS.bold.tokens.radiusBtn).toBe('9999px');
    expect(THEME_PRESETS.bold.tokens.fontHeading).toContain('var(--font-space-grotesk)');
    expect(THEME_PRESETS.bold.tokens.shadowCard).toContain('rgba(15, 23, 42, 0.08)');
  });

  it('deve retornar tokens de modern como fallback seguro caso informado tema inválido ou nulo', () => {
    const fallbackNull = getThemePresetTokens(null);
    expect(fallbackNull.radiusCard).toBe('1rem');

    const fallbackUndefined = getThemePresetTokens(undefined);
    expect(fallbackUndefined.radiusCard).toBe('1rem');

    const fallbackUnknown = getThemePresetTokens('cyberpunk_inexistente' as any);
    expect(fallbackUnknown.radiusCard).toBe('1rem');
  });

  it('deve gerar string CSS injetável no SSR com tokens semânticos e barra de anúncios', () => {
    const css = generateThemeCssVariables({
      theme_preset: 'editorial',
      primary_color: '#9333ea',
      secondary_color: '#7e22ce',
      background_color: '#fafafa',
      text_color: '#18181b',
      announcement_bg_color: '#18181b',
      announcement_text_color: '#fef08a',
    });

    expect(css).toContain('--radius-card: 0.25rem;');
    expect(css).toContain('--radius-btn: 0.25rem;');
    expect(css).toContain('--brand-primary: #9333ea;');
    expect(css).toContain('--announcement-bg: #18181b;');
    expect(css).toContain('--announcement-text: #fef08a;');
    expect(css).toContain('--font-heading: var(--font-playfair)');
  });

  it('deve aplicar tokens dinâmicos no elemento document.documentElement via applyThemeToDocument', () => {
    const styleMap = new Map<string, string>();
    const attributes = new Map<string, string>();

    const mockDocument = {
      documentElement: {
        setAttribute: (key: string, val: string) => attributes.set(key, val),
        getAttribute: (key: string) => attributes.get(key),
        style: {
          setProperty: (key: string, val: string) => styleMap.set(key, val),
          getPropertyValue: (key: string) => styleMap.get(key) || '',
        },
      },
    };

    (global as any).document = mockDocument;

    applyThemeToDocument({
      theme_preset: 'bold',
      primary_color: '#f97316',
      announcement_bg_color: '#000000',
    });

    expect(mockDocument.documentElement.getAttribute('data-theme')).toBe('bold');
    expect(mockDocument.documentElement.style.getPropertyValue('--radius-btn')).toBe('9999px');
    expect(mockDocument.documentElement.style.getPropertyValue('--brand-primary')).toBe('#f97316');
    expect(mockDocument.documentElement.style.getPropertyValue('--announcement-bg')).toBe('#000000');

    delete (global as any).document;
  });
});

describe('Validação do SaveConfigSchema com Theme Presets e Barra de Anúncios', () => {
  it('deve validar com sucesso presets e campos de anúncio válidos', () => {
    const valid = SaveConfigSchema.parse({
      theme_preset: 'editorial',
      announcement_enabled: true,
      announcement_text: 'Frete Grátis acima de R$ 199 para todo o Brasil',
      announcement_bg_color: '#0f172a',
      announcement_text_color: '#ffffff',
    });

    expect(valid.theme_preset).toBe('editorial');
    expect(valid.announcement_enabled).toBe(true);
    expect(valid.announcement_text).toBe('Frete Grátis acima de R$ 199 para todo o Brasil');
  });

  it('deve rejeitar preset de tema inexistente', () => {
    expect(() =>
      SaveConfigSchema.parse({
        theme_preset: 'futurista' as any,
      })
    ).toThrow();
  });

  it('deve rejeitar cores inválidas de anúncio', () => {
    expect(() =>
      SaveConfigSchema.parse({
        announcement_bg_color: 'rgb(0,0,0)',
      })
    ).toThrow();

    expect(() =>
      SaveConfigSchema.parse({
        announcement_text_color: 'azul',
      })
    ).toThrow();
  });
});

describe('Integração com BackendEngine: Persistência e Recuperação de Configurações', () => {
  let engine: BackendEngine;

  beforeEach(() => {
    engine = new BackendEngine();
  });

  it('deve carregar valores padrão de theme_preset e barra de anúncios no getPublicStoreConfig', () => {
    const config = engine.getPublicStoreConfig();
    expect(config.theme_preset).toBe('modern');
    expect(config.announcement_enabled).toBe(true);
    expect(config.announcement_bg_color).toBe('#0f172a');
    expect(config.announcement_text_color).toBe('#ffffff');
    expect(config.announcement_text).toContain('Compre online');
  });

  it('deve salvar e atualizar theme_preset e barra de anúncios através do handleSaveConfig', () => {
    const updated = engine.handleSaveConfig({
      theme_preset: 'editorial',
      announcement_enabled: true,
      announcement_text: 'Nova Coleção de Inverno com 20% OFF!',
      announcement_bg_color: '#4338ca',
      announcement_text_color: '#ffffff',
    });

    expect(updated.theme_preset).toBe('editorial');
    expect(updated.announcement_text).toBe('Nova Coleção de Inverno com 20% OFF!');
    expect(updated.announcement_bg_color).toBe('#4338ca');
    expect(updated.announcement_text_color).toBe('#ffffff');

    // Confirma que getPublicStoreConfig reflete imediatamente
    const fresh = engine.getPublicStoreConfig();
    expect(fresh.theme_preset).toBe('editorial');
    expect(fresh.announcement_text).toBe('Nova Coleção de Inverno com 20% OFF!');
  });
});
