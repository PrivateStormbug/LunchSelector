# 테마 시스템 (Theme System)

## 개요

LunchSelector의 테마 시스템은 사용자의 라이트/다크 모드 선호도를 관리합니다. 사용자 선택을 localStorage에 저장하고, CSS 변수를 통해 동적으로 테마를 적용하여 부드러운 테마 전환을 제공합니다.

## 주요 기능

### 1. 테마 조회

#### 시스템 기본 테마 감지
```javascript
getSystemTheme()
```
- 기본값: `'light'` (라이트 모드)
- 현재 구현에서는 항상 라이트 모드를 기본값으로 설정
- 향후 OS 설정 감지로 확장 가능

#### 저장된 테마 가져오기
```javascript
getSavedTheme()
```
- localStorage에서 사용자 저장 테마 조회
- 없으면 `null` 반환
- localStorage 키: `lunch_selector_theme`

#### 현재 테마 가져오기
```javascript
getCurrentTheme()
```
- 우선순위:
  1. 사용자 저장 설정 (if 있음)
  2. 시스템 기본값
- 반환: `'light'` 또는 `'dark'`

### 2. 테마 적용

#### 테마 적용
```javascript
applyTheme(theme)
```
- 매개변수: `'light'` 또는 `'dark'`
- 동작:
  1. CSS 변수 설정 (색상 변수 모두 업데이트)
  2. 다크모드 클래스 추가/제거 (`dark-mode`)
  3. localStorage에 저장
- 반환: `boolean` (성공 여부)

#### 테마 토글
```javascript
toggleTheme()
```
- 현재 테마 자동 감지 후 반대 테마로 전환
- 예: 라이트 → 다크, 다크 → 라이트
- 반환: 변경된 테마 문자열

#### 특정 테마로 설정
```javascript
setTheme(theme)
```
- `applyTheme()`의 래퍼
- 특정 테마로 강제 설정

#### 다크모드 여부 확인
```javascript
isDarkMode()
```
- 반환: `boolean` (다크모드 사용 중 여부)

### 3. 테마 관리

#### 시스템 기본값으로 초기화
```javascript
resetToSystemTheme()
```
- 사용자 저장 설정 제거
- 시스템 기본값(라이트)으로 복원
- localStorage에서 설정 삭제

#### 테마 정보 조회
```javascript
getThemeInfo(theme)
```
- 특정 테마의 상세 정보 반환
- 기본값: 현재 적용된 테마
- 반환:
```javascript
{
  name: 'light',
  label: '라이트 모드',
  emoji: '☀️',
  colors: {
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#1a1a1a',
    // ... 모든 색상 변수
  }
}
```

#### 사용 가능한 테마 목록
```javascript
getAvailableThemes()
```
- 반환: 테마 배열
```javascript
[
  { value: 'light', label: '라이트 모드', emoji: '☀️' },
  { value: 'dark', label: '다크 모드', emoji: '🌙' }
]
```

### 4. 시스템 테마 변경 감지

#### 리스너 설정
```javascript
onSystemThemeChange(callback)
```
- 시스템 테마 변경 감지 리스너 등록
- 사용자가 명시적 설정을 하지 않았을 때만 자동 전환
- 매개변수: `callback(newTheme)` 콜백 함수
- 반환: 리스너 제거 함수
- 구현: `matchMedia('(prefers-color-scheme: dark)')` 사용

#### 앱 초기화
```javascript
initializeTheme()
```
- 앱 시작 시 호출
- 저장된 또는 시스템 기본 테마 적용
- React의 `useEffect`에서 호출하면 좋음

## 테마 정의

### 라이트 모드 (Light)
```javascript
{
  name: 'light',
  label: '라이트 모드',
  emoji: '☀️',
  colors: {
    background: '#ffffff',      // 배경색
    surface: '#f5f5f5',          // 표면 (카드 등)
    text: '#1a1a1a',             // 주 텍스트
    textSecondary: '#666666',    // 보조 텍스트
    primary: '#667eea',          // 주 색상 (파랑)
    secondary: '#764ba2',        // 보조 색상 (보라)
    border: '#e0e0e0',           // 테두리
    shadowLight: 'rgba(0, 0, 0, 0.05)',
    shadowMedium: 'rgba(0, 0, 0, 0.1)',
    shadowHeavy: 'rgba(0, 0, 0, 0.15)'
  }
}
```

### 다크 모드 (Dark)
```javascript
{
  name: 'dark',
  label: '다크 모드',
  emoji: '🌙',
  colors: {
    background: '#1a1a1a',       // 배경색 (어두움)
    surface: '#2d2d2d',          // 표면 (더 어두움)
    text: '#ffffff',             // 주 텍스트 (밝음)
    textSecondary: '#b0b0b0',    // 보조 텍스트
    primary: '#7c8ff5',          // 주 색상 (밝은 파랑)
    secondary: '#9b7dcf',        // 보조 색상 (밝은 보라)
    border: '#3d3d3d',           // 테두리 (어두운 회색)
    shadowLight: 'rgba(0, 0, 0, 0.2)',
    shadowMedium: 'rgba(0, 0, 0, 0.4)',
    shadowHeavy: 'rgba(0, 0, 0, 0.6)'
  }
}
```

## CSS 변수 매핑

테마 색상은 다음과 같이 CSS 변수로 변환됩니다:

| JavaScript | CSS 변수 | 용도 |
|-----------|---------|------|
| `background` | `--color-background` | 페이지 배경 |
| `surface` | `--color-surface` | 카드, 컨테이너 |
| `text` | `--color-text` | 주 텍스트 |
| `textSecondary` | `--color-text-secondary` | 설명, 라벨 |
| `primary` | `--color-primary` | 버튼, 링크, 강조 |
| `secondary` | `--color-secondary` | 보조 요소 |
| `border` | `--color-border` | 테두리, 구분선 |
| `shadowLight` | `--color-shadow-light` | 미묘한 그림자 |
| `shadowMedium` | `--color-shadow-medium` | 중간 그림자 |
| `shadowHeavy` | `--color-shadow-heavy` | 강한 그림자 |

### CSS 사용 예시
```css
.my-element {
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 8px var(--color-shadow-light);
}

.dark-mode .my-element {
  /* 자동으로 다크 모드 색상 적용 */
  /* 별도 CSS 규칙 불필요 */
}
```

## 데이터 저장소

### LocalStorage 키
- **THEME_STORAGE_KEY**: `'lunch_selector_theme'`

### 저장 형식
```javascript
// localStorage.getItem('lunch_selector_theme')
"light"  // 또는 "dark"
```

## 사용 예시

### 앱 초기화 (App.jsx)
```javascript
import { initializeTheme, toggleTheme } from './themeManager'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    // 앱 시작 시 테마 초기화
    initializeTheme()
  }, [])

  const handleThemeToggle = () => {
    toggleTheme()
    // 렌더링 자동 트리거 (CSS 변수 변경)
  }

  return (
    <button onClick={handleThemeToggle}>
      🌓 테마 전환
    </button>
  )
}
```

### 테마 선택기 구현
```javascript
import { 
  setTheme, 
  getAvailableThemes, 
  getCurrentTheme 
} from './themeManager'

function ThemeSelector() {
  const themes = getAvailableThemes()
  const current = getCurrentTheme()

  return (
    <select 
      value={current}
      onChange={(e) => setTheme(e.target.value)}
    >
      {themes.map(theme => (
        <option key={theme.value} value={theme.value}>
          {theme.emoji} {theme.label}
        </option>
      ))}
    </select>
  )
}
```

### 다크모드 조건부 렌더링
```javascript
import { isDarkMode } from './themeManager'

function MyComponent() {
  const isDark = isDarkMode()

  return (
    <div style={{
      background: isDark ? '#1a1a1a' : '#ffffff',
      // 또는 CSS 변수 사용 (권장)
      background: 'var(--color-background)'
    }}>
      {isDark ? '🌙 다크 모드' : '☀️ 라이트 모드'}
    </div>
  )
}
```

## CSS 구현 패턴

### 권장: CSS 변수 사용 (자동)
```css
/* 라이트 모드 */
html:not(.dark-mode) {
  --color-background: #ffffff;
  --color-text: #1a1a1a;
  /* ... */
}

/* 다크 모드 */
html.dark-mode {
  --color-background: #1a1a1a;
  --color-text: #ffffff;
  /* ... */
}

/* 모든 요소에서 사용 */
body {
  background-color: var(--color-background);
  color: var(--color-text);
}
```

### 비권장: 조건부 CSS (수동 관리)
```css
/* 각 요소마다 다크모드 규칙을 별도로 작성해야 함 */
.button { background: #667eea; }
.dark-mode .button { background: #7c8ff5; }
```

## 성능 최적화

### 장점
1. **CSS 변수**: 브라우저가 효율적으로 처리
2. **리플로우 최소화**: 필요한 요소만 업데이트
3. **저장소 활용**: 사용자 선호도 자동 저장
4. **폴백 지원**: 미지원 브라우저도 대응 가능

### 최적화 전략
1. CSS 변수는 `documentElement`에만 적용 (캐스케이드)
2. 색상 변수는 RGB 값이 아닌 Hex 또는 CSS 함수 사용
3. 테마 적용 시 리플로우 트리거 최소화

## 보안 및 접근성

### 접근성
- **명확한 라벨**: 각 테마에 이모지 포함
- **충분한 명도 대비**: WCAG AA 기준 충족
- **사용자 선택 존중**: 시스템 설정을 무시하지 않음

### 보안
- 테마 정보는 클라이언트만 저장
- 민감한 정보 포함 없음
- localStorage 접근 제한 정책 준수

## 트러블슈팅

### 테마가 적용되지 않음
```javascript
// 1. 앱 초기화 확인
initializeTheme()

// 2. CSS 변수 사용 확인
console.log(getComputedStyle(document.documentElement)
  .getPropertyValue('--color-background'))

// 3. 클래스 적용 확인
console.log(document.documentElement.classList)
```

### 깜빡임 현상 (Flash)
```javascript
// React에서 초기 로드 시 깜빡임 방지
useEffect(() => {
  // 동기적으로 테마 로드
  const theme = getSavedTheme() || 'light'
  applyTheme(theme)
}, [])
```

### 시스템 테마 감지 미작동
```javascript
// matchMedia 지원 확인
if (window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  console.log('다크모드 선호:', mediaQuery.matches)
}
```

## 향후 개선 사항

1. **사용자 정의 테마**: 색상 커스터마이징 기능
2. **자동 전환**: 시간대별 자동 테마 전환 (일출/일몰)
3. **고대비 모드**: WCAG AAA 준수 옵션
4. **색맹 모드**: 색각 이상자 고려 팔레트
5. **클라우드 동기화**: 사용자 계정과 테마 설정 동기화
6. **테마 애니메이션**: 부드러운 색상 전환 효과
7. **이모지 관리**: 테마별 다양한 이모지 옵션
8. **글꼴 크기**: 테마와 함께 글꼴 크기도 조정
