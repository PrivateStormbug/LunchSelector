# 카카오맵 통합 (Kakao Maps Integration)

## 개요

LunchSelector는 카카오맵 API를 통해 사용자의 현재 위치 근처 음식점을 검색하고, 지도 기반의 위치 정보를 제공합니다. Promise 기반의 SDK 로드 관리와 에러 처리를 포함한 안정적인 API 래퍼를 제공합니다.

## 설정 및 초기화

### HTML에서 SDK 로드
```html
<!-- public/index.html 또는 index.html -->
<script
  type="text/javascript"
  src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_API_KEY&libraries=services"
></script>
```

### 필수 라이브러리
- `maps`: 지도 렌더링
- `services`: 장소 검색, 지오코딩 등

### Kakao API Key 획득
1. [카카오 개발자 콘솔](https://developers.kakao.com) 접속
2. 앱 생성
3. 카카오맵 API 활성화
4. JavaScript 키 발급
5. `.env` 파일에 추가:
```env
REACT_APP_KAKAO_MAP_KEY=YOUR_KAKAO_API_KEY
```

## 주요 API

### 1. SDK 로드 관리

#### SDK 로드 대기
```javascript
waitForKakaoMapsReady()
```
- Promise 기반 API
- SDK 로드 완료까지 대기
- 반복 호출 시 캐시된 Promise 반환 (성능 최적화)
- 반환: `Promise<void>`
- 타임아웃: APP_CONFIG.performance.kakaoLoadTimeout (기본 30초)

#### SDK 준비 상태 확인
```javascript
isKakaoMapsReady()
```
- 동기 함수
- Kakao Maps API 즉시 사용 가능 여부 확인
- 반환: `boolean`
- 확인 항목:
  - `window.kakao` 존재
  - `window.kakao.maps` 존재
  - `window.kakao.maps.services` 존재
  - `window.kakao.maps.services.Places` 존재

### 2. 장소 검색

#### 키워드로 장소 검색
```javascript
searchPlaces(options)
```
- 매개변수:
```javascript
{
  keyword: '음식점',           // 검색어
  searchOptions: {
    location: kakao.maps.LatLng(37.5665, 126.978),  // 중심 좌표
    radius: 1000,                                   // 검색 반경 (미터)
    size: 20                                        // 반환 결과 개수
  }
}
```
- 반환: `Promise<Array<Object>>` - 검색 결과 배열
- 결과 구조:
```javascript
[
  {
    id: "place-id",
    place_name: "음식점 이름",
    category_name: "음식 > 한식",
    phone: "010-1234-5678",
    address_name: "서울 강남구 테헤란로 123",
    road_address_name: "서울 강남구 테헤란로 123",
    x: "127.1234",         // 경도 (longitude)
    y: "37.1234",          // 위도 (latitude)
    url: "http://place.map.kakao.com/123",
    distance: "1000"       // 검색 중심점으로부터 거리 (미터)
  }
]
```
- 에러 처리:
  - `ZERO_RESULT`: 검색 결과 없음 (빈 배열 반환)
  - `ERROR_RESPONSE`: API 오류
  - `INVALID_PARAMS`: 잘못된 매개변수

### 3. 지도 관리

#### 지도 생성
```javascript
createMap(container, options)
```
- 매개변수:
  - `container` (HTMLElement): 지도를 표시할 DOM 요소
  - `options` (Object): 지도 옵션 (선택사항)
- 기본 옵션:
  - `center`: 초기 중심 좌표 (37.5665, 126.978) = 서울 광화문
  - `level`: 줌 레벨 (1~14, 기본값 3)
- 반환: Kakao Maps 지도 객체
- 요구사항: 컨테이너가 높이를 가져야 함

#### 지도 설정 예시
```javascript
const mapContainer = document.getElementById('map');
const mapOptions = {
  center: new kakao.maps.LatLng(37.5, 127.0),
  level: 5,
  mapTypeId: kakao.maps.MapTypeId.ROADMAP
};
const map = createMap(mapContainer, mapOptions);
```

#### 지도 중심 이동
```javascript
panTo(map, lat, lng, level)
```
- 매개변수:
  - `map`: 지도 객체
  - `lat` (number): 위도
  - `lng` (number): 경도
  - `level` (number, 선택사항): 줌 레벨
- 용도: 사용자 위치나 검색 결과로 지도 이동

### 4. 마커 관리

#### 마커 생성
```javascript
createMarker(options)
```
- 매개변수:
```javascript
{
  lat: 37.5665,           // 위도
  lng: 126.978,           // 경도
  map: mapObject,         // 마커를 표시할 지도
  title: '음식점 이름'    // 마커 제목
}
```
- 반환: Kakao Maps 마커 객체
- 특징: 마커 클릭 시 제목 표시

#### 마커 클릭 이벤트
```javascript
onMarkerClick(marker, callback)
```
- 매개변수:
  - `marker`: 마커 객체
  - `callback` (Function): 클릭 시 실행될 콜백
- 사용 예시:
```javascript
onMarkerClick(marker, () => {
  console.log('마커 클릭됨');
  // 상세 정보 표시 등
});
```

#### 지도에서 마커 제거
```javascript
marker.setMap(null);  // Kakao Maps API
```

#### 대량 마커 정리
```javascript
cleanupMap(markers, map)
```
- 매개변수:
  - `markers` (Array): 제거할 마커 배열
  - `map` (Object): 지도 객체 (선택사항)
- 동작: 모든 마커를 지도에서 제거

## 사용 예시

### 1. 기본 지도 표시
```javascript
import { waitForKakaoMapsReady, createMap } from './kakaoMapUtils'
import { useEffect, useRef } from 'react'

function MapComponent() {
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    // SDK 로드 대기
    waitForKakaoMapsReady()
      .then(() => {
        // 지도 생성
        map.current = createMap(mapContainer.current, {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 5
        })
      })
      .catch(error => {
        console.error('지도 로드 실패:', error)
      })
  }, [])

  return <div ref={mapContainer} style={{ width: '100%', height: '400px' }} />
}
```

### 2. 현재 위치 근처 음식점 검색
```javascript
import { 
  waitForKakaoMapsReady, 
  searchPlaces, 
  createMap, 
  createMarker 
} from './kakaoMapUtils'

async function searchNearbyRestaurants(latitude, longitude) {
  try {
    // SDK 준비 대기
    await waitForKakaoMapsReady()

    // 음식점 검색
    const results = await searchPlaces({
      keyword: '음식점',
      searchOptions: {
        location: new window.kakao.maps.LatLng(latitude, longitude),
        radius: 1000,    // 1km 범위
        size: 20
      }
    })

    console.log(`${results.length}개의 음식점 발견`)
    return results
  } catch (error) {
    console.error('검색 실패:', error)
    return []
  }
}
```

### 3. 지도에 마커 표시
```javascript
import { createMarker, onMarkerClick, isKakaoMapsReady } from './kakaoMapUtils'

function displayMarkersOnMap(map, restaurants) {
  if (!isKakaoMapsReady()) {
    console.warn('지도 API 미준비')
    return
  }

  restaurants.forEach(restaurant => {
    const marker = createMarker({
      lat: parseFloat(restaurant.y),
      lng: parseFloat(restaurant.x),
      map: map,
      title: restaurant.place_name
    })

    onMarkerClick(marker, () => {
      console.log('클릭된 음식점:', restaurant.place_name)
      // 상세 정보 모달 등 표시
    })
  })
}
```

### 4. RecommendationPanel에서의 사용
```javascript
import { 
  searchPlaces, 
  isKakaoMapsReady,
  waitForKakaoMapsReady
} from './kakaoMapUtils'

// RecommendationPanel.jsx에서
const getCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ latitude, longitude })
        
        // 카카오맵 준비 대기
        try {
          await waitForKakaoMapsReady()
          const restaurants = await searchPlaces({
            keyword: '음식점',
            searchOptions: {
              location: new window.kakao.maps.LatLng(latitude, longitude),
              radius: 1000,
              size: 20
            }
          })
          setNearbyRestaurants(restaurants)
        } catch (error) {
          console.warn('지도 검색 실패:', error)
          // 기본 추천으로 폴백
        }
      },
      (error) => {
        console.warn('위치 정보 미지원:', error.message)
        // 기본 추천 실행
      }
    )
  }
}
```

## 에러 처리

### 일반적인 에러 상황

| 에러 | 원인 | 해결책 |
|------|------|--------|
| `Kakao Maps API가 준비되지 않음` | SDK 미로드 | `waitForKakaoMapsReady()` 사용 |
| `유효한 지도 컨테이너 필요` | 컨테이너 높이 미설정 | CSS에서 높이 명시 |
| `ZERO_RESULT` | 검색 결과 없음 | 검색 반경 확대 또는 검색어 변경 |
| `타임아웃` | SDK 로드 실패 | 네트워크 확인, API 키 검증 |

### 에러 처리 패턴
```javascript
try {
  await waitForKakaoMapsReady()
  const results = await searchPlaces({...})
} catch (error) {
  if (error.message.includes('준비되지 않음')) {
    console.error('지도 API 로드 실패')
    // 지도 없이 기본 추천 사용
  } else if (error.message.includes('컨테이너')) {
    console.error('지도 컨테이너 오류')
    // DOM 구조 확인
  } else {
    console.error('기타 오류:', error)
    // 폴백 전략 실행
  }
}
```

## 성능 최적화

### 1. SDK 로드 최적화
- **캐싱**: `waitForKakaoMapsReady()`는 Promise를 캐시하여 반복 호출 시 재사용
- **지연 로드**: 필요할 때만 SDK 로드
- **타임아웃**: 30초 타임아웃으로 무한 대기 방지

### 2. 메모리 관리
```javascript
// 컴포넌트 언마운트 시 정리
useEffect(() => {
  return () => {
    cleanupMap(markers, map)
    // 참조 제거
    map = null
    markers = []
  }
}, [])
```

### 3. 검색 최적화
- **반경 제한**: 필요한 범위만 검색 (기본 1km)
- **결과 개수 제한**: 과도한 마커 표시 방지 (기본 20개)
- **캐싱**: 같은 위치 검색 결과 캐시

## 보안 고려사항

### API 키 보호
- ❌ **하지 말 것**: API 키를 코드에 하드코딩
- ✅ **할 것**: 환경 변수 사용 (`.env`)
- ✅ **할 것**: 빌드 시 주입

### Referer 제한
카카오맵 콘솔에서 JavaScript 키의 Referer 설정:
```
https://lunch.stormbug.site
https://localhost:8888
https://localhost:3000
```

### 위치 정보 프라이버시
- 사용자에게 위치 액세스 동의 요청
- 위치 정보는 추천에만 사용
- 저장하지 않음 (세션 중에만 사용)

## 카카오맵 라이브러리

### 사용 가능한 라이브러리

| 라이브러리 | 용도 | 포함 |
|-----------|------|------|
| `maps` | 기본 지도 렌더링 | 필수 |
| `services` | 장소 검색, 지오코딩 | 필수 |
| `drawing` | 도형 그리기 | 선택 |
| `clusterer` | 마커 군집화 | 선택 |
| `polygon` | 다각형 표시 | 선택 |

### SDK 로드 설정
```html
<!-- 현재 설정 -->
<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=KEY&libraries=services"></script>

<!-- 추가 라이브러리 포함 -->
<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=KEY&libraries=services,drawing,clusterer"></script>
```

## 지도 옵션

### 주요 옵션

| 옵션 | 타입 | 설명 | 기본값 |
|------|------|------|--------|
| `center` | LatLng | 중심 좌표 | (37.5665, 126.978) |
| `level` | number | 줌 레벨 (1-14) | 3 |
| `mapTypeId` | MapTypeId | 지도 종류 (ROADMAP, SKYVIEW) | ROADMAP |
| `draggable` | boolean | 드래그 가능 | true |
| `scrollwheel` | boolean | 마우스휠 줌 | true |
| `disableDoubleClickZoom` | boolean | 더블클릭 줌 비활성화 | false |

## 좌표 시스템

### WGS84 (위도/경도)
- 카카오맵이 사용하는 표준 좌표계
- 위도: -90 ~ 90
- 경도: -180 ~ 180

### 한국 주요 좌표
- **서울 광화문**: (37.5665, 126.978)
- **강남역**: (37.4979, 127.0276)
- **인천공항**: (37.4602, 126.4407)
- **부산 해운대**: (35.1595, 129.1602)

## 향후 개선 사항

1. **마커 군집화**: 마커 개수 많을 때 자동 그룹화
2. **경로 표시**: 사용자 위치에서 음식점까지 길찾기
3. **폴리곤 표시**: 배달 가능 지역 표시
4. **실시간 업데이트**: WebSocket으로 주변 음식점 실시간 업데이트
5. **지도 커스터마이징**: 브랜드 색상에 맞는 마커 디자인
6. **오프라인 모드**: 캐시된 지도 데이터 사용
7. **사용자 위치 추적**: 연속적인 위치 업데이트
