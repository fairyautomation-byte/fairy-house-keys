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
        'fha-bg': 'var(--fha-bg)',
        'fha-surface': 'var(--fha-surface)',
        'fha-surface-2': 'var(--fha-surface-2)',
        'fha-surface-3': 'var(--fha-surface-3)',
        'fha-glass': 'var(--fha-glass-bg)',
        'fha-border': 'var(--fha-border)',
        'fha-border-muted': 'var(--fha-border-muted)',
        'fha-glass-border': 'var(--fha-glass-border)',
        'fha-text': 'var(--fha-text)',
        'fha-text-muted': 'var(--fha-text-muted)',
        'fha-text-faint': 'var(--fha-text-faint)',
        'fha-text-inverse': 'var(--fha-text-inverse)',
        'fha-cyan': 'var(--fha-cyan)',
        'fha-cyan-hover': 'var(--fha-cyan-hover)',
        'fha-cyan-deep': 'var(--fha-cyan-deep)',
        'fha-cyan-muted': 'var(--fha-cyan-muted)',
        'fha-cyan-border': 'var(--fha-cyan-border)',
        'fha-success': 'var(--fha-success)',
        'fha-warning': 'var(--fha-warning)',
        'fha-error': 'var(--fha-error)',
        'fha-info': 'var(--fha-info)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'fha-border': 'var(--fha-shadow-border)',
        'fha-sm': 'var(--fha-shadow-sm)',
        'fha-md': 'var(--fha-shadow-md)',
        'fha-lg': 'var(--fha-shadow-lg)',
        'fha-cyan': 'var(--fha-shadow-cyan)',
        'fha-glow': 'var(--fha-shadow-glow)',
        'fha-focus': 'var(--fha-shadow-focus)',
        'fha-inset': 'var(--fha-shadow-inset)',
        'fha-outset': 'var(--fha-shadow-outset)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
