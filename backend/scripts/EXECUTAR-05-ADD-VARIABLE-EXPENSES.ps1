# Script PowerShell para executar 05_add_variable_expenses.sql
# Adiciona a coluna variable_expenses na tabela orders

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EXECUTAR SCRIPT SQL: variable_expenses" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Caminho do script SQL
$scriptPath = Join-Path $PSScriptRoot "05_add_variable_expenses.sql"

if (-not (Test-Path $scriptPath)) {
    Write-Host "[ERRO] Ficheiro nao encontrado: $scriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Ficheiro encontrado: $scriptPath" -ForegroundColor Green

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

if (-not $psqlPath) {
    Write-Host ""
    Write-Host "[AVISO] psql nao encontrado automaticamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "EXECUTE MANUALMENTE NO PGADMIN:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Abra pgAdmin" -ForegroundColor White
    Write-Host "2. Conecte-se ao servidor PostgreSQL" -ForegroundColor White
    Write-Host "3. Selecione a base: chefcontrol2025" -ForegroundColor White
    Write-Host "4. Clique em Tools > Query Tool" -ForegroundColor White
    Write-Host "5. Abra o ficheiro:" -ForegroundColor White
    Write-Host "   $scriptPath" -ForegroundColor Gray
    Write-Host "6. Execute o script (F5)" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou copie e cole o SQL abaixo:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "--- SQL ---" -ForegroundColor Yellow
    Get-Content $scriptPath | Write-Host -ForegroundColor Gray
    Write-Host "--- FIM SQL ---" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

# Valores padrão (ajustar conforme necessário)
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "chefcontrol2025"
$DB_USER = "postgres"
$DB_PASSWORD = "elber123"

Write-Host "[INFO] Conectando ao banco de dados..." -ForegroundColor Green
Write-Host "  Host: $DB_HOST" -ForegroundColor Gray
Write-Host "  Port: $DB_PORT" -ForegroundColor Gray
Write-Host "  Database: $DB_NAME" -ForegroundColor Gray
Write-Host "  User: $DB_USER" -ForegroundColor Gray
Write-Host ""

# Definir variável de ambiente para senha
$env:PGPASSWORD = $DB_PASSWORD

Write-Host ""
Write-Host "Executando script SQL..." -ForegroundColor Yellow
Write-Host ""

try {
    # Executar o script SQL usando -f para arquivo
    & $psqlPath -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $scriptPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  SCRIPT EXECUTADO COM SUCESSO!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "[OK] Coluna variable_expenses adicionada na tabela orders" -ForegroundColor Green
        Write-Host "[OK] Indice GIN criado para melhor performance" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "[ERRO] Falha ao executar o script SQL. Codigo de saida: $LASTEXITCODE" -ForegroundColor Red
        Write-Host ""
        Write-Host "Verifique:" -ForegroundColor Yellow
        Write-Host "  - PostgreSQL esta rodando" -ForegroundColor White
        Write-Host "  - Base de dados $DB_NAME existe" -ForegroundColor White
        Write-Host "  - Senha do postgres esta correta ($DB_PASSWORD)" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "[ERRO] Erro ao executar o script:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Execute manualmente no pgAdmin (veja instrucoes acima)" -ForegroundColor Yellow
    exit 1
} finally {
    # Limpar variável de ambiente
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "PRONTO! Agora pode reiniciar o backend." -ForegroundColor Yellow
Write-Host ""
