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
 * Kakao Maps 장소 검색 수행
 * @param {object} options - 검색 옵션 { keyword, searchOptions }
 * @returns {Promise<Array>} 검색 결과
 */
export const searchPlaces = (options) => {
  return new Promise((resolve, reject) => {
    if (!isKakaoMapsReady()) {
      const error = new Error('Kakao Maps API가 준비되지 않았습니다.')
      logger.error('searchPlaces 실패', error)
      reject(error)
      return
    }

    if (!options || !options.keyword) {
      const error = new Error('검색어(keyword)가 필요합니다.')
      logger.error('searchPlaces 파라미터 오류', error)
      reject(error)
      return
    }

    try {
      const placesService = new window.kakao.maps.services.Places()
      const keyword = String(options.keyword).trim()

      if (!keyword) {
        throw new Error('빈 검색어는 검색할 수 없습니다.')
      }

      // searchOptions 구성 (필수 항목만 포함)
      const searchOptions = {}

      // 기본 검색 옵션 설정
      searchOptions.page = 1
      searchOptions.size = Number(options.searchOptions?.size) || 15

      console.log('[searchPlaces] 검색 옵션 구성 중:')
      console.log('  - keyword:', keyword)
      console.log('  - size:', searchOptions.size)

      // location 설정: LatLng 객체를 올바르게 처리
      // LatLng 객체 {La: lng, Ma: lat} → location으로 전달
      if (options.searchOptions?.location && options.searchOptions?.radius) {
        const locObj = options.searchOptions.location

        // LatLng 객체인지 확인하고 좌표 추출
        let lat, lng
        if (locObj.getLat && locObj.getLng) {
          // LatLng 객체의 메서드 사용
          lat = locObj.getLat()
          lng = locObj.getLng()
          console.log('[searchPlaces] LatLng 메서드로 좌표 추출')
        } else if (locObj.Ma !== undefined && locObj.La !== undefined) {
          // LatLng 객체의 속성 사용 (Ma=lat, La=lng)
          lat = locObj.Ma
          lng = locObj.La
          console.log('[searchPlaces] LatLng 속성으로 좌표 추출')
        } else if (locObj.lat !== undefined && locObj.lng !== undefined) {
          // 일반 좌표 객체
          lat = locObj.lat
          lng = locObj.lng
          console.log('[searchPlaces] 일반 좌표 객체 사용')
        } else {
          throw new Error('유효한 location 객체가 아닙니다.')
        }

        console.log(`[searchPlaces] 추출된 좌표: lat=${lat}, lng=${lng}`)

        // LatLng 객체를 다시 생성해서 전달 (올바른 형식)
        // 또는 직접 좌표 전달
        searchOptions.location = new window.kakao.maps.LatLng(lat, lng)
        searchOptions.radius = Number(options.searchOptions.radius)

        console.log('  - location: 설정됨 (반경 기반 검색)')
        console.log('  - radius:', searchOptions.radius + 'm')
        console.log(`  - 실제 좌표: ${lat}, ${lng}`)
        logger.debug(`위치 기반 검색: 반경 ${searchOptions.radius}m`)
      } else {
        console.log('  - location: 설정 안 함 (일반 키워드 검색)')
        logger.debug(`일반 키워드 검색 수행`)
      }

      // sort 설정 (선택 - 거리순)
      if (options.searchOptions?.sort) {
        searchOptions.sort = options.searchOptions.sort
        console.log('  - sort: 거리순')
      }

      logger.debug(`카카오맵 검색 시작: "${keyword}"`)
      logger.debug(`searchOptions 설정 완료`, {
        keyword,
        page: searchOptions.page,
        size: searchOptions.size,
        radius: searchOptions.radius,
        hasLocation: !!searchOptions.location
      })

      // 콜백 함수 정의
      const callback = (data, status) => {
        logger.debug(`카카오맵 검색 콜백 호출 - status: ${status}`)

        // status가 null이거나 undefined인 경우 처리
        if (!status) {
          const error = new Error('카카오맵 API가 응답하지 않습니다. (status: null) - 네트워크 오류이거나 API 요청 형식이 잘못되었습니다.')
          logger.error('장소 검색 실패 - null status', error)
          reject(error)
          return
        }

        if (status === window.kakao.maps.services.Status.OK) {
          logger.info(`✅ 장소 검색 완료: ${data.length}개 결과`)
          resolve(data)
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          logger.warn('⚠️ 검색 결과 없음')
          resolve([])
        } else if (status === window.kakao.maps.services.Status.ERROR_RESPONSE) {
          const error = new Error('❌ 카카오맵 API 서버 오류 (ERROR_RESPONSE)')
          logger.error('장소 검색 실패', error)
          reject(error)
        } else if (status === window.kakao.maps.services.Status.INVALID_PARAMS) {
          const error = new Error('❌ 카카오맵 API 요청 형식 오류 (INVALID_PARAMS)')
          logger.error('장소 검색 실패', error)
          reject(error)
        } else {
          const error = new Error(`❌ 장소 검색 실패: ${status}`)
          logger.error('장소 검색 실패', error)
          reject(error)
        }
      }

      // 검색 실행
      logger.debug(`Places.keywordSearch 호출: "${keyword}"`)
      placesService.keywordSearch(keyword, callback, searchOptions)
    } catch (error) {
      logger.error('❌ 카카오맵 검색 중 예외 발생', error)
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
