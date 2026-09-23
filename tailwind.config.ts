import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary, #16a34a)',
          'primary-hover': 'var(--brand-primary-hover, #15803d)',
          contrast: 'var(--brand-contrast, #ffffff)',
          surface: 'var(--brand-surface, #f8fafc)',
          card: 'var(--brand-card, #ffffff)',
          border: 'var(--brand-border, #e2e8f0)',
          'text-main': 'var(--brand-text-main, #0f172a)',
          'text-muted': 'var(--brand-text-muted, #64748b)',
        },
        primary: {
          DEFAULT: 'var(--brand-primary, var(--primary-color, #16a34a))',
          hover: 'var(--brand-primary-hover, var(--secondary-color, #15803d))',
          50: '#f0fdf4',
          100: '#dcfce7',
          500: 'var(--brand-primary, var(--primary-color, #16a34a))',
          600: 'var(--brand-primary-hover, var(--secondary-color, #15803d))',
          700: 'var(--brand-primary-hover, var(--secondary-color, #15803d))',
        },
        secondary: 'var(--brand-primary-hover, var(--secondary-color, #15803d))',
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        card: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        'card-hover': '0 0 0 1px rgba(0, 0, 0, 0.08), 0 12px 28px -4px rgba(0, 0, 0, 0.12)',
        glow: '0 0 20px -5px var(--brand-primary, rgba(22, 163, 74, 0.35))',
      },
      borderRadius: {
        card: 'var(--radius-card, 1rem)',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
