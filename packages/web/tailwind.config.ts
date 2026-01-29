import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cyber-green': '#00cc66',
        'cyber-orange': '#ff6600',
        'cyber-cyan': '#00ccff',
        'cyber-pink': '#ff0066',
        'cyber-purple': '#9966ff',
        'cyber-yellow': '#ffcc00',
        'cyber-bg': '#0a0a0a',
        'cyber-muted': '#666666',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scanline': 'scanline 8s linear infinite',
        'flicker': 'flicker 0.15s infinite',
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 5px #00cc66, 0 0 10px #00cc66' },
          '100%': { textShadow: '0 0 10px #00cc66, 0 0 20px #00cc66, 0 0 30px #00cc66' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      boxShadow: {
        'neon-green': '0 0 5px #00cc66, 0 0 10px #00cc66, 0 0 15px #00cc66',
        'neon-orange': '0 0 5px #ff6600, 0 0 10px #ff6600, 0 0 15px #ff6600',
        'neon-cyan': '0 0 5px #00ccff, 0 0 10px #00ccff, 0 0 15px #00ccff',
        'neon-pink': '0 0 5px #ff0066, 0 0 10px #ff0066, 0 0 15px #ff0066',
      },
    },
  },
  plugins: [],
}

export default config
