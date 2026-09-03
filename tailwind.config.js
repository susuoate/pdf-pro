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
        brand: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
          950: '#4C0519',
        },
        suite: {
          organize: '#E11D48',  // Rose / Crimson
          convert: '#10B981',   // Emerald
          edit: '#3B82F6',      // Blue
          security: '#8B5CF6',  // Purple
        },
      },
      fontFamily: {
        sans: ['Sarabun', 'Prompt', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        thai: ['Sarabun', 'Prompt', 'sans-serif'],
        display: ['Prompt', 'Sarabun', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      lineHeight: {
        'thai-normal': '1.6',
        'thai-relaxed': '1.8',
        'thai-loose': '2.0',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
