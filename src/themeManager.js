/**
 * 테마 관리 시스템 (라이트/다크 모드)
 * 사용자의 테마 선호도를 저장하고 관리
 * 
 * 주요 기능:
 * - 라이트/다크 모드 토글
 * - 시스템 기본 설정 감지
 * - 사용자 선호도 저장
 * - CSS 변수를 통한 동적 테마 적용
 */

import { logger } from './config'

const THEME_STORAGE_KEY = 'lunch_selector_theme'
const DARK_MODE_CLASS = 'dark-mode'

// 테마 정의
const THEMES = {
  light: {
    name: 'light',
    label: '라이트 모드',
    emoji: '☀️',
    colors: {
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#1a1a1a',
      textSecondary: '#666666',
      primary: '#667eea',
      secondary: '#764ba2',
      border: '#e0e0e0',
      shadowLight: 'rgba(0, 0, 0, 0.05)',
      shadowMedium: 'rgba(0, 0, 0, 0.1)',
      shadowHeavy: 'rgba(0, 0, 0, 0.15)'
    }
  },
  dark: {
    name: 'dark',
    label: '다크 모드',
    emoji: '🌙',
    colors: {
      background: '#1a1a1a',
      surface: '#2d2d2d',
      text: '#ffffff',
      textSecondary: '#b0b0b0',
      primary: '#7c8ff5',
      secondary: '#9b7dcf',
      border: '#3d3d3d',
      shadowLight: 'rgba(0, 0, 0, 0.2)',
      shadowMedium: 'rgba(0, 0, 0, 0.4)',
      shadowHeavy: 'rgba(0, 0, 0, 0.6)'
    }
  }
}

/**
 * 시스템 기본 테마 감지
 * @returns {string} 'light' 또는 'dark'
 */
export function getSystemTheme() {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  } catch (error) {
    logger.debug('시스템 테마 감지 실패, 라이트 모드 사용')
    return 'light'
  }
}

/**
 * 저장된 테마 가져오기
 * @returns {string} 저장된 테마 ('light' 또는 'dark')
 */
export function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved && (saved === 'light' || saved === 'dark')) {
      return saved
    }
    return null
  } catch (error) {
    logger.error('저장된 테마 조회 실패', error)
    return null
  }
}

/**
 * 현재 테마 가져오기
 * 우선순위: 저장된 설정 > 시스템 기본값
 * @returns {string} 현재 테마
 */
export function getCurrentTheme() {
  try {
    const saved = getSavedTheme()
    if (saved) return saved
    return getSystemTheme()
  } catch (error) {
    logger.error('현재 테마 조회 실패', error)
    return 'light'
  }
}

/**
 * 테마 적용
 * @param {string} theme - 적용할 테마 ('light' 또는 'dark')
 * @returns {boolean} 성공 여부
 */
export function applyTheme(theme) {
  try {
    if (!THEMES[theme]) {
      logger.warn(`알 수 없는 테마: ${theme}`)
      return false
    }

    const root = document.documentElement
    const themeColors = THEMES[theme].colors

    // CSS 변수 설정
    Object.entries(themeColors).forEach(([key, value]) => {
      const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      root.style.setProperty(cssVar, value)
    })

    // DOM 클래스 업데이트
    if (theme === 'dark') {
      document.documentElement.classList.add(DARK_MODE_CLASS)
    } else {
      document.documentElement.classList.remove(DARK_MODE_CLASS)
    }

    // 저장소에 저장
    localStorage.setItem(THEME_STORAGE_KEY, theme)

    logger.info(`테마 적용: ${theme}`)
    return true
  } catch (error) {
    logger.error('테마 적용 실패', error)
    return false
  }
}

/**
 * 테마 토글
 * @returns {string} 변경된 테마
 */
export function toggleTheme() {
  try {
    const current = getCurrentTheme()
    const newTheme = current === 'light' ? 'dark' : 'light'
    applyTheme(newTheme)
    logger.info(`테마 토글: ${current} → ${newTheme}`)
    return newTheme
  } catch (error) {
    logger.error('테마 토글 실패', error)
    return getCurrentTheme()
  }
}

/**
 * 특정 테마로 변경
 * @param {string} theme - 변경할 테마
 * @returns {boolean} 성공 여부
 */
export function setTheme(theme) {
  return applyTheme(theme)
}

/**
 * 다크모드 여부 확인
 * @returns {boolean} 다크모드 사용 중 여부
 */
export function isDarkMode() {
  return getCurrentTheme() === 'dark'
}

/**
 * 시스템 기본값으로 초기화
 * @returns {boolean} 성공 여부
 */
export function resetToSystemTheme() {
  try {
    const systemTheme = getSystemTheme()
    applyTheme(systemTheme)
    localStorage.removeItem(THEME_STORAGE_KEY)
    logger.info('시스템 기본 테마로 초기화')
    return true
  } catch (error) {
    logger.error('테마 초기화 실패', error)
    return false
  }
}

/**
 * 테마 정보 조회
 * @param {string} theme - 테마명
 * @returns {Object} 테마 정보
 */
export function getThemeInfo(theme = null) {
  const t = theme || getCurrentTheme()
  return THEMES[t] || THEMES.light
}

/**
 * 모든 테마 목록 조회
 * @returns {Array} 테마 배열
 */
export function getAvailableThemes() {
  return Object.values(THEMES).map(theme => ({
    value: theme.name,
    label: theme.label,
    emoji: theme.emoji
  }))
}

/**
 * 시스템 테마 변경 감지 리스너 설정
 * @param {Function} callback - 테마 변경 시 호출될 콜백
 * @returns {Function} 리스너 제거 함수
 */
export function onSystemThemeChange(callback) {
  try {
    if (!window.matchMedia) {
      logger.warn('matchMedia를 지원하지 않는 브라우저')
      return () => {}
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      const newTheme = e.matches ? 'dark' : 'light'
      // 사용자가 명시적으로 테마를 설정하지 않았을 때만 자동 변경
      if (!getSavedTheme()) {
        applyTheme(newTheme)
        callback(newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  } catch (error) {
    logger.error('시스템 테마 감지 리스너 설정 실패', error)
    return () => {}
  }
}

/**
 * 테마 초기화 및 적용
 * 앱 시작 시 호출
 * @returns {string} 적용된 테마
 */
export function initializeTheme() {
  try {
    const theme = getCurrentTheme()
    applyTheme(theme)
    logger.info(`테마 초기화: ${theme}`)
    return theme
  } catch (error) {
    logger.error('테마 초기화 실패', error)
    return 'light'
  }
}

export default {
  getSystemTheme,
  getSavedTheme,
  getCurrentTheme,
  applyTheme,
  toggleTheme,
  setTheme,
  isDarkMode,
  resetToSystemTheme,
  getThemeInfo,
  getAvailableThemes,
  onSystemThemeChange,
  initializeTheme,
  THEMES
}
