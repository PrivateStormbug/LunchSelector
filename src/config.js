// 앱 설정 및 환경 변수

export const APP_CONFIG = {
  // 앱 정보
  appName: '점심 메뉴 추천',
  version: '1.0.0',
  
  // 성능 설정
  performance: {
    kakaoLoadTimeout: 5000,        // Kakao Maps 로드 타임아웃 (ms)
    mapInitDelay: 200,              // 지도 초기화 지연 (ms)
    spinDuration: 3000,             // 스피닝 애니메이션 시간 (ms)
    spinInterval: 50,               // 스피닝 갱신 주기 (ms)
    debounceDelay: 300,             // 검색 디바운스 (ms)
    searchRadius: 5000              // 음식점 검색 반경 (m)
  },

  // 데이터 저장소 설정
  storage: {
    menuKey: 'lunchSelector_customMenus',
    historyKey: 'lunchSelector_history',
    favoritesKey: 'lunchSelector_favorites',
    settingsKey: 'lunchSelector_settings',
    themeKey: 'lunchSelector_theme'
  },

  // 데이터 제한
  limits: {
    maxMenusPerCategory: 100,
    maxMenuLength: 50,
    maxHistoryItems: 100,
    maxMenuNameInput: 50
  },

  // 기본값
  defaults: {
    theme: 'light',                 // 'light' | 'dark'
    minRating: 0,                    // 최소 평점
    language: 'ko'                   // 'ko' | 'en'
  },

  // Kakao Maps 설정
  kakao: {
    libraries: ['services'],
    categoryCode: 'FD6',             // 음식점 카테고리
    sortBy: 'DISTANCE'               // 거리순 정렬
  },

  // 로깅 설정
  logging: {
    enabled: process.env.NODE_ENV === 'development',
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
  }
}

// 환경 감지
export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isMobile: () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
  isTablet: () => /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
  isDesktop: () => !ENV.isMobile() && !ENV.isTablet()
}

// 로거 유틸리티
export const logger = {
  debug: (message, data) => {
    if (APP_CONFIG.logging.enabled && APP_CONFIG.logging.level === 'debug') {
      console.log(`[DEBUG] ${message}`, data || '')
    }
  },
  
  info: (message, data) => {
    if (APP_CONFIG.logging.enabled) {
      console.info(`[INFO] ${message}`, data || '')
    }
  },
  
  warn: (message, data) => {
    if (APP_CONFIG.logging.enabled) {
      console.warn(`[WARN] ${message}`, data || '')
    }
  },
  
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error || '')
  }
}

// 성능 모니터링
export const performance = {
  marks: {},

  start: (name) => {
    performance.marks[name] = {
      start: window.performance.now(),
      label: name
    }
  },

  end: (name) => {
    if (!performance.marks[name]) {
      logger.warn(`Performance mark '${name}' not found`)
      return 0
    }

    const duration = window.performance.now() - performance.marks[name].start
    logger.debug(`${name} took ${duration.toFixed(2)}ms`, { name, duration })

    delete performance.marks[name]
    return duration
  }
}

// 기능 플래그 (향후 A/B 테스팅 등에 사용)
export const FEATURES = {
  enableDarkMode: true,
  enableFavorites: true,
  enableHistory: true,
  enableSharing: true,
  enablePWA: true,
  enableAIRecommendation: false  // 미구현
}

export default APP_CONFIG
