/**
 * Service Worker Implementation
 * 캐싱 전략, 오프라인 지원, 푸시 알림 등을 처리
 */

const CACHE_NAME = 'lunch-selector-v1'
const STATIC_CACHE = 'lunch-selector-static-v1'
const DYNAMIC_CACHE = 'lunch-selector-dynamic-v1'

// 정적 자산 목록
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
]

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('[Service Worker] 설치 시작')

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] 정적 자산 캐싱')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
      .catch((error) => console.error('[Service Worker] 설치 실패:', error))
  )
})

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 활성화')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[Service Worker] 이전 캐시 삭제:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// 네트워크 요청 처리
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // GET 요청만 캐싱
  if (request.method !== 'GET') {
    return
  }

  // API 요청 처리
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // 정적 자산 처리 (JS, CSS, 폰트 등)
  if (
    url.pathname.match(/\.(js|css|woff|woff2|ttf|eot|svg)$/) ||
    url.pathname.includes('/fonts/') ||
    url.pathname.includes('/assets/')
  ) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // 이미지 처리
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
    event.respondWith(cacheFirstStrategy(request, 'images'))
    return
  }

  // HTML 및 기타 요청 (Network First)
  event.respondWith(networkFirstStrategy(request))
})

/**
 * Cache First 전략 (캐시 우선, 네트워크 폴백)
 * 정적 자산에 적합
 */
function cacheFirstStrategy(request, cacheName = DYNAMIC_CACHE) {
  return caches.match(request)
    .then((response) => {
      if (response) {
        return response
      }

      return fetch(request)
        .then((response) => {
          // 성공한 응답만 캐싱
          if (!response || response.status !== 200 || response.type === 'error') {
            return response
          }

          const responseClone = response.clone()
          caches.open(cacheName)
            .then((cache) => {
              cache.put(request, responseClone)
            })

          return response
        })
    })
    .catch(() => {
      // 오프라인 상황에서 캐시된 응답 반환
      return caches.match(request)
        .then((response) => {
          if (response) {
            return response
          }

          // 이미지 요청이면 기본 이미지 반환
          if (request.destination === 'image') {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f0f0f0" width="100" height="100"/></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            )
          }

          return new Response('오프라인 상태입니다. 인터넷 연결을 확인해주세요.', {
            status: 503,
            statusText: 'Service Unavailable'
          })
        })
    })
}

/**
 * Network First 전략 (네트워크 우선, 캐시 폴백)
 * API 요청과 동적 콘텐츠에 적합
 */
function networkFirstStrategy(request) {
  return fetch(request)
    .then((response) => {
      // 성공한 응답은 캐싱
      if (response && response.status === 200) {
        const responseClone = response.clone()
        caches.open(DYNAMIC_CACHE)
          .then((cache) => {
            cache.put(request, responseClone)
          })
      }
      return response
    })
    .catch(() => {
      // 네트워크 실패 시 캐시에서 가져오기
      return caches.match(request)
        .then((response) => {
          if (response) {
            return response
          }

          return new Response('네트워크 연결을 확인해주세요.', {
            status: 503,
            statusText: 'Service Unavailable'
          })
        })
    })
}

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] 동기화 이벤트:', event.tag)

  if (event.tag === 'menu-sync') {
    event.waitUntil(syncMenuData())
  }
})

/**
 * 메뉴 데이터 동기화
 */
async function syncMenuData() {
  try {
    // IndexedDB에서 변경사항을 가져와서 서버와 동기화
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp: Date.now() })
    })

    if (response.ok) {
      console.log('[Service Worker] 동기화 완료')
      return true
    }
  } catch (error) {
    console.error('[Service Worker] 동기화 실패:', error)
    throw error // 재시도하도록 throw
  }
}

// 푸시 알림
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || '점심 메뉴 추천'
  const options = {
    body: data.body || '새로운 메뉴가 준비되었습니다!',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: 'lunch-selector-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: '보기'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].url === '/' && 'focus' in clientList[i]) {
              return clientList[i].focus()
            }
          }
          if (clients.openWindow) {
            return clients.openWindow('/')
          }
        })
    )
  }
})

// 메시지 수신 처리
self.addEventListener('message', (event) => {
  console.log('[Service Worker] 메시지 수신:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(DYNAMIC_CACHE)
      .then(() => {
        event.ports[0].postMessage({ success: true })
      })
  }
})

// 주기적 백그라운드 동기화 (선택사항)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'menu-daily-update') {
    event.waitUntil(
      fetch('/api/menu-updates')
        .then((response) => response.json())
        .then((data) => {
          // 업데이트된 메뉴 데이터 저장
          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put('/api/menus', new Response(JSON.stringify(data)))
            })
        })
    )
  }
})

console.log('[Service Worker] 로드 완료')
