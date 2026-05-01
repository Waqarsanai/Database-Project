import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'Avenir Next', 'Segoe UI', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        page: '#f8faf9',
        card: '#ffffff',
        ink: {
          DEFAULT: '#1a3a2e',
          strong: '#0a2e1f',
          deep: '#0f4b3b',
        },
        muted: '#5a7a6e',
        subtle: '#8a9e96',
        line: {
          DEFAULT: '#e2e8e5',
          strong: '#9fe1cb',
        },
        brand: {
          DEFAULT: '#14b88a',
          hover: '#0e946f',
          deep: '#0f4b3b',
          tint: '#e8faf3',
          soft: '#f0faf6',
          text: '#0f6e56',
          50: '#ecfdf7',
          100: '#d1faea',
          200: '#a7f3d6',
          300: '#6ee7c0',
          400: '#34d3a3',
          500: '#14b88a',
          600: '#0e946f',
          700: '#0f765b',
          800: '#115e49',
          900: '#0f4b3b',
          950: '#062b21',
        },
        blue: {
          DEFAULT: '#378add',
          tint: '#e6f1fb',
          line: '#b5d4f4',
          text: '#185fa5',
        },
        amber: {
          DEFAULT: '#ba7517',
          soft: '#ef9f27',
          tint: '#faeeda',
          line: '#fac775',
          text: '#854f0b',
        },
        red: {
          DEFAULT: '#a32d2d',
          soft: '#e24b4a',
          tint: '#fcebeb',
          line: '#f7c1c1',
        },
        purple: {
          DEFAULT: '#7f77dd',
          tint: '#eeedfe',
          line: '#afa9ec',
          text: '#534ab7',
        },
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config

