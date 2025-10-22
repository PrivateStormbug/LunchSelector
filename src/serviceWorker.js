/**
 * Service Worker for PWA
 * 오프라인 지원, 캐싱 전략, 백그라운드 동기화
 */

const CACHE_NAME = 'lunch-selector-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
]

/**
 * Service Worker 등록
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('✓ Service Worker 등록 성공:', registration)
      return registration
    } catch (error) {
      console.error('✗ Service Worker 등록 실패:', error)
      return null
    }
  }
}

/**
 * Service Worker 등록 해제
 */
export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
      }
      console.log('✓ Service Worker 등록 해제 완료')
      return true
    } catch (error) {
      console.error('✗ Service Worker 등록 해제 실패:', error)
      return false
    }
  }
}

/**
 * 캐시 업데이트 확인
 */
export function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update()
    })
  }
}

/**
 * 오프라인 상태 확인
 */
export function isOnline() {
  return navigator.onLine
}

/**
 * 온라인/오프라인 상태 변경 리스너
 */
export function onConnectionChange(callback) {
  window.addEventListener('online', () => callback(true))
  window.addEventListener('offline', () => callback(false))

  return () => {
    window.removeEventListener('online', () => callback(true))
    window.removeEventListener('offline', () => callback(false))
  }
}

/**
 * 백그라운드 동기화 등록 (오프라인 중 변경사항 동기화)
 */
export async function registerBackgroundSync(tag = 'menu-sync') {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register(tag)
      console.log(`✓ 백그라운드 동기화 등록: ${tag}`)
      return true
    } catch (error) {
      console.error('✗ 백그라운드 동기화 등록 실패:', error)
      return false
    }
  }
}

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  checkForUpdates,
  isOnline,
  onConnectionChange,
  registerBackgroundSync
}
