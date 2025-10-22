import { useState, useEffect, useRef } from 'react'
import { menuData as defaultMenuData, getBaseMenu } from './menuData'
import MenuManager from './MenuManager'
import LoadingSpinner from './LoadingSpinner'
import { APP_CONFIG, logger, performance as perfMonitor } from './config.js'
import './App.css'

function App() {
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinningMenu, setSpinningMenu] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [kakaoLoaded, setKakaoLoaded] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [showMenuManager, setShowMenuManager] = useState(false)
  const [menuData, setMenuData] = useState({})
  const [categories, setCategories] = useState([])
  const [isLoadingMap, setIsLoadingMap] = useState(false)
  const spinIntervalRef = useRef(null)
  const mapRef = useRef(null)
  const kakaoMapRef = useRef(null)
  const markersRef = useRef([])
  const menuCacheRef = useRef(null)

  // 로컬 스토리지에서 메뉴 데이터 로드
  useEffect(() => {
    const loadMenuData = () => {
      perfMonitor.start('loadMenuData')
      try {
        // 캐시 확인
        if (menuCacheRef.current) {
          logger.debug('메뉴 데이터 캐시에서 로드')
          setMenuData(menuCacheRef.current)
          setCategories(Object.keys(menuCacheRef.current))
          return
        }

        const savedMenus = localStorage.getItem(APP_CONFIG.storage.menuKey)
        if (savedMenus) {
          const parsedMenus = JSON.parse(savedMenus)
          menuCacheRef.current = parsedMenus
          setMenuData(parsedMenus)
          setCategories(Object.keys(parsedMenus))
          logger.debug('localStorage에서 메뉴 데이터 로드 성공')
        } else {
          // 저장된 데이터가 없으면 기본 데이터 사용
          menuCacheRef.current = defaultMenuData
          setMenuData(defaultMenuData)
          setCategories(Object.keys(defaultMenuData))
          logger.debug('기본 메뉴 데이터 사용')
        }
      } catch (error) {
        logger.error('메뉴 데이터 로드 실패', error)
        // 에러 발생 시 기본 데이터 사용
        menuCacheRef.current = defaultMenuData
        setMenuData(defaultMenuData)
        setCategories(Object.keys(defaultMenuData))
      } finally {
        perfMonitor.end('loadMenuData')
      }
    }
    loadMenuData()
  }, [])

  // 메뉴 데이터 저장
  const handleSaveMenus = (newMenuData) => {
    perfMonitor.start('saveMenuData')
    try {
      localStorage.setItem(APP_CONFIG.storage.menuKey, JSON.stringify(newMenuData))
      menuCacheRef.current = newMenuData
      setMenuData(newMenuData)
      setCategories(Object.keys(newMenuData))
      alert('메뉴가 성공적으로 저장되었습니다! 🎉')
      logger.info('메뉴 데이터 저장 성공')
    } catch (error) {
      logger.error('메뉴 저장 실패', error)
      alert('메뉴 저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      perfMonitor.end('saveMenuData')
    }
  }

  // 특정 카테고리에서 랜덤 메뉴 선택
  const getRandomMenuFromCategory = (category) => {
    const menus = menuData[category]
    if (!menus || menus.length === 0) return null
    const randomIndex = Math.floor(Math.random() * menus.length)
    return menus[randomIndex]
  }

  // 랜덤 카테고리 선택
  const getRandomCategory = () => {
    if (categories.length === 0) return null
    const randomIndex = Math.floor(Math.random() * categories.length)
    return categories[randomIndex]
  }

  // 완전 랜덤 메뉴 추천
  const getRandomMenu = () => {
    const category = getRandomCategory()
    if (!category) return null
    const menu = getRandomMenuFromCategory(category)
    return menu ? { category, menu } : null
  }

  // Kakao SDK 로드 확인
  useEffect(() => {
    perfMonitor.start('kakaoLoadCheck')
    let attempts = 0
    const maxAttempts = Math.ceil(APP_CONFIG.performance.kakaoLoadTimeout / 100)
    
    const checkKakaoLoaded = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          setKakaoLoaded(true)
          logger.info('Kakao Maps SDK 로드 완료')
          perfMonitor.end('kakaoLoadCheck')
        })
      } else {
        attempts++
        if (attempts >= maxAttempts) {
          logger.warn('Kakao Maps SDK 로드 타임아웃')
          perfMonitor.end('kakaoLoadCheck')
          return
        }
        setTimeout(checkKakaoLoaded, 100)
      }
    }
    checkKakaoLoaded()
  }, [])

  // 카테고리 선택 (메뉴 추천은 랜덤 버튼 클릭 시)
  const handleCategoryClick = (category) => {
    // 같은 카테고리 클릭 시 선택 해제
    if (selectedCategory === category) {
      setSelectedCategory(null)
    } else {
      setSelectedCategory(category)
      logger.debug(`카테고리 선택: ${category}`)
    }
    // 카테고리 변경 시 메뉴 초기화
    setSelectedMenu(null)
  }

  // 랜덤 메뉴 추천 (스피닝 효과)
  const handleRandomClick = () => {
    perfMonitor.start('randomMenuSelection')
    setIsSpinning(true)
    setIsAnimating(true)
    const currentCategory = selectedCategory
    setSelectedCategory('뽑는 중...')
    setSelectedMenu(null)

    // 스피닝 효과
    spinIntervalRef.current = setInterval(() => {
      if (currentCategory && currentCategory !== '뽑는 중...') {
        const menu = getRandomMenuFromCategory(currentCategory)
        setSpinningMenu(menu)
      } else {
        const { category, menu } = getRandomMenu()
        setSpinningMenu(menu)
      }
    }, APP_CONFIG.performance.spinInterval)

    // 최종 메뉴 결정
    setTimeout(() => {
      clearInterval(spinIntervalRef.current)
      let finalCategory, finalMenu

      if (currentCategory && currentCategory !== '뽑는 중...') {
        finalCategory = currentCategory
        finalMenu = getRandomMenuFromCategory(currentCategory)
      } else {
        const result = getRandomMenu()
        finalCategory = result.category
        finalMenu = result.menu
      }

      setIsSpinning(false)
      setSelectedCategory(finalCategory)
      setSelectedMenu(finalMenu)
      setSpinningMenu(null)
      setIsAnimating(false)
      
      logger.info(`추천 메뉴: ${finalCategory} - ${finalMenu}`)
      perfMonitor.end('randomMenuSelection')
    }, APP_CONFIG.performance.spinDuration)
  }

  // 컴포넌트 언마운트 시 interval 정리
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current)
      }
    }
  }, [])

  // 메뉴가 선택되면 자동으로 지도 표시
  useEffect(() => {
    if (selectedMenu && !isSpinning && kakaoLoaded) {
      logger.debug('지도 자동 표시 시작')
      setIsLoadingMap(true)

      // 현재 위치 가져오기
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            logger.debug(`위치 획득: ${latitude}, ${longitude}`)
            setCurrentLocation({ latitude, longitude })
            setShowMap(true)
            setSearchResults([])
            setIsLoadingMap(false)
          },
          (error) => {
            logger.warn('위치 정보 가져오기 실패', error)
            // 위치 정보 실패 시에도 지도는 표시하되 기본 위치 사용
            alert('위치 정보를 가져올 수 없습니다. 서울 시청 기준으로 검색합니다.')
            setCurrentLocation({ latitude: 37.5665, longitude: 126.9780 })
            setShowMap(true)
            setSearchResults([])
            setIsLoadingMap(false)
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        )
      } else {
        alert('이 브라우저는 위치 서비스를 지원하지 않습니다.')
        setIsLoadingMap(false)
      }
    }
  }, [selectedMenu, isSpinning, kakaoLoaded])

  // Kakao 지도 초기화 및 검색
  useEffect(() => {
    if (!showMap || !currentLocation || !selectedMenu || !kakaoLoaded) {
      return
    }

    perfMonitor.start('mapInitialization')
    const { latitude, longitude } = currentLocation

    // 지도 컨테이너가 준비될 때까지 대기
    const timer = setTimeout(() => {
      if (!mapRef.current) {
        logger.error('지도 컨테이너를 찾을 수 없음')
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
        logger.debug('Kakao 지도 생성 완료')

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
            markersRef.current.forEach(marker => marker.setMap(null))
            markersRef.current = []

            // 검색 결과에 마커 표시
            const newMarkers = data.map((place, index) => {
              const placePosition = new window.kakao.maps.LatLng(place.y, place.x)

              const placeMarker = new window.kakao.maps.Marker({
                position: placePosition,
                map: map
              })

              window.kakao.maps.event.addListener(placeMarker, 'click', () => {
                setSelectedPlace(place)
                map.setCenter(placePosition)
              })

              if (index === 0) {
                map.setCenter(placePosition)
                setSelectedPlace(place)
              }

              return placeMarker
            })

            markersRef.current = newMarkers
            perfMonitor.end('mapInitialization')
          } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
            setSearchResults([])
            logger.warn('검색 결과 없음')
            alert('검색 결과가 없습니다. 다른 메뉴를 추천받아보세요!')
            perfMonitor.end('mapInitialization')
          } else {
            logger.error(`장소 검색 실패: ${status}`)
            perfMonitor.end('mapInitialization')
          }
        }, searchOptions)
      } catch (error) {
        logger.error('지도 초기화 오류', error)
        perfMonitor.end('mapInitialization')
      }
    }, APP_CONFIG.performance.mapInitDelay)

    return () => clearTimeout(timer)
  }, [showMap, currentLocation, selectedMenu, kakaoLoaded])

  // 지도 닫기
  const handleCloseMap = () => {
    setShowMap(false)
    setCurrentLocation(null)
    setSearchResults([])
    setSelectedPlace(null)
    kakaoMapRef.current = null
    markersRef.current = []
    logger.debug('지도 닫기')
  }

  // 검색 결과 리스트에서 식당 클릭
  const handlePlaceClick = (place) => {
    setSelectedPlace(place)
    logger.debug(`식당 선택: ${place.place_name}`)
    if (kakaoMapRef.current) {
      const position = new window.kakao.maps.LatLng(place.y, place.x)
      kakaoMapRef.current.setCenter(position)
      kakaoMapRef.current.setLevel(3)
    }
  }

  return (
    <div className={`app ${showMap ? 'show-map' : ''}`}>
      {isLoadingMap && <LoadingSpinner message="지도 로딩 중..." />}
      
      <div className="main-panel">
        <div className="container">
          <header className="header">
            <div className="header-content">
              <h1 className="title">🍽️ 점심 메뉴 추천</h1>
              <p className="subtitle">오늘 뭐 먹을까?</p>
            </div>
            <button
              className="menu-manage-btn"
              onClick={() => setShowMenuManager(true)}
              title="메뉴 관리"
            >
              ⚙️ 메뉴 관리
            </button>
          </header>

          <div className="category-section">
            <h2 className="section-title">카테고리 선택</h2>
            <div className="category-grid">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="random-section">
            <button className="random-btn" onClick={handleRandomClick} disabled={isSpinning}>
              🎲 랜덤 추천
            </button>
            {selectedCategory && !isSpinning && !selectedMenu && (
              <p className="category-hint">
                💡 <strong>{selectedCategory}</strong> 카테고리에서 추천됩니다
              </p>
            )}
          </div>

          {(selectedMenu || isSpinning) && (
            <div className={`result-section ${isAnimating ? 'animating' : ''}`}>
              <div className={`result-card ${isSpinning ? 'spinning' : ''}`}>
                <div className="result-category">{selectedCategory}</div>
                <div className={`result-menu ${isSpinning ? 'spinning-text' : ''}`}>
                  {isSpinning ? spinningMenu || '🎰' : selectedMenu}
                </div>
                <div className="result-footer">
                  {isSpinning ? '두근두근... 🎲' : '📍 오른쪽 지도에서 주변 식당을 확인하세요!'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showMap && (
        <div className="map-panel">
          <button className="divider-close-btn" onClick={handleCloseMap} title="닫기">
            ✕
          </button>
          <div className="map-header">
            <div className="map-header-content">
              <h2 className="map-title">
                🗺️ {selectedMenu} 검색 결과
                {selectedMenu !== getBaseMenu(selectedMenu) && (
                  <span className="search-keyword"> (검색어: {getBaseMenu(selectedMenu)})</span>
                )}
              </h2>
              <p className="map-notice">
                {searchResults.length > 0
                  ? `💡 ${searchResults.length}개의 식당을 찾았습니다 (거리순 정렬)`
                  : '💡 검색 중... 잠시만 기다려주세요!'}
              </p>
            </div>
            <button className="close-map-btn" onClick={handleCloseMap}>
              ✕ 닫기
            </button>
          </div>

          <div className="map-content">
            <div className="search-results-panel">
              {searchResults.length > 0 ? (
                <div className="results-list">
                  {searchResults.map((place, index) => (
                    <div
                      key={place.id}
                      className={`result-item ${selectedPlace?.id === place.id ? 'active' : ''}`}
                      onClick={() => handlePlaceClick(place)}
                    >
                      <div className="result-item-header">
                        <span className="result-number">{index + 1}</span>
                        <h3 className="result-name">{place.place_name}</h3>
                      </div>
                      <p className="result-address">
                        📍 {place.road_address_name || place.address_name}
                      </p>
                      <p className="result-distance">
                        🚶 {place.distance}m
                      </p>
                      {place.phone && (
                        <p className="result-phone">📞 {place.phone}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <p>검색 중입니다...</p>
                </div>
              )}
            </div>

            <div className="map-view">
              <div
                ref={mapRef}
                className="map-container"
                style={{ width: '100%', height: '100%' }}
              />

              {selectedPlace && (
                <div className="place-detail-panel">
                  <div className="place-detail-header">
                    <h3>{selectedPlace.place_name}</h3>
                    <button
                      className="detail-close-btn"
                      onClick={() => setSelectedPlace(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="place-detail-body">
                    <div className="detail-item">
                      <span className="detail-label">📍 주소</span>
                      <span className="detail-value">
                        {selectedPlace.road_address_name || selectedPlace.address_name}
                      </span>
                    </div>
                    {selectedPlace.phone && (
                      <div className="detail-item">
                        <span className="detail-label">📞 전화</span>
                        <a
                          href={`tel:${selectedPlace.phone}`}
                          className="detail-value detail-link"
                        >
                          {selectedPlace.phone}
                        </a>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">🚶 거리</span>
                      <span className="detail-value">{selectedPlace.distance}m</span>
                    </div>
                    {selectedPlace.category_name && (
                      <div className="detail-item">
                        <span className="detail-label">🍽️ 카테고리</span>
                        <span className="detail-value">{selectedPlace.category_name}</span>
                      </div>
                    )}
                    {selectedPlace.place_url && (
                      <div className="detail-actions">
                        <a
                          href={selectedPlace.place_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="detail-button"
                        >
                          🔗 카카오맵에서 보기
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 메뉴 관리 모달 */}
      <MenuManager
        isOpen={showMenuManager}
        onClose={() => setShowMenuManager(false)}
        menuData={menuData}
        onSaveMenus={handleSaveMenus}
      />
    </div>
  )
}

export default App
