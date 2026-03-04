# Script de Diagnóstico: Comunicação Frontend ↔ Backend ↔ Base de Dados

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DIAGNÓSTICO DE COMUNICAÇÃO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Backend (porta 8080)
Write-Host "[1/5] Verificando Backend (porta 8080)..." -ForegroundColor Yellow
$backend = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($backend) {
    Write-Host "  ✓ Backend está a escutar na porta 8080" -ForegroundColor Green
    Write-Host "    Estado: $($backend.State)" -ForegroundColor Gray
} else {
    Write-Host "  ✗ Backend NÃO está a correr na porta 8080" -ForegroundColor Red
    Write-Host "    Ação: Inicie o backend com: .\mvnw.cmd spring-boot:run" -ForegroundColor Yellow
}
Write-Host ""

# 2. Verificar PostgreSQL (porta 5432)
Write-Host "[2/5] Verificando PostgreSQL (porta 5432)..." -ForegroundColor Yellow
$postgres = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
if ($postgres) {
    Write-Host "  ✓ PostgreSQL está a escutar na porta 5432" -ForegroundColor Green
    Write-Host "    Estado: $($postgres.State)" -ForegroundColor Gray
} else {
    Write-Host "  ✗ PostgreSQL NÃO está a correr na porta 5432" -ForegroundColor Red
    Write-Host "    Ação: Inicie o PostgreSQL (serviço Windows ou pgAdmin)" -ForegroundColor Yellow
}
Write-Host ""

# 3. Verificar Processos Java
Write-Host "[3/5] Verificando processos Java..." -ForegroundColor Yellow
$javaProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue
if ($javaProcesses) {
    Write-Host "  ✓ Encontrados $($javaProcesses.Count) processo(s) Java" -ForegroundColor Green
    foreach ($proc in $javaProcesses) {
        Write-Host "    PID: $($proc.Id) | Iniciado: $($proc.StartTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✗ Nenhum processo Java encontrado" -ForegroundColor Red
    Write-Host "    Ação: O backend não está a correr" -ForegroundColor Yellow
}
Write-Host ""

# 4. Testar conexão ao backend
Write-Host "[4/5] Testando conexão ao backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  ✓ Backend respondeu! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response) {
        Write-Host "  ⚠ Backend respondeu mas com erro: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    } else {
        Write-Host "  ✗ Backend não responde: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# 5. Verificar configuração
Write-Host "[5/5] Verificando configuração..." -ForegroundColor Yellow
$configFile = "src\main\resources\application.yml"
if (Test-Path $configFile) {
    Write-Host "  ✓ Ficheiro de configuração encontrado" -ForegroundColor Green
    $config = Get-Content $configFile -Raw
    if ($config -match "chefcontrol2025") {
        Write-Host "    Base de dados: chefcontrol2025" -ForegroundColor Gray
    }
    if ($config -match "postgres") {
        Write-Host "    Utilizador: postgres" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✗ Ficheiro de configuração não encontrado" -ForegroundColor Red
}
Write-Host ""

# Resumo
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$issues = @()
if (-not $backend) { $issues += "Backend não está a correr" }
if (-not $postgres) { $issues += "PostgreSQL não está a correr" }
if (-not $javaProcesses) { $issues += "Nenhum processo Java encontrado" }

if ($issues.Count -eq 0) {
    Write-Host "✓ Tudo parece estar a funcionar!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "  1. Verifique os logs do backend para erros de conexão à BD" -ForegroundColor White
    Write-Host "  2. Teste o login no frontend" -ForegroundColor White
    Write-Host "  3. Verifique a consola do navegador para erros CORS" -ForegroundColor White
} else {
    Write-Host "⚠ Problemas encontrados:" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "  - $issue" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Soluções:" -ForegroundColor Yellow
    if (-not $postgres) {
        Write-Host "  1. Inicie o PostgreSQL:" -ForegroundColor White
        Write-Host "     - Abra o pgAdmin" -ForegroundColor Gray
        Write-Host "     - Ou inicie o serviço Windows: net start postgresql-x64-XX" -ForegroundColor Gray
    }
    if (-not $backend) {
        Write-Host "  2. Inicie o backend:" -ForegroundColor White
        Write-Host "     cd backend" -ForegroundColor Gray
        Write-Host "     .\mvnw.cmd spring-boot:run" -ForegroundColor Gray
    }
}

Write-Host ""
