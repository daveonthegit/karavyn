$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "=== Karavyn DB Migrate ===" -ForegroundColor Cyan

Set-Location $ProjectRoot

Write-Host "`n[1/2] Generating migrations from schema..." -ForegroundColor Yellow
pnpm db:generate

Write-Host "`n[2/2] Applying migrations to database..." -ForegroundColor Yellow
pnpm db:migrate

Write-Host "`nMigrations applied successfully." -ForegroundColor Green
