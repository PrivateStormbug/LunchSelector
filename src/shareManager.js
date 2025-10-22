/**
 * 메뉴 공유 관리 시스템
 * Web Share API, 클립보드, SNS 공유 등을 통합 관리
 *
 * 주요 기능:
 * - Web Share API 지원 및 폴백
 * - 클립보드 복사
 * - SNS 공유 (카카오톡, 페이스북, 트위터, 라인)
 * - QR 코드 생성
 * - 공유 통계 기록
 */

import { logger } from './config'

const SHARE_STATS_KEY = 'lunch_selector_share_stats'

/**
 * Web Share API 지원 여부 확인
 * @returns {boolean} Web Share API 지원 여부
 */
export function isWebShareSupported() {
  return typeof navigator !== 'undefined' && !!navigator.share
}

/**
 * 클립보드 API 지원 여부 확인
 * @returns {boolean} 클립보드 API 지원 여부
 */
export function isClipboardSupported() {
  return typeof navigator !== 'undefined' && !!navigator.clipboard
}

/**
 * 메뉴 정보를 공유 텍스트로 변환
 * @param {string} menu - 메뉴명
 * @param {string} category - 카테고리
 * @param {Object} detail - 메뉴 상세정보
 * @returns {Object} { title, text, url }
 */
export function generateShareContent(menu, category, detail = {}) {
  const text = `🍽️ ${menu} (${category})\n\n` +
    `칼로리: ${detail.calories || 'N/A'}kcal\n` +
    `가격: ${detail.price ? detail.price.toLocaleString() + '원' : 'N/A'}\n` +
    `준비시간: ${detail.preparationTime ? detail.preparationTime + '분' : 'N/A'}\n\n` +
    `${detail.description || '점심 메뉴 추천 서비스를 이용해보세요!'}\n\n` +
    `#점심메뉴 #메뉴추천 #점심메뉴추천`

  return {
    title: `${menu} 추천`,
    text: text,
    url: window.location.href
  }
}

/**
 * Web Share API를 통한 공유
 * @param {string} menu - 메뉴명
 * @param {string} category - 카테고리
 * @param {Object} detail - 메뉴 상세정보
 * @returns {Promise<boolean>} 성공 여부
 */
export async function shareViaWebShare(menu, category, detail = {}) {
  if (!isWebShareSupported()) {
    logger.warn('Web Share API 미지원')
    return false
  }

  try {
    const shareContent = generateShareContent(menu, category, detail)
    await navigator.share({
      title: shareContent.title,
      text: shareContent.text,
      url: shareContent.url
    })

    recordShareStat('web_share', menu, category)
    logger.info('Web Share API를 통한 공유 완료')
    return true
  } catch (error) {
    if (error.name !== 'AbortError') {
      logger.error('Web Share API 공유 실패', error)
    }
    return false
  }
}

/**
 * 클립보드에 복사
 * @param {string} menu - 메뉴명
 * @param {string} category - 카테고리
 * @param {Object} detail - 메뉴 상세정보
 * @returns {Promise<boolean>} 성공 여부
 */
export async function copyToClipboard(menu, category, detail = {}) {
  if (!isClipboardSupported()) {
    logger.warn('클립보드 API 미지원')
    return false
  }

  try {
    const shareContent = generateShareContent(menu, category, detail)
    await navigator.clipboard.writeText(shareContent.text)

    recordShareStat('clipboard', menu, category)
    logger.info('클립보드 복사 완료')
    return true
  } catch (error) {
    logger.error('클립보드 복사 실패', error)
    return false
  }
}

/**
 * 카카오톡 공유 링크 생성
 * @param {string} menu - 메뉴명
 * @param {string} category - 카테고리
 * @param {Object} detail - 메뉴 상세정보
 * @returns {string} 카카오톡 공유 URL
 */
export function getKakaoTalkShareUrl(menu, category, detail = {}) {
  const appKey = 'YOUR_KAKAO_APP_KEY' // 실제 환경에서는 .env에서 로드
  const shareContent = generateShareContent(menu, category, detail)

  // 카카오톡 메시지 링크
  const shareText = encodeURIComponent(
    `${menu}을(를) 추천받았습니다!\n${shareContent.text}`
  )

  return `https://sharer.kakao.com/talk/friends/share/apiserver/msg?app_id=${appKey}&msg=${shareText}&link=${encodeURIComponent(window.location.href)}`
}

/**
 * 카카오톡 공유 (JavaScript SDK 필요)
 * @param {string} menu - 메뉴명
 * @param {string} category - 카테고리
 * @param {Object} detail - 메뉴 상세정보
 * @returns {boolean} 성공 여부
 */
export function shareViaKakaoTalk(menu, category, detail = {}) {
  try {
    if (typeof window.Kakao === 'undefined') {
      logger.warn('Kakao SDK 미로드')
      return false
    }

    const shareText = `${menu}을(를) 추천받았습니다!\n\n` +
      `칼로리: ${detail.calories || 'N/A'}kcal\n` +
      `가격: ${detail.price ? detail.price.toLocaleString() + '원' : 'N/A'}`

    window.Kakao.Link.sendDefault({
      objectType: 'feed',
      content: {
        title: `${menu} 추천`,
        description: shareText,
        imageUrl: 'https://via.placeholder.com/200x200?text=' + encodeURIComponent(menu),
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href
        }
      },
      buttons: [
        {
          title: '웹에서 보기',
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href
          }
        }
      ]
    })

    recordShareStat('kakao_talk', menu, category)
    logger.info('카카오톡 공유 완료')
    return true
  } catch (error) {
    logger.error('카카오톡 공유 실패', error)
    return false
  }
}

/**
 * 페이스북 공유 URL 생성
 * @param {string} menu - 메뉴명
 * @returns {string} 페이스북 공유 URL
 */
export function getFacebookShareUrl(menu) {
  const baseUrl = 'https://www.facebook.com/sharer/sharer.php'
  const params = new URLSearchParams({
    u: window.location.href,
    quote: `${menu}을(를) 추천받았습니다! #점심메뉴추천`
  })

  return `${baseUrl}?${params}`
}

/**
 * 페이스북 공유
 * @param {string} menu - 메뉴명
 * @param {string} category - 카테고리
 * @returns {boolean} 성공 여부
 */
export function shareViaFacebook(menu, category) {
  try {
    const url = getFacebookShareUrl(menu)
    window.open(url, 'facebook-share', 'width=600,height=400')

    recordShareStat('facebook', menu, category)
    logger.info('페이스북 공유 완료')
    return true
  } catch (error) {
    logger.error('페이스북 공유 실패', error)
    return false
  }
}

/**
 * 트위터 공유 URL 생성
 * @param {string} menu - 메뉴명
 * @param {string} category - 카테고리
 * @returns {string} 트위터 공유 URL
 */
export function getTwitterShareUrl(menu, category) {
  const baseUrl = 'https://twitter.com/intent/tweet'
  const text = `오늘은 ${menu}(${category})을(를) 먹을 거예요! #점심메뉴추천 #LunchSelector`
  const params = new URLSearchParams({
    text: text,
    url: window.location.href,
    hashtags: '점심메뉴,메뉴추천'
  })

  return `${baseUrl}?${params}`
}

/**
 * 트위터 공유
 * @param {string} menu - 메뉴명
 * @param {string} category - 카테고리
 * @returns {boolean} 성공 여부
 */
export function shareViaTwitter(menu, category) {
  try {
    const url = getTwitterShareUrl(menu, category)
    window.open(url, 'twitter-share', 'width=600,height=400')

    recordShareStat('twitter', menu, category)
    logger.info('트위터 공유 완료')
    return true
  } catch (error) {
    logger.error('트위터 공유 실패', error)
    return false
  }
}

/**
 * 라인 공유 URL 생성
 * @param {string} menu - 메뉴명
 * @param {string} category - 카테고리
 * @returns {string} 라인 공유 URL
 */
export function getLineShareUrl(menu, category) {
  const baseUrl = 'https://line.me/R/msg/text/'
  const text = `오늘은 ${menu}(${category})이 최고! #점심메뉴추천`

  return `${baseUrl}${encodeURIComponent(text)} ${window.location.href}`
}

/**
 * 라인 공유
 * @param {string} menu - 메뉴명
 * @param {string} category - 카테고리
 * @returns {boolean} 성공 여부
 */
export function shareViaLine(menu, category) {
  try {
    const url = getLineShareUrl(menu, category)
    window.open(url, 'line-share', 'width=600,height=400')

    recordShareStat('line', menu, category)
    logger.info('라인 공유 완료')
    return true
  } catch (error) {
    logger.error('라인 공유 실패', error)
    return false
  }
}

/**
 * 이메일 공유 링크 생성
 * @param {string} menu - 메뉴명
 * @param {string} category - 카테고리
 * @param {Object} detail - 메뉴 상세정보
 * @returns {string} 이메일 공유 링크
 */
export function getEmailShareUrl(menu, category, detail = {}) {
  const subject = `${menu} 추천`
  const body = generateShareContent(menu, category, detail).text

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/**
 * 이메일 공유
 * @param {string} menu - 메뉴명
 * @param {string} category - 카테고리
 * @param {Object} detail - 메뉴 상세정보
 * @returns {boolean} 성공 여부
 */
export function shareViaEmail(menu, category, detail = {}) {
  try {
    const url = getEmailShareUrl(menu, category, detail)
    window.location.href = url

    recordShareStat('email', menu, category)
    logger.info('이메일 공유 시작')
    return true
  } catch (error) {
    logger.error('이메일 공유 실패', error)
    return false
  }
}

/**
 * QR 코드 URL 생성
 * @param {string} menu - 메뉴명
 * @returns {string} QR 코드 이미지 URL
 */
export function getQRCodeUrl(menu) {
  const text = `${menu}\n${window.location.href}`
  const size = '200x200'

  // QR Code 생성 API 사용
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodeURIComponent(text)}`
}

/**
 * 공유 방식 자동 선택 및 실행
 * @param {string} menu - 메뉴명
 * @param {string} category - 카테고리
 * @param {Object} detail - 메뉴 상세정보
 * @returns {Promise<boolean>} 성공 여부
 */
export async function smartShare(menu, category, detail = {}) {
  try {
    // 1. Web Share API가 지원되면 우선 사용
    if (isWebShareSupported()) {
      const result = await shareViaWebShare(menu, category, detail)
      if (result) return true
    }

    // 2. Kakao SDK가 로드되어있으면 카카오톡 공유
    if (typeof window.Kakao !== 'undefined') {
      const result = shareViaKakaoTalk(menu, category, detail)
      if (result) return true
    }

    // 3. 클립보드 API 사용
    if (isClipboardSupported()) {
      const result = await copyToClipboard(menu, category, detail)
      if (result) return true
    }

    logger.warn('공유 가능한 방식이 없습니다')
    return false
  } catch (error) {
    logger.error('스마트 공유 실패', error)
    return false
  }
}

/**
 * 공유 통계 기록
 * @param {string} method - 공유 방식 (web_share, clipboard, kakao_talk 등)
 * @param {string} menu - 메뉴명
 * @param {string} category - 카테고리
 */
function recordShareStat(method, menu, category) {
  try {
    const stats = getShareStats()

    if (!stats[method]) {
      stats[method] = {
        count: 0,
        items: []
      }
    }

    stats[method].count += 1
    stats[method].items.push({
      menu,
      category,
      timestamp: Date.now()
    })

    // 최대 100개까지만 유지
    if (stats[method].items.length > 100) {
      stats[method].items = stats[method].items.slice(-100)
    }

    localStorage.setItem(SHARE_STATS_KEY, JSON.stringify(stats))
    logger.debug(`공유 통계 기록: ${method} - ${menu}`)
  } catch (error) {
    logger.error('공유 통계 기록 실패', error)
  }
}

/**
 * 공유 통계 조회
 * @returns {Object} 공유 통계
 */
export function getShareStats() {
  try {
    const statsStr = localStorage.getItem(SHARE_STATS_KEY)
    return statsStr ? JSON.parse(statsStr) : {}
  } catch (error) {
    logger.error('공유 통계 조회 실패', error)
    return {}
  }
}

/**
 * 공유 통계 분석
 * @returns {Object} 공유 분석 데이터
 */
export function analyzeShareStats() {
  try {
    const stats = getShareStats()
    const analysis = {
      totalShares: 0,
      byMethod: {},
      topMenus: {},
      recentShares: []
    }

    Object.entries(stats).forEach(([method, data]) => {
      analysis.totalShares += data.count
      analysis.byMethod[method] = data.count

      // 인기 메뉴 추적
      data.items.forEach(item => {
        const key = `${item.category}||${item.menu}`
        if (!analysis.topMenus[key]) {
          analysis.topMenus[key] = { menu: item.menu, category: item.category, count: 0 }
        }
        analysis.topMenus[key].count += 1
      })

      // 최근 공유 기록
      analysis.recentShares = analysis.recentShares
        .concat(data.items.map(item => ({ ...item, method })))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20)
    })

    logger.debug('공유 통계 분석 완료', analysis)
    return analysis
  } catch (error) {
    logger.error('공유 통계 분석 실패', error)
    return { totalShares: 0, byMethod: {}, topMenus: {}, recentShares: [] }
  }
}

/**
 * 공유 통계 초기화
 * @returns {boolean} 성공 여부
 */
export function clearShareStats() {
  try {
    localStorage.removeItem(SHARE_STATS_KEY)
    logger.info('공유 통계 초기화 완료')
    return true
  } catch (error) {
    logger.error('공유 통계 초기화 실패', error)
    return false
  }
}

export default {
  isWebShareSupported,
  isClipboardSupported,
  generateShareContent,
  shareViaWebShare,
  copyToClipboard,
  getKakaoTalkShareUrl,
  shareViaKakaoTalk,
  getFacebookShareUrl,
  shareViaFacebook,
  getTwitterShareUrl,
  shareViaTwitter,
  getLineShareUrl,
  shareViaLine,
  getEmailShareUrl,
  shareViaEmail,
  getQRCodeUrl,
  smartShare,
  getShareStats,
  analyzeShareStats,
  clearShareStats
}
