/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FDFCF9',
          100: '#FAF9F6',
          200: '#F2EFDE',
          300: '#EAE5C6',
        },
        charcoal: {
          800: '#2A2A2A',
          900: '#1C1C1C',
          950: '#111111',
        },
        forest: {
          800: '#2A3C32',
          900: '#1E2E26',
        },
        gold: {
          400: '#D4B872',
          500: '#C5A059',
          600: '#A38445',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
