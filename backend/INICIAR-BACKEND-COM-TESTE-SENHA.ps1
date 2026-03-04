# Script para Iniciar Backend Testando Senhas Automaticamente
# Tenta elber123, admin, admin123 até encontrar a correta

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIANDO BACKEND COM TESTE DE SENHA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$senhas = @("elber123", "admin", "admin123")
$configFile = "src\main\resources\application.yml"

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

Write-Host "Testando senhas do PostgreSQL automaticamente..." -ForegroundColor Yellow
Write-Host ""

# Ler conteúdo atual
$contentOriginal = Get-Content $configFile -Raw

foreach ($senha in $senhas) {
    Write-Host "========================================" -ForegroundColor Gray
    Write-Host "Tentando senha: $senha" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Gray
    Write-Host ""
    
    # Atualizar senha no ficheiro
    $content = $contentOriginal -replace "password: \$\{DB_PASSWORD:.*\}", "password: `${DB_PASSWORD:$senha}"
    Set-Content -Path $configFile -Value $content -NoNewline
    
    Write-Host "Configuracao atualizada com senha: $senha" -ForegroundColor Gray
    Write-Host "Iniciando backend para testar..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Aguarde 20 segundos e verifique os logs:" -ForegroundColor Gray
    Write-Host "  [OK] 'HikariPool-1 - Start completed' = SENHA CORRETA!" -ForegroundColor Green
    Write-Host "  [ERRO] 'FATAL: password authentication failed' = Tentando proxima..." -ForegroundColor Red
    Write-Host ""
    Write-Host "Pressione Ctrl+C para parar e tentar proxima senha" -ForegroundColor Yellow
    Write-Host ""
    
    # Iniciar backend em background para testar
    $job = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        $env:SERVER_PORT = "8081"
        & ".\mvnw.cmd" spring-boot:run 2>&1
    }
    
    # Aguardar um pouco para ver se conecta
    Start-Sleep -Seconds 25
    
    # Verificar se ainda está a correr (sinal de que conectou)
    $jobState = $job.State
    
    # Parar o job
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -ErrorAction SilentlyContinue
    
    # Parar processos Java
    Get-Process -Name "java" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    
    Write-Host ""
    Write-Host "Teste concluido. Verifique os logs acima." -ForegroundColor Gray
    Write-Host ""
    
    $resposta = Read-Host "A senha '$senha' funcionou? (s/n - Enter para tentar proxima)"
    
    if ($resposta -eq "s" -or $resposta -eq "S" -or $resposta -eq "sim" -or $resposta -eq "") {
        Write-Host ""
        Write-Host "[SUCESSO] Senha correta configurada: $senha" -ForegroundColor Green
        Write-Host ""
        Write-Host "Iniciando backend definitivamente..." -ForegroundColor Cyan
        Write-Host ""
        
        # Iniciar backend definitivamente
        .\mvnw.cmd spring-boot:run
        break
    }
}

Write-Host ""
Write-Host "Se nenhuma senha funcionou, verifique no pgAdmin a senha correta." -ForegroundColor Yellow
Write-Host ""
