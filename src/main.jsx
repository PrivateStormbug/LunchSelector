import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { logger } from './config.js'
import { initializeTheme } from './themeManager.js'
import { registerServiceWorker } from './serviceWorker.js'
import './index.css'

// 테마 초기화
initializeTheme()
logger.debug('테마 초기화 완료')

// Service Worker 등록 (PWA 지원)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await registerServiceWorker()
      if (registration) {
        logger.info('PWA Service Worker 등록 완료')

        // 업데이트 확인
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                logger.info('새로운 Service Worker 버전 이용 가능')
                // 사용자에게 업데이트 알림을 표시할 수 있음
              }
            })
          }
        })
      }
    } catch (error) {
      logger.error('Service Worker 등록 실패', error)
    }
  })
}

// Kakao Maps SDK 동적 로드
const KAKAO_MAP_API_KEY = import.meta.env.VITE_KAKAO_MAP_API_KEY

if (KAKAO_MAP_API_KEY) {
  const script = document.createElement('script')
  script.type = 'text/javascript'
  // autoload=false: SDK 로드만 하고, kakaoMapUtils에서 load() 콜백으로 초기화
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services,drawing&autoload=false`
  script.async = true
  script.onerror = () => {
    console.error('[main.jsx] ❌ Kakao Maps SDK 로드 실패')
    logger.error('❌ Kakao Maps SDK 로드 실패')
  }
  script.onload = () => {
    console.log('[main.jsx] ✅ Kakao Maps SDK 스크립트 로드 완료')
    logger.info('✅ Kakao Maps SDK 로드 완료')
    console.log('[main.jsx] window.kakao:', {
      exists: !!window.kakao,
      hasMaps: !!window.kakao?.maps,
      hasLoad: !!window.kakao?.maps?.load
    })
  }
  document.head.appendChild(script)
  console.log(`[main.jsx] ✨ Kakao Maps SDK 로드 시작 (API Key: ${KAKAO_MAP_API_KEY.substring(0, 8)}...)`)
  logger.debug(`✨ Kakao Maps SDK 로드 시작 (API Key: ${KAKAO_MAP_API_KEY.substring(0, 8)}...)`)
} else {
  console.error('[main.jsx] ❌ VITE_KAKAO_MAP_API_KEY가 설정되지 않았습니다.')
  logger.error('❌ VITE_KAKAO_MAP_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
