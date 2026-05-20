const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#0a0a0a',
        'bg-card': '#141414',
        'bg-elevated': '#1f1f1f',
        'surface': '#252525',
        'surface-glass': 'rgba(30, 30, 30, 0.7)',
        'accent-gold': {
          DEFAULT: '#d4a574',
          light: '#e8c99b',
          dark: '#b8956a',
        },
        'accent-orange': '#e87d3e',
        'cool-slate': {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        primary: {
          DEFAULT: '#0F172A',
          light: '#1E293B',
          dark: '#020617',
        },
        secondary: {
          DEFAULT: '#d4a574',
          light: '#e8c99b',
          dark: '#b8956a',
        },
        accent: {
          DEFAULT: '#d4a574',
          light: '#e8c99b',
          dark: '#b8956a',
        },
      },
      fontFamily: {
        display: ['Playfair Display', ...fontFamily.serif],
        body: ['Plus Jakarta Sans', ...fontFamily.sans],
      },
      spacing: {
        'base': '8px',
        'container': '1320px',
      },
      borderRadius: {
        'sm': '8px',
        'DEFAULT': '8px',
        'md': '14px',
        'lg': '20px',
        'xl': '28px',
      },
      boxShadow: {
        'level-1': '0 2px 4px rgba(15, 23, 42, 0.05)',
        'level-2': '0 8px 16px rgba(15, 23, 42, 0.10)',
        'level-3': '0 20px 40px rgba(15, 23, 42, 0.15)',
        'gold': '0 8px 32px rgba(212, 165, 116, 0.3)',
        'gold-lg': '0 12px 40px rgba(212, 165, 116, 0.4)',
      },
      maxWidth: {
        'container': '1320px',
      },
      fontSize: {
        'display-xl': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'display-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #d4a574 0%, #b8956a 100%)',
        'gold-text': 'linear-gradient(135deg, #e8c99b 0%, #d4a574 50%, #b8956a 100%)',
      },
    },
  },
  plugins: [],
}
