/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        surface: '#111118',
        border: '#1E1E2E',
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
        },
        secondary: {
          DEFAULT: '#10B981',
        },
        warning: '#F59E0B',
        danger: '#EF4444',
        text: {
          primary: '#F1F5F9',
          muted: '#64748B',
        }
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
}
