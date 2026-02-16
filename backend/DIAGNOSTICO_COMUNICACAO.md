# Diagnóstico: Comunicação Frontend ↔ Backend ↔ Base de Dados

## Problema
O sistema frontend e a base de dados não estão a comunicar.

## Checklist de Verificação

### 1. Backend está a correr?
```powershell
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
```
**Esperado:** Deve mostrar `State: Listen`

### 2. Backend conecta à base de dados?
Verificar nos logs do backend se há:
- `HikariPool-1 - Starting...`
- `HikariPool-1 - Start completed.`
- **ERRO:** `Connection refused` ou `FATAL: password authentication failed`

### 3. Base de dados PostgreSQL está a correr?
```powershell
Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
```
**Esperado:** Deve mostrar `State: Listen`

### 4. Credenciais da base de dados estão corretas?
- **Host:** localhost
- **Porta:** 5432
- **Base:** chefcontrol2025
- **Utilizador:** postgres
- **Senha:** admin (ou a que configurou)

### 5. CORS está configurado?
- Frontend: `http://localhost:4200`
- Backend: `http://localhost:8080`
- Headers CORS devem estar presentes nas respostas

## Testes Manuais

### Teste 1: Verificar se backend responde
```bash
curl http://localhost:8080/api/auth/login -X OPTIONS -v
```
**Esperado:** Headers `Access-Control-Allow-Origin` presentes

### Teste 2: Verificar conexão à base de dados
No pgAdmin, executar:
```sql
SELECT version();
```
**Esperado:** Versão do PostgreSQL

### Teste 3: Verificar se a base existe
```sql
SELECT datname FROM pg_database WHERE datname = 'chefcontrol2025';
```
**Esperado:** Deve retornar `chefcontrol2025`

### Teste 4: Verificar se o utilizador existe
```sql
SELECT phone, password_hash, is_admin FROM users WHERE phone = '844179584';
```
**Esperado:** Deve retornar o utilizador criado

## Soluções Comuns

### Problema: Backend não inicia
**Solução:**
1. Verificar se há erros de compilação
2. Verificar se a porta 8080 está livre
3. Verificar logs do Maven/Spring Boot

### Problema: Erro de conexão à base de dados
**Solução:**
1. Verificar se PostgreSQL está a correr
2. Verificar credenciais em `application.yml`
3. Testar conexão manualmente com `psql`

### Problema: CORS bloqueia requisições
**Solução:**
1. Verificar se `CorsConfig.java` está a ser carregado
2. Verificar se o filtro tem prioridade alta
3. Limpar cache do navegador

### Problema: "Dados incorretos" no login
**Solução:**
1. Verificar se a senha na base está exatamente como esperado
2. Verificar se o telefone está normalizado corretamente
3. Verificar logs do backend para ver a comparação
