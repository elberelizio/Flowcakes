# Script PowerShell para executar o SQL de adicionar campos de entrega e transporte
# Tenta encontrar psql em locais comuns do PostgreSQL

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EXECUTAR SCRIPT SQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptFile = Join-Path $PSScriptRoot "04_add_delivery_date_and_transport.sql"

if (-not (Test-Path $scriptFile)) {
    Write-Host "[ERRO] Ficheiro SQL nao encontrado: $scriptFile" -ForegroundColor Red
    exit 1
}

Write-Host "Ficheiro SQL encontrado: $scriptFile" -ForegroundColor Green
Write-Host ""

# Tentar encontrar psql em locais comuns
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\13\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        Write-Host "[OK] psql encontrado em: $path" -ForegroundColor Green
        break
    }
}

if (-not $psqlPath) {
    # Tentar encontrar via PATH
    $psqlInPath = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlInPath) {
        $psqlPath = $psqlInPath.Path
        Write-Host "[OK] psql encontrado no PATH: $psqlPath" -ForegroundColor Green
    }
}

if ($psqlPath) {
    Write-Host ""
    Write-Host "Executando script SQL..." -ForegroundColor Yellow
    Write-Host ""
    
    $env:PGPASSWORD = "elber123"
    
    try {
        & $psqlPath -h localhost -U postgres -d chefcontrol2025 -f $scriptFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  [SUCESSO] Script executado!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Campos adicionados na tabela orders:" -ForegroundColor Cyan
            Write-Host "  [OK] delivery_date" -ForegroundColor Green
            Write-Host "  [OK] has_delivery" -ForegroundColor Green
            Write-Host "  [OK] delivery_cost" -ForegroundColor Green
            Write-Host "  [OK] order_status" -ForegroundColor Green
            Write-Host "  [OK] is_cancelled" -ForegroundColor Green
            Write-Host ""
            Write-Host "Indices criados com sucesso!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "[ERRO] Falha ao executar. Codigo: $LASTEXITCODE" -ForegroundColor Red
            Write-Host ""
            Write-Host "Verifique:" -ForegroundColor Yellow
            Write-Host "  - PostgreSQL esta rodando" -ForegroundColor White
            Write-Host "  - Base de dados chefcontrol2025 existe" -ForegroundColor White
            Write-Host "  - Senha do postgres esta correta (elber123)" -ForegroundColor White
        }
    } catch {
        Write-Host ""
        Write-Host "[ERRO] Erro ao executar: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Execute manualmente no pgAdmin (veja instrucoes abaixo)" -ForegroundColor Yellow
    }
} else {
    Write-Host "[AVISO] psql nao encontrado automaticamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "EXECUTE MANUALMENTE NO PGADMIN:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Abra pgAdmin" -ForegroundColor White
    Write-Host "2. Conecte-se ao servidor PostgreSQL" -ForegroundColor White
    Write-Host "3. Selecione a base: chefcontrol2025" -ForegroundColor White
    Write-Host "4. Clique em Tools > Query Tool" -ForegroundColor White
    Write-Host "5. Abra o ficheiro:" -ForegroundColor White
    Write-Host "   $scriptFile" -ForegroundColor Gray
    Write-Host "6. Execute o script (F5)" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou copie e cole o SQL abaixo:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "--- SQL ---" -ForegroundColor Yellow
    Get-Content $scriptFile | Write-Host -ForegroundColor Gray
    Write-Host "--- FIM SQL ---" -ForegroundColor Yellow
}

Write-Host ""
