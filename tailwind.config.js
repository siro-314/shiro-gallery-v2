/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'glass-primary': 'var(--text-primary)',
        'glass-secondary': 'var(--text-secondary)',
        'glass-text': 'var(--text-primary)',
        'glass-text-secondary': 'var(--text-secondary)',
        'glass-border': 'var(--card-border)',
        'glass-hover': 'rgba(255, 255, 255, 0.15)',
      },
      backgroundColor: {
        'glass-card': 'var(--card-bg)',
        'glass-secondary': 'rgba(255, 255, 255, 0.1)',
      },
      backdropBlur: {
        'glass': '10px',
      },
      fontFamily: {
        'inter': ['Inter', 'Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
