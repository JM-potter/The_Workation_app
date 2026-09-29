import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Logo-derived teal palette; darker tones maintain contrast for text/buttons.
        blue: { 50: '#eefaf8', 100: '#d2f2ee', 200: '#a6e4df', 300: '#69d3cc', 400: '#07b5ad', 500: '#049da4', 600: '#056f7c', 700: '#066875', 800: '#10545f', 900: '#12464e', 950: '#062b32' },
        surface:  '#0F172A',
        card:     '#1E293B',
        card2:    '#263548',
        border:   '#334155',
        muted:    '#94A3B8',
        dim:      '#64748B',
      },
    },
  },
  plugins: [],
}
export default config
