/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#1e293b', // Slate-800
          900: '#0f172a', // Slate-900
          950: '#020617', // Sidebar BG
        },
        cream: {
          50: '#f8fafc',  // Background
          100: '#f1f5f9', // Borders Light
          200: '#e2e8f0', // Borders Dark (Restored)
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(245, 158, 11, 0.3)',
      }
    },
  },
  plugins: [],
}
