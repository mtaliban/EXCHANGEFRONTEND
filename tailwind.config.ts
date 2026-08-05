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
          blue:   { DEFAULT: '#1E40AF', 50: '#EFF6FF', 100: '#DBEAFE', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8', 900: '#1E3A8A' },
          orange: { DEFAULT: '#EA580C', 50: '#FFF7ED', 100: '#FFEDD5', 500: '#F97316', 600: '#EA580C' },
          red:    { DEFAULT: '#DC2626', 50: '#FEF2F2', 100: '#FEE2E2', 500: '#EF4444', 600: '#DC2626' },
          grey:   { DEFAULT: '#6B7280', 50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 300: '#D1D5DB', 500: '#6B7280', 700: '#374151', 900: '#111827' },
          gold:   { DEFAULT: '#F59E0B', 50: '#FFFBEB', 100: '#FEF3C7', 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706' },
          white:  '#FFFFFF',
        },
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
