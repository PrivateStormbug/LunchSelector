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
        logger.info(`Kakao Maps SDK 로드 완료 (${elapsed.toFixed(0)}ms)`)
        
        // Kakao Maps 로드 함수 실행
        window.kakao.maps.load(() => {
          resolve()
        })
      } else {
        attempts++
        if (attempts >= maxAttempts) {
          const elapsed = performance.now() - startTime
          const error = new Error(
            `Kakao Maps SDK 로드 실패 (${elapsed.toFixed(0)}ms 초과)`
          )
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
  return (
    window.kakao &&
    window.kakao.maps &&
    window.kakao.maps.services &&
    window.kakao.maps.services.Places
  )
}

/**
 * Kakao Maps 장소 검색 수행
 * @param {object} options - 검색 옵션
 * @returns {Promise<Array>} 검색 결과
 */
export const searchPlaces = (options) => {
  return new Promise((resolve, reject) => {
    if (!isKakaoMapsReady()) {
      reject(new Error('Kakao Maps API가 준비되지 않았습니다.'))
      return
    }

    try {
      const placesService = new window.kakao.maps.services.Places()

      // searchOptions 기본값 설정
      const searchOptions = {
        location: options.searchOptions?.location,
        radius: options.searchOptions?.radius || 1000,
        sort: options.searchOptions?.sort || window.kakao.maps.services.SortBy.DISTANCE,
        size: options.searchOptions?.size || 20,
        page: options.searchOptions?.page || 1
      }

      // 콜백 함수 정의
      const callback = (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          logger.debug(`장소 검색 완료: ${data.length}개 결과`)
          resolve(data)
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          logger.warn('검색 결과 없음')
          resolve([])
        } else if (status === window.kakao.maps.services.Status.ERROR_RESPONSE) {
          const error = new Error('카카오맵 API 서버 오류 (ERROR_RESPONSE)')
          logger.error('장소 검색 실패 - API 오류', error)
          reject(error)
        } else if (status === window.kakao.maps.services.Status.INVALID_PARAMS) {
          const error = new Error('카카오맵 API 매개변수 오류 (INVALID_PARAMS)')
          logger.error('장소 검색 실패 - 잘못된 매개변수', error)
          reject(error)
        } else {
          const error = new Error(`장소 검색 실패: ${status}`)
          logger.error('장소 검색 실패', error)
          reject(error)
        }
      }

      // 검색 실행
      placesService.keywordSearch(options.keyword, callback, searchOptions)
    } catch (error) {
      logger.error('카카오맵 검색 중 예외 발생', error)
      reject(new Error(`카카오맵 검색 오류: ${error.message}`))
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
