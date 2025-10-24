import { useState, useEffect, useCallback } from 'react'
import { logger } from '../config.js'

/**
 * useGeolocation - 지리 위치 정보 관리 커스텀 훅
 * 
 * 역할: 현재 사용자의 위치 정보를 가져오고 관리
 * 
 * @param {Object} params - 파라미터 객체
 * @param {Boolean} params.isRequired - 위치 정보가 필수인지 여부 (기본값: false)
 * 
 * @returns {Object} {
 *   location: Object|null - { latitude, longitude } 또는 null
 *   error: String|null - 에러 메시지
 *   isLoading: Boolean - 로딩 중 여부
 *   requestLocation: Function - 위치 요청 (동적 요청용)
 * }
 */
export function useGeolocation({ isRequired = false } = {}) {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(isRequired)

  /**
   * 위치 정보 요청 로직
   */
  const requestLocation = useCallback(() => {
    // 브라우저 지리 위치 지원 확인
    if (!navigator.geolocation) {
      const errorMsg = '이 브라우저는 위치 서비스를 지원하지 않습니다.'
      logger.warn(errorMsg)
      setError(errorMsg)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        logger.debug(`위치 획득: ${latitude}, ${longitude}`)
        setLocation({ latitude, longitude })
        setIsLoading(false)
      },
      (positionError) => {
        logger.warn('위치 정보 가져오기 실패', positionError)
        
        // 에러 메시지 처리
        let errorMsg = '위치 정보를 가져올 수 없습니다.'
        switch (positionError.code) {
          case positionError.PERMISSION_DENIED:
            errorMsg = '위치 접근 권한이 거부되었습니다.'
            break
          case positionError.POSITION_UNAVAILABLE:
            errorMsg = '위치 정보를 사용할 수 없습니다.'
            break
          case positionError.TIMEOUT:
            errorMsg = '위치 정보 요청이 시간 초과되었습니다.'
            break
          default:
            errorMsg = '위치 정보 요청에 실패했습니다.'
        }
        
        setError(errorMsg)
        
        // 기본 위치(서울 시청) 사용
        logger.warn('기본 위치(서울 시청)로 설정합니다.')
        setLocation({ latitude: 37.5665, longitude: 126.9780 })
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }, [])

  /**
   * 초기 효과: isRequired가 true이면 자동으로 위치 요청
   */
  useEffect(() => {
    if (isRequired) {
      requestLocation()
    }
  }, [isRequired, requestLocation])

  return {
    location,
    error,
    isLoading,
    requestLocation
  }
}
