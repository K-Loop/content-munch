/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          navy: '#0B132B',
          'navy-light': '#1C2541',
          'navy-dark': '#060B18',
          cream: '#FBF9F5',
          'cream-dark': '#F0ECE1',
          sand: '#E7E1D3',
          coral: '#D95D39',
          'coral-hover': '#C24D2B',
          'coral-light': '#FCEEE9',
          charcoal: '#1F2937',
          muted: '#6B7280',
          border: '#E5E0D8',
          surface: '#FFFFFF',
          'surface-subtle': '#FAF7F2',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(11, 19, 43, 0.05), 0 2px 6px -1px rgba(11, 19, 43, 0.03)',
        'elevated': '0 12px 36px -4px rgba(11, 19, 43, 0.08), 0 4px 12px -2px rgba(11, 19, 43, 0.04)',
        'floating': '0 24px 60px -8px rgba(11, 19, 43, 0.12), 0 8px 24px -4px rgba(11, 19, 43, 0.06)',
      },
      borderRadius: {
        'studio': '16px',
        'studio-lg': '24px',
        'studio-xl': '32px',
      }
    },
  },
  plugins: [],
}
