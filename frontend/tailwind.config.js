/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      colors: {
        panel: 'rgba(10, 14, 26, 0.72)',
        'panel-border': 'rgba(255, 255, 255, 0.08)',
        'panel-hover': 'rgba(255, 255, 255, 0.04)',
      },
      backdropBlur: {
        panel: '16px',
      },
      animation: {
        'ticker': 'ticker 40s linear infinite',
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-bg': 'slideBg 10s ease-in-out',
      },
      keyframes: {
        ticker: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideBg: {
          '0%':   { opacity: '0', transform: 'scale(1.04)' },
          '8%':   { opacity: '1', transform: 'scale(1.02)' },
          '92%':  { opacity: '1', transform: 'scale(1.00)' },
          '100%': { opacity: '0', transform: 'scale(1.00)' },
        },
      },
    },
  },
  plugins: [],
};
