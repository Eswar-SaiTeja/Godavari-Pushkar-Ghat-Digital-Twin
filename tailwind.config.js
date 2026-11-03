/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        command: {
          950: '#050811',
          900: '#0a0f1d',
          850: '#0e1629',
          800: '#141f36',
          750: '#1a2947',
          700: '#213357',
          600: '#2e4573',
          500: '#3d5c99',
        },
        accent: {
          cyan: '#00f0ff',
          cyanDim: 'rgba(0, 240, 255, 0.15)',
          blue: '#2563eb',
          electric: '#38bdf8',
          gold: '#f59e0b',
          emerald: '#10b981',
          danger: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(0, 240, 255, 0.35)',
        'glow-blue': '0 0 20px -3px rgba(37, 99, 235, 0.35)',
        'glow-sm': '0 0 10px -2px rgba(0, 240, 255, 0.25)',
        'panel': '0 8px 32px 0 rgba(0, 0, 0, 0.55)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
}
