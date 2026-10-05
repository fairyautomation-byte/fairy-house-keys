/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Surface */
        'fha-bg':           'var(--fha-bg)',
        'fha-surface':      'var(--fha-surface)',
        'fha-surface-2':    'var(--fha-surface-2)',
        'fha-surface-3':    'var(--fha-surface-3)',
        'fha-border':       'var(--fha-border)',
        'fha-border-muted': 'var(--fha-border-muted)',
        'fha-border-strong':'var(--fha-border-strong)',

        /* Text */
        'fha-text':         'var(--fha-text)',
        'fha-text-muted':   'var(--fha-text-muted)',
        'fha-text-faint':   'var(--fha-text-faint)',
        'fha-text-inverse': 'var(--fha-text-inverse)',

        /* Brand */
        'fha-brand':        'var(--fha-brand)',
        'fha-brand-hover':  'var(--fha-brand-hover)',
        'fha-brand-active': 'var(--fha-brand-active)',
        'fha-brand-soft':   'var(--fha-brand-soft)',

        /* Legacy cyan aliases */
        'fha-cyan':         'var(--fha-cyan)',
        'fha-cyan-hover':   'var(--fha-cyan-hover)',
        'fha-cyan-deep':    'var(--fha-cyan-deep)',
        'fha-cyan-muted':   'var(--fha-cyan-muted)',
        'fha-cyan-border':  'var(--fha-cyan-border)',

        /* Legacy glass (kept to avoid build errors, maps to transparent) */
        'fha-glass':        'transparent',
        'fha-glass-border': 'var(--fha-border)',

        /* Status */
        'fha-success':      'var(--fha-success)',
        'fha-success-bg':   'var(--fha-success-bg)',
        'fha-warning':      'var(--fha-warning)',
        'fha-warning-bg':   'var(--fha-warning-bg)',
        'fha-error':        'var(--fha-error)',
        'fha-error-bg':     'var(--fha-error-bg)',
        'fha-info':         'var(--fha-info)',
        'fha-info-bg':      'var(--fha-info-bg)',
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xs':   ['12px', { lineHeight: '16px' }],
        'sm':   ['13px', { lineHeight: '20px' }],
        'base': ['14px', { lineHeight: '22px' }],
        'md':   ['16px', { lineHeight: '24px' }],
        'lg':   ['18px', { lineHeight: '28px' }],
        'xl':   ['20px', { lineHeight: '28px' }],
        '2xl':  ['24px', { lineHeight: '32px' }],
        '3xl':  ['30px', { lineHeight: '38px' }],
        '4xl':  ['36px', { lineHeight: '44px' }],
        '5xl':  ['48px', { lineHeight: '56px' }],
      },
      boxShadow: {
        'fha-border':  'var(--fha-shadow-border)',
        'fha-sm':      'var(--fha-shadow-sm)',
        'fha-md':      'var(--fha-shadow-md)',
        'fha-lg':      'var(--fha-shadow-lg)',
        'fha-overlay': 'var(--fha-shadow-overlay)',
        'fha-focus':   'var(--fha-shadow-focus)',
        /* Legacy — resolve harmlessly */
        'fha-cyan':    'var(--fha-shadow-focus)',
        'fha-glow':    'none',
        'fha-inset':   'none',
        'fha-outset':  'none',
      },
      borderRadius: {
        'fha-sm':   'var(--fha-radius-sm)',
        'fha':      'var(--fha-radius)',
        'fha-md':   'var(--fha-radius-md)',
        'fha-lg':   'var(--fha-radius-lg)',
        'fha-xl':   'var(--fha-radius-xl)',
        'fha-full': 'var(--fha-radius-full)',
        /* Legacy aliases */
        'fha-radius-sm':   'var(--fha-radius-sm)',
        'fha-radius':      'var(--fha-radius)',
        'fha-radius-md':   'var(--fha-radius-md)',
        'fha-radius-lg':   'var(--fha-radius-lg)',
        'fha-radius-xl':   'var(--fha-radius-xl)',
        'fha-radius-full': 'var(--fha-radius-full)',
      },
      maxWidth: {
        'auth':      '480px',
        'settings':  '760px',
        'narrow':    '840px',
        'content':   '1280px',
        'landing':   '1360px',
        'standard':  '1360px',
        'wide':      '1680px',
        'admin':     '1760px',
        'ultrawide': '1840px',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'shimmer':    'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
