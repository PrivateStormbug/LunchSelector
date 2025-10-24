# 🚀 LunchSelector 시작 가이드

LunchSelector를 설치하고 실행하는 완전한 가이드입니다. 개발 환경 설정부터 배포까지 모든 단계를 다룹니다.

## 📋 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [설치](#설치)
3. [개발 환경 실행](#개발-환경-실행)
4. [프로젝트 구조](#프로젝트-구조)
5. [주요 기능](#주요-기능)
6. [개발 가이드](#개발-가이드)
7. [배포 가이드](#배포-가이드)
8. [문제 해결](#문제-해결)

---

## 💻 시스템 요구사항

### 최소 요구사항

- **OS**: Windows 10 이상, macOS 10.14 이상, Linux (Ubuntu 18.04+)
- **Node.js**: v16 이상
- **npm**: v7 이상
- **RAM**: 2GB 이상
- **Disk**: 500MB 여유 공간

### 권장 사항

- **Node.js**: v18 LTS 이상
- **npm**: v9 이상
- **RAM**: 4GB 이상
- **Visual Studio Code** (에디터)

---

## 🔧 설치

### 1단계: Node.js 및 npm 설치

#### Windows

**방법 A: 공식 웹사이트 (권장)**

1. https://nodejs.org/en/ 접속
2. LTS 버전 다운로드 및 설치
3. 설치 마법사 진행 (기본 설정으로 OK)

**방법 B: Chocolatey**

```powershell
# 관리자 권한 PowerShell에서
choco install nodejs -y
```

**설치 확인:**

```powershell
node --version  # v18.x.x 이상
npm --version   # v9.x.x 이상
```

### 2단계: 프로젝트 클론 또는 다운로드

**Git 사용 (권장):**

```powershell
git clone https://github.com/yourusername/lunch-selector.git
cd LunchSelector
```

**또는 ZIP 다운로드:**

1. GitHub에서 Code → Download ZIP
2. 압축 해제
3. 폴더로 이동: `cd LunchSelector`

### 3단계: 의존성 설치

```powershell
npm install
```

**설치 내용:**
- Vite (빌드 도구)
- React 18 (UI 프레임워크)
- Kakao Maps API (지도 서비스)
- 기타 유틸리티

**설치 완료 확인:**

```powershell
npm list --depth=0
```

---

## 🎮 개발 환경 실행

### 개발 서버 시작

```powershell
npm run dev
```

**출력 예시:**

```
  VITE v5.0.8  ready in 125 ms

  ➜  Local:   https://localhost:8888/
  ➜  press h to show help
```

### 브라우저에서 확인

주소창에 입력:

```
https://localhost:8888
```

**초기 경고 무시:** 자체 서명 인증서 경고는 무시하고 계속 진행하세요.

### 개발 팁

**자동 새로고침:** 파일을 저장하면 자동으로 브라우저가 새로고침됩니다.

**개발 도구 열기:** F12 또는 우클릭 → 검사

**포트 변경:**

다른 포트를 사용하려면 `vite.config.js` 수정:

```javascript
server: {
  port: 3000  // 8888 대신 3000 사용
}
```

---

## 📁 프로젝트 구조

```
LunchSelector/
├── src/
│   ├── hooks/                    # 📌 Custom React Hooks
│   │   ├── useMenuData.js       # 메뉴 데이터 관리
│   │   ├── useSpinningAnimation.js  # 스피닝 애니메이션
│   │   ├── useKakaoMap.js       # Kakao Maps 관리
│   │   └── useGeolocation.js    # 위치 정보 관리
│   │
│   ├── App.jsx                  # 📌 메인 컴포넌트 (리팩토링됨)
│   ├── App.css                  # 메인 스타일
│   ├── main.jsx                 # 진입점
│   ├── index.css                # 전역 스타일
│   │
│   ├── components/              # React 컴포넌트
│   │   ├── MenuManager.jsx      # 메뉴 관리 모달
│   │   ├── MenuDetailModal.jsx  # 메뉴 상세정보 모달
│   │   ├── MenuSearch.jsx       # 메뉴 검색
│   │   ├── RecommendationPanel.jsx # AI 추천
│   │   ├── LoadingSpinner.jsx   # 로딩 스피너
│   │   └── ErrorBoundary.jsx    # 에러 경계
│   │
│   ├── managers/                # 비즈니스 로직
│   │   ├── recommendationManager.js  # AI 추천 로직
│   │   ├── menuDetailManager.js      # 메뉴 상세 정보
│   │   ├── historyManager.js         # 조회 이력 관리
│   │   ├── favoritesManager.js       # 즐겨찾기 관리
│   │   ├── searchManager.js          # 검색 기능
│   │   ├── shareManager.js           # 공유 기능
│   │   └── themeManager.js           # 테마 관리
│   │
│   ├── utils/                   # 유틸리티
│   │   ├── menuData.js          # 기본 메뉴 데이터
│   │   ├── config.js            # 설정 및 로거
│   │   ├── dataValidator.js     # 데이터 검증
│   │   ├── kakaoMapUtils.js     # 카카오맵 유틸
│   │   ├── mapMarkerManager.js  # 마커 관리
│   │   ├── timeBasedRecommendation.js # 시간대 추천
│   │   └── serviceWorker.js     # PWA 서비스 워커
│   │
│   └── styles/                  # CSS 스타일
│       ├── variables.css        # CSS 변수
│       ├── animations.css       # 애니메이션
│       └── responsive.css       # 반응형 디자인
│
├── public/                      # 정적 자산
│   ├── favicon.ico
│   ├── manifest.json           # PWA 설정
│   └── robots.txt
│
├── docs/                        # 📌 문서
│   ├── SHARE_SYSTEM.md         # 공유 시스템
│   ├── THEME_SYSTEM.md         # 테마 시스템
│   ├── SEARCH_AND_HISTORY.md   # 검색 및 이력
│   ├── KAKAO_MAPS_INTEGRATION.md # 카카오맵
│   ├── MENU_DETAILS.md         # 메뉴 상세정보
│   └── DATA_MANAGEMENT.md      # 데이터 관리
│
├── package.json                # 프로젝트 설정
├── vite.config.js             # Vite 설정
├── .gitignore                 # Git 무시 파일
├── README.md                  # 프로젝트 소개
├── GETTING_STARTED.md         # 📌 이 파일
├── CLOUDFLARE_SETUP.md        # 📌 Cloudflare 배포
│
└── cloudflared-config.yml     # Cloudflare 터널 설정
```

### 주요 파일 설명

| 파일/폴더 | 설명 |
|----------|------|
| `hooks/` | Custom React Hooks - 로직을 컴포넌트에서 분리 |
| `managers/` | 비즈니스 로직 - 데이터 처리 및 알고리즘 |
| `utils/` | 유틸리티 함수 및 설정 |
| `App.jsx` | 메인 컴포넌트 - UI 조직화 |
| `vite.config.js` | 빌드 도구 설정 |
| `package.json` | 프로젝트 메타데이터 및 스크립트 |

---

## 🎯 주요 기능

### 1. 메뉴 추천 (🎲 랜덤 추천)

**기능:**
- 5가지 카테고리 (한식, 중식, 일식, 양식, 분식)
- 랜덤 메뉴 추천 (스피닝 애니메이션)
- 카테고리별 특화 추천

**코드 위치:** `hooks/useSpinningAnimation.js`

### 2. 주변 식당 검색 (🗺️ Kakao Maps)

**기능:**
- 현재 위치 기반 검색
- 거리순 정렬
- 식당 상세 정보 조회

**코드 위치:** `hooks/useKakaoMap.js`, `utils/mapMarkerManager.js`

### 3. AI 기반 추천 (💡 AI 추천)

**전략:**
1. 사용자 프로필 분석 (선호도, 검색 패턴)
2. 카테고리별 추천 (40%)
3. 새 메뉴 추천 (35%)
4. 시간대 기반 추천 (25%)

**코드 위치:** `managers/recommendationManager.js`

### 4. 메뉴 관리 (⚙️ 메뉴 관리)

**기능:**
- 메뉴 추가/삭제/수정
- 메뉴 영양정보 관리
- 로컬스토리지에 저장

**코드 위치:** `components/MenuManager.jsx`, `managers/menuDetailManager.js`

### 5. 메뉴 검색 (🔍 검색)

**기능:**
- 메뉴명으로 검색
- 최근 검색어 저장
- 검색 이력 추적

**코드 위치:** `components/MenuSearch.jsx`, `managers/searchManager.js`

### 6. 테마 관리 (🌙 다크모드)

**기능:**
- 라이트/다크 모드 전환
- 사용자 선호도 저장
- 시스템 테마 감지

**코드 위치:** `managers/themeManager.js`, `App.css`

### 7. 메뉴 공유 (📤 공유)

**기능:**
- 웹 공유 API 사용
- URL 파라미터로 메뉴 공유
- 클립보드 복사

**코드 위치:** `managers/shareManager.js`

---

## 📚 개발 가이드

### 새로운 Hook 추가

예: 새로운 기능을 위한 커스텀 훅 작성

**파일:** `src/hooks/useMyFeature.js`

```javascript
import { useState, useEffect } from 'react'
import { logger } from '../config.js'

/**
 * useMyFeature - 새로운 기능 관리 훅
 * @returns {Object} 기능 객체
 */
export function useMyFeature() {
  const [state, setState] = useState(null)

  useEffect(() => {
    logger.debug('기능 초기화')
    // 초기화 로직
  }, [])

  return {
    state,
    // 기능 함수들
  }
}
```

**App.jsx에서 사용:**

```javascript
import { useMyFeature } from './hooks/useMyFeature'

function App() {
  const { state } = useMyFeature()
  
  return (
    <div>
      {/* UI */}
    </div>
  )
}
```

### 새로운 Manager 추가

예: 새로운 데이터 관리 로직

**파일:** `src/managers/myManager.js`

```javascript
/**
 * MyManager - 새로운 기능 관리
 */

/**
 * 데이터 로드
 * @returns {Array} 데이터 배열
 */
export function loadData() {
  try {
    const data = localStorage.getItem('my_data_key')
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('데이터 로드 실패', error)
    return []
  }
}

/**
 * 데이터 저장
 * @param {Array} data - 저장할 데이터
 */
export function saveData(data) {
  try {
    localStorage.setItem('my_data_key', JSON.stringify(data))
  } catch (error) {
    console.error('데이터 저장 실패', error)
  }
}

export default {
  loadData,
  saveData
}
```

### 스타일 추가

**전역 스타일:** `src/index.css`

```css
/* 전역 변수 */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --spacing-unit: 8px;
}

/* 공통 클래스 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-unit) * 2;
}
```

**컴포넌트 스타일:** `src/App.css`

```css
.my-component {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.my-component:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
```

### 성능 최적화

**메모이제이션:**

```javascript
import { useMemo, useCallback } from 'react'

function MyComponent({ data }) {
  // 계산 결과 캐싱
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: true
    }))
  }, [data])

  // 함수 메모이제이션
  const handleClick = useCallback(() => {
    // 핸들러 로직
  }, [])

  return <div>{/* UI */}</div>
}
```

---

## 🚀 배포 가이드

### 프로덕션 빌드

```powershell
npm run build
```

**출력:**

```
dist/
├── index.html
├── assets/
│   ├── index-xxxxx.js      # 번들된 JavaScript
│   └── index-xxxxx.css     # 번들된 CSS
└── ...
```

**빌드 크기 확인:**

```powershell
npm run build -- --analyze  # 번들 크기 분석
```

### Cloudflare에 배포

**상세 가이드:** [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) 참고

**빠른 배포:**

```powershell
# 1. 프로덕션 빌드
npm run build

# 2. 개발 서버 실행 (빌드된 파일 제공)
npm run preview

# 3. 터널 시작 (다른 터미널에서)
.\cloudflared.exe tunnel --config cloudflared-config.yml run lunch-tunnel

# 4. 브라우저에서 확인
# https://lunch.stormbug.site
```

### 환경 변수 설정

**파일:** `.env` (생성)

```
VITE_API_KEY=your_api_key_here
VITE_KAKAO_API_KEY=your_kakao_key_here
VITE_CLOUDFLARE_ZONE_ID=your_zone_id
```

**사용:**

```javascript
const API_KEY = import.meta.env.VITE_API_KEY
```

---

## 🐛 문제 해결

### npm install 실패

**증상:** `npm ERR! code ERESOLVE`

**해결:**

```powershell
npm install --legacy-peer-deps
```

### Vite 서버 포트 이미 사용 중

**증상:** `listen EADDRINUSE: address already in use :::8888`

**해결:**

```powershell
# 포트 사용 프로세스 확인
netstat -ano | findstr :8888

# 프로세스 종료 (PID 찾아서)
taskkill /PID <PID> /F
```

### Kakao Maps API 로드 실패

**증상:** 지도가 표시되지 않음

**확인:**

1. `config.js`에서 API 키 확인
2. Kakao 개발자 센터에서 도메인 등록 확인
3. 브라우저 콘솔 오류 메시지 확인

**해결:**

```javascript
// config.js
export const KAKAO_API_KEY = 'your_actual_api_key_here'
```

### localStorage 오류

**증상:** `QuotaExceededError`

**해결:** 브라우저의 개발 도구 → Application → Storage → Clear

### 자체 서명 인증서 경고

**증상:** 브라우저에서 경고 표시

**무시해도 됩니다.** 개발 환경에서는 정상입니다.

**수정 (프로덕션):** Cloudflare HTTPS 사용 (자동으로 해결됨)

---

## 📖 추가 리소스

### 공식 문서

| 항목 | 링크 |
|------|------|
| React | https://react.dev |
| Vite | https://vitejs.dev |
| Kakao Maps | https://apis.map.kakao.com |
| Cloudflare Tunnel | https://developers.cloudflare.com/cloudflare-one/connections/connect-apps |

### 프로젝트 문서

| 문서 | 설명 |
|------|------|
| [README.md](./README.md) | 프로젝트 개요 및 기능 |
| [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) | 배포 및 Cloudflare 설정 |
| [SHARE_SYSTEM.md](./docs/SHARE_SYSTEM.md) | 공유 시스템 상세 |
| [THEME_SYSTEM.md](./docs/THEME_SYSTEM.md) | 테마 시스템 상세 |
| [KAKAO_MAPS_INTEGRATION.md](./docs/KAKAO_MAPS_INTEGRATION.md) | 카카오맵 통합 상세 |

---

## ✅ 체크리스트

**처음 시작할 때:**

- [ ] Node.js & npm 설치
- [ ] 프로젝트 클론/다운로드
- [ ] `npm install` 실행
- [ ] `npm run dev` 실행
- [ ] 브라우저에서 `https://localhost:8888` 확인

**개발할 때:**

- [ ] 기능 구현
- [ ] 스타일 추가
- [ ] 테스트 (F12 개발 도구)
- [ ] 커밋 및 푸시

**배포할 때:**

- [ ] `npm run build` 실행
- [ ] `npm run preview`로 테스트
- [ ] Cloudflare 터널 시작
- [ ] `https://lunch.stormbug.site` 접속 확인
- [ ] 모바일에서도 테스트

---

## 🆘 도움말

### 문제가 발생했나요?

1. **로그 확인:** 브라우저 콘솔 (F12) 확인
2. **이 문서 검색:** Ctrl+F로 증상 검색
3. **GitHub Issues:** 문제 보고
4. **Cloudflare 대시보드:** 배포 이슈 확인

### 기여하고 싶나요?

1. Fork 프로젝트
2. Feature 브랜치 생성
3. 변경 사항 커밋
4. Pull Request 제출

---

**Happy coding! 🎉**

마지막으로 [README.md](./README.md)를 읽고 프로젝트의 전체 개요를 확인하세요.
