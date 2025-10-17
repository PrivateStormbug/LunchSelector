# Port Forwarding Diagnostic Tool

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Port Forwarding Diagnostic" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$port = 8080
$publicIP = "122.32.219.38"
$localIP = "192.168.219.104"
$gateway = "192.168.219.1"

# 1. Check if server is listening
Write-Host "[1] Server Listening Status" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Gray

$listening = netstat -ano | findstr ":$port" | findstr "LISTENING"
if ($listening) {
    Write-Host "OK: Server is listening on port $port" -ForegroundColor Green
    $listening | ForEach-Object { Write-Host "   $_" -ForegroundColor White }

    if ($listening -match "0.0.0.0:$port") {
        Write-Host "OK: Listening on 0.0.0.0:$port (all interfaces)" -ForegroundColor Green
    } else {
        Write-Host "WARNING: May only be listening on localhost" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: No server listening on port $port" -ForegroundColor Red
    Write-Host "   Run 'npm run dev' first" -ForegroundColor Yellow
}

Write-Host ""

# 2. Check Windows Firewall
Write-Host "[2] Windows Firewall Rules" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Gray

$firewallRules = Get-NetFirewallRule | Where-Object {
    $_.Enabled -eq $true -and $_.Direction -eq 'Inbound'
} | Get-NetFirewallPortFilter | Where-Object {
    $_.LocalPort -eq $port
}

if ($firewallRules) {
    Write-Host "OK: Firewall inbound rule exists" -ForegroundColor Green
} else {
    Write-Host "WARNING: No firewall inbound rule for port $port" -ForegroundColor Yellow
    Write-Host "   Run as Administrator:" -ForegroundColor Cyan
    Write-Host "   New-NetFirewallRule -DisplayName 'Port $port' -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow" -ForegroundColor White
}

Write-Host ""

# 3. Network Information
Write-Host "[3] Network Configuration" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Gray

Write-Host "Local IP: $localIP" -ForegroundColor White
Write-Host "Gateway: $gateway" -ForegroundColor White
Write-Host "Public IP: $publicIP" -ForegroundColor White

Write-Host ""

# 4. Double NAT Check
Write-Host "[4] Double NAT Check (IMPORTANT!)" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Gray

Write-Host "Open router admin page ($gateway) and check:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Find WAN IP address (Internet Status/Connection Info)" -ForegroundColor White
Write-Host "   - If WAN IP = $publicIP : OK" -ForegroundColor Green
Write-Host "   - If WAN IP = 10.x.x.x, 172.16-31.x.x, 192.168.x.x : Double NAT!" -ForegroundColor Red
Write-Host ""
Write-Host "What is Double NAT?" -ForegroundColor Yellow
Write-Host "   ISP Router -> Your Router -> PC" -ForegroundColor White
Write-Host "   Port forwarding will NOT work in this case" -ForegroundColor White
Write-Host ""

$wanCheck = Read-Host "Enter router WAN IP (or press Enter to skip)"

if ($wanCheck) {
    if ($wanCheck -match "^10\." -or $wanCheck -match "^172\.(1[6-9]|2[0-9]|3[0-1])\." -or $wanCheck -match "^192\.168\.") {
        Write-Host ""
        Write-Host "ERROR: Double NAT detected!" -ForegroundColor Red
        Write-Host "   Solutions:" -ForegroundColor Yellow
        Write-Host "   1. Set ISP router to bridge mode" -ForegroundColor White
        Write-Host "   2. Setup port forwarding on ISP router too" -ForegroundColor White
        Write-Host "   3. Use tunneling (ngrok/Tailscale) - RECOMMENDED" -ForegroundColor Green
    } elseif ($wanCheck -eq $publicIP) {
        Write-Host ""
        Write-Host "OK: WAN IP matches public IP" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "WARNING: WAN IP ($wanCheck) != Public IP ($publicIP)" -ForegroundColor Yellow
        Write-Host "   Possible CGNAT or dynamic IP" -ForegroundColor White
    }
}

Write-Host ""

# 5. CGNAT Check
Write-Host "[5] CGNAT Check" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Gray

Write-Host "What is CGNAT?" -ForegroundColor Cyan
Write-Host "   Multiple customers share one public IP" -ForegroundColor White
Write-Host "   Port forwarding is IMPOSSIBLE in this case" -ForegroundColor White
Write-Host ""
Write-Host "How to check:" -ForegroundColor Yellow
Write-Host "   1. If public IP is 100.64.0.0 ~ 100.127.255.255 = CGNAT" -ForegroundColor White

if ($publicIP -match "^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\.") {
    Write-Host ""
    Write-Host "ERROR: CGNAT detected! (Public IP: $publicIP)" -ForegroundColor Red
    Write-Host "   Port forwarding impossible - must use tunneling" -ForegroundColor Yellow
} else {
    Write-Host "   2. Contact ISP to check CGNAT status" -ForegroundColor White
}

Write-Host ""

# 6. Port Forwarding Checklist
Write-Host "[6] Port Forwarding Checklist" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Gray

Write-Host "Check router settings ($gateway):" -ForegroundColor Cyan
Write-Host "[ ] External port: $port" -ForegroundColor White
Write-Host "[ ] Internal port: $port" -ForegroundColor White
Write-Host "[ ] Internal IP: $localIP (must match exactly)" -ForegroundColor White
Write-Host "[ ] Protocol: TCP (or TCP/UDP)" -ForegroundColor White
Write-Host "[ ] Status: Enabled" -ForegroundColor White
Write-Host "[ ] Router restarted" -ForegroundColor White

Write-Host ""

# 7. External Port Test
Write-Host "[7] External Port Access Test" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Gray

Write-Host "Check if port is open from outside:" -ForegroundColor Cyan
Write-Host "   https://www.yougetsignal.com/tools/open-ports/" -ForegroundColor White
Write-Host ""
Write-Host "   Enter:" -ForegroundColor Yellow
Write-Host "   - IP Address: $publicIP" -ForegroundColor White
Write-Host "   - Port Number: $port" -ForegroundColor White
Write-Host ""

$portTest = Read-Host "External port test result (open/closed)"

if ($portTest -eq "open") {
    Write-Host ""
    Write-Host "OK: Port is open!" -ForegroundColor Green
    Write-Host "   If still cannot access:" -ForegroundColor Yellow
    Write-Host "   1. Check domain DNS (nslookup lunch.stormbug.site)" -ForegroundColor White
    Write-Host "   2. Clear browser cache" -ForegroundColor White
    Write-Host "   3. Try from different network (mobile data)" -ForegroundColor White
} elseif ($portTest -eq "closed") {
    Write-Host ""
    Write-Host "ERROR: Port is closed" -ForegroundColor Red
    Write-Host "   Possible causes:" -ForegroundColor Yellow
    Write-Host "   1. Double NAT" -ForegroundColor White
    Write-Host "   2. CGNAT" -ForegroundColor White
    Write-Host "   3. ISP port blocking" -ForegroundColor White
    Write-Host "   4. Router configuration error" -ForegroundColor White
    Write-Host "   5. Firewall blocking" -ForegroundColor White
}

Write-Host ""

# 8. Recommended Solutions
Write-Host "[8] Recommended Solutions" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Gray

Write-Host ""
Write-Host "If port forwarding does not work:" -ForegroundColor Cyan
Write-Host ""
Write-Host "BEST: ngrok (easiest and fastest)" -ForegroundColor Green
Write-Host "   .\setup-ngrok.ps1" -ForegroundColor White
Write-Host ""
Write-Host "GOOD: Tailscale (for personal/team use)" -ForegroundColor Green
Write-Host "   https://tailscale.com/download" -ForegroundColor White
Write-Host ""
Write-Host "TRY: Use port 80 (ISP may block 8080)" -ForegroundColor Yellow
Write-Host "   Change port to 80 in vite.config.js" -ForegroundColor White
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Diagnosis Complete" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
