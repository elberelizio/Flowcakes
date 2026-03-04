# Script para Testar e Configurar Senha do PostgreSQL
# Tenta todas as senhas e configura a correta

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTAR E CONFIGURAR SENHA POSTGRESQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$senhas = @("elber123", "admin", "admin123")
$configFile = "src\main\resources\application.yml"

Write-Host "Testando senhas na ordem:" -ForegroundColor Yellow
Write-Host "  1. elber123" -ForegroundColor White
Write-Host "  2. admin" -ForegroundColor White
Write-Host "  3. admin123" -ForegroundColor White
Write-Host ""

# Ler conteúdo atual
$content = Get-Content $configFile -Raw

foreach ($senha in $senhas) {
    Write-Host "Testando senha: $senha" -ForegroundColor Yellow
    
    # Atualizar temporariamente
    $tempContent = $content -replace "password: \$\{DB_PASSWORD:.*\}", "password: `${DB_PASSWORD:$senha}"
    Set-Content -Path $configFile -Value $tempContent -NoNewline
    
    Write-Host "  Configurado. Tente iniciar o backend agora." -ForegroundColor Gray
    Write-Host "  Se funcionar, esta e a senha correta!" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Para testar, execute:" -ForegroundColor Cyan
    Write-Host "    .\INICIAR-BACKEND-8081.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "  Se ver 'HikariPool-1 - Start completed' = SENHA CORRETA!" -ForegroundColor Green
    Write-Host "  Se ver 'FATAL: password authentication failed' = TENTE PROXIMA" -ForegroundColor Red
    Write-Host ""
    
    $resposta = Read-Host "Esta senha funcionou? (s/n)"
    
    if ($resposta -eq "s" -or $resposta -eq "S" -or $resposta -eq "sim") {
        Write-Host ""
        Write-Host "[SUCESSO] Senha correta configurada: $senha" -ForegroundColor Green
        Write-Host "application.yml atualizado!" -ForegroundColor Green
        break
    } else {
        Write-Host "  Tentando proxima senha..." -ForegroundColor Yellow
        Write-Host ""
    }
}

Write-Host ""
Write-Host "Configuracao finalizada!" -ForegroundColor Cyan
Write-Host ""
