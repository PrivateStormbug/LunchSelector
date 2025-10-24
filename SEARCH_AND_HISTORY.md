# 검색 및 이력 관리 시스템

## 개요

LunchSelector의 검색 및 이력 시스템은 사용자가 메뉴를 효율적으로 찾고, 추천 이력을 추적하며, 사용 통계를 분석할 수 있도록 지원합니다. 자동완성, 필터링, 검색 기록, 추천 이력 관리, 상세 통계 분석 기능을 제공합니다.

## 주요 모듈

### 1. 검색 시스템 (Search Manager)

#### 모든 메뉴 조회
```javascript
getAllMenus()
```
- 모든 카테고리의 메뉴를 평탄한 배열로 반환
- 반환: `Array<{ category, menu, detail }>`
- 상세 정보 포함 (칼로리, 가격, 태그 등)

#### 메뉴 검색
```javascript
searchMenus(query, filters)
```
- 매개변수:
  - `query` (string): 검색어
  - `filters` (object): 필터 옵션
    - `category`: 특정 카테고리 필터
    - `tags`: 태그 배열로 AND 필터
- 반환: 검색 결과 배열
- 동작:
  1. 카테고리 필터 적용
  2. 태그 필터 적용 (모든 선택 태그 필수)
  3. 검색어로 메뉴명, 설명, 태그 검색
  4. 일치도에 따라 순위 정렬

#### 자동완성 제안
```javascript
getAutocompleteSuggestions(query, limit)
```
- 매개변수:
  - `query` (string): 검색어
  - `limit` (number): 최대 제안 개수 (기본값: 8)
- 반환: `Array<{ text, type, category?, menu?, score }>`
- 제안 유형:
  - `menu`: 메뉴 이름 일치
  - `tag`: 태그 일치
  - `category`: 카테고리 일치
- 점수 계산:
  - 정확 일치: 1000
  - 앞에서 시작: 500 + (길이 보정)
  - 단어 시작: 300
  - 포함: 100 + (위치 보정)

#### 사용 가능한 태그 조회
```javascript
getAllAvailableTags()
```
- 반환: 정렬된 태그 배열
- 사용처: 필터 UI에서 태그 목록 표시

#### 메뉴 보기 기록
```javascript
recordMenuView(category, menu)
```
- 사용자가 메뉴 상세 정보를 볼 때 자동 호출
- localStorage: `lunch_selector_viewed_menus`
- 최대 50개 기록 유지

#### 추천 메뉴 조회
```javascript
getRecommendedMenus()
```
- 사용자 보기 기록 기반 추천
- 최근 본 메뉴의 같은 카테고리 우선 추천
- 기록이 없으면 랜덤 5개

### 2. 검색 기록 관리

#### 검색어 기록
```javascript
recordSearchHistory(query)
```
- 검색 시마다 자동 호출
- localStorage: `lunch_selector_search_history`
- 중복 제거: 이미 있으면 맨 앞으로 이동
- 최대 20개 기록 유지

#### 검색 기록 조회
```javascript
getSearchHistory()
```
- 반환: 최근 순으로 정렬된 검색어 배열
- 사용처: 검색 입력 필드 아래 최근 검색 표시

#### 검색 기록 초기화
```javascript
clearSearchHistory()
```
- 모든 검색 기록 삭제

### 3. 추천 이력 관리 (History Manager)

#### 이력 항목 추가
```javascript
addToHistory(category, menu)
```
- 메뉴 선택 시 자동 호출
- 데이터 구조:
```javascript
{
  id: "timestamp-random",
  category: "한식",
  menu: "김밥",
  timestamp: "2025-10-24T10:30:00Z",
  date: "2025. 10. 24.",
  time: "10:30:00"
}
```
- localStorage: `lunch_selector_recommendations` (APP_CONFIG 참고)
- 최대 500개 유지

#### 전체 이력 조회
```javascript
getHistory()
```
- 반환: 최신순 정렬된 모든 이력
- 캐싱 미적용 (매번 localStorage에서 읽음)

#### 기간별 이력 조회
```javascript
getHistoryByDateRange(startDate, endDate)
```
- 매개변수: "YYYY-MM-DD" 형식
- 반환: 해당 기간의 이력 배열

#### 주별/월별 이력 조회
```javascript
getThisWeekHistory()
getThisMonthHistory()
```
- 반환: 현재 주/월의 이력

#### 카테고리별 이력 조회
```javascript
getHistoryByCategory(category)
```
- 특정 카테고리의 선택 이력만 반환

#### 메뉴별 선택 횟수
```javascript
getMenuCount(menu)
```
- 특정 메뉴를 선택한 횟수 반환

#### 이력 항목 삭제
```javascript
deleteHistoryItem(id)
```
- 특정 항목만 삭제

#### 전체 이력 삭제
```javascript
clearHistory()
```
- 모든 이력 삭제 (복구 불가)

#### 오래된 이력 정리
```javascript
cleanupOldHistory(days)
```
- 매개변수: 기준 일수 (기본값: 30)
- 예: `cleanupOldHistory(30)` → 30일 이상 전 데이터 삭제
- 반환: 삭제된 항목 수

### 4. 통계 분석 (Statistics)

#### 통계 생성
```javascript
getStatistics()
```
- 반환:
```javascript
{
  total: {
    recommendations: 150,          // 총 추천 수
    uniqueMenus: 45,              // 중복 제외 메뉴 수
    uniqueCategories: 5,          // 사용한 카테고리 수
    mostPickedMenu: "김밥",       // 가장 많이 선택된 메뉴
    mostPickedCategory: "한식"    // 가장 많이 선택된 카테고리
  },
  thisWeek: {
    recommendations: 20,
    uniqueMenus: 15,
    mostPickedMenu: "비빔밥"
  },
  thisMonth: {
    recommendations: 80,
    uniqueMenus: 35,
    mostPickedMenu: "김밥"
  },
  categoryBreakdown: {
    "한식": 70,
    "양식": 40,
    "중식": 30,
    "일식": 20,
    "분식": 10
  }
}
```

## 데이터 저장소

### LocalStorage 키

| 키 | 설명 | 최대 크기 |
|---|------|---------|
| `lunch_selector_recommendations` | 추천 이력 | 500개 항목 |
| `lunch_selector_search_history` | 검색 기록 | 20개 항목 |
| `lunch_selector_viewed_menus` | 메뉴 보기 기록 | 50개 항목 |

### 데이터 구조

**이력 항목**
```javascript
{
  id: "1729000000000-0.123456",
  category: "한식",
  menu: "김밥",
  timestamp: "2025-10-24T10:30:00.000Z",
  date: "2025. 10. 24.",
  time: "10:30:00"
}
```

**검색 기록**
```javascript
["김밥", "비빔밥", "우동", ...]
```

**보기 기록**
```javascript
[
  {
    category: "한식",
    menu: "김밥",
    timestamp: 1729000000000
  },
  ...
]
```

## 사용 예시

### 메뉴 검색
```javascript
import { searchMenus, recordSearchHistory } from './searchManager'

// 검색
const results = searchMenus('김', {
  category: '한식',
  tags: ['밥']
});

// 검색 기록
recordSearchHistory('김');
```

### 자동완성
```javascript
import { getAutocompleteSuggestions } from './searchManager'

const suggestions = getAutocompleteSuggestions('김', 8);
// [
//   { text: '김밥', type: 'menu', category: '한식', score: 500 },
//   { text: '김치', type: 'menu', category: '한식', score: 480 },
//   ...
// ]
```

### 메뉴 선택 기록
```javascript
import { addToHistory, recordMenuView } from './historyManager'
import { recordMenuView as recordView } from './searchManager'

// 메뉴 상세 보기
recordView('한식', '김밥');

// 메뉴 선택 (추천 적용)
addToHistory('한식', '김밥');
```

### 통계 조회
```javascript
import { getStatistics } from './historyManager'

const stats = getStatistics();
console.log(`이번 주 추천: ${stats.thisWeek.recommendations}개`);
console.log(`가장 인기: ${stats.total.mostPickedMenu}`);
console.log(`카테고리별:`, stats.categoryBreakdown);
```

### 데이터 내보내기/가져오기
```javascript
import { 
  exportHistoryAsJSON, 
  importHistoryFromJSON 
} from './historyManager'

// 내보내기
const jsonData = exportHistoryAsJSON();
// localStorage에 저장하거나 다운로드

// 가져오기 (다른 기기에서)
const success = importHistoryFromJSON(jsonData);
```

## 성능 고려사항

### 최적화 전략
1. **localStorage 접근 최소화**: 필요할 때만 읽음
2. **배열 크기 제한**: 최대 크기 초과 시 가장 오래된 항목 제거
3. **중복 제거**: Set 사용으로 메모리 효율성 확보
4. **캐싱 미적용**: 항상 최신 데이터 보장

### 대규모 이력 처리
- 500개 항목 기준 메모리: ~100KB
- 검색 성능: O(n) - 선형 검색
- 필터링 성능: O(n) - 다중 필터도 O(n)

## 보안 및 개인정보

- 모든 데이터는 **localStorage에 저장** (로컬 전용)
- 서버 전송 전에 사용자 동의 필수
- 민감한 정보 (비밀번호 등) 절대 저장 금지
- 데이터 내보내기 시 암호화 권장

## 마이그레이션 및 데이터 관리

### 데이터 백업
```javascript
const backup = exportHistoryAsJSON();
// 파일로 저장하거나 클라우드 동기화
```

### 데이터 복원
```javascript
const jsonData = // 백업 파일 또는 클라우드에서 로드
importHistoryFromJSON(jsonData);
```

### 정기 정리
```javascript
// 매달 1일에 30일 이상 전 데이터 삭제
cleanupOldHistory(30);
```

## 향후 개선 사항

1. **클라우드 동기화**: 여러 기기 간 이력 공유
2. **AI 분석**: 선호도 패턴 분석 및 고급 추천
3. **소셜 기능**: 친구와 이력 비교
4. **음성 검색**: 음성 입력 지원
5. **필터 저장**: 자주 사용하는 필터 프리셋
6. **검색 분석**: 검색어 트렌드 분석
7. **고급 통계**: 주간/월간 추이 그래프
