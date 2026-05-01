import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          700: '#1d4ed8',
        },
        ink: {
          DEFAULT: '#111827',
          medium:  '#374151',
          light:   '#6b7280',
          lighter: '#9ca3af',
        },
        surface: '#f9fafb',
        border:  '#e5e7eb',
        chip: {
          good:      { bg: '#d1fae5', fg: '#065f46' },
          ok:        { bg: '#fef3c7', fg: '#92400e' },
          bad:       { bg: '#fee2e2', fg: '#991b1b' },
          omission:  { bg: '#e5e7eb', fg: '#6b7280' },
          insertion: { bg: '#ede9fe', fg: '#5b21b6' },
        },
        star: {
          lit:   '#f59e0b',
          unlit: '#d1d5db',
        },
        mic: '#10b981',
        danger: '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        page: '780px',
      },
      backgroundImage: {
        'hero-fade': 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)',
      },
      boxShadow: {
        chip: '0 0 0 2px rgba(37, 99, 235, 0.33)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite linear',
      },
    },
  },
  plugins: [],
} satisfies Config
