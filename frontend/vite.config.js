import { resolve, extname } from 'path'
import { existsSync } from 'fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'

// SPA apps that use client-side routing (vue-router)
const spaRoots = ['/console', '/timetable']

// Handle MPA directory routing in dev server:
// - Rewrite / to /index.html (serves public/index.html)
// - SPA fallback: /console/*, /timetable/* subroutes → their index.html
// - Redirect /path to /path/ when path/index.html exists
function serveMPA() {
  return {
    name: 'serve-mpa',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (url === '/') {
          req.url = '/index.html'
          return next()
        }
        // SPA fallback: rewrite subroutes to the SPA's index.html
        for (const root of spaRoots) {
          if (url.startsWith(root + '/') && !extname(url)) {
            req.url = root + '/index.html'
            return next()
          }
        }
        if (!url.endsWith('/') && !extname(url)) {
          const rel = url.slice(1)
          if (existsSync(resolve(__dirname, rel, 'index.html')) ||
              existsSync(resolve(__dirname, 'public', rel, 'index.html'))) {
            const qs = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
            res.writeHead(301, { Location: url + '/' + qs })
            res.end()
            return
          }
        }
        next()
      })
    },
  }
}

export default defineConfig({
  appType: 'mpa',
  plugins: [serveMPA(), UnoCSS(), vue()],
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:5710',
      '/res': 'http://localhost:5710',
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function', 'slash-div', 'abs-percent'],
      },
    },
  },
  build: {
    target: 'esnext',
    outDir: '../server/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        timetable: resolve(__dirname, 'timetable/index.html'),
        dashboard: resolve(__dirname, 'dashboard/index.html'),
        apply: resolve(__dirname, 'apply/index.html'),
        register: resolve(__dirname, 'register/index.html'),
        'console': resolve(__dirname, 'console/index.html'),
        gallery: resolve(__dirname, 'gallery/index.html'),
        'gallery-cats': resolve(__dirname, 'gallery/cats.html'),
        'gallery-upload': resolve(__dirname, 'gallery/upload.html'),
        'gallery-ranking': resolve(__dirname, 'gallery/ranking.html'),
        'gallery-photographers': resolve(__dirname, 'gallery/photographers.html'),
        'gallery-mypage': resolve(__dirname, 'gallery/mypage.html'),
        'gallery-cat': resolve(__dirname, 'gallery/cat/index.html'),
        'gallery-photo': resolve(__dirname, 'gallery/photo/index.html'),
        'gallery-photographer': resolve(__dirname, 'gallery/photographer/index.html'),
      },
      external: (id) => id.startsWith('/res/'),
    },
  },
})
