/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#3B82F6',
        },
        dark: '#0F172A',
        secondary: '#64748B',
        border: '#E2E8F0',
        success: '#22C55E',
        background: '#F8FAFC',
        muted: '#F1F5F9',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(15, 23, 42, 0.08)',
        'card': '0 8px 32px rgba(15, 23, 42, 0.08)',
        'elevated': '0 20px 40px rgba(15, 23, 42, 0.12)',
        'glow': '0 0 20px rgba(37, 99, 235, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}