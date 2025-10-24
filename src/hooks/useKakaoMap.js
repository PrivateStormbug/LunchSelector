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

        const searchKeyword = getBaseMenu(selectedMenu)
        logger.debug(`음식점 검색: ${searchKeyword}`)
        logger.debug(`검색 위치: ${latitude}, ${longitude}`)

        // 위치 기반 검색 옵션 설정
        const searchOptions = {
          location: new window.kakao.maps.LatLng(latitude, longitude),
          radius: 1000,  // 1km 범위
          size: 20
        }

        // 검색 키워드
        const searchKeywords = [
          searchKeyword,           // 메뉴명
          searchKeyword + ' 근처', // 메뉴명 + 근처
          '식당',                  // 식당
          '음식점'                 // 음식점
        ]

        const allResults = {}  // 중복 제거용 객체 (ID 기반)

        let completedSearches = 0
        let totalSearches = searchKeywords.length

        console.log(`[useKakaoMap] 위치 기반 검색 시작: keyword="${searchKeyword}"`)
        console.log(`   → 위치: ${latitude}, ${longitude}, 반경: 1km`)
        console.log(`   → 검색 키워드: ${searchKeywords.join(', ')}`)

        // 검색 콜백 함수
        const searchCallback = (data, status) => {
          try {
            if (status === window.kakao.maps.services.Status.OK) {
              // 중복 제거하면서 모든 결과 수집
              if (data && data.length > 0) {
                data.forEach(place => {
                  if (!allResults[place.id]) {
                    allResults[place.id] = place
                  }
                })
              }

              completedSearches++
              logger.debug(`[useKakaoMap] 검색 진행: ${completedSearches}/${totalSearches}`)

              // 모든 검색이 완료되면 결과 처리
              if (completedSearches === totalSearches) {
                const resultsArray = Object.values(allResults)
                logger.debug(`[useKakaoMap] 최종 수집: ${resultsArray.length}개`)

                if (resultsArray.length > 0) {
                  // 디버깅: 사용자 위치 정보
                  logger.debug(`🔍 [거리 계산 디버깅]`)
                  logger.debug(`   사용자 좌표: lat=${latitude.toFixed(6)}, lng=${longitude.toFixed(6)}`)

                  // 모든 데이터에 거리 계산 (Haversine 공식)
                  const allWithDistance = resultsArray.map((place, idx) => {
                    const placeX = parseFloat(place.x)
                    const placeY = parseFloat(place.y)

                    // 처음 2개만 상세 로깅
                    if (idx < 2) {
                      logger.debug(`   장소 #${idx+1}: ${place.place_name}`)
                      logger.debug(`     place.x=${placeX.toFixed(6)}, place.y=${placeY.toFixed(6)}`)
                    }

                    // Haversine 공식: 더 정확한 지구 거리 계산
                    const R = 6371000; // 지구 반지름 (미터)
                    const phi1 = (latitude * Math.PI) / 180
                    const phi2 = (placeY * Math.PI) / 180
                    const deltaLat = ((placeY - latitude) * Math.PI) / 180
                    const deltaLng = ((placeX - longitude) * Math.PI) / 180

                    const a =
                      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                      Math.cos(phi1) * Math.cos(phi2) *
                      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
                    const distance = R * c; // 미터 단위

                    if (idx < 2) {
                      logger.debug(`     Δlat=${deltaLat.toFixed(6)} rad, Δlng=${deltaLng.toFixed(6)} rad`)
                      logger.debug(`     계산된 거리: ${Math.round(distance)}m`)
                    }

                    return { ...place, distance }
                  }).sort((a, b) => a.distance - b.distance)

                  logger.debug(`📊 거리 계산 완료 - 최소: ${Math.round(allWithDistance[0]?.distance || 0)}m, 최대: ${Math.round(allWithDistance[allWithDistance.length-1]?.distance || 0)}m`)
                  logger.debug(`   상위 5개: ${allWithDistance.slice(0, 5).map((p, i) => `${i+1}.${p.place_name}(${Math.round(p.distance)}m)`).join(', ')}`)

                  // 점진적 거리 확장: 각 반경에서 최소 5개 이상 찾을 때까지 확대
                  const MIN_RESTAURANTS = 5;  // 최소 표시 음식점 개수
                  let dataWithDistance = [];
                  let actualRadius = 0;

                  for (const radius of RADIUS_LEVELS) {
                    const filtered = allWithDistance.filter(place => place.distance <= radius)
                    logger.debug(`🔍 ${radius / 1000}km 반경: ${filtered.length}개 식당`)

                    if (filtered.length >= MIN_RESTAURANTS) {
                      // 최소 5개 이상 발견하면 상위 5개만 선택
                      dataWithDistance = filtered.slice(0, MIN_RESTAURANTS)
                      actualRadius = radius / 1000
                      logger.debug(`✨ ${actualRadius}km 반경에서 ${filtered.length}개 중 상위 ${MIN_RESTAURANTS}개 선택!`)
                      break;
                    }
                  }

                  // 마지막 반경까지 갔는데도 MIN_RESTAURANTS개 미만이면, 거리순 상위 MIN_RESTAURANTS개 반환
                  if (dataWithDistance.length === 0) {
                    dataWithDistance = allWithDistance.slice(0, Math.min(MIN_RESTAURANTS, allWithDistance.length))
                    actualRadius = dataWithDistance.length > 0
                      ? (dataWithDistance[dataWithDistance.length - 1].distance / 1000).toFixed(2)
                      : 0
                    logger.debug(`📍 조건을 만족하는 반경이 없음 → 거리순 상위 ${dataWithDistance.length}개 선택`)
                  }

                  logger.info(`검색 결과: ${dataWithDistance.length}개 식당 발견 (${actualRadius}km 반경, 거리순 정렬)`)
                  logger.debug(`가장 가까운 식당: ${dataWithDistance[0]?.place_name} (${Math.round(dataWithDistance[0]?.distance || 0)}m)`)
                  logger.debug(`전체 검색 결과: ${resultsArray.length}개 → 필터링 결과: ${dataWithDistance.length}개`)
                  logger.debug(`📍 현재 위치 기반 검색 (${actualRadius}km 반경)`)

                  setSearchResults(dataWithDistance)

                  // 기존 마커 제거
                  cleanupMarkers(markersRef.current.map((_, idx) => `marker_${idx}`))
                  markersRef.current = []

                  // 검색 결과에 마커 표시 (필터링된 결과만 사용)
                  const markerPool = getMarkerPool()
                  if (markerPool) {
                    const onMarkerClickHandler = (place) => {
                      selectPlace(place)
                    }
                    const newMarkers = createMarkersFromPlaces(
                      dataWithDistance,
                      map,
                      onMarkerClickHandler,
                      markerPool
                    )
                    markersRef.current = newMarkers

                    // 필터링된 가장 가까운 검색 결과로 중심 이동
                    if (dataWithDistance.length > 0) {
                      map.setCenter(new window.kakao.maps.LatLng(dataWithDistance[0].y, dataWithDistance[0].x))
                      setSelectedPlace(dataWithDistance[0])
                    }
                  } else {
                    logger.warn('마커 풀 초기화 실패, 기본 마커 생성 선택')
                    // Fallback: 기본 마커 생성 (필터링된 결과만 사용)
                    const newMarkers = dataWithDistance.map((place) => {
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
                }
              }
              setIsLoadingMap(false)
              perfMonitor.end('mapInitialization')
            } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
              completedSearches++
              if (completedSearches === totalSearches) {
                setSearchResults([])
                logger.warn('검색 결과 없음')
                setIsLoadingMap(false)
                perfMonitor.end('mapInitialization')
              }
            } else if (status === window.kakao.maps.services.Status.ERROR_RESPONSE) {
              logger.error('카카오맵 API 서버 오류 (ERROR_RESPONSE)')
              setIsLoadingMap(false)
              perfMonitor.end('mapInitialization')
            } else if (status === window.kakao.maps.services.Status.INVALID_PARAMS) {
              logger.error('카카오맵 API 매개변수 오류 (INVALID_PARAMS)')
              setIsLoadingMap(false)
              perfMonitor.end('mapInitialization')
            } else {
              logger.error(`장소 검색 실패: ${status}`)
              setIsLoadingMap(false)
              perfMonitor.end('mapInitialization')
            }
          } catch (callbackError) {
            logger.error('검색 콜백 처리 중 오류', callbackError)
            setIsLoadingMap(false)
            perfMonitor.end('mapInitialization')
          }
        }

        // 각 키워드별로 검색 실행 (searchOptions와 함께 전달)
        searchKeywords.forEach((keyword) => {
          ps.keywordSearch(keyword, searchCallback, searchOptions)
        })
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
