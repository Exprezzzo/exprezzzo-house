export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'vegas-gold': '#C5B358',
        'chocolate': '#381819',
        'desert-sand': '#EDC9AF',
        'rose-red': '#C72C41',
        'dust': '#A89F91',
        'light-sand': '#F5F5DC',
      },
      animation: {
        'shimmer': 'shimmer 8s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(1.3)' },
        }
      }
    },
  },
  plugins: [],
}