import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', '[data-theme="dim"]'],
  content: ['./src/**/*.{ts,tsx}', '../../tools/**/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        desk: {
          wood: '#5b3a1d',
          'wood-dark': '#3a2410',
          'wood-light': '#7a5530',
          lamp: '#ffdba0',
          'lamp-cool': '#cfe4ff',
        },
      },
      backgroundImage: {
        'desk-grain': 'radial-gradient(circle at 20% 30%, rgba(0,0,0,0.18), transparent 60%), repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0 2px, transparent 2px 6px)',
      },
    },
  },
  plugins: [],
}

export default config
