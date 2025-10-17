import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 모든 IP에서 접근 가능
    port: 8888, // 8888 포트 사용
    strictPort: true, // 포트 자동 변경 방지
  }
})
