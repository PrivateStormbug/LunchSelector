/**
 * Recommendation Manager for AI-based Menu Recommendations
 * 사용자 행동 분석 및 AI 기반 메뉴 추천 시스템
 */

import { menuData } from './menuData'
import { getMenuDetail, getAllMenuDetails } from './menuDetailManager'
import { getSearchHistory } from './searchManager'

/**
 * 모든 메뉴를 배열 형태로 반환
 * @returns {Array} 메뉴 배열
 */
function getAllMenus() {
  const allMenus = []
  const allDetails = getAllMenuDetails()

  // menuData의 모든 카테고리와 메뉴 순회
  Object.entries(menuData).forEach(([category, menus]) => {
    if (Array.isArray(menus)) {
      menus.forEach(menu => {
        const detail = allDetails[menu] || { calories: 0, preparationTime: 15 }
        allMenus.push({
          category,
          menu,
          detail
        })
      })
    }
  })

  return allMenus
}

/**
 * 사용자 프로필 생성
 * @returns {Object} 사용자 프로필
 */
export function buildUserProfile() {
  const profile = {
    categoryPreferences: {},
    menuPreferences: {},
    searchPatterns: [],
    viewHistory: [],
    timePatterns: {},
    preferences: {}
  }

  // 카테고리별 선택 빈도 분석
  const viewedMenus = JSON.parse(
    localStorage.getItem('lunch_selector_viewed_menus') || '[]'
  )
  
  viewedMenus.forEach(item => {
    if (!profile.categoryPreferences[item.category]) {
      profile.categoryPreferences[item.category] = 0
    }
    profile.categoryPreferences[item.category]++
  })

  // 메뉴별 선택 빈도 분석
  viewedMenus.forEach(item => {
    const key = `${item.category}_${item.menu}`
    if (!profile.menuPreferences[key]) {
      profile.menuPreferences[key] = 0
    }
    profile.menuPreferences[key]++
  })

  // 검색 패턴 분석
  const searchHistory = getSearchHistory()
  profile.searchPatterns = searchHistory.slice(0, 10)
  profile.viewHistory = viewedMenus.slice(0, 20)

  // 시간대별 선택 패턴 분석
  viewedMenus.forEach(item => {
    if (item.timestamp) {
      const hour = new Date(item.timestamp).getHours()
      const timeSlot = getTimeSlot(hour)
      if (!profile.timePatterns[timeSlot]) {
        profile.timePatterns[timeSlot] = 0
      }
      profile.timePatterns[timeSlot]++
    }
  })

  // 사용자 설정 로드
  const userPrefs = JSON.parse(
    localStorage.getItem('lunch_selector_user_preferences') || '{}'
  )
  profile.preferences = userPrefs

  return profile
}

/**
 * 시간대 분류 (점심시간, 저녁시간 등)
 * @param {number} hour - 시간
 * @returns {string} 시간대 이름
 */
function getTimeSlot(hour) {
  if (hour >= 11 && hour < 13) return '점심'
  if (hour >= 18 && hour < 20) return '저녁'
  if (hour >= 6 && hour < 11) return '아침'
  if (hour >= 20 && hour < 23) return '야식'
  return '기타'
}

/**
 * 카테고리 기반 추천
 * @param {Object} profile - 사용자 프로필
 * @param {number} count - 추천 개수
 * @returns {Array} 추천 메뉴 배열
 */
export function recommendByCategory(profile, count = 5) {
  const recommendations = []

  // 사용자가 자주 선택하는 카테고리 찾기
  const preferredCategories = Object.entries(profile.categoryPreferences)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])

  if (preferredCategories.length === 0) {
    // 선택 기록이 없으면 전체 카테고리에서 추천
    preferredCategories.push(...Object.keys(menuData))
  }

  // 추천할 카테고리 선택 (선호도가 높은 카테고리에서 70%, 다른 카테고리에서 30%)
  const selectedCategories = []
  
  // 70%: 선호도 높은 카테고리
  const preferredCount = Math.ceil(count * 0.7)
  for (let i = 0; i < preferredCount && i < preferredCategories.length; i++) {
    selectedCategories.push(preferredCategories[i])
  }

  // 30%: 다른 카테고리
  const otherCategories = Object.keys(menuData).filter(
    cat => !selectedCategories.includes(cat)
  )
  const otherCount = count - selectedCategories.length
  for (let i = 0; i < otherCount && i < otherCategories.length; i++) {
    selectedCategories.push(otherCategories[Math.floor(Math.random() * otherCategories.length)])
  }

  // 각 카테고리에서 메뉴 선택
  selectedCategories.slice(0, count).forEach(category => {
    const menus = menuData[category] || []
    if (menus.length > 0) {
      const randomMenu = menus[Math.floor(Math.random() * menus.length)]
      const detail = getMenuDetail(category, randomMenu)
      recommendations.push({
        category,
        menu: randomMenu,
        detail,
        reason: '자주 선택하는 카테고리'
      })
    }
  })

  return recommendations.slice(0, count)
}

/**
 * 다양성 기반 추천 (아직 시도하지 않은 메뉴)
 * @param {Object} profile - 사용자 프로필
 * @param {number} count - 추천 개수
 * @returns {Array} 추천 메뉴 배열
 */
export function recommendNewMenus(profile, count = 5) {
  const recommendations = []
  const allMenus = getAllMenus()
  const triedMenus = new Set(
    Object.keys(profile.menuPreferences).map(key => key)
  )

  // 시도하지 않은 메뉴 필터링
  const newMenus = allMenus.filter(item => {
    const key = `${item.category}_${item.menu}`
    return !triedMenus.has(key)
  })

  // 추천 점수 계산
  const scored = newMenus.map(item => {
    let score = 0

    // 1. 선호 카테고리에서 나온 메뉴 가산점
    if (profile.categoryPreferences[item.category]) {
      score += profile.categoryPreferences[item.category] * 10
    }

    // 2. 검색 패턴과의 유사도
    const searchScore = calculateSearchSimilarity(item.menu, profile.searchPatterns)
    score += searchScore * 5

    // 3. 준비시간 짧은 메뉴 가산점
    if (item.detail.preparationTime <= 15) {
      score += 20
    }

    // 4. 영양점수 높은 메뉴 가산점
    if (item.detail.nutritionScore >= 70) {
      score += 15
    }

    return { ...item, score }
  })

  // 점수가 높은 순서로 정렬
  scored.sort((a, b) => b.score - a.score)

  // 상위 count개 반환
  scored.slice(0, count).forEach(item => {
    recommendations.push({
      category: item.category,
      menu: item.menu,
      detail: item.detail,
      reason: '새로운 메뉴 추천',
      score: item.score
    })
  })

  return recommendations
}

/**
 * 검색어와의 유사도 계산
 * @param {string} text - 검사할 텍스트
 * @param {Array} searchPatterns - 검색 패턴 배열
 * @returns {number} 유사도 점수
 */
function calculateSearchSimilarity(text, searchPatterns) {
  let maxSimilarity = 0

  searchPatterns.forEach(pattern => {
    const similarity = calculateStringSimilarity(text, pattern)
    maxSimilarity = Math.max(maxSimilarity, similarity)
  })

  return maxSimilarity
}

/**
 * 문자열 유사도 계산 (Levenshtein 거리 기반)
 * @param {string} str1 - 첫 번째 문자열
 * @param {string} str2 - 두 번째 문자열
 * @returns {number} 유사도 (0-1)
 */
function calculateStringSimilarity(str1, str2) {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()

  // 공통 부분 문자열 찾기
  let commonLength = 0
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) {
      commonLength++
    } else {
      break
    }
  }

  const maxLength = Math.max(s1.length, s2.length)
  return commonLength / maxLength
}

/**
 * 시간대 기반 추천
 * @param {Object} profile - 사용자 프로필
 * @param {number} count - 추천 개수
 * @returns {Array} 추천 메뉴 배열
 */
export function recommendByTimeOfDay(profile, count = 5) {
  const recommendations = []
  const currentHour = new Date().getHours()
  const currentTimeSlot = getTimeSlot(currentHour)

  // 현재 시간대에 자주 선택하는 카테고리 찾기
  const preferredInTimeSlot = []
  
  // 시간대별 패턴에 따른 추천
  if (currentTimeSlot === '점심') {
    // 점심에는 빠른 음식 추천
    const allMenus = getAllMenus()
    const fastMenus = allMenus.filter(item => item.detail.preparationTime <= 20)
    
    fastMenus.sort((a, b) => {
      let scoreA = 0
      let scoreB = 0

      // 선호 카테고리 가산점
      if (profile.categoryPreferences[a.category]) {
        scoreA += profile.categoryPreferences[a.category] * 10
      }
      if (profile.categoryPreferences[b.category]) {
        scoreB += profile.categoryPreferences[b.category] * 10
      }

      // 영양점수 가산점
      scoreA += a.detail.nutritionScore
      scoreB += b.detail.nutritionScore

      return scoreB - scoreA
    })

    fastMenus.slice(0, count).forEach(item => {
      recommendations.push({
        category: item.category,
        menu: item.menu,
        detail: item.detail,
        reason: `점심시간 빠른 음식 추천 (${item.detail.preparationTime}분)`
      })
    })
  } else {
    // 다른 시간대에는 일반 추천
    recommendations.push(...recommendByCategory(profile, count))
  }

  return recommendations.slice(0, count)
}

/**
 * 종합 AI 추천
 * @param {Object} profile - 사용자 프로필
 * @param {number} count - 추천 개수
 * @returns {Array} 추천 메뉴 배열
 */
export function generateAIRecommendations(profile, count = 5) {
  // 추천 전략 조합
  const recommendations = {}

  // 1. 카테고리 기반 추천 (40%)
  const categoryRecs = recommendByCategory(profile, Math.ceil(count * 0.4))
  categoryRecs.forEach((rec, idx) => {
    const key = `${rec.category}_${rec.menu}`
    recommendations[key] = { ...rec, score: 40 }
  })

  // 2. 새 메뉴 추천 (35%)
  const newMenuRecs = recommendNewMenus(profile, Math.ceil(count * 0.35))
  newMenuRecs.forEach((rec, idx) => {
    const key = `${rec.category}_${rec.menu}`
    if (recommendations[key]) {
      recommendations[key].score += 35
      recommendations[key].reason += ' + 새로운 메뉴'
    } else {
      recommendations[key] = { ...rec, score: 35 }
    }
  })

  // 3. 시간대 기반 추천 (25%)
  const timeRecs = recommendByTimeOfDay(profile, Math.ceil(count * 0.25))
  timeRecs.forEach((rec, idx) => {
    const key = `${rec.category}_${rec.menu}`
    if (recommendations[key]) {
      recommendations[key].score += 25
      recommendations[key].reason += ' + 현재 시간대 추천'
    } else {
      recommendations[key] = { ...rec, score: 25 }
    }
  })

  // 종합 점수로 정렬 후 반환
  return Object.values(recommendations)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
}

/**
 * 사용자 설정 저장
 * @param {Object} preferences - 사용자 설정
 */
export function saveUserPreferences(preferences) {
  localStorage.setItem(
    'lunch_selector_user_preferences',
    JSON.stringify(preferences)
  )
}

/**
 * 사용자 설정 로드
 * @returns {Object} 사용자 설정
 */
export function loadUserPreferences() {
  return JSON.parse(
    localStorage.getItem('lunch_selector_user_preferences') || '{}'
  )
}

/**
 * 추천 이력 저장
 * @param {Array} recommendations - 추천 메뉴 배열
 */
export function recordRecommendations(recommendations) {
  const history = JSON.parse(
    localStorage.getItem('lunch_selector_recommendation_history') || '[]'
  )

  const record = {
    timestamp: Date.now(),
    recommendations: recommendations.map(rec => ({
      category: rec.category,
      menu: rec.menu,
      reason: rec.reason,
      score: rec.score
    }))
  }

  history.push(record)
  // 최대 30개 기록만 유지
  if (history.length > 30) {
    history.shift()
  }

  localStorage.setItem(
    'lunch_selector_recommendation_history',
    JSON.stringify(history)
  )
}

/**
 * 추천 이력 조회
 * @returns {Array} 추천 이력 배열
 */
export function getRecommendationHistory() {
  return JSON.parse(
    localStorage.getItem('lunch_selector_recommendation_history') || '[]'
  )
}

/**
 * 추천 피드백 기록
 * @param {string} category - 카테고리
 * @param {string} menu - 메뉴명
 * @param {number} rating - 평점 (1-5)
 */
export function recordRecommendationFeedback(category, menu, rating) {
  const feedback = JSON.parse(
    localStorage.getItem('lunch_selector_recommendation_feedback') || '[]'
  )

  feedback.push({
    timestamp: Date.now(),
    category,
    menu,
    rating
  })

  // 최대 100개 기록만 유지
  if (feedback.length > 100) {
    feedback.shift()
  }

  localStorage.setItem(
    'lunch_selector_recommendation_feedback',
    JSON.stringify(feedback)
  )
}

/**
 * 추천 통계 조회
 * @returns {Object} 추천 통계
 */
export function getRecommendationStats() {
  const feedback = JSON.parse(
    localStorage.getItem('lunch_selector_recommendation_feedback') || '[]'
  )

  if (feedback.length === 0) {
    return {
      avgRating: 0,
      totalFeedback: 0,
      byRating: {}
    }
  }

  const stats = {
    totalFeedback: feedback.length,
    byRating: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    },
    avgRating: 0
  }

  let totalRating = 0
  feedback.forEach(item => {
    if (item.rating >= 1 && item.rating <= 5) {
      stats.byRating[item.rating]++
      totalRating += item.rating
    }
  })

  stats.avgRating = (totalRating / feedback.length).toFixed(2)

  return stats
}

export default {
  buildUserProfile,
  recommendByCategory,
  recommendNewMenus,
  recommendByTimeOfDay,
  generateAIRecommendations,
  saveUserPreferences,
  loadUserPreferences,
  recordRecommendations,
  getRecommendationHistory,
  recordRecommendationFeedback,
  getRecommendationStats
}
