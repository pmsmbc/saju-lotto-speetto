import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import articleIndex from './scripts/vite-article-index.js'

export default defineConfig({
  base: '/',
  plugins: [react(), articleIndex()],
  build: {
    rollupOptions: {
      // 가상 모듈 청크 이름이 '_virtual_…'로 시작하면 정적 호스팅(Jekyll 등)이 _파일을 빼먹을 수 있다
      output: { chunkFileNames: (c) => `assets/${c.name.replace(/^_+/, '').replace(/^virtual_/, '')}-[hash].js` },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
})
