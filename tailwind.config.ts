import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue:   { DEFAULT: 'rgb(var(--brand-blue) / <alpha-value>)', 50: 'rgb(var(--brand-blue-50) / <alpha-value>)', 100: 'rgb(var(--brand-blue-100) / <alpha-value>)', 500: 'rgb(var(--brand-blue-500) / <alpha-value>)', 600: 'rgb(var(--brand-blue-600) / <alpha-value>)', 700: 'rgb(var(--brand-blue-700) / <alpha-value>)', 900: 'rgb(var(--brand-blue-900) / <alpha-value>)' },
          orange: { DEFAULT: 'rgb(var(--brand-orange) / <alpha-value>)', 50: 'rgb(var(--brand-orange-50) / <alpha-value>)', 100: 'rgb(var(--brand-orange-100) / <alpha-value>)', 500: 'rgb(var(--brand-orange-500) / <alpha-value>)', 600: 'rgb(var(--brand-orange-600) / <alpha-value>)' },
          red:    { DEFAULT: 'rgb(var(--brand-red) / <alpha-value>)', 50: 'rgb(var(--brand-red-50) / <alpha-value>)', 100: 'rgb(var(--brand-red-100) / <alpha-value>)', 500: 'rgb(var(--brand-red-500) / <alpha-value>)', 600: 'rgb(var(--brand-red-600) / <alpha-value>)' },
          grey:   { DEFAULT: 'rgb(var(--brand-grey) / <alpha-value>)', 50: 'rgb(var(--brand-grey-50) / <alpha-value>)', 100: 'rgb(var(--brand-grey-100) / <alpha-value>)', 200: 'rgb(var(--brand-grey-200) / <alpha-value>)', 300: 'rgb(var(--brand-grey-300) / <alpha-value>)', 500: 'rgb(var(--brand-grey-500) / <alpha-value>)', 700: 'rgb(var(--brand-grey-700) / <alpha-value>)', 900: 'rgb(var(--brand-grey-900) / <alpha-value>)', 950: 'rgb(var(--brand-grey-950) / <alpha-value>)' },
          gold:   { DEFAULT: 'rgb(var(--brand-gold) / <alpha-value>)', 50: 'rgb(var(--brand-gold-50) / <alpha-value>)', 100: 'rgb(var(--brand-gold-100) / <alpha-value>)', 400: 'rgb(var(--brand-gold-400) / <alpha-value>)', 500: 'rgb(var(--brand-gold-500) / <alpha-value>)', 600: 'rgb(var(--brand-gold-600) / <alpha-value>)' },
          navy:   'rgb(var(--brand-navy) / <alpha-value>)',
        },
        white: 'rgb(var(--brand-white) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0,0,0,0.06)',
      },
      /* ── FLUID TYPOGRAPHY FORMULA ────────────────────────────────────────
       * Kila class ya text-* sasa inatumia clamp(min, fluid, max):
       * text inapanda/pungua SMOOTHLY kati ya simu ndogo (320px) na karibia
       * tablet/desktop (~1024px) badala ya kuruka ghafla kwenye breakpoints.
       * Hii ndiyo formula ya kuhakikisha font inafaa kwenye KILA device bila
       * overflow wala micro-text. Sizes juu ya max (desktop) zinakaa sawa.
       * 8xl/9xl zimebaki kama za default kwa ajili ya future usage.
       */
      fontSize: {
        xs: ['clamp(0.6875rem, 0.66rem + 0.14vw, 0.75rem)', { lineHeight: '1rem' }],
        sm: ['clamp(0.8125rem, 0.77rem + 0.21vw, 0.875rem)', { lineHeight: '1.25rem' }],
        base: ['clamp(0.9375rem, 0.89rem + 0.24vw, 1rem)', { lineHeight: '1.5rem' }],
        lg: ['clamp(1.0625rem, 0.98rem + 0.41vw, 1.125rem)', { lineHeight: '1.75rem' }],
        xl: ['clamp(1.1875rem, 1.09rem + 0.49vw, 1.25rem)', { lineHeight: '1.75rem' }],
        '2xl': ['clamp(1.375rem, 1.24rem + 0.68vw, 1.5rem)', { lineHeight: '2rem' }],
        '3xl': ['clamp(1.5rem, 1.25rem + 1.25vw, 1.875rem)', { lineHeight: '2.25rem' }],
        '4xl': ['clamp(1.75rem, 1.4rem + 1.75vw, 2.25rem)', { lineHeight: '2.5rem' }],
        '5xl': ['clamp(2rem, 1.55rem + 2.25vw, 2.75rem)', { lineHeight: '1' }],
        '6xl': ['clamp(2.25rem, 1.7rem + 2.75vw, 3.25rem)', { lineHeight: '1' }],
        '7xl': ['clamp(2.5rem, 1.9rem + 3vw, 4rem)', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
    },
  },
  plugins: [],
};

export default config;
