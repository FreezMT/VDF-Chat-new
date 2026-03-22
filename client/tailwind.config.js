import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#1c1c1e',
        'surface-2': '#2c2c2e',
        accent: '#7C3AED',
        muted: '#8E8E93',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      maxWidth: {
        app: '1600px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        nav: '0 8px 32px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
