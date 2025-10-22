import { APP_CONFIG, logger } from './config'

/**
 * 추천 이력 및 통계 관리 시스템
 */

/**
 * 이력 항목 추가
 * @param {string} category - 카테고리
 * @param {string} menu - 메뉴명
 * @returns {object} 추가된 이력 항목
 */
export const addToHistory = (category, menu) => {
  try {
    const history = getHistory()
    
    const historyItem = {
      id: `${Date.now()}-${Math.random()}`,
      category,
      menu,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('ko-KR'),
      time: new Date().toLocaleTimeString('ko-KR')
    }

    // 최신 항목을 맨 앞에 추가
    history.unshift(historyItem)

    // 최대 개수 유지
    if (history.length > APP_CONFIG.limits.maxHistoryItems) {
      history.pop()
    }

    localStorage.setItem(APP_CONFIG.storage.historyKey, JSON.stringify(history))
    logger.debug(`이력 추가: ${category} - ${menu}`)

    return historyItem
  } catch (error) {
    logger.error('이력 추가 실패', error)
    return null
  }
}

/**
 * 전체 이력 조회
 * @returns {array} 이력 배열
 */
export const getHistory = () => {
  try {
    const history = localStorage.getItem(APP_CONFIG.storage.historyKey)
    return history ? JSON.parse(history) : []
  } catch (error) {
    logger.warn('이력 조회 실패', error)
    return []
  }
}

/**
 * 특정 기간의 이력 조회
 * @param {string} startDate - 시작 날짜 (YYYY-MM-DD)
 * @param {string} endDate - 종료 날짜 (YYYY-MM-DD)
 * @returns {array} 필터링된 이력 배열
 */
export const getHistoryByDateRange = (startDate, endDate) => {
  const history = getHistory()
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()

  return history.filter(item => {
    const itemTime = new Date(item.timestamp).getTime()
    return itemTime >= start && itemTime <= end
  })
}

/**
 * 이번 주의 이력 조회
 * @returns {array} 이번 주 이력
 */
export const getThisWeekHistory = () => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)

  return getHistory().filter(item => {
    const itemDate = new Date(item.timestamp)
    return itemDate >= startOfWeek
  })
}

/**
 * 이번 달의 이력 조회
 * @returns {array} 이번 달 이력
 */
export const getThisMonthHistory = () => {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  return getHistory().filter(item => {
    const itemDate = new Date(item.timestamp)
    return itemDate >= startOfMonth
  })
}

/**
 * 통계 정보 생성
 * @returns {object} 통계 객체
 */
export const getStatistics = () => {
  const history = getHistory()
  const thisWeek = getThisWeekHistory()
  const thisMonth = getThisMonthHistory()

  // 가장 많이 선택된 메뉴
  const menuCount = {}
  const categoryCount = {}
  
  history.forEach(item => {
    menuCount[item.menu] = (menuCount[item.menu] || 0) + 1
    categoryCount[item.category] = (categoryCount[item.category] || 0) + 1
  })

  const getMostCommon = (countObj) => {
    if (Object.keys(countObj).length === 0) return null
    return Object.entries(countObj).sort(([, a], [, b]) => b - a)[0][0]
  }

  const stats = {
    total: {
      recommendations: history.length,
      uniqueMenus: Object.keys(menuCount).length,
      uniqueCategories: Object.keys(categoryCount).length,
      mostPickedMenu: getMostCommon(menuCount),
      mostPickedCategory: getMostCommon(categoryCount)
    },
    thisWeek: {
      recommendations: thisWeek.length,
      uniqueMenus: new Set(thisWeek.map(h => h.menu)).size,
      mostPickedMenu: getMostCommon(
        thisWeek.reduce((acc, item) => {
          acc[item.menu] = (acc[item.menu] || 0) + 1
          return acc
        }, {})
      )
    },
    thisMonth: {
      recommendations: thisMonth.length,
      uniqueMenus: new Set(thisMonth.map(h => h.menu)).size,
      mostPickedMenu: getMostCommon(
        thisMonth.reduce((acc, item) => {
          acc[item.menu] = (acc[item.menu] || 0) + 1
          return acc
        }, {})
      )
    },
    categoryBreakdown: categoryCount
  }

  logger.debug('통계 생성 완료', stats)
  return stats
}

/**
 * 카테고리별 이력 조회
 * @param {string} category - 카테고리
 * @returns {array} 해당 카테고리 이력
 */
export const getHistoryByCategory = (category) => {
  return getHistory().filter(item => item.category === category)
}

/**
 * 메뉴별 선택 횟수 조회
 * @param {string} menu - 메뉴명
 * @returns {number} 선택 횟수
 */
export const getMenuCount = (menu) => {
  return getHistory().filter(item => item.menu === menu).length
}

/**
 * 전체 이력 삭제
 * @returns {boolean} 성공 여부
 */
export const clearHistory = () => {
  try {
    localStorage.removeItem(APP_CONFIG.storage.historyKey)
    logger.info('전체 이력 삭제 완료')
    return true
  } catch (error) {
    logger.error('이력 삭제 실패', error)
    return false
  }
}

/**
 * 특정 이력 항목 삭제
 * @param {string} id - 이력 항목 ID
 * @returns {boolean} 성공 여부
 */
export const deleteHistoryItem = (id) => {
  try {
    const history = getHistory()
    const filtered = history.filter(item => item.id !== id)
    localStorage.setItem(APP_CONFIG.storage.historyKey, JSON.stringify(filtered))
    logger.debug(`이력 삭제: ${id}`)
    return true
  } catch (error) {
    logger.error('이력 항목 삭제 실패', error)
    return false
  }
}

/**
 * 오래된 이력 정리 (n일 이상 전)
 * @param {number} days - 기준 일수
 * @returns {number} 삭제된 항목 수
 */
export const cleanupOldHistory = (days = 30) => {
  try {
    const history = getHistory()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const filtered = history.filter(item => {
      const itemDate = new Date(item.timestamp)
      return itemDate > cutoffDate
    })

    const deletedCount = history.length - filtered.length

    if (deletedCount > 0) {
      localStorage.setItem(APP_CONFIG.storage.historyKey, JSON.stringify(filtered))
      logger.info(`${deletedCount}개의 오래된 이력 삭제`)
    }

    return deletedCount
  } catch (error) {
    logger.error('오래된 이력 정리 실패', error)
    return 0
  }
}

/**
 * 이력 데이터 내보내기 (JSON)
 * @returns {string} JSON 문자열
 */
export const exportHistoryAsJSON = () => {
  const history = getHistory()
  return JSON.stringify({
    exportDate: new Date().toISOString(),
    version: '1.0',
    history,
    statistics: getStatistics()
  }, null, 2)
}

/**
 * 이력 데이터 가져오기 (JSON)
 * @param {string} jsonData - JSON 데이터
 * @returns {boolean} 성공 여부
 */
export const importHistoryFromJSON = (jsonData) => {
  try {
    const data = JSON.parse(jsonData)
    
    if (!data.history || !Array.isArray(data.history)) {
      throw new Error('유효하지 않은 이력 데이터 형식')
    }

    // 기존 이력과 병합 (중복 제거)
    const existingHistory = getHistory()
    const existingIds = new Set(existingHistory.map(h => h.id))
    
    const newItems = data.history.filter(item => !existingIds.has(item.id))
    const mergedHistory = [...newItems, ...existingHistory]
    
    // 최대 개수 유지
    if (mergedHistory.length > APP_CONFIG.limits.maxHistoryItems) {
      mergedHistory.length = APP_CONFIG.limits.maxHistoryItems
    }

    localStorage.setItem(APP_CONFIG.storage.historyKey, JSON.stringify(mergedHistory))
    logger.info(`${newItems.length}개의 이력 항목 가져오기 완료`)
    
    return true
  } catch (error) {
    logger.error('이력 가져오기 실패', error)
    return false
  }
}

export default {
  addToHistory,
  getHistory,
  getHistoryByDateRange,
  getThisWeekHistory,
  getThisMonthHistory,
  getStatistics,
  getHistoryByCategory,
  getMenuCount,
  clearHistory,
  deleteHistoryItem,
  cleanupOldHistory,
  exportHistoryAsJSON,
  importHistoryFromJSON
}
