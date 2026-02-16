# Script Rápido para Trocar Senha do PostgreSQL
# Use este script se a senha atual não funcionar

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("elber123", "admin", "admin123")]
    [string]$Senha = "elber123"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TROCAR SENHA POSTGRESQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$configFile = "src\main\resources\application.yml"

if (-not (Test-Path $configFile)) {
    Write-Host "[ERRO] Ficheiro application.yml nao encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "Atualizando senha para: $Senha" -ForegroundColor Yellow

# Ler conteúdo
$content = Get-Content $configFile -Raw

# Atualizar senha
$content = $content -replace "password: \$\{DB_PASSWORD:.*\}", "password: `${DB_PASSWORD:$Senha}"

# Salvar
Set-Content -Path $configFile -Value $content -NoNewline

Write-Host "[OK] application.yml atualizado!" -ForegroundColor Green
Write-Host ""
Write-Host "Senha configurada: $Senha" -ForegroundColor Cyan
Write-Host ""
Write-Host "Agora pode iniciar o backend:" -ForegroundColor Yellow
Write-Host "  .\INICIAR-BACKEND-SIMPLES.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Ou use:" -ForegroundColor Yellow
Write-Host "  .\trocar-senha-postgres.ps1 -Senha admin" -ForegroundColor White
Write-Host "  .\trocar-senha-postgres.ps1 -Senha admin123" -ForegroundColor White
Write-Host ""
