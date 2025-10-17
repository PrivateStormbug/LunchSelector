# 포트 포워딩 상태 진단 스크립트

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  포트 포워딩 진단 도구" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$port = 8080
$publicIP = "122.32.219.38"
$localIP = "192.168.219.104"
$gateway = "192.168.219.1"

# 1. 로컬 서버 리스닝 확인
Write-Host "[1] 로컬 서버 리스닝 상태 확인" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Gray

$listening = netstat -ano | findstr ":$port" | findstr "LISTENING"
if ($listening) {
    Write-Host "✅ 서버가 포트 $port 에서 리스닝 중" -ForegroundColor Green
    $listening | ForEach-Object { Write-Host "   $_" -ForegroundColor White }

    # 0.0.0.0에서 리스닝하는지 확인
    if ($listening -match "0.0.0.0:$port") {
        Write-Host "✅ 0.0.0.0:$port 에서 리스닝 (모든 인터페이스)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  경고: localhost에서만 리스닝 중일 수 있음" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ 포트 $port 에서 리스닝 중인 서버 없음" -ForegroundColor Red
    Write-Host "   npm run dev를 먼저 실행하세요" -ForegroundColor Yellow
}

Write-Host ""

# 2. 방화벽 규칙 확인
Write-Host "[2] Windows 방화벽 규칙 확인" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Gray

$firewallRules = Get-NetFirewallRule | Where-Object {
    $_.Enabled -eq $true -and $_.Direction -eq 'Inbound'
} | Get-NetFirewallPortFilter | Where-Object {
    $_.LocalPort -eq $port
}

if ($firewallRules) {
    Write-Host "✅ 방화벽 인바운드 규칙 존재" -ForegroundColor Green
    $firewallRules | ForEach-Object {
        Write-Host "   포트: $($_.LocalPort), 프로토콜: $($_.Protocol)" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  경고: 포트 $port 에 대한 방화벽 인바운드 규칙 없음" -ForegroundColor Yellow
    Write-Host "   관리자 권한 PowerShell에서 다음 명령어 실행:" -ForegroundColor Cyan
    Write-Host "   New-NetFirewallRule -DisplayName 'Port $port' -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow" -ForegroundColor White
}

Write-Host ""

# 3. 네트워크 정보 확인
Write-Host "[3] 네트워크 구성 정보" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Gray

Write-Host "로컬 IP: $localIP" -ForegroundColor White
Write-Host "게이트웨이: $gateway" -ForegroundColor White
Write-Host "공인 IP: $publicIP" -ForegroundColor White

Write-Host ""

# 4. 이중 NAT 확인 안내
Write-Host "[4] 이중 NAT 확인 (중요!)" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Gray

Write-Host "라우터 관리 페이지 ($gateway) 에 접속하여 확인:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 라우터의 WAN IP 주소 확인 (인터넷 상태/연결 정보)" -ForegroundColor White
Write-Host "   - WAN IP가 $publicIP 이면: ✅ 정상" -ForegroundColor Green
Write-Host "   - WAN IP가 10.x.x.x, 172.16-31.x.x, 192.168.x.x 이면: ❌ 이중 NAT" -ForegroundColor Red
Write-Host ""
Write-Host "이중 NAT란?" -ForegroundColor Yellow
Write-Host "   ISP 공유기 → 사용자 공유기 → PC 구조" -ForegroundColor White
Write-Host "   이 경우 포트 포워딩이 작동하지 않습니다" -ForegroundColor White
Write-Host ""

$wanCheck = Read-Host "라우터의 WAN IP 주소를 입력하세요 (확인하지 않았다면 Enter)"

if ($wanCheck) {
    if ($wanCheck -match "^10\." -or $wanCheck -match "^172\.(1[6-9]|2[0-9]|3[0-1])\." -or $wanCheck -match "^192\.168\.") {
        Write-Host ""
        Write-Host "❌ 이중 NAT 감지됨!" -ForegroundColor Red
        Write-Host "   해결 방법:" -ForegroundColor Yellow
        Write-Host "   1. ISP 공유기를 브릿지 모드로 설정" -ForegroundColor White
        Write-Host "   2. ISP 공유기에서도 포트 포워딩 설정" -ForegroundColor White
        Write-Host "   3. ngrok/Tailscale 같은 터널링 솔루션 사용 (권장)" -ForegroundColor Green
    } elseif ($wanCheck -eq $publicIP) {
        Write-Host ""
        Write-Host "✅ 정상: WAN IP와 공인 IP 일치" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  WAN IP($wanCheck)와 공인 IP($publicIP)가 다릅니다" -ForegroundColor Yellow
        Write-Host "   CGNAT 또는 동적 IP일 수 있습니다" -ForegroundColor White
    }
}

Write-Host ""

# 5. CGNAT 확인
Write-Host "[5] CGNAT 확인" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Gray

Write-Host "CGNAT(Carrier-Grade NAT)란?" -ForegroundColor Cyan
Write-Host "   여러 고객이 하나의 공인 IP를 공유하는 방식" -ForegroundColor White
Write-Host "   이 경우 포트 포워딩이 불가능합니다" -ForegroundColor White
Write-Host ""
Write-Host "CGNAT 확인 방법:" -ForegroundColor Yellow
Write-Host "   1. 공인 IP가 100.64.0.0 ~ 100.127.255.255 범위면 CGNAT 확실" -ForegroundColor White

if ($publicIP -match "^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\.") {
    Write-Host ""
    Write-Host "❌ CGNAT 감지됨! (공인 IP: $publicIP)" -ForegroundColor Red
    Write-Host "   포트 포워딩 불가능 - 터널링 솔루션 필수" -ForegroundColor Yellow
} else {
    Write-Host "   2. ISP에 문의하여 '고정 IP' 또는 'CGNAT 여부' 확인" -ForegroundColor White
}

Write-Host ""

# 6. 포트 포워딩 설정 체크리스트
Write-Host "[6] 포트 포워딩 설정 체크리스트" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Gray

Write-Host "라우터 설정 확인 ($gateway):" -ForegroundColor Cyan
Write-Host "[ ] 외부 포트: $port" -ForegroundColor White
Write-Host "[ ] 내부 포트: $port" -ForegroundColor White
Write-Host "[ ] 내부 IP: $localIP (정확히 일치해야 함)" -ForegroundColor White
Write-Host "[ ] 프로토콜: TCP (또는 TCP/UDP 모두)" -ForegroundColor White
Write-Host "[ ] 상태: 활성화/Enable" -ForegroundColor White
Write-Host "[ ] 라우터 재시작 완료" -ForegroundColor White

Write-Host ""

# 7. 외부 포트 체크 제안
Write-Host "[7] 외부 포트 접근 테스트" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Gray

Write-Host "다음 사이트에서 포트 열림 확인:" -ForegroundColor Cyan
Write-Host "   https://www.yougetsignal.com/tools/open-ports/" -ForegroundColor White
Write-Host ""
Write-Host "   입력 정보:" -ForegroundColor Yellow
Write-Host "   - IP Address: $publicIP" -ForegroundColor White
Write-Host "   - Port Number: $port" -ForegroundColor White
Write-Host ""

$portTest = Read-Host "외부 포트 체크 결과 (open/closed)"

if ($portTest -eq "open") {
    Write-Host ""
    Write-Host "✅ 포트가 열려 있습니다!" -ForegroundColor Green
    Write-Host "   그런데도 접속이 안 된다면:" -ForegroundColor Yellow
    Write-Host "   1. 도메인 DNS 확인 (nslookup lunch.stormbug.site)" -ForegroundColor White
    Write-Host "   2. 브라우저 캐시 삭제" -ForegroundColor White
    Write-Host "   3. 다른 네트워크에서 접속 시도 (모바일 데이터 등)" -ForegroundColor White
} elseif ($portTest -eq "closed") {
    Write-Host ""
    Write-Host "❌ 포트가 닫혀 있습니다" -ForegroundColor Red
    Write-Host "   가능한 원인:" -ForegroundColor Yellow
    Write-Host "   1. 이중 NAT" -ForegroundColor White
    Write-Host "   2. CGNAT" -ForegroundColor White
    Write-Host "   3. ISP 포트 차단" -ForegroundColor White
    Write-Host "   4. 라우터 설정 오류" -ForegroundColor White
    Write-Host "   5. 방화벽 차단" -ForegroundColor White
}

Write-Host ""

# 8. 최종 권장사항
Write-Host "[8] 권장 해결 방법" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Gray

Write-Host ""
Write-Host "포트 포워딩이 작동하지 않는 경우:" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ 추천 1: ngrok (가장 쉽고 빠름)" -ForegroundColor Green
Write-Host "   .\setup-ngrok.ps1" -ForegroundColor White
Write-Host ""
Write-Host "✅ 추천 2: Tailscale (개인/팀용)" -ForegroundColor Green
Write-Host "   https://tailscale.com/download" -ForegroundColor White
Write-Host ""
Write-Host "⚙️  시도 3: 포트 80 사용 (ISP가 8080 차단 가능)" -ForegroundColor Yellow
Write-Host "   vite.config.js에서 port: 80으로 변경" -ForegroundColor White
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "진단 완료" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
