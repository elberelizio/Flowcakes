# Script PowerShell para criar utilizador normal na base de dados
# Executa o script SQL automaticamente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CRIAR UTILIZADOR NORMAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile = Join-Path $scriptDir "CRIAR_USUARIO_NORMAL.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "[ERRO] Ficheiro SQL nao encontrado: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "Ficheiro SQL: $sqlFile" -ForegroundColor Gray
Write-Host ""

# Tentar executar via psql se disponível
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    Write-Host "Executando script SQL via psql..." -ForegroundColor Yellow
    Write-Host ""
    
    $env:PGPASSWORD = "elber123"  # Senha do PostgreSQL
    
    try {
        psql -h localhost -U postgres -d chefcontrol2025 -f $sqlFile
        Write-Host ""
        Write-Host "[SUCESSO] Utilizador criado!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Credenciais para login:" -ForegroundColor Cyan
        Write-Host "  Telefone: 871234567" -ForegroundColor White
        Write-Host "  Senha: maria123" -ForegroundColor White
        Write-Host "  Tipo: Utilizador Normal" -ForegroundColor White
    } catch {
        Write-Host "[ERRO] Falha ao executar: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Tente executar manualmente no pgAdmin:" -ForegroundColor Yellow
        Write-Host "  1. Abra pgAdmin" -ForegroundColor White
        Write-Host "  2. Conecte-se ao servidor" -ForegroundColor White
        Write-Host "  3. Selecione base: chefcontrol2025" -ForegroundColor White
        Write-Host "  4. Tools > Query Tool" -ForegroundColor White
        Write-Host "  5. Abra: $sqlFile" -ForegroundColor White
        Write-Host "  6. Execute (F5)" -ForegroundColor White
    }
} else {
    Write-Host "[AVISO] psql nao encontrado no PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Execute manualmente no pgAdmin:" -ForegroundColor Cyan
    Write-Host "  1. Abra pgAdmin" -ForegroundColor White
    Write-Host "  2. Conecte-se ao servidor PostgreSQL" -ForegroundColor White
    Write-Host "  3. Selecione a base de dados: chefcontrol2025" -ForegroundColor White
    Write-Host "  4. Clique em Tools > Query Tool" -ForegroundColor White
    Write-Host "  5. Abra o ficheiro:" -ForegroundColor White
    Write-Host "     $sqlFile" -ForegroundColor Gray
    Write-Host "  6. Execute o script (F5)" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou copie e cole este SQL:" -ForegroundColor Cyan
    Write-Host ""
    Get-Content $sqlFile | Write-Host -ForegroundColor Gray
}

Write-Host ""
