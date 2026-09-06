/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Pure charcoal / carbon tones — NOT navy blue
        'lunar-bg':      '#080808',
        'lunar-surface': '#0c0c0c',
        'lunar-card':    '#0a0a0a',
        'lunar-border':  '#1c1c1c',
        'lunar-accent':  '#d4940a',
        'lunar-accent2': '#f5b731',
        'lunar-dim':     '#181818',
        sensor: {
          iirs: '#ef4444',
          tmc2: '#f59e0b',
          ohrc: '#d4d4d4',
        },
        decision: {
          same: '#22c55e',
          diff: '#ef4444',
          insuf: '#f59e0b',
        },
      },
      boxShadow: {
        'glow-amber':  '0 0 20px rgba(212,148,10,0.2)',
        'glow-green':  '0 0 20px rgba(34,197,94,0.2)',
        'glow-red':    '0 0 20px rgba(239,68,68,0.2)',
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
        'decision':   'decision-appear 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
