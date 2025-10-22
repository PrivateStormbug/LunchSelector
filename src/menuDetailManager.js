/**
 * 메뉴 상세정보 관리 시스템
 * 메뉴별 상세 정보 (영양정보, 가격, 설명 등)를 저장하고 관리
 *
 * 주요 기능:
 * - 메뉴 상세정보 조회 및 저장
 * - 기본 메뉴 정보 관리
 * - 사용자 정의 메뉴 정보 추가
 * - 메뉴 정보 통계 생성
 * - 메뉴 정보 임포트/엑스포트
 */

import { logger } from './config'

const MENU_DETAILS_STORAGE_KEY = 'lunch_selector_menu_details'

/**
 * 기본 메뉴 정보 데이터셋
 * 실제 영양정보 및 칼로리 기반 데이터
 */
const DEFAULT_MENU_DETAILS = {
  // 한식
  '비빔밥': {
    category: '한식',
    calories: 550,
    protein: 18,
    carbs: 75,
    fat: 12,
    price: 8000,
    description: '다양한 채소와 고추장을 섞은 밥 요리',
    servingSize: '1인분 (300g)',
    nutrition: '밥, 계란, 소고기, 시금치, 고추장, 참기름',
    spiceLevel: 3,
    tags: ['채식가능', '영양만점'],
    preparationTime: 15
  },
  '김밥': {
    category: '한식',
    calories: 380,
    protein: 14,
    carbs: 62,
    fat: 8,
    price: 5000,
    description: '밥에 여러 재료를 싸서 굴린 음식',
    servingSize: '1회 (5줄)',
    nutrition: '밥, 계란, 당근, 시금치, 고추, 참기름',
    spiceLevel: 1,
    tags: ['휴대용', '저칼로리'],
    preparationTime: 10
  },
  '된장찌개': {
    category: '한식',
    calories: 320,
    protein: 22,
    carbs: 28,
    fat: 14,
    price: 7000,
    description: '두부, 채소를 넣은 짠 국물 요리',
    servingSize: '1인분 (400ml)',
    nutrition: '된장, 두부, 두릅, 애호박, 고추, 파',
    spiceLevel: 2,
    tags: ['국물', '따뜻함'],
    preparationTime: 20
  },
  '불고기': {
    category: '한식',
    calories: 480,
    protein: 35,
    carbs: 42,
    fat: 18,
    price: 12000,
    description: '양념한 소고기를 구운 음식',
    servingSize: '1인분 (200g)',
    nutrition: '소고기, 간장, 설탕, 참기름, 마늘',
    spiceLevel: 1,
    tags: ['고단백', '고기'],
    preparationTime: 25
  },
  '떡볶이': {
    category: '한식',
    calories: 420,
    protein: 12,
    carbs: 68,
    fat: 10,
    price: 5500,
    description: '매콤한 떡과 어묵의 조화',
    servingSize: '1인분 (250g)',
    nutrition: '떡, 어묵, 고추장, 고추, 마늘',
    spiceLevel: 4,
    tags: ['매운맛', '길거리음식'],
    preparationTime: 15
  },

  // 중식
  '짜장면': {
    category: '중식',
    calories: 520,
    protein: 18,
    carbs: 75,
    fat: 14,
    price: 5500,
    description: '검은 소스가 특징인 중국 면 요리',
    servingSize: '1인분 (350g)',
    nutrition: '밀가루 면, 돼지고기, 양파, 당근, 감자',
    spiceLevel: 1,
    tags: ['면류', '빠른조리'],
    preparationTime: 12
  },
  '짬뽕': {
    category: '중식',
    calories: 480,
    protein: 22,
    carbs: 68,
    fat: 12,
    price: 6500,
    description: '매콤한 국물이 특징인 면 요리',
    servingSize: '1인분 (400ml)',
    nutrition: '밀가루 면, 새우, 오징어, 채소, 고추',
    spiceLevel: 4,
    tags: ['국물', '해산물'],
    preparationTime: 15
  },
  '마라탕': {
    category: '중식',
    calories: 380,
    protein: 16,
    carbs: 45,
    fat: 14,
    price: 8000,
    description: '마라 소스에 각종 재료를 담근 요리',
    servingSize: '1인분 (300g)',
    nutrition: '국물, 두부, 고기, 채소, 마라소스',
    spiceLevel: 5,
    tags: ['자유선택', '매운맛'],
    preparationTime: 20
  },
  '우육면': {
    category: '중식',
    calories: 550,
    protein: 28,
    carbs: 72,
    fat: 16,
    price: 7500,
    description: '소고기 국물 면 요리',
    servingSize: '1인분 (400ml)',
    nutrition: '밀가루 면, 소고기, 국물, 채소',
    spiceLevel: 2,
    tags: ['국물', '고기'],
    preparationTime: 18
  },
  '탕수육': {
    category: '중식',
    calories: 620,
    protein: 24,
    carbs: 68,
    fat: 20,
    price: 9000,
    description: '바삭한 튀김에 새콤한 소스를 얹은 요리',
    servingSize: '1인분 (300g)',
    nutrition: '돼지고기, 전분, 설탕, 식초, 파인애플',
    spiceLevel: 1,
    tags: ['튀김', '고기'],
    preparationTime: 25
  },

  // 일식
  '초밥': {
    category: '일식',
    calories: 380,
    protein: 16,
    carbs: 52,
    fat: 8,
    price: 12000,
    description: '밥 위에 생선 등을 올린 일본 음식',
    servingSize: '8개',
    nutrition: '쌀, 생선, 채소, 식초',
    spiceLevel: 1,
    tags: ['신선한', '저칼로리', '프리미엄'],
    preparationTime: 20
  },
  '우동': {
    category: '일식',
    calories: 420,
    protein: 14,
    carbs: 64,
    fat: 10,
    price: 7000,
    description: '굵은 면이 특징인 일본 국수',
    servingSize: '1인분 (300g)',
    nutrition: '밀가루 면, 국물, 계란, 파',
    spiceLevel: 1,
    tags: ['국물', '부드러운'],
    preparationTime: 12
  },
  '돈까스': {
    category: '일식',
    calories: 580,
    protein: 32,
    carbs: 52,
    fat: 18,
    price: 10000,
    description: '튀긴 돼지고기 커틀릿',
    servingSize: '1인분 (200g)',
    nutrition: '돼지고기, 계란, 빵가루, 기름',
    spiceLevel: 1,
    tags: ['튀김', '고단백'],
    preparationTime: 18
  },
  '오코노미야키': {
    category: '일식',
    calories: 500,
    protein: 18,
    carbs: 58,
    fat: 16,
    price: 8500,
    description: '일본식 팬케이크',
    servingSize: '1인분 (200g)',
    nutrition: '밀가루, 계란, 배추, 고기, 소스',
    spiceLevel: 1,
    tags: ['독특한맛', '푸짐함'],
    preparationTime: 20
  },
  '카레라이스': {
    category: '일식',
    calories: 520,
    protein: 16,
    carbs: 72,
    fat: 12,
    price: 8000,
    description: '카레 소스와 밥의 조합',
    servingSize: '1인분 (350g)',
    nutrition: '밥, 카레, 감자, 당근, 양파',
    spiceLevel: 2,
    tags: ['순한맛', '편안함'],
    preparationTime: 15
  },

  // 양식
  '파스타': {
    category: '양식',
    calories: 520,
    protein: 18,
    carbs: 68,
    fat: 14,
    price: 9500,
    description: '이탈리아 면 요리',
    servingSize: '1인분 (300g)',
    nutrition: '밀가루 면, 토마토, 올리브유, 마늘',
    spiceLevel: 1,
    tags: ['면류', '채식가능'],
    preparationTime: 18
  },
  '스테이크': {
    category: '양식',
    calories: 620,
    protein: 48,
    carbs: 0,
    fat: 28,
    price: 18000,
    description: '구운 소고기 스테이크',
    servingSize: '1인분 (250g)',
    nutrition: '소고기, 버터, 마늘, 허브',
    spiceLevel: 1,
    tags: ['고기', '고단백', '프리미엄'],
    preparationTime: 25
  },
  '피자': {
    category: '양식',
    calories: 580,
    protein: 22,
    carbs: 64,
    fat: 18,
    price: 15000,
    description: '치즈와 토핑이 올려진 이탈리아 빵',
    servingSize: '1/4판 (200g)',
    nutrition: '밀가루, 치즈, 토마토, 각종 토핑',
    spiceLevel: 1,
    tags: ['푸짐함', '함께먹기좋음'],
    preparationTime: 20
  },
  '샐러드': {
    category: '양식',
    calories: 280,
    protein: 12,
    carbs: 32,
    fat: 10,
    price: 10000,
    description: '신선한 채소를 곁들인 요리',
    servingSize: '1인분 (250g)',
    nutrition: '각종 채소, 드레싱, 단백질',
    spiceLevel: 1,
    tags: ['건강식', '저칼로리', '채식'],
    preparationTime: 10
  },
  '버거': {
    category: '양식',
    calories: 650,
    protein: 28,
    carbs: 60,
    fat: 24,
    price: 8000,
    description: '육즙 가득한 햄버거',
    servingSize: '1개 (200g)',
    nutrition: '빵, 소고기, 치즈, 채소, 소스',
    spiceLevel: 1,
    tags: ['빠른조리', '휴대용'],
    preparationTime: 12
  },

  // 분식
  '순대': {
    category: '분식',
    calories: 320,
    protein: 16,
    carbs: 32,
    fat: 10,
    price: 5000,
    description: '돼지 내장과 재료를 채운 음식',
    servingSize: '1회 (150g)',
    nutrition: '돼지내장, 쌀, 야채, 양념',
    spiceLevel: 2,
    tags: ['독특한맛', '고단백'],
    preparationTime: 15
  },
  '어묵': {
    category: '분식',
    calories: 240,
    protein: 14,
    carbs: 28,
    fat: 6,
    price: 4000,
    description: '생선살을 곱게 갈아 만든 음식',
    servingSize: '1회 (150g)',
    nutrition: '생선, 전분, 계란, 양념',
    spiceLevel: 1,
    tags: ['저칼로리', '저가격'],
    preparationTime: 8
  },
  '튀김': {
    category: '분식',
    calories: 420,
    protein: 12,
    carbs: 48,
    fat: 16,
    price: 6000,
    description: '여러 재료를 튀긴 음식',
    servingSize: '1회 (200g)',
    nutrition: '채소/고기, 밀가루, 기름',
    spiceLevel: 1,
    tags: ['튀김', '바삭함'],
    preparationTime: 12
  },
  '군만두': {
    category: '분식',
    calories: 380,
    protein: 14,
    carbs: 48,
    fat: 12,
    price: 5500,
    description: '구운 만두',
    servingSize: '8개 (180g)',
    nutrition: '밀가루 피, 돼지고기, 채소',
    spiceLevel: 1,
    tags: ['구성진맛', '푸짐함'],
    preparationTime: 15
  },
  '핫도그': {
    category: '분식',
    calories: 480,
    protein: 16,
    carbs: 52,
    fat: 18,
    price: 4500,
    description: '소시지를 빵에 싼 간식',
    servingSize: '1개 (100g)',
    nutrition: '소시지, 밀가루 빵, 소스',
    spiceLevel: 1,
    tags: ['빠른조리', '저가격'],
    preparationTime: 8
  }
}

/**
 * 메뉴 상세정보 조회
 * @param {string} category - 음식 카테고리
 * @param {string} menu - 메뉴명
 * @returns {Object|null} 메뉴 상세정보
 */
export function getMenuDetail(category, menu) {
  try {
    const key = `${category}||${menu}`
    const customDetails = getCustomMenuDetails()

    // 커스텀 정보가 있으면 우선 반환
    if (customDetails[key]) {
      return customDetails[key]
    }

    // 기본 정보 반환
    if (DEFAULT_MENU_DETAILS[menu]) {
      return DEFAULT_MENU_DETAILS[menu]
    }

    // 상세정보가 없으면 기본 구조 반환
    return generateBasicDetail(category, menu)
  } catch (error) {
    logger.error('메뉴 상세정보 조회 실패', error)
    return null
  }
}

/**
 * 모든 메뉴 상세정보 조회
 * @returns {Object} 모든 메뉴 상세정보
 */
export function getAllMenuDetails() {
  try {
    const customDetails = getCustomMenuDetails()
    return {
      ...DEFAULT_MENU_DETAILS,
      ...customDetails
    }
  } catch (error) {
    logger.error('모든 메뉴 상세정보 조회 실패', error)
    return DEFAULT_MENU_DETAILS
  }
}

/**
 * 커스텀 메뉴 상세정보 추가
 * @param {string} category - 음식 카테고리
 * @param {string} menu - 메뉴명
 * @param {Object} details - 상세정보
 * @returns {boolean} 성공 여부
 */
export function addMenuDetail(category, menu, details) {
  try {
    if (!category || !menu || !details) {
      logger.warn('메뉴 상세정보 추가: 필수 정보 누락')
      return false
    }

    const customDetails = getCustomMenuDetails()
    const key = `${category}||${menu}`

    // 필수 정보 검증
    const validDetail = {
      category: category,
      menu: menu,
      calories: details.calories || 0,
      protein: details.protein || 0,
      carbs: details.carbs || 0,
      fat: details.fat || 0,
      price: details.price || 0,
      description: details.description || '',
      servingSize: details.servingSize || '1인분',
      nutrition: details.nutrition || '',
      spiceLevel: Math.min(5, Math.max(1, details.spiceLevel || 1)),
      tags: Array.isArray(details.tags) ? details.tags.slice(0, 5) : [],
      preparationTime: details.preparationTime || 0,
      addedAt: Date.now()
    }

    customDetails[key] = validDetail
    localStorage.setItem(MENU_DETAILS_STORAGE_KEY, JSON.stringify(customDetails))
    logger.debug(`메뉴 상세정보 추가: ${menu}`)
    return true
  } catch (error) {
    logger.error('메뉴 상세정보 추가 실패', error)
    return false
  }
}

/**
 * 메뉴 상세정보 업데이트
 * @param {string} category - 음식 카테고리
 * @param {string} menu - 메뉴명
 * @param {Object} updates - 업데이트할 정보
 * @returns {boolean} 성공 여부
 */
export function updateMenuDetail(category, menu, updates) {
  try {
    const customDetails = getCustomMenuDetails()
    const key = `${category}||${menu}`

    const existing = customDetails[key] || getMenuDetail(category, menu)
    if (!existing) {
      return false
    }

    const updated = {
      ...existing,
      ...updates,
      category: category,
      menu: menu,
      updatedAt: Date.now()
    }

    customDetails[key] = updated
    localStorage.setItem(MENU_DETAILS_STORAGE_KEY, JSON.stringify(customDetails))
    logger.debug(`메뉴 상세정보 업데이트: ${menu}`)
    return true
  } catch (error) {
    logger.error('메뉴 상세정보 업데이트 실패', error)
    return false
  }
}

/**
 * 영양 점수 계산 (0-100)
 * @param {string} category - 음식 카테고리
 * @param {string} menu - 메뉴명
 * @returns {number} 영양 점수
 */
export function calculateNutritionScore(category, menu) {
  try {
    const detail = getMenuDetail(category, menu)
    if (!detail) return 0

    // 영양 밸런스 계산
    const proteinScore = Math.min(detail.protein / 30 * 100, 100)
    const fatScore = Math.max(100 - (detail.fat / 30 * 100), 0)
    const carbScore = Math.min(detail.carbs / 80 * 100, 100)

    // 칼로리 균형 점수
    const calorieScore = detail.calories > 0 && detail.calories < 700 ? 100 : Math.max(100 - (detail.calories - 700) / 10, 0)

    const score = (proteinScore * 0.3 + fatScore * 0.2 + carbScore * 0.25 + calorieScore * 0.25)
    return Math.round(score)
  } catch (error) {
    logger.error('영양 점수 계산 실패', error)
    return 0
  }
}

/**
 * 메뉴별 영양 정보 통계
 * @returns {Object} 통계 정보
 */
export function getNutritionStats() {
  try {
    const allDetails = getAllMenuDetails()
    const stats = {
      totalMenus: Object.keys(allDetails).length,
      averageCalories: 0,
      averageProtein: 0,
      averageFat: 0,
      averageCarbs: 0,
      highestCalories: null,
      lowestCalories: null,
      categoryStats: {}
    }

    if (stats.totalMenus === 0) return stats

    const menus = Object.values(allDetails)
    let totalCals = 0, totalProt = 0, totalFat = 0, totalCarbs = 0
    let maxCals = -Infinity, minCals = Infinity
    let maxMenu = null, minMenu = null

    const categoryMap = {}

    menus.forEach(menu => {
      totalCals += menu.calories || 0
      totalProt += menu.protein || 0
      totalFat += menu.fat || 0
      totalCarbs += menu.carbs || 0

      if (menu.calories > maxCals) {
        maxCals = menu.calories
        maxMenu = menu
      }
      if (menu.calories < minCals && menu.calories > 0) {
        minCals = menu.calories
        minMenu = menu
      }

      if (!categoryMap[menu.category]) {
        categoryMap[menu.category] = {
          menus: 0,
          avgCalories: 0,
          avgProtein: 0
        }
      }
      categoryMap[menu.category].menus += 1
      categoryMap[menu.category].avgCalories += menu.calories || 0
      categoryMap[menu.category].avgProtein += menu.protein || 0
    })

    stats.averageCalories = Math.round(totalCals / stats.totalMenus)
    stats.averageProtein = Math.round(totalProt / stats.totalMenus)
    stats.averageFat = Math.round(totalFat / stats.totalMenus)
    stats.averageCarbs = Math.round(totalCarbs / stats.totalMenus)
    stats.highestCalories = maxMenu
    stats.lowestCalories = minMenu

    Object.entries(categoryMap).forEach(([cat, data]) => {
      stats.categoryStats[cat] = {
        menuCount: data.menus,
        avgCalories: Math.round(data.avgCalories / data.menus),
        avgProtein: Math.round(data.avgProtein / data.menus)
      }
    })

    logger.debug('영양 통계 생성', stats)
    return stats
  } catch (error) {
    logger.error('영양 통계 생성 실패', error)
    return {}
  }
}

/**
 * 카테고리별 메뉴 상세정보 조회
 * @param {string} category - 음식 카테고리
 * @returns {Array} 메뉴 상세정보 배열
 */
export function getMenuDetailsByCategory(category) {
  try {
    const allDetails = getAllMenuDetails()
    return Object.values(allDetails).filter(menu => menu.category === category)
  } catch (error) {
    logger.error('카테고리별 메뉴 상세정보 조회 실패', error)
    return []
  }
}

/**
 * 칼로리 범위로 메뉴 검색
 * @param {number} minCal - 최소 칼로리
 * @param {number} maxCal - 최대 칼로리
 * @returns {Array} 메뉴 배열
 */
export function searchMenuByCalories(minCal, maxCal) {
  try {
    const allDetails = getAllMenuDetails()
    return Object.values(allDetails).filter(menu =>
      menu.calories >= minCal && menu.calories <= maxCal
    ).sort((a, b) => a.calories - b.calories)
  } catch (error) {
    logger.error('칼로리 범위 검색 실패', error)
    return []
  }
}

/**
 * 태그로 메뉴 검색
 * @param {string} tag - 검색 태그
 * @returns {Array} 메뉴 배열
 */
export function searchMenuByTag(tag) {
  try {
    const allDetails = getAllMenuDetails()
    return Object.values(allDetails).filter(menu =>
      menu.tags && menu.tags.includes(tag)
    )
  } catch (error) {
    logger.error('태그로 메뉴 검색 실패', error)
    return []
  }
}

/**
 * 가격대별 메뉴 검색
 * @param {number} minPrice - 최소 가격
 * @param {number} maxPrice - 최대 가격
 * @returns {Array} 메뉴 배열
 */
export function searchMenuByPrice(minPrice, maxPrice) {
  try {
    const allDetails = getAllMenuDetails()
    return Object.values(allDetails).filter(menu =>
      menu.price >= minPrice && menu.price <= maxPrice
    ).sort((a, b) => a.price - b.price)
  } catch (error) {
    logger.error('가격대 검색 실패', error)
    return []
  }
}

/**
 * 준비 시간이 짧은 메뉴 검색
 * @param {number} maxTime - 최대 준비 시간 (분)
 * @returns {Array} 메뉴 배열
 */
export function searchFastMenus(maxTime = 15) {
  try {
    const allDetails = getAllMenuDetails()
    return Object.values(allDetails).filter(menu =>
      menu.preparationTime && menu.preparationTime <= maxTime
    ).sort((a, b) => a.preparationTime - b.preparationTime)
  } catch (error) {
    logger.error('빠른 메뉴 검색 실패', error)
    return []
  }
}

/**
 * 커스텀 메뉴 상세정보 가져오기
 * @private
 * @returns {Object} 커스텀 메뉴 상세정보
 */
function getCustomMenuDetails() {
  try {
    const customStr = localStorage.getItem(MENU_DETAILS_STORAGE_KEY)
    return customStr ? JSON.parse(customStr) : {}
  } catch (error) {
    logger.error('커스텀 메뉴 상세정보 로드 실패', error)
    return {}
  }
}

/**
 * 기본 메뉴 상세정보 생성
 * @private
 * @param {string} category - 음식 카테고리
 * @param {string} menu - 메뉴명
 * @returns {Object} 기본 상세정보
 */
function generateBasicDetail(category, menu) {
  return {
    category: category,
    menu: menu,
    calories: 500,
    protein: 20,
    carbs: 60,
    fat: 12,
    price: 0,
    description: `${menu} - ${category}`,
    servingSize: '1인분',
    nutrition: '정보 없음',
    spiceLevel: 2,
    tags: [],
    preparationTime: 0
  }
}

/**
 * 메뉴 상세정보 초기화 (커스텀만 삭제)
 * @returns {boolean} 성공 여부
 */
export function clearCustomMenuDetails() {
  try {
    localStorage.removeItem(MENU_DETAILS_STORAGE_KEY)
    logger.info('커스텀 메뉴 상세정보 삭제')
    return true
  } catch (error) {
    logger.error('메뉴 상세정보 초기화 실패', error)
    return false
  }
}

/**
 * 메뉴 상세정보 JSON 형식으로 내보내기
 * @returns {string} JSON 문자열
 */
export function exportMenuDetailsAsJSON() {
  try {
    const allDetails = getAllMenuDetails()
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: 1,
      menuDetails: allDetails
    }

    const json = JSON.stringify(exportData, null, 2)
    logger.info('메뉴 상세정보 내보내기 완료')
    return json
  } catch (error) {
    logger.error('메뉴 상세정보 내보내기 실패', error)
    return null
  }
}

export default {
  getMenuDetail,
  getAllMenuDetails,
  addMenuDetail,
  updateMenuDetail,
  calculateNutritionScore,
  getNutritionStats,
  getMenuDetailsByCategory,
  searchMenuByCalories,
  searchMenuByTag,
  searchMenuByPrice,
  searchFastMenus,
  clearCustomMenuDetails,
  exportMenuDetailsAsJSON,
  DEFAULT_MENU_DETAILS
}
