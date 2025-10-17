# 외부 접근 설정 가이드

포트 포워딩이 작동하지 않는 환경에서 외부에서 접근할 수 있도록 Cloudflare Tunnel을 사용하는 방법입니다.

## 🚨 문제 상황

- ✅ 로컬 접근: `http://localhost:8080` 정상 작동
- ✅ 로컬 네트워크: `http://192.168.219.104:8080` 정상 작동
- ❌ 외부 접근: `http://lunch.stormbug.site:8080` 타임아웃
- ❌ 공인 IP: `http://122.32.219.38:8080` 타임아웃

**원인**: 라우터 포트 포워딩 미작동 (이중 NAT, ISP 차단, CGNAT 등)

## ✅ 해결 방법: Cloudflare Tunnel

Cloudflare Tunnel을 사용하면 **포트 포워딩 없이** 외부에서 접근할 수 있습니다.

### 장점
- ✅ 포트 포워딩 불필요
- ✅ 무료 (Cloudflare 무료 플랜)
- ✅ HTTPS 자동 지원
- ✅ 안정적이고 빠름
- ✅ 도메인 연결 가능

## 📦 설정 방법

### 1단계: 초기 설정 (한 번만 실행)

PowerShell을 **관리자 권한**으로 실행한 후:

```powershell
# 프로젝트 폴더로 이동
cd E:\LunchSelector

# 실행 정책 변경 (필요한 경우)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Cloudflare Tunnel 설정 스크립트 실행
.\setup-cloudflare-tunnel.ps1
```

#### 설정 과정:
1. `cloudflared.exe` 자동 다운로드
2. 브라우저에서 Cloudflare 계정 로그인
3. Tunnel 생성 (`lunch-selector`)
4. DNS 레코드 자동 연결

### 2단계: 서비스 시작

#### 옵션 A: 전체 시작 (추천)
Vite 서버 + Cloudflare Tunnel을 동시에 실행:

```powershell
.\start-all.ps1
```

#### 옵션 B: 개별 시작
터미널 2개를 열어서 각각 실행:

**터미널 1 - Vite 서버**:
```bash
npm run dev
```

**터미널 2 - Cloudflare Tunnel**:
```powershell
.\start-tunnel.ps1
```

### 3단계: 접속 확인

- **로컬**: http://localhost:8080
- **로컬 네트워크**: http://192.168.219.104:8080
- **외부 (인터넷)**: https://lunch.stormbug.site ⭐

**주의**: 외부 접속 시 포트 번호(`:8080`)를 제거하고 `https://`를 사용하세요!

## 🔧 문제 해결

### cloudflared.exe를 찾을 수 없음
```powershell
.\setup-cloudflare-tunnel.ps1
```
스크립트를 다시 실행하세요.

### Tunnel 연결 실패
1. Vite 서버가 실행 중인지 확인: `http://localhost:8080`
2. Tunnel 상태 확인:
```powershell
.\cloudflared.exe tunnel list
```
3. Tunnel 재생성:
```powershell
.\cloudflared.exe tunnel delete lunch-selector
.\setup-cloudflare-tunnel.ps1
```

### 로그인 문제
Cloudflare 계정이 필요합니다:
1. https://dash.cloudflare.com 에서 무료 계정 생성
2. `.\cloudflared.exe tunnel login` 재실행

### DNS 전파 지연
DNS 변경 후 최대 24시간이 걸릴 수 있습니다. 보통 5-10분 이내에 적용됩니다.

## 📊 서비스 관리

### 서비스 중지
실행 중인 PowerShell에서 `Ctrl + C`

### Tunnel 목록 확인
```powershell
.\cloudflared.exe tunnel list
```

### Tunnel 삭제
```powershell
.\cloudflared.exe tunnel delete lunch-selector
```

### 로그 확인
Tunnel 실행 중 터미널에 실시간 로그가 표시됩니다.

## 🔐 보안 고려사항

### 프로덕션 배포 시
1. **환경 변수 설정**: API 키, 비밀번호 등을 환경 변수로 관리
2. **HTTPS 사용**: Cloudflare Tunnel은 자동으로 HTTPS 제공
3. **인증 추가**: 필요한 경우 Cloudflare Access로 인증 추가
4. **로그 모니터링**: Cloudflare Dashboard에서 트래픽 모니터링

### 개발 환경
현재 설정은 개발 환경에 적합합니다. 프로덕션 배포 시 추가 보안 설정이 필요합니다.

## 🚀 대안: ngrok (빠른 테스트용)

Cloudflare 설정이 복잡하다면 ngrok을 사용할 수 있습니다:

```powershell
# ngrok 설치 (Chocolatey 사용)
choco install ngrok

# 8080 포트 공개
ngrok http 8080
```

ngrok이 제공하는 임시 URL로 접근 가능합니다.

**단점**:
- 무료 버전은 URL이 매번 바뀜
- 사용자 정의 도메인 불가 (유료)
- Cloudflare보다 느릴 수 있음

## 📚 추가 자료

- [Cloudflare Tunnel 공식 문서](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [ngrok 공식 문서](https://ngrok.com/docs)
- [Vite 공식 문서](https://vitejs.dev/)

## 💡 팁

### 자동 시작 (Windows 시작 시)
1. `start-all.ps1`의 바로가기 생성
2. `shell:startup` 폴더에 바로가기 복사
3. Windows 시작 시 자동 실행됨

### 백그라운드 실행
```powershell
Start-Process powershell -ArgumentList "-File .\start-all.ps1" -WindowStyle Hidden
```

### 서비스로 등록 (고급)
NSSM (Non-Sucking Service Manager)를 사용하여 Windows 서비스로 등록 가능합니다.
