/**
 * 시간대 기반 메뉴 추천 시스템
 * 시간대와 사용자 선택 패턴을 고려하여 메뉴 추천
 * 
 * 주요 기능:
 * - 시간대별 추천 메뉴 제공
 * - 최적의 시간대 계산
 * - 시간대별 카테고리 가중치 적용
 * - 최근 선택 기반 추천
 * - 시간대별 통계 생성
 */

import { logger } from './config'
import { getHistory } from './historyManager'

// 시간대 정의
const TIME_PERIODS = {
  BREAKFAST: { start: 6, end: 11, name: '아침', emoji: '🌅' },
  LUNCH: { start: 11, end: 14, name: '점심', emoji: '🍽️' },
  AFTERNOON: { start: 14, end: 17, name: '간식', emoji: '☕' },
  DINNER: { start: 17, end: 21, name: '저녁', emoji: '🌆' },
  LATE_NIGHT: { start: 21, end: 24, name: '야식', emoji: '🌙' },
  MIDNIGHT: { start: 0, end: 6, name: '심야', emoji: '🌃' }
}

// 시간대별 카테고리 가중치
const CATEGORY_WEIGHTS = {
  아침: {
    한식: 0.6,
    중식: 0.4,
    일식: 0.5,
    양식: 0.4,
    분식: 0.7
  },
  점심: {
    한식: 1.0,
    중식: 0.9,
    일식: 0.7,
    양식: 0.8,
    분식: 0.6
  },
  간식: {
    한식: 0.5,
    중식: 0.4,
    일식: 0.3,
    양식: 0.6,
    분식: 1.0
  },
  저녁: {
    한식: 0.9,
    중식: 0.8,
    일식: 0.8,
    양식: 0.9,
    분식: 0.5
  },
  야식: {
    한식: 0.5,
    중식: 0.9,
    일식: 0.3,
    양식: 0.4,
    분식: 1.0
  },
  심야: {
    한식: 0.3,
    중식: 0.8,
    일식: 0.2,
    양식: 0.3,
    분식: 0.9
  }
}

/**
 * 현재 시간대 구하기
 * @returns {Object} 시간대 정보 { start, end, name, emoji, hour }
 */
export function getCurrentTimePeriod() {
  const hour = new Date().getHours()
  
  let period
  if (hour >= TIME_PERIODS.BREAKFAST.start && hour < TIME_PERIODS.BREAKFAST.end) {
    period = TIME_PERIODS.BREAKFAST
  } else if (hour >= TIME_PERIODS.LUNCH.start && hour < TIME_PERIODS.LUNCH.end) {
    period = TIME_PERIODS.LUNCH
  } else if (hour >= TIME_PERIODS.AFTERNOON.start && hour < TIME_PERIODS.AFTERNOON.end) {
    period = TIME_PERIODS.AFTERNOON
  } else if (hour >= TIME_PERIODS.DINNER.start && hour < TIME_PERIODS.DINNER.end) {
    period = TIME_PERIODS.DINNER
  } else if (hour >= TIME_PERIODS.LATE_NIGHT.start && hour < 24) {
    period = TIME_PERIODS.LATE_NIGHT
  } else {
    period = TIME_PERIODS.MIDNIGHT
  }
  
  return { ...period, hour }
}

/**
 * 특정 시간대 정보 가져오기
 * @param {number} hour - 시간 (0-23)
 * @returns {Object} 시간대 정보
 */
export function getTimePeriodByHour(hour) {
  if (hour >= TIME_PERIODS.BREAKFAST.start && hour < TIME_PERIODS.BREAKFAST.end) {
    return { ...TIME_PERIODS.BREAKFAST, hour }
  } else if (hour >= TIME_PERIODS.LUNCH.start && hour < TIME_PERIODS.LUNCH.end) {
    return { ...TIME_PERIODS.LUNCH, hour }
  } else if (hour >= TIME_PERIODS.AFTERNOON.start && hour < TIME_PERIODS.AFTERNOON.end) {
    return { ...TIME_PERIODS.AFTERNOON, hour }
  } else if (hour >= TIME_PERIODS.DINNER.start && hour < TIME_PERIODS.DINNER.end) {
    return { ...TIME_PERIODS.DINNER, hour }
  } else if (hour >= TIME_PERIODS.LATE_NIGHT.start) {
    return { ...TIME_PERIODS.LATE_NIGHT, hour }
  } else {
    return { ...TIME_PERIODS.MIDNIGHT, hour }
  }
}

/**
 * 현재 시간대에 적합한 카테고리 추천
 * @returns {Array} 카테고리 배열 (가중치 순)
 */
export function getRecommendedCategoriesByTime() {
  try {
    const currentPeriod = getCurrentTimePeriod()
    const weights = CATEGORY_WEIGHTS[currentPeriod.name]
    
    if (!weights) {
      logger.warn(`시간대 '${currentPeriod.name}'에 대한 가중치 없음`)
      return []
    }

    const categories = Object.entries(weights)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, _]) => cat)
    
    logger.debug(`추천 카테고리 (${currentPeriod.name}): ${categories.join(', ')}`)
    return categories
  } catch (error) {
    logger.error('추천 카테고리 조회 실패', error)
    return []
  }
}

/**
 * 특정 시간대에 추천되는 메뉴 점수 계산
 * @param {string} category - 음식 카테고리
 * @param {string} timePeriodName - 시간대명
 * @returns {number} 추천 점수 (0-1)
 */
export function getRecommendationScore(category, timePeriodName) {
  try {
    const weights = CATEGORY_WEIGHTS[timePeriodName]
    if (!weights) {
      logger.warn(`시간대 '${timePeriodName}'에 대한 정보 없음`)
      return 0
    }

    return weights[category] || 0
  } catch (error) {
    logger.error('추천 점수 계산 실패', error)
    return 0
  }
}

/**
 * 최근 선택 기반 시간대 추천
 * 최근 7일간의 선택 패턴을 분석하여 최적 카테고리 제안
 * @param {number} limit - 최대 추천 개수
 * @returns {Array} 추천 카테고리 배열
 */
export function getRecommendedCategoriesByPattern(limit = 3) {
  try {
    const currentPeriod = getCurrentTimePeriod()
    const history = getHistory()
    
    // 최근 7일 데이터 필터링
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    const recentHistory = history.filter(h => h.timestamp > sevenDaysAgo)
    
    if (recentHistory.length === 0) {
      logger.debug('최근 선택 기록 없음, 기본 추천 사용')
      return getRecommendedCategoriesByTime()
    }

    // 시간대별 선택 분석
    const categoryFrequency = {}
    recentHistory.forEach(h => {
      const historyTime = new Date(h.timestamp).getHours()
      const historyPeriod = getTimePeriodByHour(historyTime)
      
      if (historyPeriod.name === currentPeriod.name) {
        categoryFrequency[h.category] = (categoryFrequency[h.category] || 0) + 1
      }
    })

    // 빈도 순으로 정렬
    const recommendedCategories = Object.entries(categoryFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([cat, _]) => cat)

    // 사용자 패턴이 없으면 시간대 기반 추천 사용
    if (recommendedCategories.length === 0) {
      return getRecommendedCategoriesByTime().slice(0, limit)
    }

    logger.debug(`시간대 패턴 추천 (${currentPeriod.name}): ${recommendedCategories.join(', ')}`)
    return recommendedCategories
  } catch (error) {
    logger.error('패턴 기반 추천 실패', error)
    return getRecommendedCategoriesByTime()
  }
}

/**
 * 시간대별 통계
 * @returns {Object} 시간대별 선택 통계
 */
export function getTimeBasedStats() {
  try {
    const history = getHistory()
    const stats = {
      periodStats: {},
      mostPopularTimeCategory: null,
      leastPopularTimeCategory: null
    }

    Object.values(TIME_PERIODS).forEach(period => {
      stats.periodStats[period.name] = {
        totalSelections: 0,
        categoryBreakdown: {},
        emoji: period.emoji
      }
    })

    // 각 기록을 시간대별로 분류
    history.forEach(h => {
      const hour = new Date(h.timestamp).getHours()
      const period = getTimePeriodByHour(hour)
      
      stats.periodStats[period.name].totalSelections += 1
      stats.periodStats[period.name].categoryBreakdown[h.category] = 
        (stats.periodStats[period.name].categoryBreakdown[h.category] || 0) + 1
    })

    // 가장 인기 있는 시간대-카테고리 조합
    let maxCount = 0
    let minCount = Infinity
    Object.entries(stats.periodStats).forEach(([period, data]) => {
      Object.entries(data.categoryBreakdown).forEach(([cat, count]) => {
        if (count > maxCount) {
          maxCount = count
          stats.mostPopularTimeCategory = { period, category: cat, count }
        }
        if (count > 0 && count < minCount) {
          minCount = count
          stats.leastPopularTimeCategory = { period, category: cat, count }
        }
      })
    })

    logger.debug('시간대별 통계 생성', stats)
    return stats
  } catch (error) {
    logger.error('시간대별 통계 생성 실패', error)
    return {}
  }
}

/**
 * 최적 식사 시간 추천
 * 선택 빈도가 높은 시간대를 추천
 * @returns {Object} 최적 시간대 정보
 */
export function getOptimalMealTime() {
  try {
    const stats = getTimeBasedStats()
    
    let optimalPeriod = null
    let maxSelections = 0
    
    Object.entries(stats.periodStats).forEach(([period, data]) => {
      if (data.totalSelections > maxSelections) {
        maxSelections = data.totalSelections
        optimalPeriod = period
      }
    })

    if (!optimalPeriod) {
      logger.debug('최적 식사 시간 데이터 없음')
      return null
    }

    const periodData = TIME_PERIODS[Object.keys(TIME_PERIODS).find(
      key => TIME_PERIODS[key].name === optimalPeriod
    )]

    return {
      period: optimalPeriod,
      emoji: stats.periodStats[optimalPeriod].emoji,
      selections: maxSelections,
      startHour: periodData.start,
      endHour: periodData.end,
      recommendation: `${optimalPeriod}에 가장 많이 식사하고 있습니다!`
    }
  } catch (error) {
    logger.error('최적 식사 시간 추천 실패', error)
    return null
  }
}

/**
 * 시간대별 메뉴 다양성 점수
 * 0-1 범위 (1에 가까울수록 다양함)
 * @returns {Object} 다양성 점수
 */
export function getTimePeriodDiversity() {
  try {
    const stats = getTimeBasedStats()
    const diversity = {}

    Object.entries(stats.periodStats).forEach(([period, data]) => {
      if (data.totalSelections === 0) {
        diversity[period] = 0
        return
      }

      // Shannon 다양성 지수 계산
      let shannon = 0
      Object.values(data.categoryBreakdown).forEach(count => {
        if (count > 0) {
          const p = count / data.totalSelections
          shannon -= p * Math.log2(p)
        }
      })

      // 최대값으로 정규화 (카테고리 수 기준)
      const maxShannon = Math.log2(Object.keys(data.categoryBreakdown).length)
      const normalizedDiversity = maxShannon > 0 ? shannon / maxShannon : 0
      diversity[period] = parseFloat(normalizedDiversity.toFixed(2))
    })

    logger.debug('시간대별 다양성', diversity)
    return diversity
  } catch (error) {
    logger.error('다양성 계산 실패', error)
    return {}
  }
}

/**
 * 현재 시간에 추천되는 메뉴 (종합 점수 기반)
 * @param {Array} availableCategories - 사용 가능한 카테고리 배열
 * @returns {Array} 추천 카테고리 배열 (점수 순)
 */
export function getTopRecommendationsByTime(availableCategories = []) {
  try {
    const currentPeriod = getCurrentTimePeriod()
    const weights = CATEGORY_WEIGHTS[currentPeriod.name]
    
    if (!weights) {
      return availableCategories || []
    }

    let recommendations
    if (availableCategories.length > 0) {
      recommendations = availableCategories
    } else {
      recommendations = Object.keys(weights)
    }

    const scored = recommendations.map(cat => ({
      category: cat,
      score: weights[cat] || 0
    }))

    scored.sort((a, b) => b.score - a.score)
    
    logger.debug(`${currentPeriod.name} 상위 추천:`, scored)
    return scored
  } catch (error) {
    logger.error('상위 추천 조회 실패', error)
    return []
  }
}

export default {
  getCurrentTimePeriod,
  getTimePeriodByHour,
  getRecommendedCategoriesByTime,
  getRecommendationScore,
  getRecommendedCategoriesByPattern,
  getTimeBasedStats,
  getOptimalMealTime,
  getTimePeriodDiversity,
  getTopRecommendationsByTime,
  TIME_PERIODS,
  CATEGORY_WEIGHTS
}
