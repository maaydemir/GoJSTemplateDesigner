/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#1a1f2b',
        panel: '#23283a'
      }
    }
  },
  plugins: []
}
