import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Kakao Maps SDK 동적 로드
const KAKAO_MAP_API_KEY = import.meta.env.VITE_KAKAO_MAP_API_KEY

if (KAKAO_MAP_API_KEY) {
  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services&autoload=false`
  script.async = true
  document.head.appendChild(script)
} else {
  console.warn('⚠️ Kakao Map API Key가 설정되지 않았습니다. .env 파일을 확인해주세요.')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
