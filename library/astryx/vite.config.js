import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 見本ページ（demo/）を動かすための設定。ポートはアプリ本体（5173）とずらす。
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
})
