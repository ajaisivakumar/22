/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E42527',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#E42527',
          600: '#c81e20',
          700: '#b01b1d',
        },
        brand: {
          blue: '#226DB4',
          green: '#089949',
          yellow: '#F9B21D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
