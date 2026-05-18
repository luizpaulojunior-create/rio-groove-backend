/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Anton', 'sans-serif'],
        oswald: ['Oswald', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#FF2A1F',
          glow: 'rgba(255,42,31,0.35)',
        },
        surface: {
          primary: '#050505',
          secondary: '#0D0D0D',
          card: 'rgba(255,255,255,0.03)',
          cardHover: 'rgba(255,255,255,0.05)',
          border: 'rgba(255,255,255,0.06)',
        },
        text: {
          primary: '#F5F5F5',
          secondary: 'rgba(255,255,255,0.62)',
        }
      }
    },
  },
  plugins: [],
}
