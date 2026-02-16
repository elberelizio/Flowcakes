# Como Iniciar o Backend na Porta 8081

## ⚠️ Problema Identificado
A porta 8081 não está funcional porque o backend não foi iniciado corretamente.

## ✅ Solução: Iniciar Manualmente

### Opção 1: Usar o Script PowerShell (Recomendado)

1. Abra o PowerShell
2. Navegue até a pasta do backend:
   ```powershell
   cd "C:\Users\Elber Elizio\Desktop\DAP PROJECTOS\sistemas de gestao de doces e salgados para empreendedores informais\chef-control-sistema-de-gestao-de-doces-e-salgados\backend"
   ```
3. Execute o script:
   ```powershell
   .\INICIAR-BACKEND-8081.ps1
   ```

### Opção 2: Comando Manual

1. Abra o PowerShell
2. Navegue até a pasta do backend
3. Execute:
   ```powershell
   $env:SERVER_PORT = "8081"
   .\mvnw.cmd spring-boot:run
   ```

## ⏱️ Aguarde o Backend Iniciar

O backend demora **30-60 segundos** para iniciar completamente.

### Sinais de que iniciou com sucesso:
- ✅ Procure por: `Started ChefControlApplication` nos logs
- ✅ Procure por: `Tomcat started on port(s): 8081`
- ✅ Procure por: `HikariPool-1 - Start completed` (conexão à BD OK)

### Se houver erros:
- ❌ `Connection refused` - PostgreSQL não está a correr
- ❌ `FATAL: password authentication failed` - Senha da BD errada
- ❌ `Port 8081 already in use` - Porta ocupada (pare processos Java)

## 🧪 Testar se Funcionou

Após o backend iniciar, execute (em outro terminal):
```powershell
.\teste-backend-8081.ps1
```

Ou teste manualmente:
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" `
  -Method POST `
  -Body '{"phone":"844179584","password":"elber123"}' `
  -ContentType "application/json"
```

## 📋 Checklist

- [ ] PostgreSQL está a correr (porta 5432)
- [ ] Base de dados `chefcontrol2025` existe
- [ ] Utilizador com telefone `844179584` existe na BD
- [ ] Backend iniciou sem erros
- [ ] Porta 8081 está a escutar
- [ ] Frontend está configurado para porta 8081 ✅ (já feito)

## 🆘 Problemas Comuns

### Backend não inicia
- Verifique se há erros nos logs
- Verifique se PostgreSQL está a correr
- Verifique credenciais da BD em `application.yml`

### Erro de conexão à BD
- Verifique se PostgreSQL está a correr: `Get-NetTCPConnection -LocalPort 5432`
- Teste conexão manual no pgAdmin
- Verifique senha em `application.yml` (padrão: `admin`)

### Porta 8081 ocupada
```powershell
# Ver o que está a usar a porta
Get-NetTCPConnection -LocalPort 8081

# Parar processos Java
Get-Process -Name "java" | Stop-Process -Force
```
