import React, { useState, useEffect, useRef } from 'react'
import {
  generateAIRecommendations,
  buildUserProfile,
  recordRecommendations,
  recordRecommendationFeedback,
  getRecommendationStats,
  generateAIRecommendationsWithLocation
} from './recommendationManager'
import { isKakaoMapsReady, waitForKakaoMapsReady } from './kakaoMapUtils'
import './RecommendationPanel.css'

/**
 * RecommendationPanel Component - AI 기반 메뉴 추천 패널
 */
function RecommendationPanel({ onSelectMenu, onShowDetail, isVisible, onClose }) {
  const [recommendations, setRecommendations] = useState([])
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('recommendations')
  const [feedbackRatings, setFeedbackRatings] = useState({})
  const [showFeedback, setShowFeedback] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [nearbyRestaurants, setNearbyRestaurants] = useState([])
  const [searchedRadius, setSearchedRadius] = useState(0) // 실제 검색된 거리 추적
  const isSearchingNearbyRef = useRef(false)

  // 추천 생성
  useEffect(() => {
    if (isVisible) {
      getCurrentLocation()
      loadStats()
    }
  }, [isVisible])

  // nearbyRestaurants가 업데이트되면 추천 생성
  useEffect(() => {
    if (currentLocation && nearbyRestaurants.length > 0) {
      generateRecommendationsWithLocation(currentLocation.latitude, currentLocation.longitude)
    }
  }, [nearbyRestaurants])

  /**
   * 현재 위치 정보 가져오기
   */
  const getCurrentLocation = () => {
    console.log('🔐 [getCurrentLocation] Geolocation 권한 요청 시작...')
    if (navigator.geolocation) {
      console.log('✅ [getCurrentLocation] Geolocation API 지원')
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy, altitude, altitudeAccuracy } = position.coords
          console.log('📍 [getCurrentLocation] 현재 위치 획득 성공')
          console.log(`   좌표: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
          console.log(`   정확도: ±${Math.round(accuracy)}m`)
          if (altitude !== null) console.log(`   고도: ${Math.round(altitude)}m`)
          setCurrentLocation({ latitude, longitude })

          // 현재 위치에서 음식점 검색
          await searchNearbyRestaurants(latitude, longitude)
        },
        (error) => {
          console.warn('❌ [getCurrentLocation] 위치 정보 오류')
          console.warn(`   에러 코드: ${error.code}`)
          console.warn(`   에러 메시지: ${error.message}`)

          // 에러 코드별 설명
          switch(error.code) {
            case error.PERMISSION_DENIED:
              console.warn('   원인: 사용자가 위치 공유 권한을 거부했습니다')
              console.warn('   해결: 브라우저 설정 > 위치 > 허용으로 변경하세요')
              break
            case error.POSITION_UNAVAILABLE:
              console.warn('   원인: GPS 신호를 수신할 수 없습니다')
              break
            case error.TIMEOUT:
              console.warn('   원인: 위치 조회 시간이 초과되었습니다')
              break
          }
          console.log('📌 기본 추천으로 진행합니다.')
          generateRecommendations()
        }
      )
    } else {
      console.warn('❌ [getCurrentLocation] Geolocation API를 지원하지 않습니다')
      console.log('📌 기본 추천으로 진행합니다.')
      generateRecommendations()
    }
  }

  /**
   * 현재 위치 근처 음식점 검색
   */
  const searchNearbyRestaurants = async (latitude, longitude) => {
    // 중복 요청 방지 (useRef로 동기식 체크)
    if (isSearchingNearbyRef.current) {
      console.log('🔄 이미 검색 중입니다. 중복 요청 무시')
      return
    }

    isSearchingNearbyRef.current = true
    try {
      // 입력값 검증
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new Error('위치 정보가 유효하지 않습니다.')
      }

      // 카카오맵 준비 대기
      console.log('[searchNearbyRestaurants] 카카오맵 대기 중...')
      try {
        await waitForKakaoMapsReady()
        console.log('[searchNearbyRestaurants] 카카오맵 대기 완료')
      } catch (error) {
        console.warn('⚠️ 카카오맵 API 로드 실패:', error.message)
        console.log('📌 기본 추천으로 진행합니다.')
        generateRecommendations()
        return
      }

      // 카카오맵 준비 확인
      const kakaoReady = isKakaoMapsReady()
      console.log('[searchNearbyRestaurants] isKakaoMapsReady():', kakaoReady)
      if (!kakaoReady) {
        console.warn('⚠️ 카카오맵 API가 아직 준비되지 않았습니다.')
        console.log('📌 기본 추천으로 진행합니다.')
        generateRecommendations()
        return
      }

      console.log('🔍 카카오맵에서 근처 음식점 검색 중...')
      console.log(`📍 검색 위치: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)

      // Kakao Maps 객체 존재 확인
      if (!window.kakao?.maps?.services?.Places) {
        throw new Error('Kakao Maps Places 서비스가 준비되지 않았습니다.')
      }

      // Places 객체 생성
      const ps = new window.kakao.maps.services.Places()

      console.log('🔄 Places.keywordSearch() 호출 중...')
      console.log(`📍 위도: ${latitude}, 경도: ${longitude}`)

      // 거리 확장 레벨: [3km, 5km, 10km, 15km, 20km, 30km]
      const RADIUS_LEVELS = [3000, 5000, 10000, 15000, 20000, 30000];

      // 다양한 음식 관련 키워드로 검색 (일반 음식점, 카페, 식당 등)
      // 여러 키워드의 결과를 합쳐서 더 많은 결과 확보
      const searchKeywords = ['음식점', '식당', '카페', '커피숍']
      const allResults = {}  // 중복 제거용 객체 (ID 기반)

      return new Promise((resolve, reject) => {
        let completedSearches = 0
        let totalSearches = searchKeywords.length

        const searchCallback = (data, status) => {
          try {
            console.log(`[searchNearbyRestaurants] 검색 콜백 - status: ${status}, 결과: ${Array.isArray(data) ? data.length : 'null'}`)

            if (status === window.kakao.maps.services.Status.OK) {
              console.log(`✅ 검색 완료: ${data.length}개`)

              // 중복 제거하면서 모든 결과 수집
              if (data && data.length > 0) {
                data.forEach(place => {
                  if (!allResults[place.id]) {
                    allResults[place.id] = place
                  }
                })
              }

              completedSearches++
              console.log(`📊 검색 진행: ${completedSearches}/${totalSearches}`)

              // 모든 검색이 완료되면 결과 처리
              if (completedSearches === totalSearches) {
                const resultsArray = Object.values(allResults)
                console.log(`✅ 최종 수집: ${resultsArray.length}개`)

                if (resultsArray.length > 0) {
                  // 🔍 첫 번째 항목 상세 디버깅
                  const firstPlace = resultsArray[0]
                  console.log('🔍 [첫 번째 검색 결과 상세 분석]')
                  console.log(`   place_name: ${firstPlace.place_name}`)
                  console.log(`   place.x: ${firstPlace.x}`)
                  console.log(`   place.y: ${firstPlace.y}`)
                  console.log(`   사용자 경도: ${longitude}`)
                  console.log(`   사용자 위도: ${latitude}`)

                  // 모든 데이터에 거리 계산 (Haversine 공식 - 정확한 지구 거리)
                  const allWithDistance = resultsArray.map((place, idx) => {
                    const placeX = parseFloat(place.x)  // 경도
                    const placeY = parseFloat(place.y)  // 위도

                    // Haversine 공식: 정확한 지구 거리 계산
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

                    // 첫 번째 항목만 상세 계산 과정 출력
                    if (idx === 0) {
                      console.log(`   ΔLat (라디안): ${deltaLat}`)
                      console.log(`   ΔLng (라디안): ${deltaLng}`)
                      console.log(`   a 값: ${a}`)
                      console.log(`   c 값: ${c}`)
                      console.log(`   최종 거리: ${distance}m`)
                    }

                    return { ...place, distance }
                  }).sort((a, b) => a.distance - b.distance)

                  // 거리 통계 로깅
                  const distances = allWithDistance.map(p => p.distance)
                  const minDistance = Math.min(...distances)
                  const maxDistance = Math.max(...distances)
                  const avgDistance = (distances.reduce((a, b) => a + b, 0) / distances.length).toFixed(0)

                  console.log(`📊 거리 통계:`)
                  console.log(`  - 최단: ${Math.round(minDistance)}m`)
                  console.log(`  - 최장: ${Math.round(maxDistance)}m`)
                  console.log(`  - 평균: ${avgDistance}m`)
                  console.log(`  - 상위 5개 음식점:`)
                  allWithDistance.slice(0, 5).forEach((p, i) => {
                    console.log(`    ${i+1}. ${p.place_name} - ${Math.round(p.distance)}m`)
                  })

                  // 점진적 거리 확장: 각 반경에서 최소 5개 이상 찾을 때까지 확대
                  const MIN_RESTAURANTS = 5;  // 최소 표시 음식점 개수
                  let foundRestaurants = [];
                  let actualRadius = 0;
                  let selectedRadiusLevel = 0;

                  for (const radius of RADIUS_LEVELS) {
                    const filtered = allWithDistance.filter(place => place.distance <= radius)
                    console.log(`🔍 ${radius / 1000}km 반경: ${filtered.length}개 음식점`)

                    if (filtered.length >= MIN_RESTAURANTS) {
                      // 최소 5개 이상 발견하면 상위 5개만 선택
                      foundRestaurants = filtered.slice(0, MIN_RESTAURANTS)
                      actualRadius = radius / 1000
                      selectedRadiusLevel = radius
                      console.log(`✨ ${actualRadius}km 반경에서 ${filtered.length}개 중 상위 ${MIN_RESTAURANTS}개 선택!`)
                      console.log('검색된 음식점 (거리순):', foundRestaurants.map(p => ({
                        name: p.place_name,
                        distance: `${Math.round(p.distance)}m (${(p.distance / 1000).toFixed(2)}km)`
                      })))
                      break;
                    }
                  }

                  // 마지막 반경까지 갔는데도 MIN_RESTAURANTS개 미만이면, 거리순 상위 MIN_RESTAURANTS개 반환
                  if (foundRestaurants.length === 0) {
                    foundRestaurants = allWithDistance.slice(0, Math.min(MIN_RESTAURANTS, allWithDistance.length))
                    actualRadius = foundRestaurants.length > 0
                      ? (foundRestaurants[foundRestaurants.length - 1].distance / 1000).toFixed(2)
                      : 0
                    console.log(`📍 조건을 만족하는 반경이 없음 → 거리순 상위 ${foundRestaurants.length}개 선택`)
                    console.log('검색된 음식점 (거리순):', foundRestaurants.map(p => ({
                      name: p.place_name,
                      distance: `${Math.round(p.distance)}m (${(p.distance / 1000).toFixed(2)}km)`
                    })))
                  } else {
                    console.log(`🎯 최종 결과: ${actualRadius}km 반경에서 ${foundRestaurants.length}개 음식점 선택`)
                  }

                  setNearbyRestaurants(foundRestaurants)
                  setSearchedRadius(actualRadius)
                } else {
                  // 결과가 없을 경우
                  console.log('⚠️ 수집된 결과가 없습니다.')
                  setNearbyRestaurants([])
                  setSearchedRadius(0)
                  generateRecommendations()
                }
              }
            } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
              console.log('⚠️ 검색 결과 없음')
              completedSearches++

              if (completedSearches === totalSearches) {
                const resultsArray = Object.values(allResults)
                console.log(`✅ 최종 수집: ${resultsArray.length}개`)

                if (resultsArray.length === 0) {
                  setNearbyRestaurants([])
                  setSearchedRadius(0)
                  generateRecommendations()
                }
              }
            } else {
              console.error(`❌ 검색 실패: ${status}`)
              completedSearches++

              // 마지막 검색이 실패했을 때
              if (completedSearches === totalSearches && Object.keys(allResults).length === 0) {
                throw new Error(`장소 검색 실패: ${status}`)
              }
            }
          } catch (error) {
            console.error('❌ 검색 콜백 처리 중 오류:', error)
            reject(error)
          }
        }

        // ✅ Kakao Maps JS SDK의 keywordSearch() 사용
        // 주의: searchOptions는 지원되지 않음 (HTTP 400 에러 발생)
        // 모든 결과를 받아서 클라이언트에서 거리순으로 정렬
        console.log(`🔍 위치 기반 검색 시작: (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`)
        console.log(`   → 다양한 키워드로 음식점 검색 후 클라이언트에서 거리순 정렬`)
        console.log(`   → 검색 키워드: ${searchKeywords.join(', ')}`)

        // 각 키워드별로 검색 실행
        searchKeywords.forEach((keyword) => {
          ps.keywordSearch(keyword, searchCallback)
        })
      })
    } catch (error) {
      console.error('❌ 음식점 검색 오류:', error)
      console.error('에러 메시지:', error.message)
      console.log('📌 기본 추천으로 폴백합니다.')

      // 음식점 검색 실패 시 기본 추천 실행
      setNearbyRestaurants([])
      generateRecommendations()
    } finally {
      isSearchingNearbyRef.current = false
    }
  }

  /**
   * AI 추천 생성 (위치 기반)
   */
  const generateRecommendationsWithLocation = (latitude, longitude) => {
    setIsLoading(true)
    console.log('🤖 위치 기반 AI 추천 생성 중...')

    // 사용자 프로필 구성
    const profile = buildUserProfile()

    // 위치 기반 AI 추천 생성
    const aiRecommendations = generateAIRecommendationsWithLocation(
      profile,
      nearbyRestaurants,
      { latitude, longitude },
      5
    )

    // 추천 이력 저장
    recordRecommendations(aiRecommendations)

    console.log(`✨ 추천 완료: ${aiRecommendations.length}개 메뉴`)
    setRecommendations(aiRecommendations)
    setIsLoading(false)
  }

  /**
   * AI 추천 생성 (기본)
   */
  const generateRecommendations = () => {
    setIsLoading(true)
    console.log('🤖 기본 AI 추천 생성 중...')

    // 사용자 프로필 구성
    const profile = buildUserProfile()

    // AI 추천 생성
    const aiRecommendations = generateAIRecommendations(profile, 5)

    // 추천 이력 저장
    recordRecommendations(aiRecommendations)

    console.log(`✨ 추천 완료: ${aiRecommendations.length}개 메뉴`)
    setRecommendations(aiRecommendations)
    setIsLoading(false)
  }

  /**
   * 통계 로드
   */
  const loadStats = () => {
    const stats = getRecommendationStats()
    setStats(stats)
  }

  /**
   * 추천 메뉴 클릭
   */
  const handleRecommendationClick = (recommendation) => {
    if (onSelectMenu) {
      onSelectMenu(recommendation.category, recommendation.menu)
    }
    if (onShowDetail) {
      onShowDetail(recommendation.category, recommendation.menu)
    }
  }

  /**
   * 피드백 제출
   */
  const handleSubmitFeedback = (category, menu, rating) => {
    recordRecommendationFeedback(category, menu, rating)
    setFeedbackRatings(prev => ({
      ...prev,
      [`${category}_${menu}`]: rating
    }))
    setShowFeedback(prev => ({
      ...prev,
      [`${category}_${menu}`]: false
    }))
    
    // 통계 업데이트
    loadStats()
  }

  /**
   * 새로운 추천 생성
   */
  const handleRefresh = () => {
    generateRecommendations()
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="recommendation-panel">
      <div className="panel-header">
        <h2 className="panel-title">🤖 AI 메뉴 추천</h2>
        <button
          className="panel-close-btn"
          onClick={onClose}
          aria-label="패널 닫기"
          title="닫기"
        >
          ✕
        </button>
      </div>

      {/* 현재 위치 정보 표시 */}
      {currentLocation && (
        <div className="location-info">
          📍 현재 위치: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
        </div>
      )}

      <div className="panel-tabs">
        <button
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          💡 추천
        </button>
        <button
          className={`tab-btn ${activeTab === 'nearby' ? 'active' : ''}`}
          onClick={() => setActiveTab('nearby')}
        >
          📍 근처 ({nearbyRestaurants.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 통계
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'recommendations' && (
          <div className="recommendations-tab">
            {isLoading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>추천을 생성하는 중입니다...</p>
              </div>
            ) : (
              <>
                {recommendations.length > 0 ? (
                  <>
                    <div className="recommendations-list">
                      {recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="recommendation-card"
                        >
                          <div className="card-ranking">
                            {idx === 0 && '🥇'}
                            {idx === 1 && '🥈'}
                            {idx === 2 && '🥉'}
                            {idx > 2 && `${idx + 1}`}
                          </div>

                          <div className="card-content">
                            <div className="card-header">
                              <h3 className="card-menu-name">{rec.menu}</h3>
                              <span className="card-category">{rec.category}</span>
                            </div>

                            <p className="card-reason">
                              <span className="reason-icon">✨</span>
                              {rec.reason}
                            </p>

                            <div className="card-details">
                              <span className="detail-item">
                                🔥 {rec.detail.calories}kcal
                              </span>
                              <span className="detail-item">
                                💰 {rec.detail.price?.toLocaleString()}원
                              </span>
                              <span className="detail-item">
                                ⏱️ {rec.detail.preparationTime}분
                              </span>
                            </div>

                            {rec.detail.tags && rec.detail.tags.length > 0 && (
                              <div className="card-tags">
                                {rec.detail.tags.slice(0, 2).map((tag, i) => (
                                  <span key={i} className="tag">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="card-actions">
                            <button
                              className="action-btn select-btn"
                              onClick={() => handleRecommendationClick(rec)}
                              title="이 메뉴 선택"
                            >
                              선택
                            </button>
                            <button
                              className="action-btn feedback-btn"
                              onClick={() =>
                                setShowFeedback(prev => ({
                                  ...prev,
                                  [`${rec.category}_${rec.menu}`]:
                                    !prev[`${rec.category}_${rec.menu}`]
                                }))
                              }
                              title="피드백 제공"
                            >
                              💬
                            </button>
                          </div>

                          {showFeedback[`${rec.category}_${rec.menu}`] && (
                            <div className="feedback-section">
                              <p className="feedback-question">
                                이 추천이 만족스러웠나요?
                              </p>
                              <div className="rating-buttons">
                                {[1, 2, 3, 4, 5].map(rating => (
                                  <button
                                    key={rating}
                                    className={`rating-btn ${
                                      feedbackRatings[`${rec.category}_${rec.menu}`] === rating
                                        ? 'selected'
                                        : ''
                                    }`}
                                    onClick={() =>
                                      handleSubmitFeedback(
                                        rec.category,
                                        rec.menu,
                                        rating
                                      )
                                    }
                                    title={`${rating}점 평가`}
                                  >
                                    {rating}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      className="refresh-btn"
                      onClick={handleRefresh}
                      title="새로운 추천 생성"
                    >
                      🔄 새로운 추천 받기
                    </button>
                  </>
                ) : (
                  <div className="no-data">
                    <div className="no-data-icon">🤔</div>
                    <p>아직 추천할 데이터가 없습니다.</p>
                    <p className="no-data-hint">
                      메뉴를 더 많이 선택하면 더 나은 추천을 받을 수 있습니다!
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'nearby' && (
          <div className="nearby-tab">
            {nearbyRestaurants.length > 0 ? (
              <div className="nearby-list">
                <div className="nearby-info">
                  📍 현재 위치 {searchedRadius}km 반경에 {nearbyRestaurants.length}개 식당을 찾았습니다
                </div>
                {nearbyRestaurants.map((restaurant, idx) => (
                  <div key={idx} className="nearby-item">
                    <div className="nearby-ranking">{idx + 1}</div>
                    <div className="nearby-content">
                      <h4 className="nearby-name">{restaurant.place_name}</h4>
                      <p className="nearby-address">📍 {restaurant.address_name}</p>
                      <p className="nearby-distance">
                        🚶 {(restaurant.distance / 1000).toFixed(2)}km
                      </p>
                      {restaurant.phone && (
                        <p className="nearby-phone">📞 {restaurant.phone}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <div className="no-data-icon">📍</div>
                <p>현재 위치 30km 반경에 검색된 식당이 없습니다.</p>
                <p className="no-data-hint">
                  다른 메뉴를 시도하거나 위치를 확인해보세요!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-tab">
            {stats && stats.totalFeedback > 0 ? (
              <>
                <div className="stat-card">
                  <div className="stat-label">평균 만족도</div>
                  <div className="stat-value">{stats.avgRating} / 5.0</div>
                  <div className="stat-bar">
                    <div
                      className="stat-fill"
                      style={{
                        width: `${(stats.avgRating / 5) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="rating-distribution">
                  <h4 className="rating-title">평점 분포</h4>
                  {[5, 4, 3, 2, 1].map(rating => (
                    <div key={rating} className="rating-row">
                      <span className="rating-label">{rating}⭐</span>
                      <div className="rating-bar-container">
                        <div
                          className="rating-bar"
                          style={{
                            width: `${
                              stats.totalFeedback > 0
                                ? (stats.byRating[rating] / stats.totalFeedback) * 100
                                : 0
                            }%`
                          }}
                        ></div>
                      </div>
                      <span className="rating-count">
                        {stats.byRating[rating]}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="stat-card total">
                  <span className="stat-label">총 피드백</span>
                  <span className="stat-value">{stats.totalFeedback}개</span>
                </div>
              </>
            ) : (
              <div className="no-data">
                <div className="no-data-icon">📊</div>
                <p>아직 피드백이 없습니다.</p>
                <p className="no-data-hint">
                  추천받은 메뉴에 대해 평가하면 추천이 더 정확해집니다!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RecommendationPanel
