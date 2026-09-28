import type { ThemePreset, StoreConfig } from '@/types';

export interface ThemeTokens {
  fontHeading: string;
  fontSans: string;
  radiusCard: string;
  radiusBtn: string;
  radiusBadge: string;
  shadowCard: string;
  shadowCardHover: string;
  borderWidth: string;
  letterSpacingHeading: string;
}

export interface ThemePresetDefinition {
  id: ThemePreset;
  name: string;
  tagline: string;
  description: string;
  fontTitle: string;
  fontBody: string;
  radiusLabel: string;
  tokens: ThemeTokens;
}

export const THEME_PRESETS: Record<ThemePreset, ThemePresetDefinition> = {
  modern: {
    id: 'modern',
    name: 'Modern (Padrão)',
    tagline: 'Equilíbrio & Sofisticação',
    description: 'Tipografia limpa (Plus Jakarta Sans / Inter), cantos arredondados em 1rem e sombras difusas contemporâneas.',
    fontTitle: 'Plus Jakarta Sans / Inter',
    fontBody: 'Plus Jakarta Sans / Inter',
    radiusLabel: '1rem (16px)',
    tokens: {
      fontHeading: 'var(--font-plus-jakarta), var(--font-inter), -apple-system, sans-serif',
      fontSans: 'var(--font-plus-jakarta), var(--font-inter), -apple-system, sans-serif',
      radiusCard: '1rem',
      radiusBtn: '0.875rem',
      radiusBadge: '9999px',
      shadowCard: '0 2px 15px -3px rgba(0, 0, 0, 0.05), 0 10px 20px -2px rgba(0, 0, 0, 0.03)',
      shadowCardHover: '0 12px 28px -4px rgba(0, 0, 0, 0.1)',
      borderWidth: '1px',
      letterSpacingHeading: '-0.025em',
    },
  },
  editorial: {
    id: 'editorial',
    name: 'Editorial Minimalista',
    tagline: 'Alta Moda & Boutique',
    description: 'Títulos em serifa requintada (Playfair Display), textos em Inter, cantos minimalistas (0.25rem) e estética de luxo.',
    fontTitle: 'Playfair Display',
    fontBody: 'Inter',
    radiusLabel: '0.25rem (4px)',
    tokens: {
      fontHeading: 'var(--font-playfair), Georgia, "Times New Roman", serif',
      fontSans: 'var(--font-inter), -apple-system, sans-serif',
      radiusCard: '0.25rem',
      radiusBtn: '0.25rem',
      radiusBadge: '0.25rem',
      shadowCard: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
      shadowCardHover: '0 6px 16px -2px rgba(0, 0, 0, 0.08)',
      borderWidth: '1px',
      letterSpacingHeading: '-0.01em',
    },
  },
  bold: {
    id: 'bold',
    name: 'Bold Impact',
    tagline: 'Vibrante & Pílula',
    description: 'Tipografia geométrica (Space Grotesk), botões pílula (rounded-full) e sombras de forte impacto visual.',
    fontTitle: 'Space Grotesk',
    fontBody: 'Space Grotesk',
    radiusLabel: 'Pílula (rounded-full)',
    tokens: {
      fontHeading: 'var(--font-space-grotesk), -apple-system, sans-serif',
      fontSans: 'var(--font-space-grotesk), -apple-system, sans-serif',
      radiusCard: '1.25rem',
      radiusBtn: '9999px',
      radiusBadge: '9999px',
      shadowCard: '0 4px 0 0 rgba(15, 23, 42, 0.08), 0 2px 8px 0 rgba(0, 0, 0, 0.04)',
      shadowCardHover: '0 6px 0 0 rgba(15, 23, 42, 0.12), 0 8px 16px 0 rgba(0, 0, 0, 0.08)',
      borderWidth: '1.5px',
      letterSpacingHeading: '-0.035em',
    },
  },
};

export const THEME_PRESET_LIST: ThemePresetDefinition[] = [
  THEME_PRESETS.modern,
  THEME_PRESETS.editorial,
  THEME_PRESETS.bold,
];

/**
 * Retorna os tokens CSS para o tema selecionado com fallback seguro para 'modern'
 */
export function getThemePresetTokens(preset?: ThemePreset | string | null): ThemeTokens {
  if (preset && preset in THEME_PRESETS) {
    return THEME_PRESETS[preset as ThemePreset].tokens;
  }
  return THEME_PRESETS.modern.tokens;
}

/**
 * Gera string de variáveis CSS injetáveis no SSR (RootLayout)
 * sem risco de hydration mismatch e com zero Cumulative Layout Shift (CLS).
 */
export function generateThemeCssVariables(config?: Partial<StoreConfig> | null): string {
  const presetKey: ThemePreset = (config?.theme_preset as ThemePreset) || 'modern';
  const tokens = getThemePresetTokens(presetKey);

  const primary = config?.primary_color || '#16a34a';
  const secondary = config?.secondary_color || '#15803d';
  const surface = config?.background_color || '#f8fafc';
  const textMain = config?.text_color || '#0f172a';
  const announcementBg = config?.announcement_bg_color || '#0f172a';
  const announcementText = config?.announcement_text_color || '#ffffff';

  return `
    :root {
      --brand-primary: ${primary};
      --brand-primary-hover: ${secondary};
      --brand-contrast: #ffffff;
      --brand-surface: ${surface};
      --brand-card: #ffffff;
      --brand-border: #e2e8f0;
      --brand-text-main: ${textMain};
      --brand-text-muted: #64748b;

      --radius-card: ${tokens.radiusCard};
      --radius-btn: ${tokens.radiusBtn};
      --radius-badge: ${tokens.radiusBadge};

      --shadow-card: ${tokens.shadowCard};
      --shadow-card-hover: ${tokens.shadowCardHover};

      --font-heading: ${tokens.fontHeading};
      --font-sans: ${tokens.fontSans};
      --letter-spacing-heading: ${tokens.letterSpacingHeading};

      --announcement-bg: ${announcementBg};
      --announcement-text: ${announcementText};

      /* Aliases retrocompatíveis */
      --primary-color: var(--brand-primary);
      --secondary-color: var(--brand-primary-hover);
      --bg-color: var(--brand-surface);
      --text-color: var(--brand-text-main);
    }
  `.replace(/\s+/g, ' ').trim();
}

/**
 * Aplica os tokens do tema e cores diretamente nas CSS custom properties do documento
 */
export function applyThemeToDocument(config: Partial<StoreConfig>): void {
  if (typeof document === 'undefined') return;

  const presetKey: ThemePreset = (config.theme_preset as ThemePreset) || 'modern';
  const tokens = getThemePresetTokens(presetKey);

  const primary = config.primary_color || '#16a34a';
  const secondary = config.secondary_color || '#15803d';
  const surface = config.background_color || '#f8fafc';
  const textMain = config.text_color || '#0f172a';
  const announcementBg = config.announcement_bg_color || '#0f172a';
  const announcementText = config.announcement_text_color || '#ffffff';

  const root = document.documentElement;

  // Atributo data-theme no <html>
  root.setAttribute('data-theme', presetKey);

  // Paleta de Cores
  root.style.setProperty('--brand-primary', primary);
  root.style.setProperty('--brand-primary-hover', secondary);
  root.style.setProperty('--brand-surface', surface);
  root.style.setProperty('--brand-text-main', textMain);
  root.style.setProperty('--primary-color', primary);
  root.style.setProperty('--secondary-color', secondary);
  root.style.setProperty('--bg-color', surface);
  root.style.setProperty('--text-color', textMain);

  // Barra de Anúncios
  root.style.setProperty('--announcement-bg', announcementBg);
  root.style.setProperty('--announcement-text', announcementText);

  // Tokens do Preset (Tipografia e Cantos Arredondados)
  root.style.setProperty('--radius-card', tokens.radiusCard);
  root.style.setProperty('--radius-btn', tokens.radiusBtn);
  root.style.setProperty('--radius-badge', tokens.radiusBadge);
  root.style.setProperty('--shadow-card', tokens.shadowCard);
  root.style.setProperty('--shadow-card-hover', tokens.shadowCardHover);
  root.style.setProperty('--font-heading', tokens.fontHeading);
  root.style.setProperty('--font-sans', tokens.fontSans);
  root.style.setProperty('--letter-spacing-heading', tokens.letterSpacingHeading);
}
