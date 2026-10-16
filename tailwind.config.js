/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        'soft-line': 'var(--soft-line)',
        paper: 'var(--paper)',
        cream: 'var(--cream)',
        green: {
          DEFAULT: 'var(--green)',
          dark: 'var(--green-dark)',
          wash: 'var(--green-wash)'
        },
        amber: 'var(--amber)'
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'monospace'],
      }
    }
  },
  plugins: [],
};
