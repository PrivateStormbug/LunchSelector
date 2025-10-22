# 🍽️ LunchSelector (점심 메뉴 추천)

오늘 점심 뭐 먹을지 고민될 때 사용하는 메뉴 추천 앱입니다.

## ✨ 주요 기능

- 6가지 음식 카테고리 (한식, 중식, 일식, 양식, 분식, 기타)
- 카테고리별 메뉴 추천 & 완전 랜덤 추천
- **카테고리별 메뉴 추가/수정/삭제 기능**
- **Kakao Maps API 연동 - 주변 식당 검색**
- **로컬 스토리지 - 커스텀 메뉴 저장**
- 부드러운 애니메이션 효과
- 모바일/데스크톱 반응형 디자인

## 🚀 시작하기

### 1. 설치

```bash
npm install
```

### 2. API 키 설정

**Kakao Maps API 키가 필요합니다:**

1. [Kakao Developers](https://developers.kakao.com/console/app)에서 애플리케이션 등록, 접근할 URL:port 정보 추가, localhost:8888로 작업함
2. JavaScript 키 발급
3. 프로젝트 루트에 `.env` 파일 생성:

```bash
# .env.example을 복사해서 .env 파일 생성
cp .env.example .env
```

4. `.env` 파일에 발급받은 API 키 입력:

```env
VITE_KAKAO_MAP_API_KEY=your_kakao_map_api_key_here
```

⚠️ **중요**: `.env` 파일은 Git에 커밋되지 않습니다. API 키를 안전하게 보관하세요.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:8888` 접속

### 프로덕션 빌드

```bash
npm run build
```

## 🛠️ 기술 스택

- React 18
- Vite
- CSS3 (Animations & Gradients)

## 📝 프로젝트 구조

```
src/
├── main.jsx       # 엔트리 포인트
├── App.jsx        # 메인 컴포넌트
├── App.css        # 스타일 및 애니메이션
├── index.css      # 전역 스타일
└── menuData.js    # 메뉴 데이터 및 추천 로직
```

## 🎨 디자인 특징

- 그라데이션 배경
- 부드러운 호버 효과
- 3D 카드 애니메이션
- 반응형 그리드 레이아웃

## 📖 상세 문서

프로젝트 구조와 개발 가이드는 [CLAUDE.md](./CLAUDE.md)를 참고하세요.
# LunchSelector
# LunchSelector
