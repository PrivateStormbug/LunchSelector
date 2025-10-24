import { useState, useEffect, useRef } from 'react'
import MenuManager from './MenuManager'
import LoadingSpinner from './LoadingSpinner'
import MenuDetailModal from './MenuDetailModal'
import MenuSearch from './MenuSearch'
import RecommendationPanel from './RecommendationPanel'
import { APP_CONFIG, logger, performance as perfMonitor } from './config.js'
import { recordMenuView } from './searchManager'
import { addToHistory } from './historyManager'
import { initializeTheme, toggleTheme, getCurrentTheme } from './themeManager'

// Custom Hooks
import { useMenuData } from './hooks/useMenuData'
import { useSpinningAnimation } from './hooks/useSpinningAnimation'
import { useKakaoMap } from './hooks/useKakaoMap'
import { useGeolocation } from './hooks/useGeolocation'

import './App.css'

/**
 * App 컴포넌트 - LunchSelector 메인 애플리케이션
 * 
 * 구조:
 * - useMenuData: 메뉴 데이터 관리 (로딩, 저장, 캐싱)
 * - useSpinningAnimation: 랜덤 메뉴 추천 스피닝 효과
 * - useGeolocation: 현재 위치 정보 관리
 * - useKakaoMap: Kakao Maps 지도 및 장소 검색
 * - UI 상태: 모달, 패널, 테마 등
 * 
 * 주요 기능:
 * 1. 메뉴 카테고리 선택
 * 2. 랜덤 메뉴 추천 (스피닝 효과)
 * 3. 주변 식당 검색 (Kakao Maps)
 * 4. 메뉴 상세정보 및 공유
 * 5. 메뉴 관리 및 커스터마이징
 */
function App() {
  // ==================== 데이터 관리 ====================
  const { menuData, categories, isLoading: isLoadingMenus, error: menuError, saveMenus } = useMenuData()

  // ==================== UI 상태 ====================
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [showMenuManager, setShowMenuManager] = useState(false)
  const [showMenuDetail, setShowMenuDetail] = useState(false)
  const [menuDetailInfo, setMenuDetailInfo] = useState({ category: null, menu: null })
  const [showSearch, setShowSearch] = useState(false)
  const [showRecommendation, setShowRecommendation] = useState(false)
  const [theme, setTheme] = useState(getCurrentTheme())
  const [isAnimating, setIsAnimating] = useState(false)

  // ==================== 스피닝 및 메뉴 추천 ====================
  const {
    isSpinning,
    spinningMenu,
    finalCategory,
    finalMenu,
    startSpinning,
    getRandomMenuFromCategory,
    getRandomMenu
  } = useSpinningAnimation({
    menuData,
    categories,
    selectedCategory
  })

  const [selectedMenu, setSelectedMenu] = useState(null)

  // ==================== 위치 및 지도 ====================
  const { location: currentLocation, requestLocation } = useGeolocation()

  const {
    kakaoLoaded,
    isLoadingMap,
    searchResults,
    selectedPlace,
    mapRef,
    kakaoMapRef,
    selectPlace,
    clearMap
  } = useKakaoMap({
    selectedMenu,
    currentLocation,
    shouldShowMap: showMap
  })

  // ==================== 초기화 ====================
  /**
   * 테마 초기화 효과
   */
  useEffect(() => {
    initializeTheme()
    logger.debug('테마 초기화 완료')
  }, [])

  // ==================== 이벤트 핸들러 ====================
  /**
   * 카테고리 선택 핸들러
   * @param {String} category - 선택한 카테고리
   */
  const handleCategoryClick = (category) => {
    if (selectedCategory === category) {
      setSelectedCategory(null)
    } else {
      setSelectedCategory(category)
      logger.debug(`카테고리 선택: ${category}`)
    }
    setSelectedMenu(null)
  }

  /**
   * 랜덤 메뉴 추천 핸들러
   * 스피닝 애니메이션 시작 및 최종 메뉴 결정
   */
  const handleRandomClick = async () => {
    setIsAnimating(true)
    const tempCategory = selectedCategory
    setSelectedCategory(tempCategory && tempCategory !== '뽑는 중...' ? tempCategory : '뽑는 중...')
    setSelectedMenu(null)

    // 스피닝 시작 (Promise 반환)
    const result = await startSpinning()

    // 스피닝 완료 후 상태 업데이트
    setSelectedCategory(result.category)
    setSelectedMenu(result.menu)
    setIsAnimating(false)
  }

  /**
   * 메뉴 선택 시 자동으로 위치 정보 요청 및 지도 표시
   */
  useEffect(() => {
    if (selectedMenu && !isSpinning && kakaoLoaded) {
      logger.debug('지도 자동 표시 시작')
      requestLocation()
      setShowMap(true)
      setSelectedPlace(null)
    }
  }, [selectedMenu, isSpinning, kakaoLoaded, requestLocation])

  /**
   * 메뉴 저장 핸들러
   * @param {Object} newMenuData - 저장할 메뉴 데이터
   */
  const handleSaveMenus = (newMenuData) => {
    const success = saveMenus(newMenuData)
    if (success) {
      alert('메뉴가 성공적으로 저장되었습니다! 🎉')
    } else {
      alert('메뉴 저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  /**
   * 지도 닫기 핸들러
   */
  const handleCloseMap = () => {
    setShowMap(false)
    clearMap()
    logger.debug('지도 닫기')
  }

  /**
   * 메뉴 상세정보 표시 핸들러
   */
  const handleShowMenuDetail = () => {
    if (selectedMenu && selectedCategory) {
      setMenuDetailInfo({
        category: selectedCategory,
        menu: selectedMenu
      })
      setShowMenuDetail(true)
      logger.debug(`메뉴 상세정보 표시: ${selectedCategory} - ${selectedMenu}`)
    }
  }

  /**
   * 메뉴 상세정보 닫기 핸들러
   */
  const handleCloseMenuDetail = () => {
    setShowMenuDetail(false)
  }

  /**
   * 메뉴 공유 핸들러
   * @param {String} category - 메뉴 카테고리
   * @param {String} menu - 메뉴명
   * @param {Object} detail - 메뉴 상세정보
   */
  const handleShareMenu = (category, menu, detail) => {
    const shareText = `🍽️ ${menu} (${category})\n\n칼로리: ${detail.calories}kcal\n가격: ${detail.price ? detail.price.toLocaleString() + '원' : '정보없음'}\n\n${detail.description}`

    if (navigator.share) {
      navigator.share({
        title: `${menu} 추천`,
        text: shareText,
        url: window.location.href
      }).catch((error) => {
        logger.debug('공유 취소됨', error)
      })
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('메뉴 정보가 복사되었습니다!')
        logger.debug('메뉴 정보 복사 완료')
      }).catch((error) => {
        logger.error('복사 실패', error)
        alert('공유 정보 복사에 실패했습니다.')
      })
    }
  }

  /**
   * 검색 결과에서 메뉴 선택 핸들러
   * @param {String} category - 카테고리
   * @param {String} menu - 메뉴명
   */
  const handleSelectFromSearch = (category, menu) => {
    setSelectedCategory(category)
    setSelectedMenu(menu)
    recordMenuView(category, menu)
    addToHistory(category, menu)
    setShowSearch(false)
    logger.debug(`검색 결과에서 메뉴 선택: ${category} - ${menu}`)
  }

  /**
   * 검색 결과에서 메뉴 상세정보 표시 핸들러
   * @param {String} category - 카테고리
   * @param {String} menu - 메뉴명
   */
  const handleShowDetailFromSearch = (category, menu) => {
    setMenuDetailInfo({ category, menu })
    setShowMenuDetail(true)
    logger.debug(`검색 결과에서 상세정보 표시: ${category} - ${menu}`)
  }

  /**
   * 식당 클릭 핸들러
   * @param {Object} place - Kakao 장소 객체
   */
  const handlePlaceClick = (place) => {
    selectPlace(place)
  }

  /**
   * 추천 패널에서 메뉴 선택 핸들러
   * @param {String} category - 카테고리
   * @param {String} menu - 메뉴명
   */
  const handleSelectFromRecommendation = (category, menu) => {
    setSelectedCategory(category)
    setSelectedMenu(menu)
    addToHistory(category, menu)
    setShowRecommendation(false)
    logger.debug(`추천에서 메뉴 선택: ${category} - ${menu}`)
  }

  /**
   * 추천 패널에서 메뉴 상세정보 표시 핸들러
   * @param {String} category - 카테고리
   * @param {String} menu - 메뉴명
   */
  const handleShowDetailFromRecommendation = (category, menu) => {
    setMenuDetailInfo({ category, menu })
    setShowMenuDetail(true)
    logger.debug(`추천에서 상세정보 표시: ${category} - ${menu}`)
  }

  /**
   * 테마 토글 핸들러
   */
  const handleToggleTheme = () => {
    const newTheme = toggleTheme()
    setTheme(newTheme)
  }

  // ==================== 렌더링 ====================
  return (
    <div className={`app ${showMap ? 'show-map' : ''}`}>
      {isLoadingMap && <LoadingSpinner message="지도 로딩 중..." />}

      <div className="main-panel">
        <div className="container">
          {/* 헤더 */}
          <header className="header">
            <div className="header-content">
              <h1 className="title">🍽️ 점심 메뉴 추천</h1>
              <p className="subtitle">오늘 뭐 먹을까?</p>
            </div>
            <div className="header-buttons">
              <button
                className="search-toggle-btn"
                onClick={() => setShowSearch(!showSearch)}
                title="메뉴 검색"
              >
                🔍 검색
              </button>
              <button
                className="recommendation-toggle-btn"
                onClick={() => setShowRecommendation(!showRecommendation)}
                title="AI 추천"
              >
                💡 AI 추천
              </button>
              <button
                className="menu-manage-btn"
                onClick={() => setShowMenuManager(true)}
                title="메뉴 관리"
              >
                ⚙️ 메뉴 관리
              </button>
              <button
                className="theme-toggle-btn"
                onClick={handleToggleTheme}
                title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
              >
                {theme === 'dark' ? '☀️ 라이트' : '🌙 다크'}
              </button>
            </div>
          </header>

          {/* 검색 섹션 */}
          {showSearch && (
            <div className="search-section">
              <MenuSearch
                onSelectMenu={handleSelectFromSearch}
                onShowDetail={handleShowDetailFromSearch}
              />
            </div>
          )}

          {/* 카테고리 섹션 */}
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

          {/* 랜덤 추천 섹션 */}
          <div className="random-section">
            <button
              className="random-btn"
              onClick={handleRandomClick}
              disabled={isSpinning}
            >
              🎲 랜덤 추천
            </button>
            {selectedCategory && !isSpinning && !selectedMenu && (
              <p className="category-hint">
                💡 <strong>{selectedCategory}</strong> 카테고리에서 추천됩니다
              </p>
            )}
          </div>

          {/* 결과 표시 섹션 */}
          {(selectedMenu || isSpinning) && (
            <div className={`result-section ${isAnimating ? 'animating' : ''}`}>
              <div
                className={`result-card ${isSpinning ? 'spinning' : ''}`}
                onClick={() => !isSpinning && handleShowMenuDetail()}
                style={{ cursor: isSpinning ? 'default' : 'pointer' }}
                title={isSpinning ? '' : '메뉴 상세정보 보기'}
              >
                <div className="result-category">{selectedCategory}</div>
                <div className={`result-menu ${isSpinning ? 'spinning-text' : ''}`}>
                  {isSpinning ? spinningMenu || '🎰' : selectedMenu}
                </div>
                <div className="result-footer">
                  {isSpinning ? '두근두근... 🎲' : '📍 클릭하여 상세정보 보기 | 오른쪽 지도에서 주변 식당 확인'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 지도 패널 */}
      {showMap && (
        <div className="map-panel">
          <button className="divider-close-btn" onClick={handleCloseMap} title="닫기">
            ✕
          </button>
          <div className="map-header">
            <div className="map-header-content">
              <h2 className="map-title">
                🗺️ {selectedMenu} 검색 결과
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
                      onClick={() => selectPlace(null)}
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

      {/* 메뉴 상세정보 모달 */}
      {showMenuDetail && (
        <MenuDetailModal
          category={menuDetailInfo.category}
          menu={menuDetailInfo.menu}
          onClose={handleCloseMenuDetail}
          onShare={handleShareMenu}
        />
      )}

      {/* AI 추천 패널 */}
      {showRecommendation && (
        <RecommendationPanel
          onSelectMenu={handleSelectFromRecommendation}
          onShowDetail={handleShowDetailFromRecommendation}
          isVisible={showRecommendation}
          onClose={() => setShowRecommendation(false)}
        />
      )}
    </div>
  )
}

export default App
