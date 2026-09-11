/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        command: {
          950: '#070b12',
          900: '#0b1321',
          850: '#0f1b2f',
          800: '#14233c',
          700: '#1d3356',
          600: '#2c4b7a',
        },
        risk: {
          safe: '#10b981',      // Emerald 500
          warning: '#f59e0b',   // Amber 500
          critical: '#ef4444',  // Rose/Red 500
          severe: '#b91c1c',    // Dark Red 700
        },
        telemetry: {
          cyan: '#06b6d4',
          neon: '#00f2fe',
          orange: '#ff6b35',
          gold: '#facc15',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'radar-sweep': 'spin 4s linear infinite',
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(6, 182, 212, 0.35)',
        'neon-red': '0 0 20px rgba(239, 68, 68, 0.45)',
        'neon-amber': '0 0 15px rgba(245, 158, 11, 0.35)',
        'neon-green': '0 0 15px rgba(16, 185, 129, 0.35)',
      }
    },
  },
  plugins: [],
}
