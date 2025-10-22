/**
 * Search Manager for Advanced Menu Search with Autocomplete
 * 메뉴 검색, 필터링, 자동완성 기능 관리
 */

import { menuData } from './menuData'
import { getMenuDetail } from './menuDetailManager'

/**
 * 모든 메뉴를 평탄한 배열로 변환
 * @returns {Array} { category, menu, detail } 배열
 */
export function getAllMenus() {
  const allMenus = []
  
  for (const [category, menus] of Object.entries(menuData)) {
    if (Array.isArray(menus)) {
      menus.forEach(menu => {
        const detail = getMenuDetail(category, menu)
        allMenus.push({
          category,
          menu,
          detail
        })
      })
    }
  }
  
  return allMenus
}

/**
 * 검색어에 따라 메뉴 검색
 * @param {string} query - 검색어
 * @param {Object} filters - 필터 옵션 { category, minCalories, maxCalories, minPrice, maxPrice, tags }
 * @returns {Array} 검색 결과 배열
 */
export function searchMenus(query = '', filters = {}) {
  const allMenus = getAllMenus()
  let results = [...allMenus]
  
  // 카테고리 필터
  if (filters.category && filters.category !== '전체') {
    results = results.filter(item => item.category === filters.category)
  }
  
  // 칼로리 필터
  if (filters.minCalories !== undefined) {
    results = results.filter(item => item.detail.calories >= filters.minCalories)
  }
  if (filters.maxCalories !== undefined) {
    results = results.filter(item => item.detail.calories <= filters.maxCalories)
  }
  
  // 가격 필터
  if (filters.minPrice !== undefined) {
    results = results.filter(item => item.detail.price >= filters.minPrice)
  }
  if (filters.maxPrice !== undefined) {
    results = results.filter(item => item.detail.price <= filters.maxPrice)
  }
  
  // 준비시간 필터
  if (filters.maxPrepTime !== undefined) {
    results = results.filter(item => item.detail.preparationTime <= filters.maxPrepTime)
  }
  
  // 태그 필터 (모든 선택된 태그를 포함해야 함)
  if (filters.tags && filters.tags.length > 0) {
    results = results.filter(item => {
      const menuTags = item.detail.tags || []
      return filters.tags.every(tag => menuTags.includes(tag))
    })
  }
  
  // 검색어로 필터링
  if (query.trim()) {
    const searchTerm = query.toLowerCase()
    results = results.filter(item => {
      const menuLower = item.menu.toLowerCase()
      const descriptionLower = item.detail.description.toLowerCase()
      const tagsLower = (item.detail.tags || []).map(t => t.toLowerCase()).join(' ')
      
      return (
        menuLower.includes(searchTerm) ||
        descriptionLower.includes(searchTerm) ||
        tagsLower.includes(searchTerm)
      )
    })
    
    // 검색 결과 순위 지정 (검색어와의 일치도에 따라)
    results.sort((a, b) => {
      const aMenu = a.menu.toLowerCase()
      const bMenu = b.menu.toLowerCase()
      const aIdx = aMenu.indexOf(searchTerm)
      const bIdx = bMenu.indexOf(searchTerm)
      
      // 메뉴 이름 맨 앞에서 시작하는 것이 우선
      if (aIdx !== bIdx) {
        if (aIdx === 0) return -1
        if (bIdx === 0) return 1
      }
      
      // 같으면 메뉴 이름 길이가 짧은 것이 우선 (더 정확한 매칭)
      return a.menu.length - b.menu.length
    })
  }
  
  return results
}

/**
 * 자동완성 제안 생성
 * @param {string} query - 검색어
 * @param {number} limit - 제안 개수 제한
 * @returns {Array} { text, type, category, menu } 제안 배열
 */
export function getAutocompleteSuggestions(query = '', limit = 8) {
  if (!query.trim()) {
    return []
  }
  
  const searchTerm = query.toLowerCase()
  const suggestions = new Map() // 중복 제거용
  const allMenus = getAllMenus()
  
  // 메뉴 이름으로 제안
  allMenus.forEach(item => {
    const menuLower = item.menu.toLowerCase()
    
    // 메뉴 이름이 검색어를 포함하면 제안에 추가
    if (menuLower.includes(searchTerm)) {
      const key = `menu_${item.menu}`
      
      // 아직 추가되지 않았거나 현재 제안이 더 좋으면 업데이트
      if (!suggestions.has(key)) {
        suggestions.set(key, {
          text: item.menu,
          type: 'menu',
          category: item.category,
          menu: item.menu,
          score: calculateScore(item.menu, searchTerm)
        })
      }
    }
  })
  
  // 태그로 제안
  const allTags = new Set()
  allMenus.forEach(item => {
    (item.detail.tags || []).forEach(tag => {
      if (tag.toLowerCase().includes(searchTerm)) {
        allTags.add(tag)
      }
    })
  })
  
  allTags.forEach(tag => {
    const key = `tag_${tag}`
    suggestions.set(key, {
      text: tag,
      type: 'tag',
      score: calculateScore(tag, searchTerm)
    })
  })
  
  // 카테고리로 제안
  Object.keys(menuData).forEach(category => {
    if (category.toLowerCase().includes(searchTerm)) {
      const key = `category_${category}`
      suggestions.set(key, {
        text: category,
        type: 'category',
        category: category,
        score: calculateScore(category, searchTerm)
      })
    }
  })
  
  // 점수에 따라 정렬하고 제한된 개수만 반환
  return Array.from(suggestions.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * 검색어와의 일치도를 점수화
 * @param {string} text - 검사할 텍스트
 * @param {string} query - 검색어
 * @returns {number} 점수 (높을수록 좋음)
 */
function calculateScore(text, query) {
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()
  
  // 정확히 일치하면 최고 점수
  if (textLower === queryLower) {
    return 1000
  }
  
  // 맨 앞에서 시작하면 높은 점수
  if (textLower.startsWith(queryLower)) {
    return 500 + (1 - queryLower.length / textLower.length) * 100
  }
  
  // 단어 시작에서 일치하면 중간 점수
  const words = textLower.split(/[\s\-_]/)
  if (words.some(word => word.startsWith(queryLower))) {
    return 300
  }
  
  // 포함하면 기본 점수
  const index = textLower.indexOf(queryLower)
  return 100 + (1 - index / textLower.length) * 50
}

/**
 * 모든 사용 가능한 태그 조회
 * @returns {Array} 태그 배열
 */
export function getAllAvailableTags() {
  const tags = new Set()
  const allMenus = getAllMenus()
  
  allMenus.forEach(item => {
    (item.detail.tags || []).forEach(tag => {
      tags.add(tag)
    })
  })
  
  return Array.from(tags).sort()
}

/**
 * 검색 기록 관리
 * @param {string} query - 검색 쿼리
 */
export function recordSearchHistory(query) {
  if (!query.trim()) return
  
  const storageKey = 'lunch_selector_search_history'
  const history = JSON.parse(localStorage.getItem(storageKey) || '[]')
  
  // 중복 제거 (이미 있으면 맨 앞으로 이동)
  const filtered = history.filter(item => item !== query)
  filtered.unshift(query)
  
  // 최대 20개만 유지
  const limited = filtered.slice(0, 20)
  
  localStorage.setItem(storageKey, JSON.stringify(limited))
}

/**
 * 검색 기록 조회
 * @returns {Array} 검색 기록 배열
 */
export function getSearchHistory() {
  const storageKey = 'lunch_selector_search_history'
  return JSON.parse(localStorage.getItem(storageKey) || '[]')
}

/**
 * 검색 기록 초기화
 */
export function clearSearchHistory() {
  localStorage.removeItem('lunch_selector_search_history')
}

/**
 * 추천 메뉴 조회 (사용자 기록 기반)
 * @returns {Array} 추천 메뉴 배열
 */
export function getRecommendedMenus() {
  const allMenus = getAllMenus()
  
  // 최근에 본 메뉴 기록 가져오기
  const viewedHistory = JSON.parse(
    localStorage.getItem('lunch_selector_viewed_menus') || '[]'
  )
  
  if (viewedHistory.length === 0) {
    // 기록이 없으면 전체에서 랜덤 선택
    return allMenus.sort(() => Math.random() - 0.5).slice(0, 5)
  }
  
  // 같은 카테고리의 메뉴 추천
  const lastViewed = viewedHistory[0]
  const categoryMenus = allMenus.filter(
    item => item.category === lastViewed.category
  )
  
  return categoryMenus.sort(() => Math.random() - 0.5).slice(0, 5)
}

/**
 * 메뉴 보기 기록 저장
 * @param {string} category - 카테고리
 * @param {string} menu - 메뉴명
 */
export function recordMenuView(category, menu) {
  const storageKey = 'lunch_selector_viewed_menus'
  const history = JSON.parse(localStorage.getItem(storageKey) || '[]')
  
  // 중복 제거 (이미 있으면 맨 앞으로 이동)
  const filtered = history.filter(
    item => !(item.category === category && item.menu === menu)
  )
  filtered.unshift({ category, menu, timestamp: Date.now() })
  
  // 최대 50개만 유지
  const limited = filtered.slice(0, 50)
  
  localStorage.setItem(storageKey, JSON.stringify(limited))
}

export default {
  getAllMenus,
  searchMenus,
  getAutocompleteSuggestions,
  getAllAvailableTags,
  recordSearchHistory,
  getSearchHistory,
  clearSearchHistory,
  getRecommendedMenus,
  recordMenuView
}
