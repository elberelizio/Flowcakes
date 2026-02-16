# Solução: Problemas de Comunicação Frontend ↔ Backend ↔ Base de Dados

## ✅ Status Atual
- **Backend:** ✅ A correr (porta 8080)
- **PostgreSQL:** ✅ A correr (porta 5432)
- **Processos Java:** ✅ 3 processos ativos

## 🔍 Problemas Identificados

### 1. CORS ainda bloqueia requisições
**Sintoma:** Erros no navegador: "Access to fetch blocked by CORS policy"

**Solução:**
1. O filtro CORS customizado (`CorsConfig.java`) foi criado mas pode não estar a ser carregado
2. Verificar se o backend reiniciou após as mudanças

**Ação:**
```bash
# Parar o backend (Ctrl+C no terminal)
# Reiniciar o backend
cd backend
.\mvnw.cmd spring-boot:run
```

### 2. Backend não conecta à base de dados
**Sintoma:** Erros nos logs: "Connection refused" ou "FATAL: password authentication failed"

**Verificar:**
- Credenciais em `application.yml`:
  - Host: `localhost`
  - Porta: `5432`
  - Base: `chefcontrol2025`
  - Utilizador: `postgres`
  - Senha: `admin` (ou a que configurou)

**Testar conexão manual:**
```sql
-- No pgAdmin, executar:
SELECT version();
```

### 3. Utilizador não existe ou senha incorreta
**Sintoma:** "Dados incorretos" no login

**Verificar na base de dados:**
```sql
SELECT phone, password_hash, is_admin 
FROM users 
WHERE phone = '844179584';
```

**Se não existir ou senha estiver errada:**
```sql
-- Atualizar senha
UPDATE users 
SET password_hash = 'elber123' 
WHERE phone = '844179584';

-- Ou criar novo utilizador
INSERT INTO users (id, phone, password_hash, full_name, is_admin, created_at, updated_at)
SELECT gen_random_uuid(), '844179584', 'elber123', 'Elber', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '844179584');
```

## 🔧 Passos para Resolver

### Passo 1: Reiniciar Backend
```bash
# No terminal onde o backend está a correr, pressione Ctrl+C
# Depois execute:
cd "chef-control-sistema-de-gestao-de-doces-e-salgados\backend"
.\mvnw.cmd clean compile spring-boot:run
```

### Passo 2: Verificar Logs do Backend
Procure por:
- ✅ `Started ChefControlApplication` - Backend iniciou
- ✅ `HikariPool-1 - Start completed` - Conectou à BD
- ❌ `Connection refused` - Erro de conexão
- ❌ `FATAL: password authentication failed` - Senha errada

### Passo 3: Testar CORS
Abra o navegador (F12) e na consola execute:
```javascript
fetch('http://localhost:8080/api/auth/login', {
  method: 'OPTIONS',
  headers: { 'Origin': 'http://localhost:4200' }
}).then(r => console.log('CORS OK:', r.headers.get('Access-Control-Allow-Origin')))
```

### Passo 4: Verificar Base de Dados
No pgAdmin:
1. Conecte-se à base `chefcontrol2025`
2. Execute:
```sql
SELECT phone, password_hash, is_admin FROM users WHERE phone = '844179584';
```
3. Verifique se `password_hash` é exatamente `elber123`

## 📋 Checklist Final

- [ ] Backend reiniciado após mudanças CORS
- [ ] Logs do backend não mostram erros de conexão
- [ ] Utilizador existe na base de dados
- [ ] Senha está correta (exatamente `elber123`)
- [ ] Frontend está a correr em `http://localhost:4200`
- [ ] Navegador não tem cache antigo (Ctrl+Shift+R)

## 🆘 Se Ainda Não Funcionar

1. **Limpar cache do navegador:** Ctrl+Shift+Delete
2. **Fechar e reabrir o navegador**
3. **Verificar se há firewall bloqueando**
4. **Verificar logs completos do backend** para erros específicos
