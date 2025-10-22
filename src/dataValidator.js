import { APP_CONFIG, logger } from './config'

/**
 * 메뉴 데이터 검증 및 정제 시스템
 */

// 검증 규칙
const VALIDATION_RULES = {
  requiredCategories: ['한식', '중식', '일식', '양식', '분식'],
  maxMenusPerCategory: APP_CONFIG.limits.maxMenusPerCategory,
  maxMenuLength: APP_CONFIG.limits.maxMenuLength,
  minMenuLength: 1
}

/**
 * 메뉴 데이터 전체 검증
 * @param {object} data - 검증할 메뉴 데이터
 * @returns {object} { valid: boolean, errors: string[], data: object }
 */
export const validateMenuData = (data) => {
  const errors = []

  // 데이터 타입 확인
  if (!data || typeof data !== 'object') {
    errors.push('메뉴 데이터는 객체여야 합니다.')
    return {
      valid: false,
      errors,
      data: null
    }
  }

  // 필수 카테고리 확인
  const missingCategories = VALIDATION_RULES.requiredCategories.filter(
    cat => !data[cat] || !Array.isArray(data[cat])
  )

  if (missingCategories.length > 0) {
    errors.push(`필수 카테고리 누락: ${missingCategories.join(', ')}`)
  }

  // 각 카테고리별 검증
  Object.entries(data).forEach(([category, menus]) => {
    if (!Array.isArray(menus)) {
      errors.push(`${category}: 배열 타입이어야 합니다.`)
      return
    }

    // 메뉴 개수 제한
    if (menus.length > VALIDATION_RULES.maxMenusPerCategory) {
      errors.push(
        `${category}: 메뉴가 ${VALIDATION_RULES.maxMenusPerCategory}개를 초과합니다. (${menus.length}개)`
      )
    }

    // 메뉴명 검증
    menus.forEach((menu, index) => {
      if (typeof menu !== 'string') {
        errors.push(`${category}[${index}]: 문자열이어야 합니다.`)
      } else if (menu.length < VALIDATION_RULES.minMenuLength) {
        errors.push(`${category}[${index}]: 빈 문자열입니다.`)
      } else if (menu.length > VALIDATION_RULES.maxMenuLength) {
        errors.push(
          `${category}[${index}]: 메뉴명이 너무 깁니다. (${menu.length}자, 최대 ${VALIDATION_RULES.maxMenuLength}자)`
        )
      }
    })
  })

  if (errors.length > 0) {
    logger.warn('메뉴 데이터 검증 실패', { errors, data })
    return {
      valid: false,
      errors,
      data
    }
  }

  logger.debug('메뉴 데이터 검증 성공')
  return {
    valid: true,
    errors: [],
    data
  }
}

/**
 * 메뉴 데이터 정제 (손상된 데이터 복구)
 * @param {object} data - 정제할 메뉴 데이터
 * @returns {object} 정제된 메뉴 데이터
 */
export const sanitizeMenuData = (data) => {
  if (!data || typeof data !== 'object') {
    logger.warn('메뉴 데이터 정제 실패: 유효하지 않은 데이터')
    return null
  }

  const sanitized = {}

  // 필수 카테고리만 유지
  VALIDATION_RULES.requiredCategories.forEach(category => {
    const menus = data[category]

    if (Array.isArray(menus)) {
      // 메뉴 개수 제한
      let validMenus = menus.slice(0, VALIDATION_RULES.maxMenusPerCategory)

      // 문자열이고 길이 제한을 만족하는 메뉴만 유지
      validMenus = validMenus.filter(
        menu =>
          typeof menu === 'string' &&
          menu.length > 0 &&
          menu.length <= VALIDATION_RULES.maxMenuLength
      )

      sanitized[category] = validMenus.length > 0 ? validMenus : []
    } else {
      sanitized[category] = []
    }
  })

  logger.info('메뉴 데이터 정제 완료', sanitized)
  return sanitized
}

/**
 * 메뉴 추가 시 검증
 * @param {string} category - 카테고리
 * @param {string} menu - 메뉴명
 * @returns {object} { valid: boolean, error: string }
 */
export const validateMenuItem = (category, menu) => {
  if (!category || typeof category !== 'string') {
    return {
      valid: false,
      error: '유효한 카테고리를 선택해주세요.'
    }
  }

  if (!menu || typeof menu !== 'string') {
    return {
      valid: false,
      error: '메뉴명을 입력해주세요.'
    }
  }

  if (menu.length < VALIDATION_RULES.minMenuLength) {
    return {
      valid: false,
      error: '메뉴명은 최소 1자 이상이어야 합니다.'
    }
  }

  if (menu.length > VALIDATION_RULES.maxMenuLength) {
    return {
      valid: false,
      error: `메뉴명은 ${VALIDATION_RULES.maxMenuLength}자 이하여야 합니다. (현재: ${menu.length}자)`
    }
  }

  return {
    valid: true,
    error: null
  }
}

/**
 * 중복 메뉴 확인
 * @param {object} allMenus - 전체 메뉴 데이터
 * @param {string} category - 확인할 카테고리
 * @param {string} menu - 확인할 메뉴명
 * @returns {object} { isDuplicate: boolean, duplicateIn: string[] }
 */
export const checkDuplicateMenu = (allMenus, category, menu) => {
  const duplicateIn = []

  Object.entries(allMenus).forEach(([cat, menus]) => {
    if (menus.includes(menu)) {
      duplicateIn.push(cat)
    }
  })

  const isDuplicate = duplicateIn.length > 0

  if (isDuplicate) {
    logger.debug(`중복 메뉴 발견: ${menu} (${duplicateIn.join(', ')})`)
  }

  return {
    isDuplicate,
    duplicateIn
  }
}

/**
 * 메뉴 개수 제한 확인
 * @param {object} menus - 카테고리 메뉴 배열
 * @returns {object} { canAdd: boolean, count: number, remaining: number }
 */
export const checkMenuCapacity = (menus) => {
  const count = Array.isArray(menus) ? menus.length : 0
  const remaining = VALIDATION_RULES.maxMenusPerCategory - count

  return {
    canAdd: remaining > 0,
    count,
    remaining: Math.max(0, remaining)
  }
}

export default {
  validateMenuData,
  sanitizeMenuData,
  validateMenuItem,
  checkDuplicateMenu,
  checkMenuCapacity,
  VALIDATION_RULES
}
