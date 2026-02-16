# Teste Rápido - Backend Porta 8081

Write-Host "=== TESTE BACKEND PORTA 8081 ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se está a escutar
$port = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
if ($port) {
    Write-Host "[OK] Porta 8081 esta a escutar" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Porta 8081 NAO esta a escutar" -ForegroundColor Red
    Write-Host "Backend nao esta a correr!" -ForegroundColor Red
    exit 1
}

# Testar login
Write-Host ""
Write-Host "Testando login..." -ForegroundColor Yellow
try {
    $body = '{"phone":"844179584","password":"elber123"}'
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 5 `
        -ErrorAction Stop
    
    Write-Host "[SUCESSO] Login funcionou!" -ForegroundColor Green
    Write-Host "ID: $($response.id)" -ForegroundColor Gray
    Write-Host "Telefone: $($response.phone)" -ForegroundColor Gray
    Write-Host "Nome: $($response.fullName)" -ForegroundColor Gray
    Write-Host "Admin: $($response.isAdmin)" -ForegroundColor Gray
} catch {
    Write-Host "[ERRO] Login falhou: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $status = [int]$_.Exception.Response.StatusCode
        Write-Host "Status HTTP: $status" -ForegroundColor Yellow
        
        if ($status -eq 404) {
            Write-Host "Problema: Endpoint nao encontrado - Backend pode nao ter iniciado completamente" -ForegroundColor Red
        } elseif ($status -eq 401) {
            Write-Host "Problema: Credenciais incorretas - Verifique utilizador na base de dados" -ForegroundColor Red
        } elseif ($status -eq 500) {
            Write-Host "Problema: Erro no servidor - Verifique logs do backend" -ForegroundColor Red
        }
    }
}

Write-Host ""
