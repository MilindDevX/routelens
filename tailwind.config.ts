import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        sans:    ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        slate: {
          850: '#172033',
          950: '#0b1120',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-down': 'slideDown 0.25s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', maxHeight: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', maxHeight: '1000px', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
