import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/sunrin-algorithm-frontend/',
  plugins: [react()],
  build: { target: 'es2022' },
})
