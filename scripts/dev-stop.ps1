$ErrorActionPreference = "SilentlyContinue"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PidFile = Join-Path $ProjectRoot ".dev-pids"

Write-Host "=== Karavyn Dev Stop ===" -ForegroundColor Cyan

# Kill tracked PIDs from pid file
if (Test-Path $PidFile) {
    $pids = Get-Content $PidFile
    foreach ($pid in $pids) {
        $pid = $pid.Trim()
        if ($pid -and $pid -match '^\d+$') {
            $proc = Get-Process -Id ([int]$pid) -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "Killing tracked process $pid ($($proc.ProcessName))"
                Stop-Process -Id ([int]$pid) -Force -ErrorAction SilentlyContinue
            }
        }
    }
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

# Kill anything on API port 3000
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pid in $port3000) {
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Killing process on port 3000: $($proc.ProcessName) (PID: $pid)"
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

# Kill anything on Expo port 8081
$port8081 = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pid in $port8081) {
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Killing process on port 8081: $($proc.ProcessName) (PID: $pid)"
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

# Kill node/tsx processes running from this project
$nodeProcs = Get-WmiObject Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and $_.CommandLine -like "*$ProjectRoot*" }
foreach ($proc in $nodeProcs) {
    Write-Host "Killing node process (PID: $($proc.ProcessId))"
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "All Karavyn dev processes stopped." -ForegroundColor Green
