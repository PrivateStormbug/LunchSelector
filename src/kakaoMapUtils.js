import { APP_CONFIG, logger } from './config'

/**
 * Kakao Maps API 로드 관리
 * Promise 기반으로 SDK 로드 상태를 추적합니다.
 */

let kakaoLoadPromise = null

/**
 * Kakao Maps SDK 로드 대기
 * @returns {Promise<void>} SDK 로드 완료 시 resolve
 */
export const waitForKakaoMapsReady = () => {
  if (kakaoLoadPromise) {
    logger.debug('Kakao Maps 캐시된 Promise 반환')
    return kakaoLoadPromise
  }

  kakaoLoadPromise = new Promise((resolve, reject) => {
    const startTime = performance.now()
    let attempts = 0
    const maxAttempts = Math.ceil(APP_CONFIG.performance.kakaoLoadTimeout / 100)

    const checkKakaoReady = () => {
      if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
        const elapsed = performance.now() - startTime
        console.log(`[waitForKakaoMapsReady] SDK 준비 완료: ${elapsed.toFixed(0)}ms`)
        logger.info(`Kakao Maps SDK 로드 완료 (${elapsed.toFixed(0)}ms)`)

        // Kakao Maps 로드 함수 실행
        console.log('[waitForKakaoMapsReady] window.kakao.maps.load() 호출 중...')
        window.kakao.maps.load(() => {
          console.log('[waitForKakaoMapsReady] load() 콜백 실행됨')

          // Places 서비스가 완전히 준비될 때까지 대기
          let placesAttempts = 0
          const placesMaxAttempts = 50 // 5초 대기 (100ms * 50)

          const checkPlacesReady = () => {
            const hasServices = window.kakao?.maps?.services
            const hasPlaces = window.kakao?.maps?.services?.Places

            console.log(`[waitForKakaoMapsReady] Places 확인 시도 ${placesAttempts + 1}/${placesMaxAttempts}:`, {
              services: !!hasServices,
              places: !!hasPlaces,
              servicesKeys: hasServices ? Object.keys(hasServices) : 'N/A'
            })

            if (hasPlaces) {
              const totalElapsed = performance.now() - startTime
              console.log(`[waitForKakaoMapsReady] ✅ Places 서비스 준비 완료: ${totalElapsed.toFixed(0)}ms`)
              logger.info(`✅ Kakao Maps Places 서비스 준비 완료 (${totalElapsed.toFixed(0)}ms)`)
              resolve()
            } else {
              placesAttempts++
              if (placesAttempts >= placesMaxAttempts) {
                const totalElapsed = performance.now() - startTime
                console.log(`[waitForKakaoMapsReady] ⚠️ Places 초기화 타임아웃 (${totalElapsed.toFixed(0)}ms) - 진행 계속`)
                logger.warn(`⚠️ Places 서비스 초기화 지연 (${totalElapsed.toFixed(0)}ms)하지만 진행`)
                resolve() // 타임아웃되어도 진행
                return
              }
              setTimeout(checkPlacesReady, 100)
            }
          }

          checkPlacesReady()
        })
      } else {
        attempts++
        console.log(`[waitForKakaoMapsReady] SDK 미준비 시도 ${attempts}/${maxAttempts}`)

        if (attempts >= maxAttempts) {
          const elapsed = performance.now() - startTime
          const error = new Error(
            `Kakao Maps SDK 로드 실패 (${elapsed.toFixed(0)}ms 초과)`
          )
          console.error(`[waitForKakaoMapsReady] ❌ SDK 로드 실패: ${error.message}`)
          logger.error('Kakao Maps SDK 로드 실패', error)
          reject(error)
          return
        }

        setTimeout(checkKakaoReady, 100)
      }
    }

    checkKakaoReady()
  })

  // 에러 발생 시 Promise 초기화
  kakaoLoadPromise.catch(() => {
    kakaoLoadPromise = null
  })

  return kakaoLoadPromise
}

/**
 * Kakao Maps API 준비 상태 확인
 * @returns {boolean} 준비 여부
 */
export const isKakaoMapsReady = () => {
  // 각 단계별 상세 로깅
  const hasWindow = !!window.kakao
  const hasMaps = hasWindow && !!window.kakao.maps
  const hasServices = hasMaps && !!window.kakao.maps.services
  const hasPlaces = hasServices && !!window.kakao.maps.services.Places

  console.log('[isKakaoMapsReady] 디버깅 정보:')
  console.log('  - window.kakao:', hasWindow, window.kakao ? '✓' : '✗')
  console.log('  - window.kakao.maps:', hasMaps, hasMaps ? '✓' : '✗')
  console.log('  - window.kakao.maps.services:', hasServices, hasServices ? '✓' : '✗')
  console.log('  - window.kakao.maps.services.Places:', hasPlaces, hasPlaces ? '✓' : '✗')

  // 각 객체의 상세 정보 출력
  if (hasWindow) {
    console.log('  - window.kakao 객체 키:', Object.keys(window.kakao))
  }
  if (hasMaps) {
    console.log('  - window.kakao.maps 객체 키:', Object.keys(window.kakao.maps))
  }
  if (hasServices) {
    console.log('  - window.kakao.maps.services 객체 키:', Object.keys(window.kakao.maps.services))
  }

  const isReady = hasWindow && hasMaps && hasServices && hasPlaces
  console.log('[isKakaoMapsReady] 최종 결과:', isReady ? '준비됨 ✓' : '미준비 ✗')

  return isReady
}

/**
 * Kakao Maps 장소 검색 수행 (SDK Places 메서드 사용)
 * useKakaoMap.js와 동일한 방식으로 구현
 * @param {object} options - 검색 옵션 { keyword, searchOptions }
 * @returns {Promise<Array>} 검색 결과
 */
export const searchPlaces = (options) => {
  return new Promise((resolve, reject) => {
    if (!options || !options.keyword) {
      const error = new Error('검색어(keyword)가 필요합니다.')
      logger.error('searchPlaces 파라미터 오류', error)
      console.error('[searchPlaces] ❌ 파라미터 오류:', error.message)
      reject(error)
      return
    }

    try {
      const keyword = String(options.keyword).trim()

      if (!keyword) {
        throw new Error('빈 검색어는 검색할 수 없습니다.')
      }

      // Kakao Maps SDK의 Places 서비스 사용
      if (!window.kakao?.maps?.services?.Places) {
        throw new Error('Kakao Maps Places 서비스가 준비되지 않았습니다.')
      }

      const ps = new window.kakao.maps.services.Places()

      console.log('[searchPlaces] Kakao Maps Places.keywordSearch() called')
      logger.debug(`Kakao Maps SDK API call: ${keyword}`)

      // Search callback
      const searchCallback = (data, status) => {
        try {
          if (status === window.kakao.maps.services.Status.OK) {
            console.log(`Search completed: ${data.length} results`)
            logger.info(`Place search completed: ${data.length} results`)
            resolve(data)
          } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
            console.log('No search results')
            logger.warn('No search results')
            resolve([])
          } else if (status === window.kakao.maps.services.Status.ERROR_RESPONSE) {
            throw new Error('Kakao Maps API server error (ERROR_RESPONSE)')
          } else if (status === window.kakao.maps.services.Status.INVALID_PARAMS) {
            throw new Error('Kakao Maps API parameter error (INVALID_PARAMS)')
          } else {
            throw new Error(`Place search failed: ${status}`)
          }
        } catch (callbackError) {
          console.error('Error in search callback:', callbackError)
          logger.error('Error in search callback', callbackError)
          reject(callbackError)
        }
      }

      // Search execution - pass searchOptions as third parameter
      ps.keywordSearch(keyword, searchCallback, options.searchOptions)
    } catch (error) {
      console.error('❌ 카카오맵 검색 오류:', error)
      logger.error('❌ 카카오맵 검색 중 오류 발생', error)
      reject(error)
    }
  })
}

/**
 * 지도 생성 및 초기화
 * @param {HTMLElement} container - 지도 컨테이너
 * @param {object} options - 지도 옵션
 * @returns {object} 생성된 지도 객체
 */
export const createMap = (container, options = {}) => {
  if (!isKakaoMapsReady()) {
    throw new Error('Kakao Maps API가 준비되지 않았습니다.')
  }

  if (!container || !container.offsetHeight) {
    throw new Error('유효한 지도 컨테이너가 필요합니다.')
  }

  const defaultOptions = {
    center: new window.kakao.maps.LatLng(37.5665, 126.978),
    level: 3
  }

  const mapOptions = { ...defaultOptions, ...options }
  const map = new window.kakao.maps.Map(container, mapOptions)

  logger.debug('Kakao 지도 생성 완료')
  return map
}

/**
 * 마커 생성
 * @param {object} options - 마커 옵션
 * @returns {object} 생성된 마커 객체
 */
export const createMarker = (options) => {
  if (!isKakaoMapsReady()) {
    throw new Error('Kakao Maps API가 준비되지 않았습니다.')
  }

  const markerOptions = {
    position: new window.kakao.maps.LatLng(options.lat, options.lng),
    map: options.map,
    title: options.title
  }

  return new window.kakao.maps.Marker(markerOptions)
}

/**
 * 마커 클릭 이벤트 등록
 * @param {object} marker - 마커 객체
 * @param {function} callback - 클릭 콜백
 */
export const onMarkerClick = (marker, callback) => {
  window.kakao.maps.event.addListener(marker, 'click', callback)
}

/**
 * 지도 중심 이동
 * @param {object} map - 지도 객체
 * @param {number} lat - 위도
 * @param {number} lng - 경도
 * @param {number} level - 줌 레벨 (선택사항)
 */
export const panTo = (map, lat, lng, level = null) => {
  if (!map) return

  const position = new window.kakao.maps.LatLng(lat, lng)
  map.setCenter(position)
  
  if (level !== null) {
    map.setLevel(level)
  }

  logger.debug(`지도 중심 이동: ${lat}, ${lng}`)
}

/**
 * 지도 메모리 정리
 * @param {array} markers - 마커 배열
 * @param {object} map - 지도 객체
 */
export const cleanupMap = (markers = [], map = null) => {
  // 마커 제거
  if (Array.isArray(markers)) {
    markers.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null)
      }
    })
  }

  // 지도 참조 정리
  if (map) {
    // Kakao Maps API에는 map.destroy() 같은 메서드가 없으므로
    // 참조만 제거하고 가비지 컬렉션에 맡김
    logger.debug('지도 정리 완료')
  }
}

export default {
  waitForKakaoMapsReady,
  isKakaoMapsReady,
  searchPlaces,
  createMap,
  createMarker,
  onMarkerClick,
  panTo,
  cleanupMap
}
