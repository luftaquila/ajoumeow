import { defineConfig, presetIcons, transformerDirectives } from 'unocss'
import presetWind4 from '@unocss/preset-wind4'

export default defineConfig({
  presets: [
    presetWind4({
      preflights: {
        reset: false,
      },
    }),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  transformers: [
    transformerDirectives(),
  ],
  theme: {
    colors: {
      primary: '#2196F3',
      course1: {
        DEFAULT: '#F87171',
        bg: '#FEF2F2',
        text: '#DC2626',
      },
      course2: {
        DEFAULT: '#FBBF24',
        bg: '#FFFBEB',
        text: '#D97706',
      },
      course3: {
        DEFAULT: '#34D399',
        bg: '#ECFDF5',
        text: '#059669',
      },
      surface: {
        DEFAULT: '#FFFFFF',
        muted: '#F5F6FA',
        border: '#E8ECF1',
      },
      text: {
        DEFAULT: '#1A1A2E',
        secondary: '#6B7280',
        muted: '#9CA3AF',
      },
      calendar: {
        bg: '#F5F6FA',
        today: '#EEF2FF',
        selected: '#DBEAFE',
        inactive: '#D1D5DB',
        text: '#1A1A2E',
        header: '#9CA3AF',
      },
      dust: {
        good: '#3B82F6',
        normal: '#22C55E',
        bad: '#F59E0B',
        worst: '#EF4444',
      },
    },
    animation: {
      keyframes: {
        rainbow: `{
          from  { color: rgba(255,   0,   0, 0.5); }
           8.3% { color: rgba(255,   0, 127, 0.5); }
          16.6% { color: rgba(255,   0, 255, 0.5); }
            25% { color: rgba(127,   0, 255, 0.5); }
          33.3% { color: rgba(  0,   0, 255, 0.5); }
          41.6% { color: rgba(  0, 127, 255, 0.5); }
            50% { color: rgba(  0, 255, 255, 0.5); }
          58.3% { color: rgba(  0, 255, 127, 0.5); }
          66.6% { color: rgba(  0, 255,   0, 0.5); }
            75% { color: rgba(127, 255,   0, 0.5); }
          83.3% { color: rgba(255, 255,   0, 0.5); }
          91.6% { color: rgba(255, 127,   0, 0.5); }
          to    { color: rgba(255,   0,   0, 0.5); }
        }`,
      },
      durations: {
        rainbow: '2s',
      },
      counts: {
        rainbow: 'infinite',
      },
    },
  },
  shortcuts: {
    'btn-blue': 'inline-block px-4 py-1.5 my-1 mx-0.5 rounded-lg cursor-pointer no-underline text-sm text-white bg-primary',
    'btn-green': 'inline-block px-4 py-1.5 my-1 mx-0.5 rounded-lg cursor-pointer no-underline text-sm text-white bg-[#22C55E]',
    'btn-red': 'inline-block px-4 py-1.5 my-1 mx-0.5 rounded-lg cursor-pointer no-underline text-sm text-white bg-[#EF4444]',
    'cal-col': 'inline-block text-text-muted text-[11px] font-semibold tracking-wide py-3 px-[3px] text-center uppercase h-[38px] w-[13.5vw]',
    'cal-body-col': 'w-[13.5vw] h-[13.5vw] max-h-[60px] pb-[2px]',
    'cal-item': 'border-2 border-transparent rounded-full text-calendar-text text-[12px] font-semibold w-full h-full flex items-center justify-center cursor-pointer transition-all duration-200 ease-out',
    'card': 'bg-surface rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-surface-border',
    'card-section': 'bg-surface rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-surface-border p-5',
  },
  safelist: [
    'animate-rainbow',
    'bg-course1', 'bg-course2', 'bg-course3',
    'bg-course1-bg', 'bg-course2-bg', 'bg-course3-bg',
    'border-course1', 'border-course2', 'border-course3',
    'text-course1', 'text-course2', 'text-course3',
    'text-course1-text', 'text-course2-text', 'text-course3-text',
  ],
})
