import { useState, useEffect, useRef } from 'react'
import { menuData as defaultMenuData, getBaseMenu } from './menuData'
import MenuManager from './MenuManager'
import './App.css'

const STORAGE_KEY = 'lunchSelector_customMenus'

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
  const spinIntervalRef = useRef(null)
  const mapRef = useRef(null)
  const kakaoMapRef = useRef(null)
  const markersRef = useRef([])

  // 로컬 스토리지에서 메뉴 데이터 로드
  useEffect(() => {
    const loadMenuData = () => {
      try {
        const savedMenus = localStorage.getItem(STORAGE_KEY)
        if (savedMenus) {
          const parsedMenus = JSON.parse(savedMenus)
          setMenuData(parsedMenus)
          setCategories(Object.keys(parsedMenus))
        } else {
          // 저장된 데이터가 없으면 기본 데이터 사용
          setMenuData(defaultMenuData)
          setCategories(Object.keys(defaultMenuData))
        }
      } catch (error) {
        console.error('메뉴 데이터 로드 실패:', error)
        // 에러 발생 시 기본 데이터 사용
        setMenuData(defaultMenuData)
        setCategories(Object.keys(defaultMenuData))
      }
    }
    loadMenuData()
  }, [])

  // 메뉴 데이터 저장
  const handleSaveMenus = (newMenuData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMenuData))
      setMenuData(newMenuData)
      setCategories(Object.keys(newMenuData))
      alert('메뉴가 성공적으로 저장되었습니다! 🎉')
    } catch (error) {
      console.error('메뉴 저장 실패:', error)
      alert('메뉴 저장에 실패했습니다. 다시 시도해주세요.')
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
    const checkKakaoLoaded = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          setKakaoLoaded(true)
          console.log('Kakao Maps SDK loaded successfully')
        })
      } else {
        console.error('Kakao Maps SDK not found')
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
    }
    // 카테고리 변경 시 메뉴 초기화
    setSelectedMenu(null)
  }

  // 랜덤 메뉴 추천 (3초 뽑기 효과)
  // 카테고리가 선택되어 있으면 해당 카테고리에서만, 아니면 전체에서 추천
  const handleRandomClick = () => {
    setIsSpinning(true)
    setIsAnimating(true)
    const currentCategory = selectedCategory // 현재 선택된 카테고리 저장
    setSelectedCategory('뽑는 중...')
    setSelectedMenu(null)

    // 50ms마다 랜덤 메뉴 표시 (스피닝 효과)
    spinIntervalRef.current = setInterval(() => {
      // 카테고리가 선택되어 있으면 해당 카테고리에서만, 아니면 전체에서
      if (currentCategory && currentCategory !== '뽑는 중...') {
        const menu = getRandomMenuFromCategory(currentCategory)
        setSpinningMenu(menu)
      } else {
        const { category, menu } = getRandomMenu()
        setSpinningMenu(menu)
      }
    }, 50)

    // 3초 후 최종 메뉴 결정
    setTimeout(() => {
      clearInterval(spinIntervalRef.current)
      let finalCategory, finalMenu

      if (currentCategory && currentCategory !== '뽑는 중...') {
        // 선택된 카테고리에서만 추천
        finalCategory = currentCategory
        finalMenu = getRandomMenuFromCategory(currentCategory)
      } else {
        // 전체 카테고리에서 랜덤 추천
        const result = getRandomMenu()
        finalCategory = result.category
        finalMenu = result.menu
      }

      setIsSpinning(false)
      setSelectedCategory(finalCategory)
      setSelectedMenu(finalMenu)
      setSpinningMenu(null)
      setIsAnimating(false)
    }, 3000)
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
      console.log('Menu selected, auto-opening map...')

      // 현재 위치 가져오기
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            console.log('Location obtained:', latitude, longitude)
            setCurrentLocation({ latitude, longitude })
            setShowMap(true)
            setSearchResults([])
          },
          (error) => {
            console.error('위치 정보 가져오기 실패:', error)
            // 위치 정보 실패 시에도 지도는 표시하되 기본 위치 사용
            alert('위치 정보를 가져올 수 없습니다. 서울 시청 기준으로 검색합니다.')
            setCurrentLocation({ latitude: 37.5665, longitude: 126.9780 }) // 서울 시청
            setShowMap(true)
            setSearchResults([])
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        )
      } else {
        alert('이 브라우저는 위치 서비스를 지원하지 않습니다.')
      }
    }
  }, [selectedMenu, isSpinning, kakaoLoaded])

  // Kakao 지도 초기화 및 검색
  useEffect(() => {
    if (!showMap || !currentLocation || !selectedMenu || !kakaoLoaded) {
      return
    }

    console.log('Initializing Kakao Map with:', {
      showMap,
      currentLocation,
      selectedMenu,
      kakaoLoaded
    })

    const { latitude, longitude } = currentLocation

    // 지도 컨테이너가 준비될 때까지 대기
    const timer = setTimeout(() => {
      if (!mapRef.current) {
        console.error('Map container not found')
        return
      }

      const container = mapRef.current
      const options = {
        center: new window.kakao.maps.LatLng(latitude, longitude),
        level: 4 // 지도 확대 레벨 (1~14, 낮을수록 확대)
      }

      try {
        // 지도 생성
        const map = new window.kakao.maps.Map(container, options)
        kakaoMapRef.current = map
        console.log('Kakao Map created successfully')

        // 현재 위치 마커 표시
        const markerPosition = new window.kakao.maps.LatLng(latitude, longitude)
        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
          map: map
        })

        // 장소 검색 객체 생성
        const ps = new window.kakao.maps.services.Places()

        // 키워드로 장소 검색 (반경 5km 이내, 음식점만)
        const searchOptions = {
          location: new window.kakao.maps.LatLng(latitude, longitude),
          radius: 5000, // 5km 반경
          sort: window.kakao.maps.services.SortBy.DISTANCE, // 거리순 정렬
          category_group_code: 'FD6' // 음식점 카테고리 코드
        }

        // 기본 메뉴로 검색 (예: 해물짬뽕 → 짬뽕)
        const searchKeyword = getBaseMenu(selectedMenu)
        console.log('Searching for:', searchKeyword, '(original:', selectedMenu, ')', searchOptions)

        ps.keywordSearch(searchKeyword, (data, status) => {
          console.log('Search result:', status, data)

          if (status === window.kakao.maps.services.Status.OK) {
            setSearchResults(data)

            // 기존 마커 제거
            markersRef.current.forEach(marker => marker.setMap(null))
            markersRef.current = []

            // 검색 결과에 마커 표시
            const newMarkers = data.map((place, index) => {
              const placePosition = new window.kakao.maps.LatLng(place.y, place.x)

              // 마커 생성
              const placeMarker = new window.kakao.maps.Marker({
                position: placePosition,
                map: map
              })

              // 마커 클릭 시 상세 정보 표시
              window.kakao.maps.event.addListener(placeMarker, 'click', () => {
                setSelectedPlace(place)
                map.setCenter(placePosition)
              })

              // 첫 번째 결과 위치로 지도 중심 이동
              if (index === 0) {
                map.setCenter(placePosition)
                setSelectedPlace(place)
              }

              return placeMarker
            })

            markersRef.current = newMarkers
          } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
            setSearchResults([])
            alert('검색 결과가 없습니다. 다른 메뉴를 추천받아보세요!')
          } else {
            console.error('검색 실패:', status)
          }
        }, searchOptions)
      } catch (error) {
        console.error('Map initialization error:', error)
      }
    }, 200) // 지도 컨테이너 렌더링 대기

    return () => clearTimeout(timer)
  }, [showMap, currentLocation, selectedMenu, kakaoLoaded])

  // 카카오 지도에서 메뉴 검색
  const handleMenuClick = () => {
    if (!selectedMenu || isSpinning) {
      console.log('Cannot open map:', { selectedMenu, isSpinning })
      return
    }

    console.log('Menu clicked, getting location...')

    // Kakao SDK 로드 확인
    if (!kakaoLoaded) {
      alert('지도를 불러오는 중입니다. 잠시만 기다려주세요.')
      return
    }

    // 현재 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log('Location obtained:', latitude, longitude)
          setCurrentLocation({ latitude, longitude })
          setShowMap(true)
          setSearchResults([])
        },
        (error) => {
          console.error('위치 정보 가져오기 실패:', error)
          alert('위치 정보를 가져올 수 없습니다. 위치 서비스를 활성화해주세요.')
        },
        {
          enableHighAccuracy: true,  // 높은 정확도
          timeout: 10000,            // 10초 타임아웃
          maximumAge: 0              // 캐시 사용 안함 (실시간 위치)
        }
      )
    } else {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.')
    }
  }

  // 지도 닫기
  const handleCloseMap = () => {
    setShowMap(false)
    setCurrentLocation(null)
    setSearchResults([])
    setSelectedPlace(null)
    kakaoMapRef.current = null
    markersRef.current = []
  }

  // 검색 결과 리스트에서 식당 클릭
  const handlePlaceClick = (place) => {
    setSelectedPlace(place)
    if (kakaoMapRef.current) {
      const position = new window.kakao.maps.LatLng(place.y, place.x)
      kakaoMapRef.current.setCenter(position)
      kakaoMapRef.current.setLevel(3) // 줌 인
    }
  }

  return (
    <div className={`app ${showMap ? 'show-map' : ''}`}>
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
            <button className="random-btn" onClick={handleRandomClick}>
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
