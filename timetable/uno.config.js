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
      course1: 'lightcoral',
      course2: 'gold',
      course3: 'forestgreen',
      calendar: {
        bg: '#F8FAFA',
        today: '#F2F6F8',
        selected: 'rgba(102, 220, 236, 0.8)',
        inactive: '#DCDCE3',
        text: '#424588',
        header: '#99A4AE',
      },
      dust: {
        good: '#32a1ff',
        normal: '#00c73c',
        bad: '#fd9b5a',
        worst: '#ff5959',
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
    'btn-blue': 'inline-block px-4 py-1.5 my-1 mx-0.5 rounded cursor-pointer no-underline text-sm text-white bg-[#2196F3]',
    'btn-green': 'inline-block px-4 py-1.5 my-1 mx-0.5 rounded cursor-pointer no-underline text-sm text-white bg-[#4CAF50]',
    'btn-red': 'inline-block px-4 py-1.5 my-1 mx-0.5 rounded cursor-pointer no-underline text-sm text-white bg-[#f44336]',
    'cal-col': 'inline-block text-[#99A4AE] text-[12px] font-bold py-3 px-[3px] text-center uppercase h-[38px] w-[13.5vw]',
    'cal-body-col': 'w-[13.5vw] h-[13.5vw] max-h-[60px] pb-[2px]',
    'cal-item': 'border-2 border-transparent rounded-[50%] text-[#424588] text-[12px] font-bold w-full h-full flex items-center justify-center cursor-pointer',
  },
  safelist: [
    'animate-rainbow',
  ],
})
