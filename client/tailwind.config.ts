import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          orange: '#FF6B35',
          red: '#E63946',
        },
        surface: {
          900: '#0D0D0F',
          800: '#16161A',
          700: '#1E1E24',
          600: '#2A2A32',
        },
        text: {
          primary: '#F2F2F7',
          muted: '#8E8EA0',
        },
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
