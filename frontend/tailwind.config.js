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
        'lunar-bg':     '#070B14',
        'lunar-surface':'#0d1424',
        'lunar-card':   '#0f1628',
        'lunar-border': '#1a2540',
        'lunar-accent': '#6366F1',
        'lunar-accent2':'#818CF8',
        'lunar-dim':    '#1e2d4a',
        sensor: {
          iirs: '#ef4444',
          tmc2: '#818cf8',
          ohrc: '#f97316',
        },
        decision: {
          same: '#22c55e',
          diff: '#ef4444',
          insuf: '#f59e0b',
        },
      },
      boxShadow: {
        'glow-indigo': '0 0 24px rgba(99,102,241,0.3)',
        'glow-green':  '0 0 24px rgba(34,197,94,0.3)',
        'glow-red':    '0 0 24px rgba(239,68,68,0.3)',
        'glow-amber':  '0 0 24px rgba(245,158,11,0.3)',
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
