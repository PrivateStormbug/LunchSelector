import { useState, useEffect, useRef, useCallback } from 'react'
import { APP_CONFIG, logger, performance as perfMonitor } from '../config.js'
import { addToHistory } from '../historyManager'

/**
 * useSpinningAnimation - 스피닝 애니메이션 관리 커스텀 훅
 * 
 * 역할: 랜덤 메뉴 추천 시 스피닝 효과와 최종 메뉴 결정 로직 담당
 * 
 * @param {Object} params - 파라미터 객체
 * @param {Object} params.menuData - 메뉴 데이터
 * @param {Array} params.categories - 카테고리 목록
 * @param {String} params.selectedCategory - 선택된 카테고리
 * 
 * @returns {Object} {
 *   isSpinning: Boolean - 스피닝 상태
 *   spinningMenu: String - 스피닝 중 표시할 메뉴
 *   finalCategory: String - 최종 선택된 카테고리
 *   finalMenu: String - 최종 선택된 메뉴
 *   startSpinning: Function - 스피닝 시작
 *   stopSpinning: Function - 스피닝 중지 (cleanup)
 * }
 */
export function useSpinningAnimation({ menuData, categories, selectedCategory }) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinningMenu, setSpinningMenu] = useState(null)
  const [finalCategory, setFinalCategory] = useState(null)
  const [finalMenu, setFinalMenu] = useState(null)
  const spinIntervalRef = useRef(null)
  const spinTimeoutRef = useRef(null)

  /**
   * 특정 카테고리에서 랜덤 메뉴 추출
   * @param {String} category - 카테고리명
   * @returns {String|null} 랜덤 메뉴 또는 null
   */
  const getRandomMenuFromCategory = useCallback((category) => {
    const menus = menuData[category]
    if (!menus || menus.length === 0) return null
    const randomIndex = Math.floor(Math.random() * menus.length)
    return menus[randomIndex]
  }, [menuData])

  /**
   * 랜덤 카테고리 선택
   * @returns {String|null} 랜덤 카테고리 또는 null
   */
  const getRandomCategory = useCallback(() => {
    if (categories.length === 0) return null
    const randomIndex = Math.floor(Math.random() * categories.length)
    return categories[randomIndex]
  }, [categories])

  /**
   * 완전 랜덤 메뉴 추천 (카테고리와 메뉴 모두 랜덤)
   * @returns {Object|null} { category, menu } 또는 null
   */
  const getRandomMenu = useCallback(() => {
    const category = getRandomCategory()
    if (!category) return null
    const menu = getRandomMenuFromCategory(category)
    return menu ? { category, menu } : null
  }, [getRandomCategory, getRandomMenuFromCategory])

  /**
   * 스피닝 시작 및 실행
   * @returns {Promise<Object>} 최종 메뉴 { category, menu }
   */
  const startSpinning = useCallback(() => {
    perfMonitor.start('randomMenuSelection')
    setIsSpinning(true)

    return new Promise((resolve) => {
      // 스피닝 효과: 100ms마다 다른 메뉴 표시
      spinIntervalRef.current = setInterval(() => {
        if (selectedCategory && selectedCategory !== '뽑는 중...') {
          const menu = getRandomMenuFromCategory(selectedCategory)
          setSpinningMenu(menu)
        } else {
          const { menu } = getRandomMenu() || { menu: null }
          setSpinningMenu(menu)
        }
      }, APP_CONFIG.performance.spinInterval)

      // 지정된 시간 후 스피닝 종료 및 최종 메뉴 결정
      spinTimeoutRef.current = setTimeout(() => {
        clearInterval(spinIntervalRef.current)
        
        let category, menu
        if (selectedCategory && selectedCategory !== '뽑는 중...') {
          category = selectedCategory
          menu = getRandomMenuFromCategory(selectedCategory)
        } else {
          const result = getRandomMenu()
          category = result.category
          menu = result.menu
        }

        setIsSpinning(false)
        setSpinningMenu(null)
        setFinalCategory(category)
        setFinalMenu(menu)

        // 히스토리 추가
        if (category && menu) {
          addToHistory(category, menu)
          logger.info(`추천 메뉴: ${category} - ${menu}`)
        }

        perfMonitor.end('randomMenuSelection')
        resolve({ category, menu })
      }, APP_CONFIG.performance.spinDuration)
    })
  }, [selectedCategory, getRandomMenuFromCategory, getRandomMenu])

  /**
   * 컴포넌트 언마운트 시 interval 정리
   */
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current)
      }
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current)
      }
    }
  }, [])

  /**
   * 스피닝 중단 (필요 시)
   */
  const stopSpinning = useCallback(() => {
    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current)
    }
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current)
    }
    setIsSpinning(false)
    setSpinningMenu(null)
  }, [])

  return {
    isSpinning,
    spinningMenu,
    finalCategory,
    finalMenu,
    startSpinning,
    stopSpinning,
    // 내부 유틸 함수 (필요 시)
    getRandomMenuFromCategory,
    getRandomCategory,
    getRandomMenu
  }
}
