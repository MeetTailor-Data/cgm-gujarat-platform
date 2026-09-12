Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   CGM Gujarat Platform - Starting Up..." -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$root    = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

# 1. Install dependencies if needed
if (-not (Test-Path "$backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location $backend; npm install --silent; Pop-Location
}
if (-not (Test-Path "$frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $frontend; npm install --silent; Pop-Location
}

# 2. Seed DB if it does not exist yet
$db = Join-Path $backend "data\cgm_platform.db"
if (-not (Test-Path $db)) {
    Write-Host "Seeding demo data..." -ForegroundColor Yellow
    Push-Location $backend; node src/db/seed.js; Pop-Location
}

# 3. Kill anything already on 5000 / 3000
foreach ($port in @(5000, 3000)) {
    $pids = netstat -ano 2>$null |
            Select-String (":$port\s") |
            ForEach-Object { ($_ -split '\s+')[-1] } |
            Sort-Object -Unique
    foreach ($p in $pids) {
        if ($p -match '^\d+$' -and $p -ne '0') {
            Stop-Process -Id ([int]$p) -Force -ErrorAction SilentlyContinue
        }
    }
}

# 4. Start backend
Write-Host "Starting backend  : http://localhost:5000" -ForegroundColor Green
Start-Process -FilePath "node" `
    -ArgumentList "src/index.js" `
    -WorkingDirectory $backend `
    -RedirectStandardOutput (Join-Path $root "backend.log") `
    -RedirectStandardError  (Join-Path $root "backend-err.log") `
    -WindowStyle Hidden

# 5. Wait for backend to respond
$ready = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep 1
    try {
        $r = Invoke-RestMethod "http://localhost:5000/api/health" -TimeoutSec 2
        if ($r.status -eq "ok") { $ready = $true; break }
    } catch {}
}
if (-not $ready) {
    Write-Host "Backend failed to start. See backend-err.log" -ForegroundColor Red
    exit 1
}
Write-Host "  Backend is up" -ForegroundColor Green

# 6. Start frontend
Write-Host "Starting frontend : http://localhost:3000" -ForegroundColor Green
Start-Process -FilePath "npm" `
    -ArgumentList "run", "dev" `
    -WorkingDirectory $frontend `
    -RedirectStandardOutput (Join-Path $root "frontend.log") `
    -RedirectStandardError  (Join-Path $root "frontend-err.log") `
    -WindowStyle Hidden

# 7. Wait for Vite
$viteReady = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep 1
    try {
        $null = Invoke-WebRequest "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing
        $viteReady = $true; break
    } catch {}
}
if ($viteReady) {
    Write-Host "  Frontend is up" -ForegroundColor Green
} else {
    Write-Host "  Frontend still warming up - check frontend.log" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Platform is RUNNING" -ForegroundColor Green
Write-Host ""
Write-Host "  App   : http://localhost:3000" -ForegroundColor White
Write-Host "  API   : http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "  Demo logins  (password: password123)" -ForegroundColor White
Write-Host "  Farmer : 9876543210" -ForegroundColor White
Write-Host "  Buyer  : 9876500001" -ForegroundColor White
Write-Host "  Admin  : 9000000000" -ForegroundColor White
Write-Host ""
Write-Host "  Logs : backend.log / frontend.log" -ForegroundColor DarkGray
Write-Host "  Stop : run stop.ps1" -ForegroundColor DarkGray
Write-Host "===============================================" -ForegroundColor Cyan

# Open browser
Start-Process "http://localhost:3000"
