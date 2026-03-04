# Teste Completo Automático - Frontend ↔ Backend ↔ Base de Dados

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE AUTOMATICO COMPLETO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$resultados = @{}

# 1. Verificar Backend (porta 8080)
Write-Host "[1/7] Verificando Backend..." -ForegroundColor Yellow
$backend = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
if ($backend) {
    Write-Host "  OK - Backend a escutar na porta 8080" -ForegroundColor Green
    $resultados["Backend_Porta"] = "OK"
} else {
    Write-Host "  ERRO - Backend nao esta a escutar" -ForegroundColor Red
    $resultados["Backend_Porta"] = "ERRO"
}
Start-Sleep -Milliseconds 500

# 2. Verificar PostgreSQL (porta 5432)
Write-Host "[2/7] Verificando PostgreSQL..." -ForegroundColor Yellow
$postgres = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
if ($postgres) {
    Write-Host "  OK - PostgreSQL a escutar na porta 5432" -ForegroundColor Green
    $resultados["PostgreSQL_Porta"] = "OK"
} else {
    Write-Host "  ERRO - PostgreSQL nao esta a escutar" -ForegroundColor Red
    $resultados["PostgreSQL_Porta"] = "ERRO"
}
Start-Sleep -Milliseconds 500

# 3. Testar resposta HTTP do backend
Write-Host "[3/7] Testando resposta HTTP do backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  OK - Backend respondeu (Status: $($response.StatusCode))" -ForegroundColor Green
    $resultados["Backend_HTTP"] = "OK"
} catch {
    if ($_.Exception.Response) {
        $status = [int]$_.Exception.Response.StatusCode
        Write-Host "  AVISO - Backend respondeu com status $status" -ForegroundColor Yellow
        $resultados["Backend_HTTP"] = "AVISO"
    } else {
        Write-Host "  ERRO - Backend nao responde: $($_.Exception.Message)" -ForegroundColor Red
        $resultados["Backend_HTTP"] = "ERRO"
    }
}
Start-Sleep -Milliseconds 500

# 4. Testar CORS (OPTIONS preflight)
Write-Host "[4/7] Testando CORS (preflight OPTIONS)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "http://localhost:4200"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "content-type"
    }
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" -Method OPTIONS -Headers $headers -TimeoutSec 5 -ErrorAction Stop
    
    $corsOrigin = $response.Headers["Access-Control-Allow-Origin"]
    if ($corsOrigin) {
        Write-Host "  OK - CORS configurado (Origin: $corsOrigin)" -ForegroundColor Green
        $resultados["CORS"] = "OK"
    } else {
        Write-Host "  ERRO - Headers CORS nao encontrados" -ForegroundColor Red
        $resultados["CORS"] = "ERRO"
    }
} catch {
    Write-Host "  ERRO - CORS falhou: $($_.Exception.Message)" -ForegroundColor Red
    $resultados["CORS"] = "ERRO"
}
Start-Sleep -Milliseconds 500

# 5. Testar endpoint de login (sem autenticação)
Write-Host "[5/7] Testando endpoint /api/auth/login..." -ForegroundColor Yellow
try {
    $body = @{
        phone = "844179584"
        password = "elber123"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 5 `
        -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "  OK - Login funcionou!" -ForegroundColor Green
        $resultados["Login"] = "OK"
    } else {
        Write-Host "  AVISO - Login retornou status $($response.StatusCode)" -ForegroundColor Yellow
        $resultados["Login"] = "AVISO"
    }
} catch {
    if ($_.Exception.Response) {
        $status = [int]$_.Exception.Response.StatusCode
        if ($status -eq 401 -or $status -eq 404) {
            Write-Host "  ERRO - Login falhou (Status: $status) - Verifique credenciais" -ForegroundColor Red
        } else {
            Write-Host "  ERRO - Login falhou (Status: $status)" -ForegroundColor Red
        }
        $resultados["Login"] = "ERRO"
    } else {
        Write-Host "  ERRO - Nao foi possivel conectar: $($_.Exception.Message)" -ForegroundColor Red
        $resultados["Login"] = "ERRO"
    }
}
Start-Sleep -Milliseconds 500

# 6. Verificar processos Java
Write-Host "[6/7] Verificando processos Java..." -ForegroundColor Yellow
$javaProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue
if ($javaProcesses) {
    Write-Host "  OK - $($javaProcesses.Count) processo(s) Java encontrado(s)" -ForegroundColor Green
    $resultados["Java_Processos"] = "OK"
} else {
    Write-Host "  ERRO - Nenhum processo Java" -ForegroundColor Red
    $resultados["Java_Processos"] = "ERRO"
}
Start-Sleep -Milliseconds 500

# 7. Verificar configuração
Write-Host "[7/7] Verificando configuracao..." -ForegroundColor Yellow
$configFile = "src\main\resources\application.yml"
if (Test-Path $configFile) {
    $config = Get-Content $configFile -Raw
    $hasDb = $config -match "chefcontrol2025"
    $hasUser = $config -match "postgres"
    
    if ($hasDb -and $hasUser) {
        Write-Host "  OK - Configuracao encontrada" -ForegroundColor Green
        $resultados["Configuracao"] = "OK"
    } else {
        Write-Host "  AVISO - Configuracao incompleta" -ForegroundColor Yellow
        $resultados["Configuracao"] = "AVISO"
    }
} else {
    Write-Host "  ERRO - Ficheiro de configuracao nao encontrado" -ForegroundColor Red
    $resultados["Configuracao"] = "ERRO"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ok = 0
$erro = 0
$aviso = 0

foreach ($teste in $resultados.Keys) {
    $status = $resultados[$teste]
    $nome = $teste -replace "_", " "
    
    switch ($status) {
        "OK" { 
            Write-Host "  [OK] $nome" -ForegroundColor Green
            $ok++
        }
        "ERRO" { 
            Write-Host "  [ERRO] $nome" -ForegroundColor Red
            $erro++
        }
        "AVISO" { 
            Write-Host "  [AVISO] $nome" -ForegroundColor Yellow
            $aviso++
        }
    }
}

Write-Host ""
Write-Host "Total: $ok OK, $aviso Avisos, $erro Erros" -ForegroundColor Cyan
Write-Host ""

if ($erro -eq 0 -and $aviso -eq 0) {
    Write-Host "TUDO FUNCIONANDO PERFEITAMENTE!" -ForegroundColor Green
} elseif ($erro -eq 0) {
    Write-Host "Sistema funcionando com alguns avisos" -ForegroundColor Yellow
} else {
    Write-Host "PROBLEMAS ENCONTRADOS - Verifique os erros acima" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solucoes:" -ForegroundColor Yellow
    if ($resultados["Backend_Porta"] -eq "ERRO") {
        Write-Host "  - Inicie o backend: .\mvnw.cmd spring-boot:run" -ForegroundColor White
    }
    if ($resultados["PostgreSQL_Porta"] -eq "ERRO") {
        Write-Host "  - Inicie o PostgreSQL (pgAdmin ou servico Windows)" -ForegroundColor White
    }
    if ($resultados["CORS"] -eq "ERRO") {
        Write-Host "  - Reinicie o backend para carregar CorsConfig" -ForegroundColor White
    }
    if ($resultados["Login"] -eq "ERRO") {
        Write-Host "  - Verifique se o utilizador existe na base de dados" -ForegroundColor White
        Write-Host "  - Execute no pgAdmin: SELECT * FROM users WHERE phone = '844179584';" -ForegroundColor Gray
    }
}

Write-Host ""
