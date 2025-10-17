# 외부 접근 대안 솔루션 가이드

포트 포워딩이 작동하지 않을 때 사용할 수 있는 다양한 대안 방법들입니다.

## 📊 솔루션 비교표

| 방법 | 난이도 | 비용 | 속도 | 사용자 정의 도메인 | 추천도 |
|------|--------|------|------|-------------------|--------|
| ngrok | ⭐ 쉬움 | 무료/유료 | 빠름 | 유료 ($8/월) | ⭐⭐⭐⭐⭐ |
| Tailscale | ⭐⭐ 보통 | 무료 | 매우 빠름 | 불가 | ⭐⭐⭐⭐ |
| localtunnel | ⭐ 쉬움 | 무료 | 보통 | 가능 | ⭐⭐⭐ |
| 포트 80/443 | ⭐ 쉬움 | 무료 | 매우 빠름 | 가능 | ⭐⭐ |
| UPnP 자동화 | ⭐⭐⭐ 어려움 | 무료 | 매우 빠름 | 가능 | ⭐⭐ |

---

## 🚀 대안 1: ngrok (가장 추천) ⭐⭐⭐⭐⭐

### 장점
- ✅ 설정이 매우 간단 (5분 이내)
- ✅ 안정적이고 빠름
- ✅ HTTPS 자동 지원
- ✅ 무료 플랜 사용 가능
- ✅ 웹 인터페이스로 트래픽 모니터링

### 단점
- ❌ 무료 버전은 URL이 매번 바뀜 (예: https://abc123.ngrok.io)
- ❌ 사용자 정의 도메인은 유료 ($8/월)
- ❌ 무료 버전은 동시 접속 제한

### 설정 방법

#### 1단계: ngrok 설치
```powershell
cd E:\LunchSelector
.\setup-ngrok.ps1
```

#### 2단계: 무료 계정 생성 (권장)
1. https://dashboard.ngrok.com/signup 에서 무료 가입
2. https://dashboard.ngrok.com/get-started/your-authtoken 에서 토큰 복사
3. 스크립트 실행 시 토큰 입력

#### 3단계: 서비스 시작
**터미널 1 - Vite 서버**:
```bash
npm run dev
```

**터미널 2 - ngrok**:
```powershell
.\start-ngrok.ps1
```

#### 4단계: URL 확인
ngrok이 제공하는 URL을 사용:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:8080
```

**접속**: `https://abc123.ngrok-free.app`

### 사용자 정의 도메인 (유료)

유료 플랜 ($8/월)에서는 `lunch.stormbug.site`를 연결 가능:
```powershell
.\ngrok.exe http --domain=lunch.stormbug.site 8080
```

---

## 🔐 대안 2: Tailscale (VPN 방식) ⭐⭐⭐⭐

### 장점
- ✅ 완전 무료 (개인 사용)
- ✅ 매우 빠름 (P2P 연결)
- ✅ 매우 안전 (WireGuard 기반)
- ✅ 100개 기기까지 무료
- ✅ 고정 IP 제공

### 단점
- ❌ 접속하는 모든 기기에 Tailscale 설치 필요
- ❌ 공개 웹사이트로는 사용 불가 (VPN 멤버만 접근)
- ❌ 사용자 정의 도메인 불가

### 설정 방법

#### 1단계: Tailscale 설치
1. https://tailscale.com/download/windows 에서 다운로드
2. 설치 및 Google/Microsoft 계정으로 로그인

#### 2단계: 서버 설정
서버 컴퓨터에서 Tailscale 실행 후 로그인

#### 3단계: Tailscale IP 확인
Tailscale 앱에서 IP 확인 (예: 100.101.102.103)

#### 4단계: 클라이언트 설정
접속할 기기에도 Tailscale 설치 및 동일 계정으로 로그인

#### 5단계: 접속
```
http://100.101.102.103:8080
```

### 적합한 경우
- 개인적으로만 사용 (팀원, 가족)
- 보안이 중요한 경우
- 공개 웹사이트가 아닌 경우

---

## 🌐 대안 3: localtunnel (오픈소스) ⭐⭐⭐

### 장점
- ✅ 완전 무료
- ✅ 오픈소스
- ✅ npm으로 간단 설치
- ✅ 서브도메인 지정 가능

### 단점
- ❌ 불안정할 수 있음
- ❌ 속도가 느릴 수 있음
- ❌ HTTPS 인증서 문제

### 설정 방법

#### 1단계: localtunnel 설치
```bash
npm install -g localtunnel
```

#### 2단계: 실행
```bash
# Vite 서버 실행
npm run dev

# 다른 터미널에서
lt --port 8080 --subdomain lunch-selector
```

#### 3단계: 접속
```
https://lunch-selector.loca.lt
```

**주의**: 처음 접속 시 비밀번호 입력 화면이 나타날 수 있습니다.

---

## 🔧 대안 4: 포트 80 또는 443 사용 ⭐⭐

### 원리
HTTP(80), HTTPS(443) 포트는 대부분의 ISP가 차단하지 않습니다.

### 설정 방법

#### 포트 80 사용

**vite.config.js 수정**:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 80,
    strictPort: true,
  }
})
```

**관리자 권한으로 실행** (포트 80은 관리자 권한 필요):
```powershell
# PowerShell을 관리자 권한으로 실행
cd E:\LunchSelector
npm run dev
```

**라우터 설정**:
- 외부 포트: 80
- 내부 포트: 80
- 내부 IP: 192.168.219.104

**접속**:
```
http://lunch.stormbug.site
```

포트 번호 없이 접속 가능!

### 주의사항
- Windows에서 포트 80은 관리자 권한 필요
- 다른 웹서버(IIS, Apache 등)가 80 포트 사용 중이면 충돌

---

## ⚙️ 대안 5: UPnP 자동 포트 포워딩 ⭐⭐

### 원리
라우터의 UPnP 기능을 이용해 자동으로 포트 포워딩 설정

### 사전 요구사항
- 라우터에서 UPnP 활성화 필요
- 일부 라우터는 UPnP 지원 안 함

### 설정 방법

#### 1단계: 라우터 UPnP 확인
라우터 관리 페이지 (192.168.219.1)에서:
- 고급 설정 → UPnP → **활성화**

#### 2단계: Node.js UPnP 패키지 설치
```bash
npm install -g nat-upnp-2
```

#### 3단계: 포트 매핑 스크립트 작성
**setup-upnp.js**:
```javascript
const natUpnp = require('nat-upnp-2');
const client = natUpnp.createClient();

client.portMapping({
  public: 8080,
  private: 8080,
  ttl: 0
}, function(err) {
  if (err) {
    console.error('UPnP 포트 매핑 실패:', err);
  } else {
    console.log('UPnP 포트 매핑 성공!');
  }

  client.close();
});
```

#### 4단계: 실행
```bash
node setup-upnp.js
```

### 단점
- 라우터마다 UPnP 지원 여부가 다름
- 보안상 UPnP를 비활성화하는 경우가 많음
- 신뢰성이 낮음

---

## 📝 추천 순서

### 일반 사용자 (공개 웹사이트)
1. **ngrok** (가장 추천) - 설정 간단, 안정적
2. **localtunnel** - 완전 무료
3. **포트 80** - ISP가 허용하는 경우

### 개인/팀 사용
1. **Tailscale** - 안전하고 빠름
2. **ngrok** - 간단한 공유

### 개발/테스트
1. **ngrok** - 빠른 테스트
2. **localtunnel** - 무료 대안

---

## 🎯 빠른 시작: ngrok 사용

가장 간단하고 안정적인 ngrok 사용을 추천합니다:

```powershell
# 1. ngrok 설정
cd E:\LunchSelector
.\setup-ngrok.ps1

# 2. Vite 서버 시작 (터미널 1)
npm run dev

# 3. ngrok 시작 (터미널 2)
.\start-ngrok.ps1
```

ngrok이 제공하는 URL로 즉시 접속 가능합니다!

---

## 🆘 문제 해결

### ngrok: "Failed to start tunnel"
- 무료 계정 생성 및 authtoken 설정 필요
- 방화벽에서 ngrok.exe 허용

### Tailscale: 연결 안 됨
- 양쪽 기기 모두 Tailscale 로그인 확인
- 방화벽에서 Tailscale 허용

### localtunnel: 느리거나 불안정
- ngrok 또는 Tailscale로 전환 추천

### 포트 80: 관리자 권한 오류
- PowerShell을 관리자 권한으로 실행
- 또는 다른 포트 사용

---

## 💡 결론

**가장 추천하는 방법**: **ngrok**

- 설정이 가장 간단
- 안정적이고 빠름
- 무료로 즉시 사용 가능
- 필요시 유료로 사용자 정의 도메인 사용

지금 바로 시도해보세요:
```powershell
.\setup-ngrok.ps1
```
