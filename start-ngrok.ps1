# ngrok 시작 스크립트

Write-Host "=== ngrok 시작 ===" -ForegroundColor Green

if (-not (Test-Path ".\ngrok.exe")) {
    Write-Host "오류: ngrok.exe를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "먼저 setup-ngrok.ps1을 실행하세요." -ForegroundColor Yellow
    exit 1
}

Write-Host "`nVite 서버가 http://localhost:8080 에서 실행 중인지 확인하세요." -ForegroundColor Yellow
Write-Host "Vite 서버가 실행 중이 아니라면 먼저 'npm run dev'를 실행하세요.`n" -ForegroundColor Yellow

Write-Host "ngrok 터널을 시작합니다..." -ForegroundColor Cyan
Write-Host "외부 접속 URL이 표시됩니다." -ForegroundColor Green
Write-Host "중지하려면 Ctrl+C를 누르세요.`n" -ForegroundColor Yellow
Write-Host "================================`n" -ForegroundColor Green

# ngrok 실행
& .\ngrok.exe http 8080
