import { useState, useEffect, useRef, useCallback } from 'react'
import { APP_CONFIG, logger, performance as perfMonitor } from '../config.js'
import { waitForKakaoMapsReady } from '../kakaoMapUtils'
import { getBaseMenu } from '../menuData'
import { initMarkerPool, getMarkerPool, createMarkersFromPlaces, cleanupMarkers } from '../mapMarkerManager'

/**
 * useKakaoMap - Kakao Maps 관리 커스텀 훅
 * 
 * 역할: Kakao Maps SDK 로딩, 지도 초기화, 장소 검색 결과 관리
 * 
 * @param {Object} params - 파라미터 객체
 * @param {String} params.selectedMenu - 선택된 메뉴명
 * @param {Object} params.currentLocation - 현재 위치 { latitude, longitude }
 * @param {Boolean} params.shouldShowMap - 지도 표시 여부
 * 
 * @returns {Object} {
 *   kakaoLoaded: Boolean - Kakao Maps SDK 로드 완료 여부
 *   isLoadingMap: Boolean - 지도 로딩 중 여부
 *   searchResults: Array - 검색 결과 장소 목록
 *   selectedPlace: Object|null - 선택된 장소
 *   mapRef: React.Ref - 지도 컨테이너 ref
 *   kakaoMapRef: React.Ref - Kakao Map 인스턴스 ref
 *   initializeMap: Function - 지도 초기화
 *   selectPlace: Function - 장소 선택
 *   clearMap: Function - 지도 초기화
 * }
 */
export function useKakaoMap({ selectedMenu, currentLocation, shouldShowMap }) {
  const [kakaoLoaded, setKakaoLoaded] = useState(false)
  const [isLoadingMap, setIsLoadingMap] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [selectedPlace, setSelectedPlace] = useState(null)
  
  const mapRef = useRef(null)
  const kakaoMapRef = useRef(null)
  const markersRef = useRef([])

  /**
   * Kakao SDK 로드 확인
   */
  useEffect(() => {
    perfMonitor.start('kakaoLoadCheck')
    waitForKakaoMapsReady()
      .then(() => {
        setKakaoLoaded(true)
        logger.info('Kakao Maps SDK 로드 완료')
        perfMonitor.end('kakaoLoadCheck')
      })
      .catch((error) => {
        logger.error('Kakao Maps SDK 로드 실패', error)
        perfMonitor.end('kakaoLoadCheck')
      })
  }, [])

  /**
   * 장소 선택 및 지도 이동
   * @param {Object} place - Kakao 장소 객체
   */
  const selectPlace = useCallback((place) => {
    setSelectedPlace(place)
    logger.debug(`식당 선택: ${place.place_name}`)
    
    if (kakaoMapRef.current) {
      const position = new window.kakao.maps.LatLng(place.y, place.x)
      kakaoMapRef.current.setCenter(position)
      kakaoMapRef.current.setLevel(3)
    }
  }, [])

  /**
   * 지도 초기화 및 장소 검색
   */
  const initializeMap = useCallback(async () => {
    if (!shouldShowMap || !currentLocation || !selectedMenu || !kakaoLoaded) {
      return
    }

    perfMonitor.start('mapInitialization')
    setIsLoadingMap(true)

    const { latitude, longitude } = currentLocation

    // 지도 컨테이너가 준비될 때까지 대기
    const timer = setTimeout(() => {
      if (!mapRef.current) {
        logger.error('지도 컨테이너를 찾을 수 없음')
        setIsLoadingMap(false)
        return
      }

      const container = mapRef.current
      const options = {
        center: new window.kakao.maps.LatLng(latitude, longitude),
        level: 4
      }

      try {
        // 지도 생성
        const map = new window.kakao.maps.Map(container, options)
        kakaoMapRef.current = map
        
        // 마커풀 초기화
        initMarkerPool(map, APP_CONFIG.performance.markerPoolSize || 20)
        logger.debug('Kakao 지도 생성 완료')
        logger.debug('마커풀 초기화 완료')

        // 현재 위치 마커 표시
        const markerPosition = new window.kakao.maps.LatLng(latitude, longitude)
        new window.kakao.maps.Marker({
          position: markerPosition,
          map: map
        })

        // 장소 검색 객체 생성
        const ps = new window.kakao.maps.services.Places()

        // 키워드로 장소 검색
        const searchOptions = {
          location: new window.kakao.maps.LatLng(latitude, longitude),
          radius: APP_CONFIG.performance.searchRadius,
          sort: window.kakao.maps.services.SortBy.DISTANCE,
          category_group_code: APP_CONFIG.kakao.categoryCode
        }

        const searchKeyword = getBaseMenu(selectedMenu)
        logger.debug(`음식점 검색: ${searchKeyword}`)

        ps.keywordSearch(searchKeyword, (data, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            setSearchResults(data)
            logger.info(`검색 결과: ${data.length}개 식당 발견`)

            // 기존 마커 제거
            cleanupMarkers(markersRef.current.map((_, idx) => `marker_${idx}`))
            markersRef.current = []

            // 검색 결과에 마커 표시
            const markerPool = getMarkerPool()
            if (markerPool) {
              const onMarkerClickHandler = (place) => {
                selectPlace(place)
              }
              const newMarkers = createMarkersFromPlaces(
                data,
                map,
                onMarkerClickHandler,
                markerPool
              )
              markersRef.current = newMarkers
              
              // 첫 번째 검색 결과로 중심 이동
              if (data.length > 0) {
                map.setCenter(new window.kakao.maps.LatLng(data[0].y, data[0].x))
                setSelectedPlace(data[0])
              }
            } else {
              logger.warn('마커 풀 초기화 실패, 기본 마커 생성 선택')
              // Fallback: 기본 마커 생성
              const newMarkers = data.map((place) => {
                const placePosition = new window.kakao.maps.LatLng(place.y, place.x)
                const placeMarker = new window.kakao.maps.Marker({
                  position: placePosition,
                  map: map
                })
                window.kakao.maps.event.addListener(placeMarker, 'click', () => {
                  selectPlace(place)
                })
                return placeMarker
              })
              markersRef.current = newMarkers
            }
            setIsLoadingMap(false)
            perfMonitor.end('mapInitialization')
          } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
            setSearchResults([])
            logger.warn('검색 결과 없음')
            alert('검색 결과가 없습니다. 다른 메뉴를 추천받아보세요!')
            setIsLoadingMap(false)
            perfMonitor.end('mapInitialization')
          } else {
            logger.error(`장소 검색 실패: ${status}`)
            setIsLoadingMap(false)
            perfMonitor.end('mapInitialization')
          }
        }, searchOptions)
      } catch (error) {
        logger.error('지도 초기화 오류', error)
        setIsLoadingMap(false)
        perfMonitor.end('mapInitialization')
      }
    }, APP_CONFIG.performance.mapInitDelay)

    return () => clearTimeout(timer)
  }, [shouldShowMap, currentLocation, selectedMenu, kakaoLoaded, selectPlace])

  /**
   * 지도 초기화 효과
   */
  useEffect(() => {
    if (shouldShowMap && currentLocation && selectedMenu && kakaoLoaded) {
      initializeMap()
    }
  }, [shouldShowMap, currentLocation, selectedMenu, kakaoLoaded, initializeMap])

  /**
   * 지도 정리 및 리소스 해제
   */
  const clearMap = useCallback(() => {
    setSearchResults([])
    setSelectedPlace(null)
    kakaoMapRef.current = null
    markersRef.current = []
    logger.debug('지도 정리 완료')
  }, [])

  return {
    kakaoLoaded,
    isLoadingMap,
    searchResults,
    selectedPlace,
    setSelectedPlace,
    mapRef,
    kakaoMapRef,
    initializeMap,
    selectPlace,
    clearMap
  }
}
