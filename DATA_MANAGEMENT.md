# 데이터 관리 시스템 (Data Management System)

## 개요

LunchSelector의 데이터 관리 시스템은 localStorage를 활용하여 사용자 데이터를 로컬에 저장하고 관리합니다. 메뉴 정보, 이력, 설정, 테마 등 다양한 데이터를 효율적으로 저장하고 검증합니다.

## 저장소 구조

### LocalStorage 키 맵핑

| 기능 | 저장소 키 | 용도 | 최대 크기 |
|------|----------|------|---------|
| 메뉴 정보 | `lunch_selector_menu_details` | 커스텀 메뉴 정보 | - |
| 추천 이력 | `lunch_selector_recommendations` | 메뉴 선택 이력 | 100개 항목 |
| 검색 기록 | `lunch_selector_search_history` | 최근 검색어 | 20개 항목 |
| 보기 기록 | `lunch_selector_viewed_menus` | 본 메뉴 기록 | 50개 항목 |
| 공유 통계 | `lunch_selector_share_stats` | 공유 기록 | 100개 항목 |
| 테마 설정 | `lunch_selector_theme` | 라이트/다크 모드 | 단일 값 |
| 설정 | `lunch_selector_settings` | 앱 사용자 설정 | - |
| 즐겨찾기 | `lunch_selector_favorites` | 자주 먹는 메뉴 | - |

### 저장소 용량 기준

```
총 저장 가능 공간: 5-10MB (브라우저 의존)
현재 사용량: 약 500KB (기본값)
남은 공간: 약 4.5-9.5MB (충분함)

각 항목별 크기:
- 메뉴 1개: 약 500B
- 이력 1개: 약 200B
- 검색어 1개: 약 100B
- 공유 기록 1개: 약 100B
- 테마: 약 10B
```

## 데이터 스키마

### 메뉴 정보 (Menu Details)
```javascript
// Key: "한식||김밥"
{
  category: "한식",
  menu: "김밥",
  calories: 380,
  protein: 14,
  carbs: 62,
  fat: 8,
  price: 5000,
  description: "밥에 여러 재료를 싸서 굴린 음식",
  servingSize: "1회 (5줄)",
  nutrition: "밥, 계란, 당근, 시금치, 고추, 참기름",
  spiceLevel: 1,
  tags: ["휴대용", "저칼로리"],
  preparationTime: 10,
  addedAt: 1729000000000,  // 커스텀 추가 시간
  updatedAt: 1729000000000 // 수정 시간
}
```

### 추천 이력 (Recommendation History)
```javascript
// Array
[
  {
    id: "1729000000000-0.123456",
    category: "한식",
    menu: "김밥",
    timestamp: "2025-10-24T10:30:00.000Z",
    date: "2025. 10. 24.",
    time: "10:30:00"
  },
  // ... 최대 100개
]
```

### 검색 기록 (Search History)
```javascript
// Array
[
  "김밥",
  "비빔밥",
  "우동",
  // ... 최대 20개
]
```

### 보기 기록 (Viewed Menus)
```javascript
// Array
[
  {
    category: "한식",
    menu: "김밥",
    timestamp: 1729000000000
  },
  // ... 최대 50개
]
```

### 공유 통계 (Share Statistics)
```javascript
{
  "web_share": {
    count: 5,
    items: [
      {
        menu: "김밥",
        category: "한식",
        timestamp: 1729000000000
      }
    ]
  },
  "facebook": {
    count: 3,
    items: [...]
  },
  // ... 다른 공유 방식들
}
```

### 테마 설정 (Theme)
```javascript
"light"  // 또는 "dark"
```

### 설정 (Settings)
```javascript
{
  theme: "light",
  language: "ko",
  notifications: true,
  autoplay: true,
  fontSize: "medium",
  // ... 기타 사용자 설정
}
```

### 즐겨찾기 (Favorites)
```javascript
// Array
[
  {
    category: "한식",
    menu: "김밥",
    addedAt: 1729000000000,
    frequency: 5  // 선택 횟수
  },
  // ... 즐겨찾기 메뉴들
]
```

## 데이터 접근 패턴

### 설정 조회
```javascript
const CONFIG = {
  storage: {
    menuKey: 'lunchSelector_customMenus',
    historyKey: 'lunchSelector_history',
    favoritesKey: 'lunchSelector_favorites',
    settingsKey: 'lunchSelector_settings',
    themeKey: 'lunchSelector_theme'
  },
  
  limits: {
    maxMenusPerCategory: 100,
    maxMenuLength: 50,
    maxHistoryItems: 100,
    maxMenuNameInput: 50
  }
}
```

### 데이터 쓰기 패턴
```javascript
// 1. 기존 데이터 읽기
const existing = JSON.parse(
  localStorage.getItem(key) || '[]'
);

// 2. 새 항목 추가
existing.push(newItem);

// 3. 크기 제한 적용
if (existing.length > limit) {
  existing.shift();  // 가장 오래된 항목 제거
}

// 4. 저장
localStorage.setItem(key, JSON.stringify(existing));
```

### 데이터 읽기 패턴
```javascript
try {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
} catch (error) {
  logger.error('데이터 읽기 실패', error);
  return defaultValue;  // 안전한 폴백
}
```

## 데이터 검증

### 입력 검증

| 필드 | 검증 규칙 | 예시 |
|------|---------|------|
| `category` | 필수, 1-50자 | "한식" |
| `menu` | 필수, 1-50자 | "김밥" |
| `calories` | 0-9999, 숫자 | 380 |
| `price` | 0-999999, 숫자 | 5000 |
| `spiceLevel` | 1-5, 정수 | 2 |
| `tags` | 배열, 최대 5개 | ["저칼로리"] |

### 타입 검증 예시
```javascript
function validateMenuDetail(detail) {
  const errors = [];

  if (!detail.category || !detail.menu) {
    errors.push('메뉴명과 카테고리는 필수');
  }

  if (detail.calories && isNaN(detail.calories)) {
    errors.push('칼로리는 숫자여야 함');
  }

  if (detail.spiceLevel && 
      (detail.spiceLevel < 1 || detail.spiceLevel > 5)) {
    errors.push('매운 정도는 1-5 사이여야 함');
  }

  if (Array.isArray(detail.tags) && detail.tags.length > 5) {
    errors.push('태그는 최대 5개까지만 가능');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

## 데이터 정리 및 유지보수

### 정기적 정리 작업

```javascript
// 1. 오래된 이력 정리 (30일 이상)
cleanupOldHistory(30)

// 2. 초과 데이터 제거
pruneData(key, limit)

// 3. 무효한 데이터 정리
validateAndRepair()
```

### 자동 유지보수
```javascript
// 앱 시작 시 실행
function initializeDataManagement() {
  // 1. 저장소 상태 확인
  checkStorageStatus()
  
  // 2. 데이터 무결성 검사
  validateAllData()
  
  // 3. 필요시 마이그레이션
  runMigrations()
  
  // 4. 오래된 데이터 정리
  cleanupOldData()
}
```

### 저장소 용량 모니터링
```javascript
function getStorageStatus() {
  let totalSize = 0;
  
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage.getItem(key).length;
    }
  }
  
  const usagePercent = (totalSize / 5242880) * 100;  // 5MB 기준
  
  return {
    usedBytes: totalSize,
    usedMB: (totalSize / 1024 / 1024).toFixed(2),
    usagePercent: usagePercent.toFixed(1),
    status: usagePercent > 90 ? 'critical' : 'normal'
  };
}
```

## 데이터 백업 및 복원

### 백업 생성
```javascript
function createBackup() {
  const backup = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {
      menuDetails: getAllMenuDetails(),
      history: getHistory(),
      searchHistory: getSearchHistory(),
      viewedMenus: getViewedMenus(),
      shareStats: getShareStats(),
      theme: getSavedTheme(),
      settings: getSettings(),
      favorites: getFavorites()
    }
  };
  
  return JSON.stringify(backup, null, 2);
}
```

### 백업 복원
```javascript
function restoreBackup(backupJson) {
  try {
    const backup = JSON.parse(backupJson);
    
    // 검증
    if (!backup.version || !backup.data) {
      throw new Error('유효하지 않은 백업 파일');
    }
    
    // 복원
    Object.entries(backup.data).forEach(([key, value]) => {
      if (value !== null) {
        const storageKey = getStorageKey(key);
        localStorage.setItem(storageKey, JSON.stringify(value));
      }
    });
    
    return true;
  } catch (error) {
    logger.error('백업 복원 실패', error);
    return false;
  }
}
```

## 데이터 내보내기 및 가져오기

### JSON으로 내보내기
```javascript
function exportAllData() {
  const allData = {
    exportDate: new Date().toISOString(),
    app: 'LunchSelector',
    version: '1.0.0',
    menuDetails: getAllMenuDetails(),
    history: getHistory(),
    stats: getStatistics(),
    favorites: getFavorites()
  };
  
  const json = JSON.stringify(allData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // 다운로드
  const a = document.createElement('a');
  a.href = url;
  a.download = `lunch-selector-backup-${Date.now()}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}
```

### CSV로 내보내기 (이력)
```javascript
function exportHistoryAsCSV() {
  const history = getHistory();
  
  const csv = [
    ['날짜', '시간', '카테고리', '메뉴'].join(','),
    ...history.map(h => 
      [h.date, h.time, h.category, h.menu].join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // 다운로드
  const a = document.createElement('a');
  a.href = url;
  a.download = `lunch-history-${Date.now()}.csv`;
  a.click();
  
  URL.revokeObjectURL(url);
}
```

### 파일에서 가져오기
```javascript
async function importFromFile(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // 데이터 마이그레이션
    migrateData(data);
    
    // 검증 후 저장
    if (validateImportedData(data)) {
      saveImportedData(data);
      return { success: true };
    } else {
      return { success: false, error: '유효하지 않은 데이터 형식' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## 데이터 마이그레이션

### 버전 관리
```javascript
const MIGRATION_VERSIONS = {
  '1.0': {
    from: 'initial',
    changes: ['menu_details 추가', 'share_stats 추가']
  },
  '1.1': {
    from: '1.0',
    changes: ['tags 최대 5개로 제한', 'spiceLevel 범위화']
  }
};
```

### 마이그레이션 함수
```javascript
function runMigrations() {
  const currentVersion = localStorage.getItem('data_version') || '1.0';
  
  if (currentVersion === '1.0') {
    // 1.0 → 1.1 마이그레이션
    migrateFrom1_0To1_1();
  }
  
  localStorage.setItem('data_version', CURRENT_VERSION);
}

function migrateFrom1_0To1_1() {
  // 태그 정규화
  const menuDetails = JSON.parse(
    localStorage.getItem('lunch_selector_menu_details') || '{}'
  );
  
  Object.values(menuDetails).forEach(menu => {
    if (menu.tags && menu.tags.length > 5) {
      menu.tags = menu.tags.slice(0, 5);
    }
  });
  
  localStorage.setItem(
    'lunch_selector_menu_details',
    JSON.stringify(menuDetails)
  );
}
```

## 보안 및 개인정보

### 저장된 데이터의 특성
- ✅ 로컬 저장 (서버 미전송)
- ✅ 개인식별정보 미포함
- ✅ 사용자 완전 제어

### 데이터 보호
```javascript
// 민감한 정보 처리 금지
const FORBIDDEN_DATA = [
  'password',
  'email',
  'phone',
  'address',
  'ssn',  // 주민번호
  'credit_card'
];

function validateSensitiveData(data) {
  for (const key of FORBIDDEN_DATA) {
    if (key in data) {
      throw new Error(`민감한 정보는 저장 불가: ${key}`);
    }
  }
}
```

### 데이터 삭제
```javascript
function deleteAllUserData() {
  const keys = [
    'lunch_selector_menu_details',
    'lunch_selector_recommendations',
    'lunch_selector_search_history',
    'lunch_selector_viewed_menus',
    'lunch_selector_share_stats',
    'lunch_selector_theme',
    'lunch_selector_settings',
    'lunch_selector_favorites'
  ];
  
  keys.forEach(key => localStorage.removeItem(key));
  
  logger.info('모든 사용자 데이터 삭제 완료');
}
```

## 성능 고려사항

### 접근 최적화
1. **필요할 때만 읽기**: 앱 시작 시 전체 로드 피하기
2. **배치 업데이트**: 여러 업데이트를 한 번에 처리
3. **캐싱**: 자주 읽는 데이터는 메모리 캐시

### 저장소 최적화
```javascript
// 좋은 예
const history = getHistory();  // 한 번 로드
const recent = history.slice(0, 10);  // 메모리에서 필터링

// 나쁜 예
for (let i = 0; i < 10; i++) {
  const item = getHistory()[i];  // 매번 전체 로드
}
```

## 트러블슈팅

### 데이터 손상 시
```javascript
// 1. 손상된 데이터 확인
try {
  JSON.parse(localStorage.getItem(key));
} catch {
  console.error('손상된 데이터 발견');
  localStorage.removeItem(key);  // 삭제 후 초기화
}

// 2. 백업에서 복구
if (backup.exists) {
  restoreBackup(backup.json);
}
```

### 저장소 초과 시
```javascript
// 용량 확인
const status = getStorageStatus();
if (status.usagePercent > 80) {
  // 오래된 데이터 정리
  cleanupOldHistory(7);  // 7일 이상 전 데이터 삭제
  
  // 통계 압축
  compressShareStats();
  
  // 불필요한 커스텀 메뉴 삭제
  pruneUnusedMenus();
}
```

## 향후 개선 사항

1. **암호화**: 민감한 데이터 암호화 저장
2. **IndexedDB**: localStorage 용량 한계 극복
3. **클라우드 동기화**: 여러 기기 간 데이터 동기화
4. **버전 관리**: 더욱 강화된 마이그레이션 시스템
5. **감사 로그**: 데이터 변경 이력 추적
6. **자동 백업**: 주기적 자동 백업
7. **데이터 분석**: 개인정보 미포함 통계 분석
8. **동의 관리**: GDPR 준수 데이터 관리
