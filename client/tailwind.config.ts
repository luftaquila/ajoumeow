import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd3',
          200: '#fad6a5',
          300: '#f6b86d',
          400: '#f19232',
          500: '#ee7711',
          600: '#df5d07',
          700: '#b94509',
          800: '#93370e',
          900: '#772f0f',
          950: '#401505',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
