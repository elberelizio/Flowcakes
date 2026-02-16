# Script para Testar Senha do PostgreSQL

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTANDO SENHAS DO POSTGRESQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$senhas = @("elber123", "admin", "admin123")
$host = "localhost"
$port = "5432"
$database = "chefcontrol2025"
$user = "postgres"

foreach ($senha in $senhas) {
    Write-Host "Testando senha: $senha" -ForegroundColor Yellow
    
    try {
        # Tentar conectar usando psql se disponível
        $env:PGPASSWORD = $senha
        $result = & psql -h $host -p $port -U $user -d $database -c "SELECT version();" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [SUCESSO] Senha correta: $senha" -ForegroundColor Green
            Write-Host ""
            Write-Host "Atualize application.yml com:" -ForegroundColor Cyan
            Write-Host "  password: $senha" -ForegroundColor White
            break
        } else {
            Write-Host "  [ERRO] Senha incorreta: $senha" -ForegroundColor Red
        }
    } catch {
        Write-Host "  [AVISO] psql nao disponivel, testando via Java..." -ForegroundColor Yellow
        
        # Se psql não estiver disponível, apenas informar
        Write-Host "  Configure manualmente em application.yml" -ForegroundColor Gray
    }
    
    Write-Host ""
}

Write-Host "Se nenhuma senha funcionou, verifique no pgAdmin:" -ForegroundColor Yellow
Write-Host "  1. Abra o pgAdmin" -ForegroundColor White
Write-Host "  2. Clique com botao direito no servidor" -ForegroundColor White
Write-Host "  3. Properties > Connection" -ForegroundColor White
Write-Host "  4. Veja a senha configurada" -ForegroundColor White
Write-Host ""
