Write-Host "Stopping CGM Gujarat Platform..." -ForegroundColor Yellow
@(5000, 3000) | ForEach-Object {
    $port = $_
    $pids = netstat -ano 2>$null |
            Select-String ":$port\s" |
            ForEach-Object { ($_ -split '\s+')[-1] } |
            Sort-Object -Unique
    foreach ($p in $pids) {
        if ($p -match '^\d+$' -and $p -ne '0') {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
            Write-Host "  Killed PID $p (port $port)" -ForegroundColor Gray
        }
    }
}
Write-Host "✅ Stopped." -ForegroundColor Green
