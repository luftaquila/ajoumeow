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
      primary: {
        DEFAULT: '#6366F1',
        light: '#818CF8',
        dark: '#4F46E5',
      },
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
        muted: '#F8FAFC',
        dim: '#F1F5F9',
        border: '#E2E8F0',
      },
      text: {
        DEFAULT: '#0F172A',
        secondary: '#475569',
        muted: '#94A3B8',
      },
      saturday: '#818CF8',
      sunday: '#F87171',
      accent: '#34D399',
      calendar: {
        bg: '#F8FAFC',
        today: '#EEF2FF',
        selected: '#E0E7FF',
        inactive: '#CBD5E1',
        text: '#0F172A',
        header: '#64748B',
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
    'btn-blue': 'inline-block px-5 py-2 my-1 mx-0.5 rounded-xl cursor-pointer no-underline text-sm text-white font-medium bg-primary hover:bg-primary-dark transition-colors',
    'btn-green': 'inline-block px-5 py-2 my-1 mx-0.5 rounded-xl cursor-pointer no-underline text-sm text-white font-medium bg-[#22C55E] hover:bg-[#16A34A] transition-colors',
    'btn-red': 'inline-block px-5 py-2 my-1 mx-0.5 rounded-xl cursor-pointer no-underline text-sm text-white font-medium bg-[#EF4444] hover:bg-[#DC2626] transition-colors',
    'cal-col': 'text-calendar-header text-[11px] font-semibold tracking-wider py-2.5 text-center uppercase',
    'cal-body-col': 'aspect-square p-[2px]',
    'cal-item': 'border-2 border-transparent rounded-xl text-calendar-text text-[12px] font-semibold w-full h-full flex items-center justify-center cursor-pointer transition-all duration-200 ease-out bg-no-repeat',
    'shadow-card': 'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]',
    'shadow-card-hover': 'shadow-[0_2px_6px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.1)]',
    'shadow-elevated': 'shadow-[0_4px_12px_rgba(0,0,0,0.08),0_16px_40px_rgba(0,0,0,0.12)]',
    'card': 'bg-surface rounded-2xl shadow-card border border-surface-border/70',
    'card-section': 'bg-surface rounded-2xl shadow-card border border-surface-border/70 p-6',
  },
  safelist: [
    'animate-rainbow',
    'bg-course1', 'bg-course2', 'bg-course3',
    'bg-course1-bg', 'bg-course2-bg', 'bg-course3-bg',
    'border-course1', 'border-course2', 'border-course3',
    'text-course1', 'text-course2', 'text-course3',
    'text-course1-text', 'text-course2-text', 'text-course3-text',
    'text-dust-good', 'text-dust-normal', 'text-dust-bad', 'text-dust-worst',
    'bg-primary/10', 'bg-primary/5', 'hover:bg-primary/5',
    'bg-surface-dim', 'bg-surface-dim/50',
    'border-surface-border/50', 'border-surface-border/60', 'border-surface-border/70',
    'from-primary', 'via-primary-light', 'to-[#A78BFA]',
    'hover:text-primary', 'hover:text-primary-dark', 'hover:bg-primary-dark',
    'border-course1/20', 'border-course2/20', 'border-course3/20',
    'shadow-elevated',
  ],
})
