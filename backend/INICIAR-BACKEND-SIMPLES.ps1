# Script Simples - Inicia Backend (senha já configurada)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIANDO BACKEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Parar processos antigos
Get-Process -Name "java" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Configurar porta
$env:SERVER_PORT = "8081"

Write-Host "Configuracao:" -ForegroundColor Yellow
Write-Host "  Porta: 8081" -ForegroundColor Gray
Write-Host "  Base: chefcontrol2025" -ForegroundColor Gray
Write-Host "  Utilizador: postgres" -ForegroundColor Gray
Write-Host "  Senha: elber123 (ou a configurada em application.yml)" -ForegroundColor Gray
Write-Host ""
Write-Host "Iniciando..." -ForegroundColor Yellow
Write-Host ""

.\mvnw.cmd spring-boot:run
