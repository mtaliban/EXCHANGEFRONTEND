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
        },
        white: 'rgb(var(--brand-white) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
