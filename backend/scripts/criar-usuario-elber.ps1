# Script PowerShell para criar utilizador Elber na base de dados
# Telefone: 844179584
# Senha: elber123

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Criando Utilizador Administrador" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile = Join-Path $scriptPath "CRIAR_USUARIO_ELBER.sql"

# Configurações da base de dados (ajuste se necessário)
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "chefcontrol2025"
$dbUser = "postgres"
$dbPassword = "admin"

Write-Host "Conectando à base de dados: $dbName" -ForegroundColor Yellow
Write-Host ""

# Tentar executar via psql
$env:PGPASSWORD = $dbPassword

try {
    $sqlContent = Get-Content $sqlFile -Raw
    $sqlContent | & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[OK] Utilizador criado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Credenciais de login:" -ForegroundColor Yellow
        Write-Host "  Telefone: 844179584" -ForegroundColor White
        Write-Host "  Senha: elber123" -ForegroundColor White
        Write-Host "  Permissões: Administrador (is_admin = true)" -ForegroundColor White
    } else {
        Write-Host "[ERRO] Falha ao executar SQL" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERRO] Não foi possível executar psql" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, execute manualmente o ficheiro SQL:" -ForegroundColor Yellow
    Write-Host "  $sqlFile" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou conecte-se ao PostgreSQL e execute:" -ForegroundColor Yellow
    Write-Host @"
INSERT INTO users (id, phone, password_hash, full_name, is_admin, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    '844179584',
    'elber123',
    'Elber',
    true,
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '844179584');
"@ -ForegroundColor White
}
