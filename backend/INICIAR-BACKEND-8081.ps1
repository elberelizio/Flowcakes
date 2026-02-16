# Script para Iniciar Backend na Porta 8081

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIANDO BACKEND NA PORTA 8081" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se porta está livre
$port = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
if ($port) {
    Write-Host "[AVISO] Porta 8081 ja esta em uso!" -ForegroundColor Yellow
    Write-Host "Parando processos antigos..." -ForegroundColor Yellow
    Get-Process -Name "java" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

# Configurar variável de ambiente
$env:SERVER_PORT = "8081"

# Verificar senha do PostgreSQL
$configFile = "src\main\resources\application.yml"
if (Test-Path $configFile) {
    $config = Get-Content $configFile -Raw
    if ($config -match "password:\s*\$\{DB_PASSWORD:(.*)\}") {
        $senhaAtual = $matches[1]
        Write-Host "Configuracao:" -ForegroundColor Yellow
        Write-Host "  Porta: 8081" -ForegroundColor Gray
        Write-Host "  Base de dados: chefcontrol2025" -ForegroundColor Gray
        Write-Host "  Utilizador: postgres" -ForegroundColor Gray
        Write-Host "  Senha: $senhaAtual" -ForegroundColor Gray
        Write-Host ""
    }
}

Write-Host "Iniciando Spring Boot..." -ForegroundColor Yellow
Write-Host "Aguarde 30-60 segundos para o backend iniciar completamente" -ForegroundColor Gray
Write-Host ""
Write-Host "Sinais de sucesso:" -ForegroundColor Cyan
Write-Host "  [OK] 'HikariPool-1 - Start completed' = Conexao BD OK" -ForegroundColor Green
Write-Host "  [OK] 'Started ChefControlApplication' = Backend iniciado" -ForegroundColor Green
Write-Host ""
Write-Host "Sinais de erro:" -ForegroundColor Cyan
Write-Host "  [ERRO] 'FATAL: password authentication failed' = Senha errada" -ForegroundColor Red
Write-Host "  [ERRO] 'Connection refused' = PostgreSQL nao esta a correr" -ForegroundColor Red
Write-Host ""
Write-Host "Se a senha estiver errada, execute:" -ForegroundColor Yellow
Write-Host "  .\testar-e-configurar-senha.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o backend" -ForegroundColor Yellow
Write-Host ""

# Iniciar backend
.\mvnw.cmd spring-boot:run
