/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'rc-bg': '#0a0a0a',
        'rc-panel': '#0f0f0f',
        'rc-purple': '#7C3AED',
        'rc-purple-hover': '#8B5CF6',
        'rc-green': '#39FF14',
        'rc-border': 'rgba(255,255,255,0.1)',
      },
      fontFamily: {
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
