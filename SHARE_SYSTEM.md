# 공유 시스템 (Share System)

## 개요

LunchSelector의 공유 시스템은 사용자가 추천받은 메뉴를 다양한 플랫폼을 통해 공유할 수 있는 종합 기능을 제공합니다. 메뉴 정보를 포함한 URL 생성, 멀티플랫폼 공유(SNS, 이메일), QR 코드 생성, 공유 통계 관리를 통합적으로 처리합니다.

## 주요 기능

### 1. 공유 URL 생성
```javascript
generateShareUrl(menu, category)
```
- 메뉴 정보를 포함한 URL을 생성합니다
- URL 파라미터: `menu`, `category`
- 반환: `http://domain/?menu=메뉴명&category=카테고리`
- 다른 사용자가 URL을 방문하면 해당 메뉴 정보가 자동으로 로드됩니다

### 2. 공유 콘텐츠 생성
```javascript
generateShareContent(menu, category, detail)
```
- 메뉴 정보를 공유용 텍스트로 변환합니다
- 포함 정보:
  - 메뉴명 및 카테고리
  - 칼로리 정보
  - 가격
  - 준비시간
  - 상세 설명
  - 공유 URL
  - 해시태그
- 반환: `{ title, text, url }`

### 3. 멀티플랫폼 공유

#### Web Share API 공유
```javascript
shareViaWebShare(menu, category, detail)
```
- 지원 브라우저의 기본 공유 인터페이스 사용
- 모바일: 카카오톡, 메시지, 카톡 등
- 데스크톱: 메일 클라이언트 등
- 무조건 지원 여부: `isWebShareSupported()`

#### 클립보드 복사
```javascript
copyToClipboard(menu, category, detail)
```
- 공유 텍스트를 클립보드에 복사
- 사용자가 직접 붙여넣기 가능
- 지원 여부: `isClipboardSupported()`

#### SNS 공유

**카카오톡**
```javascript
shareViaKakaoTalk(menu, category, detail)
shareViaKakaoTalkUrl() // URL 기반
```
- Kakao SDK 필수 로드
- Rich 포맷으로 메뉴 정보 전달
- 이미지, 버튼 포함 가능

**페이스북**
```javascript
shareViaFacebook(menu, category, detail)
getFacebookShareUrl() // 공유 URL 생성
```
- Facebook Sharer 사용
- 별도 로그인 불필요

**트위터**
```javascript
shareViaTwitter(menu, category, detail)
getTwitterShareUrl() // 공유 URL 생성
```
- Twitter Intent 사용
- 해시태그 포함

**라인**
```javascript
shareViaLine(menu, category, detail)
getLineShareUrl() // 공유 URL 생성
```
- Line 메시지 공유
- 텍스트 및 URL 전달

**이메일**
```javascript
shareViaEmail(menu, category, detail)
getEmailShareUrl() // mailto 링크 생성
```
- 기본 메일 클라이언트 사용
- 제목 및 본문 자동 입력

### 4. QR 코드 생성
```javascript
getQRCodeUrl(menu, category)
```
- QR Server API 사용
- 메뉴 정보 포함 URL을 QR 코드로 변환
- 이미지 URL 반환
- 사용처:
  - 웹앱에 QR 표시
  - 오프라인 프린팅
  - SNS 공유

### 5. 스마트 공유
```javascript
smartShare(menu, category, detail)
```
- 사용 환경에 따라 최적의 공유 방식을 자동 선택
- 순서:
  1. Web Share API 지원 → 사용 (가장 우수한 UX)
  2. Kakao SDK 로드 → 카카오톡 공유
  3. Clipboard API → 클립보드 복사
- 비동기 처리: `Promise<boolean>`

### 6. 공유 통계

#### 통계 기록
```javascript
// 내부 함수 (자동 호출)
recordShareStat(method, menu, category)
```
- 각 공유 시 자동으로 기록
- localStorage에 저장
- 최대 100개 항목 유지

#### 통계 조회
```javascript
getShareStats()
```
- 반환: 
```javascript
{
  "web_share": {
    count: 5,
    items: [
      { menu, category, timestamp }
    ]
  },
  "facebook": { ... },
  // 기타 공유 방식들
}
```

#### 통계 분석
```javascript
analyzeShareStats()
```
- 반환:
```javascript
{
  totalShares: 20,
  byMethod: {
    web_share: 5,
    facebook: 3,
    line: 12
  },
  topMenus: {
    "카테고리||메뉴명": { menu, category, count }
  },
  recentShares: [
    { menu, category, method, timestamp }
  ]
}
```

#### 통계 초기화
```javascript
clearShareStats()
```
- 모든 공유 통계 삭제

## 저장소 구조

### LocalStorage 키
- **SHARE_STATS_KEY**: `'lunch_selector_share_stats'`

### 데이터 구조
```javascript
{
  "web_share": {
    "count": 5,
    "items": [
      {
        "menu": "김밥",
        "category": "한식",
        "timestamp": 1729000000000
      }
    ]
  },
  "facebook": {
    "count": 3,
    "items": [ ... ]
  }
}
```

## 사용 예시

### 기본 공유
```javascript
import { shareViaWebShare } from './shareManager'

// 메뉴 선택 시
const detail = {
  calories: 450,
  price: 8000,
  preparationTime: 15,
  description: "신선한 재료로 만든 맛있는 메뉴"
};

// Web Share API 사용 (자동 폴백)
const success = await shareViaWebShare('김밥', '한식', detail);
```

### SNS별 공유
```javascript
import { shareViaFacebook, shareViaTwitter } from './shareManager'

// 페이스북 공유
shareViaFacebook('김밥', '한식', detail);

// 트위터 공유
shareViaTwitter('김밥', '한식', detail);
```

### 스마트 공유
```javascript
import { smartShare } from './shareManager'

// 환경에 최적인 방식으로 자동 공유
const success = await smartShare('김밥', '한식', detail);
```

### URL 기반 공유
```javascript
import { generateShareUrl, getQRCodeUrl } from './shareManager'

// 공유 가능한 URL
const url = generateShareUrl('김밥', '한식');
// http://localhost:8888/?menu=김밥&category=한식

// QR 코드 이미지 URL
const qrUrl = getQRCodeUrl('김밥', '한식');
```

### 통계 조회
```javascript
import { analyzeShareStats } from './shareManager'

const analysis = analyzeShareStats();
console.log(`총 공유 수: ${analysis.totalShares}`);
console.log(`인기 메뉴:`, analysis.topMenus);
console.log(`공유 방식별 통계:`, analysis.byMethod);
```

## API 호환성

| 기능 | 지원 환경 | 폴백 |
|------|---------|------|
| Web Share | 최신 브라우저 | Clipboard 복사 |
| Clipboard | 최신 브라우저 | - |
| Kakao Talk | Kakao SDK 로드 필수 | Web Share 또는 Clipboard |
| Facebook | 모든 브라우저 (팝업) | - |
| Twitter | 모든 브라우저 (팝업) | - |
| Line | 모든 브라우저 | - |
| Email | 모든 브라우저 | - |
| QR Code | 모든 브라우저 (API) | - |

## 에러 처리

- **API 미지원**: 자동으로 다음 옵션으로 폴백
- **Network 오류**: 로깅 후 사용자 알림
- **AbortError**: 사용자 취소 (로깅 안함)
- **파싱 오류**: 로거를 통해 기록

## 보안 고려사항

- URL 파라미터는 `URLSearchParams`로 안전하게 인코딩
- localStorage는 중요한 정보 저장 금지
- 공유 통계는 메뉴 이름과 카테고리만 저장 (개인정보 미포함)
- QR 코드는 서버 API 사용으로 클라이언트 처리 부하 감소

## 성능 최적화

- 공유 통계는 최대 100개까지만 유지
- 분석은 주기적 요청 시에만 수행
- API 호출은 필요한 시점에만 실행
- localStorage 접근은 최소화

## 추가 개선 사항

1. **Kakao SDK 초기화**: `.env`에서 Kakao App Key 로드
2. **공유 통계 백엔드 연동**: 장기 분석을 위한 서버 저장
3. **공유 이벤트 추적**: Google Analytics, Mixpanel 등
4. **짧은 URL 생성**: bit.ly, TinyURL 등 API 연동
5. **동적 메타 태그**: OpenGraph, Twitter Card 설정
6. **앱 인증**: Facebook, Twitter 앱 등록 및 연동
