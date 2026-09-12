/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff8e1',
          100: '#ffecb3',
          500: '#ff8f00',
          600: '#e65100',
          700: '#bf360c',
        },
        earth: {
          50: '#efebe9',
          100: '#d7ccc8',
          500: '#795548',
          600: '#6d4c41',
          700: '#4e342e',
        },
        cotton: {
          light: '#e3f2fd',
          DEFAULT: '#1565c0',
          dark: '#0d47a1',
        },
        groundnut: {
          light: '#fff8e1',
          DEFAULT: '#f57f17',
          dark: '#e65100',
        },
      },
    },
  },
  plugins: [],
}
