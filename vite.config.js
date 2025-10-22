import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 모든 IP에서 접근 가능
    port: 8888, // 8888 포트 사용
    strictPort: true, // 포트 자동 변경 방지
    // Cloudflare Tunnel 사용 시 HTTP로 실행 (Tunnel이 HTTPS 처리)
    cors: true, // CORS 활성화
    hmr: {
      host: 'lunch.stormbug.site', // HMR용 호스트
      port: 8888
    }
  }
})
