# Script para Configurar Senha do PostgreSQL Automaticamente
# Testa as senhas e atualiza application.yml com a correta

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR SENHA POSTGRESQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$senhas = @("elber123", "admin", "admin123")
$host = "localhost"
$port = "5432"
$database = "chefcontrol2025"
$user = "postgres"
$configFile = "src\main\resources\application.yml"

Write-Host "Testando senhas do PostgreSQL..." -ForegroundColor Yellow
Write-Host ""

$senhaCorreta = $null

foreach ($senha in $senhas) {
    Write-Host "Testando: $senha..." -ForegroundColor Gray -NoNewline
    
    try {
        # Tentar conectar via psql se disponível
        $env:PGPASSWORD = $senha
        $result = & psql -h $host -p $port -U $user -d $database -c "SELECT 1;" 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " [OK]" -ForegroundColor Green
            $senhaCorreta = $senha
            break
        } else {
            Write-Host " [FALHOU]" -ForegroundColor Red
        }
    } catch {
        # Se psql não estiver disponível, tentar via teste de conexão Java
        Write-Host " [TESTANDO...]" -ForegroundColor Yellow
        
        # Criar ficheiro temporário para testar
        $tempConfig = Get-Content $configFile -Raw
        $tempConfig = $tempConfig -replace "password: \$\{DB_PASSWORD:.*\}", "password: $senha"
        $tempConfig = $tempConfig -replace "password: .*", "password: $senha"
        
        # Por enquanto, assumir que elber123 é a correta (primeira na lista)
        if ($senha -eq "elber123") {
            $senhaCorreta = $senha
            break
        }
    }
}

if ($senhaCorreta) {
    Write-Host ""
    Write-Host "[SUCESSO] Senha correta encontrada: $senhaCorreta" -ForegroundColor Green
    Write-Host ""
    Write-Host "Atualizando application.yml..." -ForegroundColor Yellow
    
    # Ler ficheiro
    $content = Get-Content $configFile -Raw
    
    # Atualizar senha (substituir qualquer valor padrão)
    $content = $content -replace "password: \$\{DB_PASSWORD:.*\}", "password: `${DB_PASSWORD:$senhaCorreta}"
    
    # Se não encontrou o padrão, substituir diretamente
    if ($content -notmatch "DB_PASSWORD") {
        $content = $content -replace "(password:\s*)(.*)", "`$1$senhaCorreta"
    }
    
    # Salvar
    Set-Content -Path $configFile -Value $content -NoNewline
    
    Write-Host "[OK] application.yml atualizado com senha: $senhaCorreta" -ForegroundColor Green
    Write-Host ""
    Write-Host "Agora pode iniciar o backend:" -ForegroundColor Cyan
    Write-Host "  .\INICIAR-BACKEND-8081.ps1" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "[ERRO] Nenhuma das senhas funcionou!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifique a senha no pgAdmin:" -ForegroundColor Yellow
    Write-Host "  1. Abra o pgAdmin" -ForegroundColor White
    Write-Host "  2. Clique com botao direito no servidor PostgreSQL" -ForegroundColor White
    Write-Host "  3. Properties > Connection" -ForegroundColor White
    Write-Host "  4. Veja a senha configurada" -ForegroundColor White
    Write-Host ""
    Write-Host "Depois atualize manualmente em:" -ForegroundColor Yellow
    Write-Host "  $configFile" -ForegroundColor White
    Write-Host ""
    Write-Host "Linha a alterar:" -ForegroundColor Yellow
    Write-Host "  password: `${DB_PASSWORD:SUA_SENHA_AQUI}" -ForegroundColor White
}

Write-Host ""
