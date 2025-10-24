import { useState, useEffect, useRef } from 'react'
import { menuData as defaultMenuData } from '../menuData'
import { APP_CONFIG, logger, performance as perfMonitor } from '../config.js'
import { validateMenuData, sanitizeMenuData } from '../dataValidator'

/**
 * useMenuData - 메뉴 데이터 관리 커스텀 훅
 * 
 * 역할: 메뉴 데이터의 로딩, 검증, 캐싱, 저장을 담당
 * 
 * @returns {Object} {
 *   menuData: Object - 메뉴 데이터
 *   categories: Array - 카테고리 목록
 *   isLoading: Boolean - 로딩 상태
 *   error: String|null - 에러 메시지
 *   saveMenus: Function - 메뉴 저장
 * }
 */
export function useMenuData() {
  const [menuData, setMenuData] = useState({})
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const menuCacheRef = useRef(null)

  /**
   * 초기화 효과: localStorage에서 메뉴 데이터 로드
   * 캐시가 있으면 캐시 사용, 없으면 localStorage 확인, 모두 없으면 기본값 사용
   */
  useEffect(() => {
    const loadMenuData = () => {
      perfMonitor.start('loadMenuData')
      try {
        // 1. 캐시 확인
        if (menuCacheRef.current) {
          logger.debug('메뉴 데이터 캐시에서 로드')
          setMenuData(menuCacheRef.current)
          setCategories(Object.keys(menuCacheRef.current))
          setIsLoading(false)
          return
        }

        // 2. localStorage에서 데이터 확인
        const savedMenus = localStorage.getItem(APP_CONFIG.storage.menuKey)
        if (savedMenus) {
          const parsedMenus = JSON.parse(savedMenus)
          // 데이터 검증
          const validationResult = validateMenuData(parsedMenus)
          if (!validationResult.valid) {
            logger.warn('메뉴 데이터 검증 실패, 데이터 정제 시도', validationResult.errors)
            const sanitizedData = sanitizeMenuData(parsedMenus)
            menuCacheRef.current = sanitizedData
            setMenuData(sanitizedData)
            setCategories(Object.keys(sanitizedData))
          } else {
            menuCacheRef.current = parsedMenus
            setMenuData(parsedMenus)
            setCategories(Object.keys(parsedMenus))
          }
          logger.debug('localStorage에서 메뉴 데이터 로드 성공')
        } else {
          // 3. 저장된 데이터가 없으면 기본 데이터 사용
          menuCacheRef.current = defaultMenuData
          setMenuData(defaultMenuData)
          setCategories(Object.keys(defaultMenuData))
          logger.debug('기본 메뉴 데이터 사용')
        }
        setError(null)
      } catch (err) {
        logger.error('메뉴 데이터 로드 실패', err)
        setError(err.message)
        // 에러 발생 시 기본 데이터 사용
        menuCacheRef.current = defaultMenuData
        setMenuData(defaultMenuData)
        setCategories(Object.keys(defaultMenuData))
      } finally {
        setIsLoading(false)
        perfMonitor.end('loadMenuData')
      }
    }

    loadMenuData()
  }, [])

  /**
   * 메뉴 데이터 저장
   * @param {Object} newMenuData - 저장할 메뉴 데이터
   * @returns {Boolean} 저장 성공 여부
   */
  const saveMenus = (newMenuData) => {
    perfMonitor.start('saveMenuData')
    try {
      // 검증
      const validationResult = validateMenuData(newMenuData)
      if (!validationResult.valid) {
        const errorMsg = `메뉴 데이터 검증 실패: ${validationResult.errors.join(', ')}`
        logger.error(errorMsg)
        setError(errorMsg)
        return false
      }

      // localStorage에 저장
      localStorage.setItem(APP_CONFIG.storage.menuKey, JSON.stringify(newMenuData))
      // 캐시 업데이트
      menuCacheRef.current = newMenuData
      // 상태 업데이트
      setMenuData(newMenuData)
      setCategories(Object.keys(newMenuData))
      setError(null)
      logger.info('메뉴 데이터 저장 성공')
      perfMonitor.end('saveMenuData')
      return true
    } catch (err) {
      logger.error('메뉴 저장 실패', err)
      const errorMsg = `저장 실패: ${err.message}`
      setError(errorMsg)
      perfMonitor.end('saveMenuData')
      return false
    }
  }

  return {
    menuData,
    categories,
    isLoading,
    error,
    saveMenus
  }
}
