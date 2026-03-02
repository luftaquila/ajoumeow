import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/timetable/',
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:5710',
      '/res': 'http://localhost:5710',
    }
  },
  build: {
    outDir: '../server/timetable-dist',
    emptyOutDir: true,
    rollupOptions: {
      external: (id) => {
        // Don't bundle absolute paths to server static resources
        if (id.startsWith('/res/')) return true
        return false
      },
    },
  }
})
