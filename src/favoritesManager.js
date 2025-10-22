/**
 * 즐겨찾기 관리 시스템
 * 사용자가 선호하는 메뉴를 저장하고 관리하는 기능 제공
 * 
 * 주요 기능:
 * - 메뉴를 즐겨찾기에 추가/제거
 * - 즐겨찾기 목록 조회
 * - 카테고리별 즐겨찾기 조회
 * - 즐겨찾기 통계 생성
 * - 즐겨찾기 데이터 임포트/엑스포트
 * - 즐겨찾기 점수 계산 (인기도 기반)
 */

import { logger } from './config'

const FAVORITES_STORAGE_KEY = 'lunch_selector_favorites'

/**
 * 즐겨찾기에 메뉴 추가
 * @param {string} category - 음식 카테고리
 * @param {string} menu - 메뉴명
 * @param {number} rating - 평점 (1-5, 선택사항)
 * @returns {boolean} 성공 여부
 */
export function addToFavorites(category, menu, rating = 0) {
  try {
    if (!category || !menu) {
      logger.warn('즐겨찾기 추가: 필수 정보 누락', { category, menu })
      return false
    }

    const favorites = getFavorites()
    const key = `${category}||${menu}`
    
    if (favorites[key]) {
      // 이미 즐겨찾기에 있으면 횟수 증가
      favorites[key].count += 1
      if (rating > 0) {
        favorites[key].rating = rating
      }
      logger.debug(`즐겨찾기 업데이트: ${menu} (${favorites[key].count}회)`)
    } else {
      // 새로운 즐겨찾기 추가
      favorites[key] = {
        category,
        menu,
        addedAt: Date.now(),
        count: 1,
        rating: rating > 0 ? rating : 0,
        lastSelectedAt: Date.now()
      }
      logger.debug(`즐겨찾기 추가: ${menu}`)
    }

    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
    return true
  } catch (error) {
    logger.error('즐겨찾기 추가 실패', error)
    return false
  }
}

/**
 * 즐겨찾기에서 메뉴 제거
 * @param {string} category - 음식 카테고리
 * @param {string} menu - 메뉴명
 * @returns {boolean} 성공 여부
 */
export function removeFromFavorites(category, menu) {
  try {
    const favorites = getFavorites()
    const key = `${category}||${menu}`
    
    if (favorites[key]) {
      delete favorites[key]
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
      logger.debug(`즐겨찾기 제거: ${menu}`)
      return true
    }
    
    return false
  } catch (error) {
    logger.error('즐겨찾기 제거 실패', error)
    return false
  }
}

/**
 * 메뉴가 즐겨찾기에 있는지 확인
 * @param {string} category - 음식 카테고리
 * @param {string} menu - 메뉴명
 * @returns {boolean} 즐겨찾기 여부
 */
export function isFavorite(category, menu) {
  try {
    const favorites = getFavorites()
    const key = `${category}||${menu}`
    return key in favorites
  } catch (error) {
    logger.error('즐겨찾기 확인 실패', error)
    return false
  }
}

/**
 * 모든 즐겨찾기 조회
 * @param {string} sortBy - 정렬 방식 ('date', 'count', 'rating', 'score')
 * @returns {Array} 즐겨찾기 배열
 */
export function getFavorites(sortBy = 'score') {
  try {
    const favoritesStr = localStorage.getItem(FAVORITES_STORAGE_KEY)
    const favorites = favoritesStr ? JSON.parse(favoritesStr) : {}
    
    let results = Object.values(favorites)
    
    // 정렬
    switch (sortBy) {
      case 'date':
        results.sort((a, b) => b.addedAt - a.addedAt)
        break
      case 'count':
        results.sort((a, b) => b.count - a.count)
        break
      case 'rating':
        results.sort((a, b) => b.rating - a.rating)
        break
      case 'score':
      default:
        // 복합 점수: (횟수 * 0.4) + (평점 * 10 * 0.6)
        results.sort((a, b) => {
          const scoreA = (a.count * 0.4) + (Math.max(a.rating, 1) * 10 * 0.6)
          const scoreB = (b.count * 0.4) + (Math.max(b.rating, 1) * 10 * 0.6)
          return scoreB - scoreA
        })
    }
    
    return results
  } catch (error) {
    logger.error('즐겨찾기 조회 실패', error)
    return []
  }
}

/**
 * 카테고리별 즐겨찾기 조회
 * @param {string} category - 음식 카테고리
 * @param {number} limit - 최대 개수
 * @returns {Array} 즐겨찾기 배열
 */
export function getFavoritesByCategory(category, limit = null) {
  try {
    const favorites = getFavorites()
    let results = favorites.filter(fav => fav.category === category)
    
    if (limit) {
      results = results.slice(0, limit)
    }
    
    logger.debug(`${category} 즐겨찾기: ${results.length}개`)
    return results
  } catch (error) {
    logger.error('카테고리별 즐겨찾기 조회 실패', error)
    return []
  }
}

/**
 * 즐겨찾기 통계
 * @returns {Object} 통계 정보
 */
export function getFavoriteStats() {
  try {
    const favorites = getFavorites()
    const stats = {
      totalFavorites: favorites.length,
      totalCount: 0,
      averageRating: 0,
      topFavorite: null,
      categoryStats: {},
      ratedCount: 0
    }

    if (favorites.length === 0) {
      return stats
    }

    let totalRating = 0
    const categoryMap = {}

    favorites.forEach(fav => {
      stats.totalCount += fav.count
      if (fav.rating > 0) {
        totalRating += fav.rating
        stats.ratedCount += 1
      }
      
      if (!categoryMap[fav.category]) {
        categoryMap[fav.category] = {
          count: 0,
          items: 0
        }
      }
      categoryMap[fav.category].count += fav.count
      categoryMap[fav.category].items += 1
    })

    stats.topFavorite = favorites[0]
    stats.averageRating = stats.ratedCount > 0 
      ? (totalRating / stats.ratedCount).toFixed(2) 
      : 0
    
    Object.entries(categoryMap).forEach(([cat, data]) => {
      stats.categoryStats[cat] = {
        itemCount: data.items,
        selectCount: data.count,
        averageCount: (data.count / data.items).toFixed(1)
      }
    })

    logger.debug('즐겨찾기 통계 생성', stats)
    return stats
  } catch (error) {
    logger.error('즐겨찾기 통계 생성 실패', error)
    return {}
  }
}

/**
 * 즐겨찾기 평점 업데이트
 * @param {string} category - 음식 카테고리
 * @param {string} menu - 메뉴명
 * @param {number} rating - 평점 (1-5)
 * @returns {boolean} 성공 여부
 */
export function updateFavoriteRating(category, menu, rating) {
  try {
    if (rating < 1 || rating > 5) {
      logger.warn('평점은 1-5 범위여야 합니다', { category, menu, rating })
      return false
    }

    const favorites = getFavorites()
    const key = `${category}||${menu}`
    
    if (favorites[key]) {
      favorites[key].rating = rating
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
      logger.debug(`평점 업데이트: ${menu} (${rating}/5)`)
      return true
    }
    
    return false
  } catch (error) {
    logger.error('평점 업데이트 실패', error)
    return false
  }
}

/**
 * 즐겨찾기 검색
 * @param {string} searchTerm - 검색어
 * @returns {Array} 검색 결과
 */
export function searchFavorites(searchTerm) {
  try {
    if (!searchTerm) return getFavorites()
    
    const term = searchTerm.toLowerCase()
    const favorites = getFavorites()
    
    return favorites.filter(fav => 
      fav.menu.toLowerCase().includes(term) ||
      fav.category.toLowerCase().includes(term)
    )
  } catch (error) {
    logger.error('즐겨찾기 검색 실패', error)
    return []
  }
}

/**
 * 즐겨찾기 데이터 전체 삭제
 * @returns {boolean} 성공 여부
 */
export function clearAllFavorites() {
  try {
    localStorage.removeItem(FAVORITES_STORAGE_KEY)
    logger.info('모든 즐겨찾기 삭제')
    return true
  } catch (error) {
    logger.error('즐겨찾기 삭제 실패', error)
    return false
  }
}

/**
 * 즐겨찾기 JSON 형식으로 내보내기
 * @returns {string} JSON 문자열
 */
export function exportFavoritesAsJSON() {
  try {
    const favorites = getFavorites()
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: 1,
      favorites: favorites
    }
    
    const json = JSON.stringify(exportData, null, 2)
    logger.info('즐겨찾기 내보내기 완료')
    return json
  } catch (error) {
    logger.error('즐겨찾기 내보내기 실패', error)
    return null
  }
}

/**
 * 즐겨찾기 JSON 형식으로 가져오기
 * @param {string} jsonData - JSON 문자열
 * @returns {boolean} 성공 여부
 */
export function importFavoritesFromJSON(jsonData) {
  try {
    const data = JSON.parse(jsonData)
    
    if (!data.favorites || !Array.isArray(data.favorites)) {
      logger.warn('유효하지 않은 즐겨찾기 데이터')
      return false
    }

    const favorites = {}
    data.favorites.forEach(fav => {
      const key = `${fav.category}||${fav.menu}`
      favorites[key] = fav
    })

    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
    logger.info(`즐겨찾기 가져오기 완료: ${data.favorites.length}개`)
    return true
  } catch (error) {
    logger.error('즐겨찾기 가져오기 실패', error)
    return false
  }
}

/**
 * 오래된 즐겨찾기 정리 (선택사항)
 * @param {number} days - 이전의 즐겨찾기만 삭제 (미사용 기준)
 * @returns {number} 삭제된 개수
 */
export function cleanupOldFavorites(days = 90) {
  try {
    const favorites = getFavorites()
    const threshold = Date.now() - (days * 24 * 60 * 60 * 1000)
    
    const favoritesObj = {}
    let deletedCount = 0

    favorites.forEach(fav => {
      const lastSelected = fav.lastSelectedAt || fav.addedAt
      if (lastSelected > threshold) {
        const key = `${fav.category}||${fav.menu}`
        favoritesObj[key] = fav
      } else {
        deletedCount += 1
      }
    })

    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritesObj))
    logger.info(`오래된 즐겨찾기 정리: ${deletedCount}개 삭제`)
    return deletedCount
  } catch (error) {
    logger.error('즐겨찾기 정리 실패', error)
    return 0
  }
}

export default {
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  getFavorites,
  getFavoritesByCategory,
  getFavoriteStats,
  updateFavoriteRating,
  searchFavorites,
  clearAllFavorites,
  exportFavoritesAsJSON,
  importFavoritesFromJSON,
  cleanupOldFavorites
}
