import { logger } from './config'

/**
 * 마커 풀(Pool) 패턴을 사용한 마커 관리
 * 메모리 효율성을 높이기 위해 마커를 재사용합니다.
 */

class MarkerPool {
  constructor(initialSize = 0) {
    this.availableMarkers = []
    this.usedMarkers = new Map() // id -> marker 매핑
    this.map = null
    this.clickListeners = new Map()

    // 초기 마커 풀 생성
    for (let i = 0; i < initialSize; i++) {
      this.createMarker()
    }

    logger.debug(`마커 풀 초기화: ${initialSize}개 마커 생성`)
  }

  /**
   * 새 마커 생성
   * @private
   */
  createMarker() {
    if (!window.kakao || !window.kakao.maps) {
      logger.error('Kakao Maps API를 초기화할 수 없습니다.')
      return null
    }

    const marker = new window.kakao.maps.Marker({
      map: null // 초기에는 지도에 표시하지 않음
    })

    this.availableMarkers.push(marker)
    return marker
  }

  /**
   * 지도 설정
   * @param {object} map - Kakao Maps 객체
   */
  setMap(map) {
    this.map = map
  }

  /**
   * 마커 획득 (재사용 또는 새로 생성)
   * @param {string} id - 고유 ID
   * @param {number} lat - 위도
   * @param {number} lng - 경도
   * @param {object} options - 추가 옵션
   * @returns {object} 마커 객체
   */
  acquireMarker(id, lat, lng, options = {}) {
    let marker

    // 사용 가능한 마커가 있으면 재사용
    if (this.availableMarkers.length > 0) {
      marker = this.availableMarkers.pop()
      logger.debug(`재사용 마커 획득 (풀 크기: ${this.availableMarkers.length})`)
    } else {
      // 없으면 새로 생성
      marker = this.createMarker()
      logger.debug('새 마커 생성')
    }

    // 마커 위치 설정
    const position = new window.kakao.maps.LatLng(lat, lng)
    marker.setPosition(position)
    marker.setMap(this.map)

    // 옵션 적용
    if (options.title) {
      marker.setTitle(options.title)
    }

    // 사용 중인 마커로 등록
    this.usedMarkers.set(id, marker)

    return marker
  }

  /**
   * 마커 반환 (풀로 돌려보기)
   * @param {string} id - 마커 ID
   */
  releaseMarker(id) {
    const marker = this.usedMarkers.get(id)

    if (marker) {
      // 마커 숨기기
      marker.setMap(null)

      // 클릭 리스너 제거
      if (this.clickListeners.has(id)) {
        window.kakao.maps.event.removeListener(
          marker,
          'click',
          this.clickListeners.get(id)
        )
        this.clickListeners.delete(id)
      }

      // 풀로 반환
      this.availableMarkers.push(marker)
      this.usedMarkers.delete(id)

      logger.debug(`마커 반환 (풀 크기: ${this.availableMarkers.length})`)
    }
  }

  /**
   * 마커에 클릭 리스너 추가
   * @param {string} id - 마커 ID
   * @param {function} callback - 콜백 함수
   */
  onMarkerClick(id, callback) {
    const marker = this.usedMarkers.get(id)

    if (marker) {
      // 기존 리스너 제거
      if (this.clickListeners.has(id)) {
        window.kakao.maps.event.removeListener(
          marker,
          'click',
          this.clickListeners.get(id)
        )
      }

      // 새 리스너 추가
      window.kakao.maps.event.addListener(marker, 'click', () => {
        callback(id)
      })

      this.clickListeners.set(id, callback)
    }
  }

  /**
   * 모든 마커 정리
   */
  releaseAll() {
    const ids = Array.from(this.usedMarkers.keys())

    ids.forEach(id => {
      this.releaseMarker(id)
    })

    logger.debug('모든 마커 정리 완료')
  }

  /**
   * 마커 풀 통계
   * @returns {object} 통계 정보
   */
  getStats() {
    return {
      total: this.usedMarkers.size + this.availableMarkers.length,
      used: this.usedMarkers.size,
      available: this.availableMarkers.length,
      efficiency: this.availableMarkers.length > 0 ? 'high' : 'low'
    }
  }

  /**
   * 마커 풀 정리 (사용하지 않는 마커 제거)
   * @param {number} maxPool - 유지할 최대 풀 크기
   */
  optimize(maxPool = 20) {
    while (this.availableMarkers.length > maxPool) {
      this.availableMarkers.pop()
    }

    logger.debug(`마커 풀 최적화: ${this.availableMarkers.length}개 유지`)
  }
}

/**
 * 전역 마커 풀 인스턴스
 */
let globalMarkerPool = null

/**
 * 마커 풀 초기화
 * @param {object} map - Kakao Maps 객체
 * @param {number} initialSize - 초기 마커 풀 크기
 * @returns {MarkerPool} 마커 풀 인스턴스
 */
export const initMarkerPool = (map, initialSize = 10) => {
  if (!globalMarkerPool) {
    globalMarkerPool = new MarkerPool(initialSize)
  }

  globalMarkerPool.setMap(map)
  logger.info(`마커 풀 초기화 완료 (초기 크기: ${initialSize})`)

  return globalMarkerPool
}

/**
 * 글로벌 마커 풀 인스턴스 가져오기
 * @returns {MarkerPool} 마커 풀 인스턴스
 */
export const getMarkerPool = () => {
  if (!globalMarkerPool) {
    globalMarkerPool = new MarkerPool()
  }

  return globalMarkerPool
}

/**
 * 마커 풀 리셋
 */
export const resetMarkerPool = () => {
  if (globalMarkerPool) {
    globalMarkerPool.releaseAll()
    globalMarkerPool = null
    logger.debug('마커 풀 리셋 완료')
  }
}

/**
 * 마커들을 마커 풀로 관리하는 헬퍼 함수
 * @param {array} places - 장소 데이터 배열
 * @param {object} map - Kakao Maps 객체
 * @param {function} onMarkerClick - 마커 클릭 콜백
 * @returns {object} { markerPool, markerIds }
 */
export const createMarkersFromPlaces = (places, map, onMarkerClick) => {
  const pool = initMarkerPool(map)
  const markerIds = []

  places.forEach((place, index) => {
    const id = `place-${place.id}`

    pool.acquireMarker(
      id,
      parseFloat(place.y),
      parseFloat(place.x),
      {
        title: place.place_name
      }
    )

    if (onMarkerClick) {
      pool.onMarkerClick(id, (markerId) => {
        onMarkerClick(place, markerId)
      })
    }

    markerIds.push(id)
  })

  logger.info(`${places.length}개 마커 생성 (풀 효율: ${pool.getStats().efficiency})`)

  return {
    markerPool: pool,
    markerIds
  }
}

/**
 * 마커 풀 정리
 * @param {array} markerIds - 정리할 마커 ID 배열
 */
export const cleanupMarkers = (markerIds = []) => {
  const pool = getMarkerPool()

  if (markerIds.length > 0) {
    // 특정 마커만 정리
    markerIds.forEach(id => {
      pool.releaseMarker(id)
    })
    logger.debug(`${markerIds.length}개 마커 정리`)
  } else {
    // 모든 마커 정리
    pool.releaseAll()
  }

  // 풀 최적화
  pool.optimize()
}

export default {
  MarkerPool,
  initMarkerPool,
  getMarkerPool,
  resetMarkerPool,
  createMarkersFromPlaces,
  cleanupMarkers
}
