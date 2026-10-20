/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FBF7F4',
          100: '#F6EEE7',
          200: '#EBD9CE',
          300: '#D9B9A6',
          400: '#C29177',
          500: '#A2674B',
          600: '#8A4A33',
          700: '#713626',
          800: '#5C2B20',
          900: '#4C241C',
        },
        maroon: {
          50: '#FCF4F5',
          100: '#F8E8EA',
          500: '#800020',
          600: '#6C001B',
          700: '#560015',
          800: '#420010',
          900: '#2F000B',
        },
        gold: {
          50: '#FAF8F0',
          100: '#F3EEDC',
          200: '#E7DCB9',
          300: '#D7C48D',
          400: '#C7AC63',
          500: '#B8933D',
          600: '#A07B2D',
          700: '#7E5F23',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
