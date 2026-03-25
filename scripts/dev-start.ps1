$ErrorActionPreference = "Stop"

function Resolve-PnpmExecutable {
    $cmd = Get-Command pnpm -ErrorAction SilentlyContinue
    if ($null -eq $cmd) {
        throw "pnpm not found in PATH. Install pnpm and reopen this terminal."
    }
    $path = $cmd.Source
    if ($path -match '\.cmd$') { return $path }
    if ($path -match '\.exe$') { return $path }
    if ($path -match '\.ps1$') {
        $dir = Split-Path $path
        $cmdShim = Join-Path $dir "pnpm.cmd"
        if (Test-Path $cmdShim) { return $cmdShim }
    }
    return $path
}

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PidFile = Join-Path $ProjectRoot ".dev-pids"

Write-Host "=== Karavyn Dev Start ===" -ForegroundColor Cyan

Write-Host "`n[1/3] Stopping existing processes..." -ForegroundColor Yellow
& "$PSScriptRoot\dev-stop.ps1"

Write-Host "`n[2/3] Installing dependencies..." -ForegroundColor Yellow
Set-Location $ProjectRoot
pnpm install

$pnpmExe = (Resolve-PnpmExecutable).Replace('/', '\')
Write-Host "Using pnpm: $pnpmExe" -ForegroundColor DarkGray

"" | Out-File -FilePath $PidFile -Encoding utf8

Write-Host "`n[3/3] Starting dev servers..." -ForegroundColor Yellow

$apiDir    = Join-Path $ProjectRoot "apps\api"
$mobileDir = Join-Path $ProjectRoot "apps\mobile"

Write-Host "  Opening API terminal (port 3000)..."
$apiProc = Start-Process powershell `
    -ArgumentList "-NoExit", "-Command", `
        "& { `$host.UI.RawUI.WindowTitle = 'Karavyn - API'; Set-Location '$apiDir'; & '$pnpmExe' dev }" `
    -PassThru
$apiProc.Id | Out-File -FilePath $PidFile -Append -Encoding utf8

Write-Host "  Opening Expo terminal..."
$mobileProc = Start-Process powershell `
    -ArgumentList "-NoExit", "-Command", `
        "& { `$host.UI.RawUI.WindowTitle = 'Karavyn - Mobile'; Set-Location '$mobileDir'; & '$pnpmExe' dev }" `
    -PassThru
$mobileProc.Id | Out-File -FilePath $PidFile -Append -Encoding utf8

# 127.0.0.1 avoids Windows localhost/IPv6 resolution issues
$healthUrl = "http://127.0.0.1:3000/health"
Write-Host "`nWaiting for API at $healthUrl ..."
$ready = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) {
            Write-Host "  API is ready!" -ForegroundColor Green
            $ready = $true
            break
        }
    } catch {
        if ($i -eq 1 -or $i % 10 -eq 0) {
            Write-Host "  Still waiting ($i/30)..."
        }
    }
    Start-Sleep -Seconds 1
}

if (-not $ready) {
    Write-Host "`n  API did not become ready in 30s." -ForegroundColor Red
    Write-Host "  Check the 'Karavyn - API' terminal window for errors." -ForegroundColor Yellow
    Write-Host "  Then run: .\scripts\dev-stop.ps1 and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Karavyn is running ===" -ForegroundColor Green
Write-Host "  API:    http://localhost:3000"
Write-Host "  Mobile: Expo dev server"
Write-Host ""
Write-Host "  Stop with: .\scripts\dev-stop.ps1" -ForegroundColor DarkGray
