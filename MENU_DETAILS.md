# 메뉴 상세 정보 관리 시스템 (Menu Details System)

## 개요

LunchSelector의 메뉴 상세 정보 시스템은 각 메뉴의 영양 정보, 가격, 준비 시간, 태그 등 상세한 정보를 관리하고 제공합니다. 기본 데이터셋과 사용자 정의 데이터를 조합하여 확장 가능한 메뉴 데이터베이스를 구성합니다.

## 주요 기능

### 1. 메뉴 상세 정보 조회

#### 단일 메뉴 정보 조회
```javascript
getMenuDetail(category, menu)
```
- 매개변수: 카테고리, 메뉴명
- 반환: 메뉴 상세 정보 객체
- 우선순위:
  1. 사용자 커스텀 정보 (있으면 사용)
  2. 기본 데이터셋 정보
  3. 기본 구조 (정보 없을 때)

#### 메뉴 정보 구조
```javascript
{
  category: '한식',              // 카테고리
  menu: '김밥',                 // 메뉴명
  calories: 380,                // 칼로리 (kcal)
  protein: 14,                  // 단백질 (g)
  carbs: 62,                    // 탄수화물 (g)
  fat: 8,                       // 지방 (g)
  price: 5000,                  // 가격 (원)
  description: '밥에 여러...',  // 설명
  servingSize: '1회 (5줄)',     // 제공량
  nutrition: '밥, 계란, ...',   // 영양 재료
  spiceLevel: 1,                // 매운맛 정도 (1-5)
  tags: ['휴대용', '저칼로리'], // 태그 배열
  preparationTime: 10           // 준비 시간 (분)
}
```

#### 모든 메뉴 정보 조회
```javascript
getAllMenuDetails()
```
- 반환: 모든 메뉴 상세 정보 객체
- 포함: 기본 데이터 + 커스텀 데이터

### 2. 커스텀 메뉴 관리

#### 메뉴 추가
```javascript
addMenuDetail(category, menu, details)
```
- 매개변수:
  - `category` (string): 카테고리
  - `menu` (string): 메뉴명
  - `details` (object): 상세 정보
- 자동 검증:
  - 필수 필드 확인
  - 매운 정도: 1-5 범위로 정규화
  - 태그: 최대 5개 유지
- 반환: `boolean` (성공 여부)
- localStorage: `lunch_selector_menu_details`

#### 메뉴 정보 업데이트
```javascript
updateMenuDetail(category, menu, updates)
```
- 기존 정보에 새 값 병합
- 카테고리, 메뉴명은 변경 불가
- 수정 시간 자동 기록
- 반환: `boolean` (성공 여부)

#### 커스텀 정보 초기화
```javascript
clearCustomMenuDetails()
```
- 사용자 추가 데이터만 삭제
- 기본 데이터는 유지

#### 데이터 내보내기
```javascript
exportMenuDetailsAsJSON()
```
- 모든 메뉴 정보를 JSON으로 변환
- 백업 또는 이전용
- 반환: JSON 문자열

### 3. 영양 분석

#### 영양 점수 계산
```javascript
calculateNutritionScore(category, menu)
```
- 범위: 0-100점
- 계산 기준:
  - **단백질** (35% 가중치): 40g 기준
  - **지방** (20% 가중치): 10-20g 최적
  - **탄수화물** (25% 가중치): 30-70g 최적
  - **칼로리** (20% 가중치): 400-600kcal 최적
- 반환: 계산된 영양 점수 (정수)

**점수 해석:**
- 90-100: 매우 우수한 영양 가치
- 75-89: 좋은 영양 가치
- 60-74: 보통 영양 가치
- 45-59: 낮은 영양 가치
- 0-44: 매우 낮은 영양 가치

#### 영양 통계
```javascript
getNutritionStats()
```
- 반환:
```javascript
{
  totalMenus: 45,                      // 총 메뉴 수
  averageCalories: 450,                // 평균 칼로리
  averageProtein: 18,                  // 평균 단백질
  averageFat: 12,                      // 평균 지방
  averageCarbs: 58,                    // 평균 탄수화물
  highestCalories: {                   // 가장 높은 칼로리 메뉴
    menu: '스테이크',
    calories: 620
  },
  lowestCalories: {                    // 가장 낮은 칼로리 메뉴
    menu: '샐러드',
    calories: 280
  },
  categoryStats: {
    '한식': { 
      menuCount: 9, 
      avgCalories: 420, 
      avgProtein: 20 
    },
    // ... 다른 카테고리
  }
}
```

### 4. 메뉴 검색

#### 카테고리별 조회
```javascript
getMenuDetailsByCategory(category)
```
- 특정 카테고리의 모든 메뉴 반환
- 반환: 메뉴 배열

#### 칼로리 범위로 검색
```javascript
searchMenuByCalories(minCal, maxCal)
```
- 칼로리 범위 내 메뉴 검색
- 칼로리순 정렬
- 예: `searchMenuByCalories(300, 500)` → 300-500kcal 메뉴

#### 태그로 검색
```javascript
searchMenuByTag(tag)
```
- 특정 태그 포함 메뉴 검색
- 예: `searchMenuByTag('저칼로리')`
- 활용 태그:
  - `채식가능`, `영양만점`, `저칼로리`
  - `고단백`, `매운맛`, `국물`, `튀김` 등

#### 가격대로 검색
```javascript
searchMenuByPrice(minPrice, maxPrice)
```
- 가격 범위 내 메뉴 검색
- 가격순 정렬
- 예: `searchMenuByPrice(5000, 10000)`

#### 빠른 메뉴 검색
```javascript
searchFastMenus(maxTime)
```
- 준비 시간이 짧은 메뉴 검색
- 기본값: 15분 이하
- 시간순 정렬

## 기본 메뉴 데이터셋

### 한식 (5개)
| 메뉴 | 칼로리 | 가격 | 준비시간 |
|------|-------|------|---------|
| 비빔밥 | 550 | 8,000원 | 15분 |
| 김밥 | 380 | 5,000원 | 10분 |
| 된장찌개 | 320 | 7,000원 | 20분 |
| 불고기 | 480 | 12,000원 | 25분 |
| 떡볶이 | 420 | 5,500원 | 15분 |

### 중식 (5개)
| 메뉴 | 칼로리 | 가격 | 준비시간 |
|------|-------|------|---------|
| 짜장면 | 520 | 5,500원 | 12분 |
| 짬뽕 | 480 | 6,500원 | 15분 |
| 마라탕 | 380 | 8,000원 | 20분 |
| 우육면 | 550 | 7,500원 | 18분 |
| 탕수육 | 620 | 9,000원 | 25분 |

### 일식 (5개)
| 메뉴 | 칼로리 | 가격 | 준비시간 |
|------|-------|------|---------|
| 초밥 | 380 | 12,000원 | 20분 |
| 우동 | 420 | 7,000원 | 12분 |
| 돈까스 | 580 | 10,000원 | 18분 |
| 오코노미야키 | 500 | 8,500원 | 20분 |
| 카레라이스 | 520 | 8,000원 | 15분 |

### 양식 (5개)
| 메뉴 | 칼로리 | 가격 | 준비시간 |
|------|-------|------|---------|
| 파스타 | 520 | 9,500원 | 18분 |
| 스테이크 | 620 | 18,000원 | 25분 |
| 피자 | 580 | 15,000원 | 20분 |
| 샐러드 | 280 | 10,000원 | 10분 |
| 버거 | 650 | 8,000원 | 12분 |

### 분식 (5개)
| 메뉴 | 칼로리 | 가격 | 준비시간 |
|------|-------|------|---------|
| 순대 | 320 | 5,000원 | 15분 |
| 어묵 | 240 | 4,000원 | 8분 |
| 튀김 | 420 | 6,000원 | 12분 |
| 군만두 | 380 | 5,500원 | 15분 |
| 핫도그 | 480 | 4,500원 | 8분 |

## 사용 예시

### 메뉴 정보 조회
```javascript
import { getMenuDetail } from './menuDetailManager'

const detail = getMenuDetail('한식', '김밥');
console.log(`칼로리: ${detail.calories}kcal`);
console.log(`가격: ${detail.price.toLocaleString()}원`);
console.log(`태그: ${detail.tags.join(', ')}`);
```

### 커스텀 메뉴 추가
```javascript
import { addMenuDetail } from './menuDetailManager'

const success = addMenuDetail('한식', '새로운메뉴', {
  calories: 450,
  protein: 20,
  carbs: 60,
  fat: 10,
  price: 8500,
  description: '새롭게 추가된 맛있는 메뉴',
  tags: ['신메뉴', '추천'],
  preparationTime: 18
});

if (success) {
  console.log('메뉴 추가 완료');
}
```

### 영양 정보 분석
```javascript
import { calculateNutritionScore, getNutritionStats } from './menuDetailManager'

// 특정 메뉴의 영양 점수
const score = calculateNutritionScore('한식', '비빔밥');
console.log(`영양 점수: ${score}점`);

// 전체 영양 통계
const stats = getNutritionStats();
console.log(`평균 칼로리: ${stats.averageCalories}kcal`);
console.log(`가장 높은 칼로리: ${stats.highestCalories.menu}`);
```

### 메뉴 검색
```javascript
import { 
  searchMenuByCalories, 
  searchMenuByTag, 
  searchFastMenus 
} from './menuDetailManager'

// 칼로리 범위로 검색
const lightMenus = searchMenuByCalories(200, 400);
console.log(`저칼로리 메뉴 ${lightMenus.length}개`);

// 태그로 검색
const vegetarian = searchMenuByTag('채식가능');
console.log(`채식 메뉴: ${vegetarian.map(m => m.menu).join(', ')}`);

// 빠른 메뉴 검색
const fastMenus = searchFastMenus(10);
console.log(`10분 이내 준비 가능: ${fastMenus.map(m => m.menu).join(', ')}`);
```

### MenuDetailModal에서의 사용
```javascript
import { getMenuDetail, calculateNutritionScore } from './menuDetailManager'

function MenuDetailModal({ category, menu }) {
  const detail = getMenuDetail(category, menu);
  const nutritionScore = calculateNutritionScore(category, menu);

  return (
    <div>
      <h2>{detail.menu}</h2>
      <div className="nutrition-badge">{nutritionScore}점</div>
      
      <div className="nutrition-info">
        <p>칼로리: {detail.calories}kcal</p>
        <p>단백질: {detail.protein}g</p>
        <p>탄수화물: {detail.carbs}g</p>
        <p>지방: {detail.fat}g</p>
      </div>

      <div className="details">
        <p>가격: {detail.price.toLocaleString()}원</p>
        <p>준비시간: {detail.preparationTime}분</p>
        <p>제공량: {detail.servingSize}</p>
      </div>

      <div className="tags">
        {detail.tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
    </div>
  );
}
```

## 데이터 저장소

### LocalStorage 키
- **MENU_DETAILS_STORAGE_KEY**: `'lunch_selector_menu_details'`

### 저장 형식
```javascript
{
  "한식||새로운메뉴": {
    category: '한식',
    menu: '새로운메뉴',
    // ... 상세정보
    addedAt: 1729000000000,
    updatedAt: 1729000000000
  }
}
```

### 저장소 크기
- 기본 데이터: 약 50KB (25개 메뉴)
- 커스텀 데이터: 1메뉴당 약 500B
- 최대 저장 용량: localStorage 5-10MB (브라우저 의존)

## 성능 최적화

### 메모리 효율성
1. **기본 데이터셋 고정**: 앱 로드 시에만 메모리 로드
2. **커스텀 데이터 지연 로드**: 필요할 때만 localStorage에서 로드
3. **캐싱**: 같은 메뉴 조회 시 매번 재계산 (가벼운 작업이므로 문제 없음)

### 검색 성능
- **메뉴 수 기준**: 현재 25개 → O(n) 선형 검색 (매우 빠름)
- **향후 확장**: 1000개 이상 시 인덱싱 고려

### 계산 성능
- **영양 점수**: O(1) 고정 시간
- **통계 생성**: O(n) 선형 (모든 메뉴 순회)

## 영양 가이드

### 건강한 영양 균형
```
단백질: 15-35% of daily calories
지방: 20-35% (포화 <10%)
탄수화물: 45-65%
```

### 식사 기준 칼로리
- **아침**: 400-500kcal
- **점심**: 500-700kcal
- **저녁**: 400-500kcal

### 태그 활용 예시
| 태그 | 의미 | 예시 |
|------|------|------|
| `저칼로리` | 400kcal 미만 | 샐러드, 어묵 |
| `고단백` | 단백질 30g+ | 스테이크, 불고기 |
| `채식가능` | 육류 미포함/선택 | 비빔밥, 파스타 |
| `국물` | 수프/국 형태 | 된장찌개, 짬뽕 |
| `빠른조리` | 15분 이하 | 김밥, 우동 |

## 에러 처리

### 일반적인 오류

| 상황 | 해결책 |
|------|--------|
| `null` 반환 | 메뉴명 오타 확인, 기본 구조 사용 |
| JSON 파싱 오류 | localStorage 데이터 초기화 |
| 범위 검색 결과 없음 | 검색 범위 확대 |

### 안전한 사용
```javascript
// 안전한 조회
const detail = getMenuDetail(category, menu);
if (detail) {
  const score = calculateNutritionScore(category, menu);
  // 사용
} else {
  // 기본값 사용
}
```

## 데이터 마이그레이션

### 내보내기
```javascript
const json = exportMenuDetailsAsJSON();
// 파일로 저장
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// 다운로드
```

### 가져오기
```javascript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const text = await file.text();
// addMenuDetail() 사용하여 각 항목 추가
```

## 향후 개선 사항

1. **이미지 저장**: 메뉴 사진 URL/데이터
2. **평점 시스템**: 사용자 평가 저장
3. **알레르기 정보**: 알레르기 유발 물질 표시
4. **다이어트 모드**: 특정 영양 목표에 맞는 메뉴 추천
5. **음식 준비 동영상**: 조리 방법 링크
6. **식재료 정보**: 산지, 신선도 표시
7. **칼로리 계산기**: 사용자 맞춤 식사 계획
8. **데이터베이스 백엔드**: 서버에 메뉴 정보 저장
