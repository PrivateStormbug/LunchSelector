# ngrok 설정 및 실행 스크립트

Write-Host "=== ngrok 설정 시작 ===" -ForegroundColor Green

# ngrok 다운로드 URL (Windows 64bit)
$ngrokUrl = "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
$ngrokZip = "ngrok.zip"
$ngrokExe = "ngrok.exe"

# 1. ngrok 다운로드
if (-not (Test-Path $ngrokExe)) {
    Write-Host "`n1. ngrok 다운로드 중..." -ForegroundColor Cyan

    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $ngrokUrl -OutFile $ngrokZip

        Write-Host "다운로드 완료! 압축 해제 중..." -ForegroundColor Green
        Expand-Archive -Path $ngrokZip -DestinationPath . -Force
        Remove-Item $ngrokZip

        Write-Host "ngrok 설치 완료!" -ForegroundColor Green
    } catch {
        Write-Host "다운로드 실패: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`n수동 설치:" -ForegroundColor Yellow
        Write-Host "1. https://ngrok.com/download 에서 Windows 버전 다운로드" -ForegroundColor White
        Write-Host "2. 압축 해제 후 ngrok.exe를 현재 폴더에 복사" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "`nngrok.exe가 이미 존재합니다." -ForegroundColor Yellow
}

# 2. ngrok 계정 안내
Write-Host "`n2. ngrok 인증 토큰 설정" -ForegroundColor Cyan
Write-Host "무료 계정이 필요합니다 (선택사항이지만 권장):" -ForegroundColor Yellow
Write-Host "1. https://dashboard.ngrok.com/signup 에서 무료 가입" -ForegroundColor White
Write-Host "2. https://dashboard.ngrok.com/get-started/your-authtoken 에서 토큰 복사" -ForegroundColor White
Write-Host "`n인증 토큰이 있으면 입력하세요 (없으면 Enter):" -ForegroundColor Yellow
$authToken = Read-Host

if ($authToken) {
    & .\ngrok.exe config add-authtoken $authToken
    Write-Host "인증 토큰 설정 완료!" -ForegroundColor Green
}

# 3. 실행 안내
Write-Host "`n=== 설정 완료! ===" -ForegroundColor Green
Write-Host "`nngrok을 시작하려면:" -ForegroundColor Cyan
Write-Host ".\start-ngrok.ps1" -ForegroundColor White
Write-Host "`n또는 직접 실행:" -ForegroundColor Cyan
Write-Host ".\ngrok.exe http 8080" -ForegroundColor White
