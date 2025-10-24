# Cloudflare 터널 설정 및 배포 가이드

LunchSelector를 HTTPS로 외부에 공개하기 위한 Cloudflare 터널 설정 및 배포 가이드입니다.

## 📋 목차

- [개요](#개요)
- [준비사항](#준비사항)
- [빠른 시작](#빠른시작-3단계)
- [상세 설정](#상세-설정)
- [운영 및 관리](#운영-및-관리)
- [문제 해결](#문제-해결)
- [고급 설정](#고급-설정)

---

## 🎯 개요

### Cloudflare Tunnel이란?

Cloudflare Tunnel은 포트 포워딩 없이 로컬 서버를 HTTPS로 외부에 공개할 수 있는 안전한 터널 서비스입니다.

**주요 특징:**
- ✅ 포트 포워딩 불필요
- ✅ 자동 HTTPS (Let's Encrypt 불필요)
- ✅ DDoS 방어 (Cloudflare 제공)
- ✅ IP 주소 숨김 (보안 강화)
- ✅ CDN 캐싱 (성능 향상)
- ✅ 무료 사용 가능

### 작동 방식

```
사용자 브라우저 (https://lunch.stormbug.site)
         ↓ HTTPS 요청
Cloudflare Edge 서버 (SSL/TLS 처리)
         ↓ Cloudflare Tunnel
LunchSelector 로컬 서버 (http://localhost:8888)
```

---

## 📋 준비사항

### 필수 요구사항

- [ ] Cloudflare 계정 (https://dash.cloudflare.com/sign-up)
- [ ] Cloudflare에 등록된 도메인 (`stormbug.site`)
- [ ] LunchSelector 프로젝트 (`E:\LunchSelector`)
- [ ] Node.js 및 npm 설치
- [ ] PowerShell 또는 Command Prompt 접근권

### 도메인 설정 상태 확인

Cloudflare 대시보드 → **Overview** 탭에서 다음을 확인합니다:
- 도메인: `stormbug.site` (추가됨)
- DNS 레코드: 자동 스캔됨
- Plan: Free (무료)

---

## 🚀 빠른시작: 3단계

### 1단계: cloudflared 다운로드

**옵션 A: 자동 스크립트 사용 (권장)**

```powershell
cd E:\LunchSelector
# 아래 스크립트는 자동으로 cloudflared 다운로드 및 설정
python setup-cloudflare.py
```

**옵션 B: 수동 다운로드**

1. https://github.com/cloudflare/cloudflared/releases/latest 접속
2. `cloudflared-windows-amd64.exe` 다운로드
3. `E:\LunchSelector\cloudflared.exe`로 저장

### 2단계: Cloudflare 로그인 및 터널 설정

**PowerShell 열기:**

```powershell
cd E:\LunchSelector
.\cloudflared.exe tunnel login
```

**명령어 설명:**
1. 브라우저가 자동으로 열림
2. Cloudflare 계정으로 로그인
3. 도메인 `stormbug.site` 선택
4. 인증 완료

**결과:** `C:\Users\<USERNAME>\.cloudflared\` 디렉토리에 인증 파일 저장

### 3단계: 터널 생성 및 시작

**터널 생성:**

```powershell
.\cloudflared.exe tunnel create lunch-tunnel
```

**출력 예시:**
```
Created tunnel lunch-tunnel with id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**터널 ID 복사 (나중에 필요):**
위 출력에서 `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` 복사

**DNS 레코드 자동 추가:**

```powershell
.\cloudflared.exe tunnel route dns lunch-tunnel lunch.stormbug.site
```

**터널 시작:**

```powershell
.\cloudflared.exe tunnel run lunch-tunnel
```

**테스트:**

브라우저에서 접속:
```
https://lunch.stormbug.site
```

성공! 🎉

---

## 📝 상세 설정

### 설정 파일 구조

`E:\LunchSelector\cloudflared-config.yml`:

```yaml
# Tunnel 식별자
tunnel: <YOUR_TUNNEL_ID>

# 인증 파일 경로
credentials-file: C:\Users\<USERNAME>\.cloudflared\<TUNNEL_ID>.json

# 인그레스 규칙 (요청 라우팅)
ingress:
  # 도메인 lunch.stormbug.site → 로컬 8888 포트로 라우트
  - hostname: lunch.stormbug.site
    service: http://localhost:8888
  
  # 나머지 모든 요청은 404 반환
  - service: http_status:404

# 로그 레벨 (debug, info, warn, error)
loglevel: info
```

**설정 파일 커스터마이징:**

다른 포트에서 서버를 실행하려면:
```yaml
service: http://localhost:3000  # 3000 포트 사용 시
```

### 터널 실행 방법

**포그라운드 실행 (개발 시):**

```powershell
cd E:\LunchSelector
.\cloudflared.exe tunnel --config cloudflared-config.yml run lunch-tunnel
```

**백그라운드 실행:**

```powershell
Start-Process -FilePath ".\cloudflared.exe" -ArgumentList "tunnel", "--config", "cloudflared-config.yml", "run", "lunch-tunnel" -WindowStyle Hidden
```

**시작 배치 파일 사용:**

`start-tunnel.bat` 실행:
```batch
cd E:\LunchSelector
start-tunnel.bat
```

---

## 🛠️ 운영 및 관리

### Windows 서비스로 등록 (자동 시작)

**관리자 권한 PowerShell에서:**

```powershell
cd E:\LunchSelector
.\cloudflared.exe service install
.\cloudflared.exe service start
```

**서비스 확인:**

```powershell
Get-Service cloudflared
```

**서비스 시작/중지:**

```powershell
# 시작
Start-Service cloudflared

# 중지
Stop-Service cloudflared

# 상태 확인
Get-Service cloudflared | Format-Table Status, DisplayName
```

### 터널 상태 모니터링

**터널 정보 확인:**

```powershell
.\cloudflared.exe tunnel info lunch-tunnel
```

**활성 연결 확인:**

```powershell
.\cloudflared.exe tunnel info --verbose lunch-tunnel
```

**로그 확인:**

```powershell
# 기본 로그
.\cloudflared.exe tunnel --config cloudflared-config.yml run lunch-tunnel

# 디버그 로그
.\cloudflared.exe tunnel --config cloudflared-config.yml run lunch-tunnel --loglevel debug

# 경고만
.\cloudflared.exe tunnel --config cloudflared-config.yml run lunch-tunnel --loglevel warn
```

### 터널 중지 및 정리

**터널 중지:**

```powershell
# 실행 중인 프로세스 종료 (Ctrl+C)
# 또는
.\cloudflared.exe tunnel kill lunch-tunnel
```

**Windows 서비스 제거:**

```powershell
.\cloudflared.exe service uninstall
```

**터널 삭제:**

```powershell
.\cloudflared.exe tunnel delete lunch-tunnel
```

---

## 🐛 문제 해결

### 터널이 연결되지 않음

**확인 사항:**

1. **Vite 서버 실행 확인:**
   ```powershell
   # 새 PowerShell 탭에서
   npm run dev
   ```

2. **로컬 연결 테스트:**
   ```powershell
   curl https://localhost:8888
   ```

3. **cloudflared 실행 확인:**
   ```powershell
   Get-Process cloudflared
   ```

4. **터널 정보 확인:**
   ```powershell
   .\cloudflared.exe tunnel info lunch-tunnel
   ```

### DNS 전파 확인 안 됨

**DNS 확인:**

```powershell
nslookup lunch.stormbug.site
```

**예상 출력:**
```
Server: 8.8.8.8
Address: 8.8.8.8

Name:    lunch.stormbug.site
Addresses: (Cloudflare IP 주소)
```

**네임서버 확인:**

```powershell
nslookup -type=NS stormbug.site
```

**DNS 캐시 초기화:**

```powershell
ipconfig /flushdns
```

**강제 DNS 업데이트:**

Cloudflare 대시보드 → **DNS** → **Purge Cache** 클릭

### 브라우저 캐시 문제

**강제 새로고침:**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**시크릿 모드 사용:**
- Chrome: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`

### 성능 문제 (느린 응답)

**확인 사항:**

1. **로컬 서버 성능:**
   ```powershell
   # 터널 없이 직접 접속
   https://localhost:8888
   ```

2. **Cloudflare 캐싱 설정:**
   대시보드 → **Caching** → **Cache Level** 확인

3. **로그 레벨 변경:**
   ```yaml
   loglevel: warn  # debug → warn으로 변경
   ```

### 인증서 오류

**증상:** `ERR_CERT_AUTHORITY_INVALID`

**해결 방법:**

Cloudflare 대시보드 → **SSL/TLS** → **Overview**:
- SSL/TLS encryption mode: `Full (strict)` 설정
- Always Use HTTPS: `ON`

---

## 🔧 고급 설정

### 다중 서비스 라우팅

여러 로컬 서버를 하나의 도메인에서 라우트하려면:

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: C:\Users\<USERNAME>\.cloudflared\<TUNNEL_ID>.json

ingress:
  # API 서버 (조건부 라우트)
  - hostname: api.lunch.stormbug.site
    service: http://localhost:3000
  
  # 메인 앱
  - hostname: lunch.stormbug.site
    service: http://localhost:8888
  
  # 관리자 대시보드
  - hostname: admin.lunch.stormbug.site
    service: http://localhost:9000
  
  # 404
  - service: http_status:404
```

### 자체 서명 인증서 (개발 환경)

```yaml
ingress:
  - hostname: lunch.stormbug.site
    service: https://localhost:8888
    originRequest:
      noTLSVerify: true  # 자체 서명 인증서 무시
```

### 원본 서버 호스트 헤더

```yaml
ingress:
  - hostname: lunch.stormbug.site
    service: http://localhost:8888
    originRequest:
      httpHost: "localhost:8888"
```

### 로드 밸런싱

여러 인스턴스로 로드 밸런싱:

```yaml
ingress:
  - hostname: lunch.stormbug.site
    service: http://localhost:8888
  
  - hostname: lunch.stormbug.site
    service: http://localhost:8889
```

### 액세스 제어 (Basic Auth)

Cloudflare Zero Trust 필요:

```yaml
ingress:
  - hostname: lunch.stormbug.site
    service: http://localhost:8888
    originRequest:
      access:
        required: true
```

---

## 📊 상태 확인 체크리스트

배포 전 다음을 확인하세요:

- [ ] Cloudflare 계정 생성 완료
- [ ] 도메인이 Cloudflare에 추가됨
- [ ] cloudflared.exe 다운로드 완료
- [ ] Cloudflare 로그인 완료 (`tunnel login`)
- [ ] 터널 생성 완료 (`tunnel create`)
- [ ] DNS 레코드 연결 완료 (`tunnel route dns`)
- [ ] Vite 개발 서버 실행 중
- [ ] 터널 실행 중 (`tunnel run`)
- [ ] `https://lunch.stormbug.site` 접속 성공
- [ ] Cloudflare 대시보드에서 트래픽 확인 가능

---

## 🔗 유용한 링크

| 항목 | 링크 |
|------|------|
| **Cloudflare 대시보드** | https://dash.cloudflare.com |
| **Tunnel 문서** | https://developers.cloudflare.com/cloudflare-one/connections/connect-apps |
| **cloudflared 다운로드** | https://github.com/cloudflare/cloudflared/releases |
| **도메인 관리** | https://dash.cloudflare.com/.../ |
| **DNS 관리** | https://dash.cloudflare.com/.../ → DNS |

---

## 💡 팁

### 개발 중 Vite와 Tunnel 동시 시작

`start-all.bat` 생성:

```batch
@echo off
echo Starting Vite development server...
start "Vite Dev Server" cmd /k "npm run dev"

echo Waiting for Vite to start...
timeout /t 5 /nobreak

echo Starting Cloudflare Tunnel...
start "Cloudflare Tunnel" cmd /k ".\cloudflared.exe tunnel --config cloudflared-config.yml run lunch-tunnel"

echo Both services started!
pause
```

실행:
```powershell
.\start-all.bat
```

### 빠른 명령어 별칭 (PowerShell)

`$PROFILE` 수정:

```powershell
# 터널 시작
function Start-Tunnel { 
    cd E:\LunchSelector
    .\cloudflared.exe tunnel --config cloudflared-config.yml run lunch-tunnel
}

# 터널 중지
function Stop-Tunnel { 
    Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process
}

# 터널 상태 확인
function Get-TunnelStatus { 
    cd E:\LunchSelector
    .\cloudflared.exe tunnel info lunch-tunnel
}
```

### 모니터링 도구

Cloudflare 대시보드에서 실시간 모니터링:

**Caching Analytics:**
- Dashboard → **Analytics** → **Caching**

**Traffic Analytics:**
- Dashboard → **Analytics** → **Traffic**

**Error Tracking:**
- Dashboard → **Analytics** → **Web Analytics**

---

## 🚀 다음 단계

1. [GETTING_STARTED.md](./GETTING_STARTED.md) - 프로젝트 전체 가이드
2. [README.md](./README.md) - 프로젝트 소개 및 기능
3. [개발 문서](./docs/) - 각 기능별 상세 문서

---

**질문 또는 문제?** GitHub Issues에서 보고해주세요.
