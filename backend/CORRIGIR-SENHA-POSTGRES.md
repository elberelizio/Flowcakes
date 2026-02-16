# 🔧 Como Corrigir a Senha do PostgreSQL

## ❌ Erro Encontrado
```
FATAL: password authentication failed for user "postgres"
SQLState: 28P01
```

## ✅ Solução

### Opção 1: Script Automático (Recomendado)

Execute o script que testa todas as senhas:
```powershell
.\testar-e-configurar-senha.ps1
```

Este script vai:
1. Testar senha: `elber123`
2. Se não funcionar, testar: `admin`
3. Se não funcionar, testar: `admin123`
4. Configurar automaticamente a senha correta

### Opção 2: Manual

1. Abra o ficheiro: `src\main\resources\application.yml`
2. Encontre a linha:
   ```yaml
   password: ${DB_PASSWORD:elber123}
   ```
3. Altere para uma das senhas:
   - `password: ${DB_PASSWORD:elber123}`
   - `password: ${DB_PASSWORD:admin}`
   - `password: ${DB_PASSWORD:admin123}`
4. Salve o ficheiro
5. Reinicie o backend

## 🧪 Como Saber Qual Senha Está Correta

### Método 1: Testar no pgAdmin
1. Abra o pgAdmin
2. Clique com botão direito no servidor PostgreSQL
3. **Properties** > **Connection**
4. Veja a senha configurada

### Método 2: Testar Iniciando o Backend
1. Inicie o backend: `.\INICIAR-BACKEND-8081.ps1`
2. Procure nos logs:
   - ✅ `HikariPool-1 - Start completed` = **SENHA CORRETA!**
   - ❌ `FATAL: password authentication failed` = **SENHA ERRADA** (tente próxima)

## 📋 Senhas a Testar (por ordem)

1. **elber123** (já configurada)
2. **admin**
3. **admin123**

## 🔄 Após Corrigir

1. Pare o backend (Ctrl+C)
2. Inicie novamente: `.\INICIAR-BACKEND-8081.ps1`
3. Verifique se conecta à base de dados

## 🆘 Se Nenhuma Senha Funcionar

1. Verifique a senha no pgAdmin (método acima)
2. Ou altere a senha do PostgreSQL:
   ```sql
   ALTER USER postgres WITH PASSWORD 'elber123';
   ```
3. Depois atualize `application.yml` com a nova senha
